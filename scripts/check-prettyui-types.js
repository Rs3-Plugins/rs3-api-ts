const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const source = require("./lib/prettyui-source");

const root = path.resolve(__dirname, "..");
const packageDir = path.join(root, "packages", "prettyui");
const sourceInfo = JSON.parse(fs.readFileSync(path.join(packageDir, "data", "source.json"), "utf8"));

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const verbose = args.includes("--verbose");
const selfTest = args.includes("--self-test");
const fixMode = args.includes("--fix");
const round = Number(flag("--round") ?? "1");
const sourceDir = path.resolve(flag("--source") ?? path.join(root, ".vendor", "prettyui"));
const typesDir = path.resolve(flag("--types") ?? path.join(packageDir, "types"));
const indexFile = path.resolve(flag("--index") ?? path.join(typesDir, "..", "index.d.ts"));
const ref = flag("--ref") ?? sourceInfo.commit;

const problems = [];
const fixes = [];
function fail(message, fix) {
    if (!problems.includes(message)) problems.push(message);
    if (fix) fixes.push(fix);
}


const luaFiles = new Map();
const tsByLua = new Map();
const scaffoldOptions = new Set();
const scaffoldNames = new Set();
const coreGlobals = new Set();
const coreMembers = new Map();

function luaPath(module) {
    return module.endsWith(".lua") ? module : `${module}.lua`;
}

function stripStrings(line) {
    return line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
}

function nestingMask(lines) {
    const mask = [];
    const stack = [];
    for (let i = 0; i < lines.length; i++) {
        mask.push(!stack.includes("F"));
        if (i === 0) continue;
        const text = stripStrings(lines[i]).replace(/--.*$/, "");
        let skipThen = false;
        for (const m of text.matchAll(/\b(function|then|do|end|elseif|repeat|until)\b/g)) {
            const word = m[1];
            if (word === "function") stack.push("F");
            else if (word === "elseif") skipThen = true;
            else if (word === "then") {
                if (skipThen) skipThen = false;
                else stack.push("B");
            } else if (word === "do" || word === "repeat") stack.push("B");
            else if (word === "end" || word === "until") stack.pop();
        }
    }
    return mask;
}

function luaFile(file) {
    file = luaPath(file);
    if (luaFiles.has(file)) return luaFiles.get(file);
    const full = path.join(sourceDir, file);
    if (!fs.existsSync(full)) return undefined;
    const text = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
    const lines = text.split("\n");
    const info = { file, text, lines, requires: new Map(), functions: [], classes: new Set(), tables: new Set(), metaBase: new Map(), installs: new Map(), returnExpr: undefined, byKey: new Map() };
    for (const m of text.matchAll(/^local (\w+) = require\("([^"]+)"\)/gm)) info.requires.set(m[1], luaPath(m[2]));
    for (const m of text.matchAll(/^(\w+)\.__index = \1$/gm)) info.classes.add(m[1]);
    for (const m of text.matchAll(/^local (\w+) = \{\}$/gm)) info.tables.add(m[1]);
    for (const m of text.matchAll(/^setmetatable\((\w+), \{ __index = (\w+) \}\)/gm)) info.metaBase.set(m[1], m[2]);
    for (const m of text.matchAll(/^local (\w+) = setmetatable\(\{\}, \{ __index = (\w+) \}\)/gm)) info.metaBase.set(m[1], m[2]);
    for (const m of text.matchAll(/^ContentMethods\.install(Single|Paired)\((\w+)/gm)) info.installs.set(m[2], { ...info.installs.get(m[2]), content: m[1] === "Single" ? "single" : "paired" });
    for (const m of text.matchAll(/^Scroll\.install\((\w+)\)/gm)) info.installs.set(m[1], { ...info.installs.get(m[1]), scroll: true });
    const ret = [...text.matchAll(/^return (.+)$/gm)];
    info.returnExpr = ret.length > 0 ? ret[ret.length - 1][1].trim() : undefined;

    const addFunction = (startLine, indent, owner, kind, name, params, endPredicate) => {
        let end = lines.length - 1;
        for (let j = startLine + 1; j < lines.length; j++) {
            if (endPredicate(lines[j])) {
                end = j;
                break;
            }
        }
        const bodyLines = lines.slice(startLine, end + 1);
        const record = { file, key: owner ? `${owner}${kind}${name}` : name, owner, kind, name, params: parseParams(params), body: bodyLines.join("\n"), lines: bodyLines, mask: nestingMask(bodyLines), startLine: startLine + 1, indent };
        info.functions.push(record);
        if (!info.byKey.has(record.key)) info.byKey.set(record.key, record);
    };
    for (let i = 0; i < lines.length; i++) {
        const m = /^(\s*)(?:local )?function (?:(\w+)([.:]))?(\w+)\(([^)]*)\)/.exec(lines[i]);
        if (m) {
            const indent = m[1];
            addFunction(i, indent, m[2], m[3] ?? "", m[4], m[5], (l) => l === `${indent}end` || l === `${indent}end,` || l.startsWith(`${indent}end)`));
            continue;
        }
        const t = /^(\s*)(\w+) = function\(([^)]*)\)/.exec(lines[i]);
        if (t) {
            const indent = t[1];
            let owner;
            for (let j = i - 1; j >= 0; j--) {
                const o = /^(\s*)(\w+) = \{$/.exec(lines[j]);
                if (o && o[1].length < indent.length) {
                    owner = o[2];
                    break;
                }
                if (lines[j].search(/\S/) >= 0 && lines[j].search(/\S/) < indent.length && !/^\s*\w+ = \{/.test(lines[j])) break;
            }
            addFunction(i, indent, owner, owner ? "." : "", t[2], t[3], (l) => l === `${indent}end,` || l === `${indent}end`);
        }
    }
    luaFiles.set(file, info);
    return info;
}

function allSourceFiles() {
    const out = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(path.join(sourceDir, dir), { withFileTypes: true })) {
            const relative = path.posix.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== "tests" && entry.name !== ".git") walk(relative);
            } else if (entry.name.endsWith(".lua")) out.push(relative);
        }
    };
    walk("src");
    out.push("main.lua");
    return out;
}

function parseParams(list) {
    return list
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p !== "")
        .map((p) => ({ name: p, rest: p === "..." }));
}

function describe(params) {
    return `(${params.map((p) => (p.rest ? "..." : p.name)).join(", ")})`;
}

function findFunction(info, owner, name) {
    for (const kind of [".", ":"]) {
        const record = info.byKey.get(`${owner}${kind}${name}`);
        if (record) return record;
    }
    return undefined;
}

function resolveModule(file) {
    const info = luaFile(file);
    if (!info) throw new Error(`${file} does not exist in the PrettyUI source`);
    const expr = info.returnExpr ?? "";
    const re = /^require\("([^"]+)"\)$/.exec(expr);
    if (re) return resolveModule(re[1]);
    return { info, luaName: /^\w+$/.test(expr) ? expr : undefined };
}

function resolveLocal(info, local) {
    if (info.requires.has(local)) {
        const target = resolveModule(info.requires.get(local));
        return { info: target.info, luaName: target.luaName };
    }
    if (info.classes.has(local) || info.tables.has(local)) return { info, luaName: local };
    return undefined;
}


function exportsFromMain() {
    const main = luaFile("main.lua");
    const exported = new Map();
    const table = /local PrettyUI = \{([\s\S]*?)\n\}/.exec(main.text);
    if (!table) throw new Error("main.lua: the PrettyUI table was not found");
    for (const m of table[1].matchAll(/^\s+(\w+) = (.+?),?$/gm)) {
        const [, name, value] = m;
        const req = /^require\("([^"]+)"\)$/.exec(value);
        if (req) {
            exported.set(name, { file: luaPath(req[1]) });
            continue;
        }
        const dotted = /^(\w+)\.(\w+)$/.exec(value);
        if (dotted && main.requires.has(dotted[1])) {
            exported.set(name, { file: main.requires.get(dotted[1]), tableExport: dotted[2] });
            continue;
        }
        if (/^\w+$/.test(value) && main.requires.has(value)) {
            exported.set(name, { file: main.requires.get(value) });
            continue;
        }
        fail(`main.lua: cannot tell what prettyui.${name} = ${value} refers to`);
    }
    return { exported, hasVersion: /^PrettyUI\.version\s*=/m.test(main.text) };
}

function buildClass(tsName, info, luaName, options = {}) {
    const cls = { ts: tsName, file: info.file, info, luaName, ctor: undefined, instance: new Map(), statics: new Map(), bases: [], content: undefined, scroll: false, exported: options.exported === true };
    for (const fn of info.functions) {
        if (fn.owner !== luaName || fn.name.startsWith("_") || fn.indent !== "") continue;
        if (fn.kind === ":") cls.instance.set(fn.name, { params: fn.params, fn });
        else if (fn.name === "new") cls.ctor = { params: fn.params, fn };
        else cls.statics.set(fn.name, { params: fn.params, fn });
    }
    for (const m of info.text.matchAll(new RegExp(`^${luaName}\\.(\\w+)\\s*=\\s*(\\w+)\\.(\\w+)\\s*$`, "gm"))) {
        const [, member, targetLocal, targetMember] = m;
        if (member.startsWith("_")) continue;
        const target = resolveLocal(info, targetLocal);
        const fn = target && findFunction(target.info, target.luaName ?? targetLocal, targetMember);
        if (!fn) {
            fail(`${info.file}: ${luaName}.${member} aliases ${targetLocal}.${targetMember}, which cannot be found`);
            continue;
        }
        (fn.kind === ":" ? cls.instance : cls.statics).set(member, { params: fn.params, fn });
    }
    const install = info.installs.get(luaName);
    if (install) {
        cls.content = install.content;
        cls.scroll = install.scroll === true;
    }
    const base = info.metaBase.get(luaName);
    if (base) {
        const target = resolveLocal(info, base);
        if (target && target.luaName) cls.bases.push(buildClass(undefined, target.info, target.luaName));
    }
    if (cls.ctor) {
        const fn = cls.ctor.fn;
        for (let i = 1; i < fn.lines.length; i++) {
            if (!fn.mask[i]) continue;
            const m = /^\s*return (?:(\w+)|require\("([^"]+)"\))\.new\(/.exec(fn.lines[i]);
            if (!m) continue;
            const target = m[1] ? resolveLocal(info, m[1]) : resolveModule(m[2]);
            if (target && target.luaName && target.luaName !== luaName) cls.bases.push(buildClass(undefined, target.info, target.luaName));
        }
    }
    for (const b of cls.bases) {
        if (!cls.content && b.content) cls.content = b.content;
        if (b.scroll) cls.scroll = true;
    }
    return cls;
}

function buildTableExport(tsName, info, exportName) {
    const start = info.text.search(new RegExp(`^    ${exportName} = \\{`, "m"));
    if (start < 0) throw new Error(`${info.file}: no table export named ${exportName}`);
    const end = balanced(info.text, info.text.indexOf("{", start));
    const block = info.text.slice(start, end);
    const cls = { ts: tsName, file: info.file, info, luaName: exportName, ctor: undefined, instance: new Map(), statics: new Map(), bases: [], content: undefined, scroll: false, exported: true };
    const ctor = info.byKey.get(`${exportName}.new`);
    if (ctor) {
        cls.ctor = { params: ctor.params, fn: ctor };
        for (const m of ctor.body.matchAll(/(\w+)\.new\(/g)) {
            const target = resolveLocal(info, m[1]);
            if (target && target.luaName && target.luaName !== exportName) cls.bases.push(buildClass(undefined, target.info, target.luaName));
        }
    }
    for (const m of block.matchAll(/^\s+(\w+) = (\w+)\.(\w+),?$/gm)) {
        const target = resolveLocal(info, m[2]);
        const fn = target && findFunction(target.info, target.luaName ?? m[2], m[3]);
        if (fn) (fn.kind === ":" ? cls.instance : cls.statics).set(m[1], { params: fn.params, fn });
    }
    return cls;
}

function allInstance(cls, out = new Map(), seen = new Set()) {
    if (seen.has(cls)) return out;
    seen.add(cls);
    for (const [k, v] of cls.instance) if (!out.has(k)) out.set(k, v);
    for (const base of cls.bases) allInstance(base, out, seen);
    return out;
}

function contentRegistry() {
    const text = luaFile("src/core/content_methods.lua").text;
    const start = text.indexOf("local COMPONENTS = {");
    const end = text.indexOf("\n}\n", start);
    const body = text.slice(start, end);
    const starts = [...body.matchAll(/method = "(\w+)"/g)];
    return starts.map((m, i) => {
        const rest = body.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : body.length);
        const optionsIndex = /optionsIndex = (\d+)/.exec(rest);
        const argCount = optionsIndex ? Number(optionsIndex[1]) : /textTitle = (?:true|false)/.test(rest) ? 1 : undefined;
        if (argCount === undefined) throw new Error(`cannot tell how many arguments ${m[1]} takes from the content_methods registry`);
        return { method: m[1], argCount, paired: !/paired = false/.test(rest), text: /textTitle = /.test(rest) };
    });
}

function scrollInstall() {
    const fn = luaFile("src/core/scroll.lua").byKey.get("Scroll.install");
    const out = new Map();
    for (const m of fn.body.matchAll(/class\.(\w+) = function\(self(?:,\s*([^)]*))?\)/g)) out.set(m[1], { params: parseParams(m[2] ?? ""), fn: undefined });
    return out;
}

function luaSpriteKeys() {
    const text = luaFile("src/core/sprites.lua").text;
    const keys = new Set();
    let depth = 0;
    let inLiteral = false;
    for (const line of text.split("\n")) {
        if (/^local Sprites = \{/.test(line)) inLiteral = true;
        const key = /^\s*([A-Z_][A-Z0-9_]*) = /.exec(line);
        if (inLiteral && depth === 1 && key) keys.add(key[1]);
        if (inLiteral && depth === 1 && /^\}/.test(line)) inLiteral = false;
        const top = /^Sprites\.([A-Z_][A-Z0-9_]*) = /.exec(line);
        if (top) keys.add(top[1]);
        for (const char of line) {
            if (char === "{") depth++;
            else if (char === "}") depth--;
        }
    }
    return keys;
}

function luaSpriteType(key) {
    const text = luaFile("src/core/sprites.lua").text;
    const m = new RegExp(`^(?:\\s+|Sprites\\.)${key} = (.*)$`, "m").exec(text);
    if (!m) return "number";
    const rest = text.slice(m.index + m[0].length - m[1].length);
    if (!rest.startsWith("{")) return "number";
    const close = balanced(rest, 0);
    if (close < 0) return "number";
    const literal = rest.slice(0, close + 1);
    const describeTable = (table) => {
        const fields = [];
        let positional = 0;
        for (const field of splitArgs(table.slice(1, -1))) {
            const fm = /^(\w+) = ([\s\S]+)$/.exec(field.trim());
            if (!fm) {
                if (field.trim() !== "") positional++;
                continue;
            }
            const value = fm[2].trim();
            fields.push(`readonly ${fm[1]}: ${value.startsWith("{") ? describeTable(value) : "number"}`);
        }
        if (fields.length === 0) return positional > 0 ? "number[]" : "{}";
        return `{ ${fields.join("; ")} }`;
    };
    if (/^\{\s*"/.test(literal)) return "string[]";
    return describeTable(literal);
}


const decls = new Map();
const aliases = new Map();
const synthetic = new Map();
const sources = new Map();

function decl(name) {
    if (!decls.has(name)) decls.set(name, { name, kind: "interface", ctor: undefined, methods: new Map(), statics: new Map(), props: new Map(), returns: new Map(), extends: [], extendsClass: [], nodes: { classes: [], interfaces: [], namespaces: [] }, memberNodes: new Map() });
    return decls.get(name);
}

const trace = process.env.PRETTYUI_TRACE;

function tsParams(node) {
    return node.parameters.map((p) => ({ name: p.name.getText(), optional: p.questionToken !== undefined || p.initializer !== undefined, rest: p.dotDotDotToken !== undefined, type: p.type })).filter((p) => p.name !== "this");
}

function heritage(node) {
    const out = [];
    for (const clause of node.heritageClauses ?? []) {
        for (const type of clause.types) {
            const text = type.expression.getText();
            if (!text.startsWith("globalThis.")) out.push(text.replace(/<.*$/, ""));
        }
    }
    return out;
}

function loadDeclarations() {
    for (const file of fs.readdirSync(typesDir).filter((f) => f.endsWith(".d.ts"))) {
        const text = fs.readFileSync(path.join(typesDir, file), "utf8");
        const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
        sources.set(file, { text, sf });
        for (const namespace of sf.statements.filter((s) => ts.isModuleDeclaration(s) && s.name.text === "prettyui")) {
            for (const statement of namespace.body.statements) {
                if (ts.isClassDeclaration(statement)) {
                    const d = decl(statement.name.text);
                    d.kind = "class";
                    d.nodes.classes.push({ file, node: statement });
                    d.extendsClass.push(...heritage(statement));
                    for (const member of statement.members) {
                        if (ts.isConstructorDeclaration(member)) {
                            d.ctor = tsParams(member);
                            d.memberNodes.set("ctor", { file, node: member });
                        } else if (ts.isMethodDeclaration(member)) {
                            d.methods.set(member.name.getText(), tsParams(member));
                            d.returns.set(`:${member.name.getText()}`, member.type);
                            d.memberNodes.set(`:${member.name.getText()}`, { file, node: member });
                        } else if (ts.isPropertyDeclaration(member)) {
                            d.props.set(member.name.getText(), member.type);
                            d.memberNodes.set(`prop:${member.name.getText()}`, { file, node: member });
                        }
                    }
                } else if (ts.isInterfaceDeclaration(statement)) {
                    const d = decl(statement.name.text);
                    d.nodes.interfaces.push({ file, node: statement });
                    d.extends.push(...heritage(statement));
                    for (const member of statement.members) {
                        if (ts.isMethodSignature(member)) {
                            d.methods.set(member.name.getText(), tsParams(member));
                            d.returns.set(`:${member.name.getText()}`, member.type);
                            d.memberNodes.set(`:${member.name.getText()}`, { file, node: member });
                        } else if (ts.isPropertySignature(member)) {
                            d.props.set(member.name.getText(), member.type);
                            d.memberNodes.set(`prop:${member.name.getText()}`, { file, node: member });
                        }
                    }
                } else if (ts.isModuleDeclaration(statement) && statement.body && ts.isModuleBlock(statement.body)) {
                    const d = decl(statement.name.text);
                    d.hasNamespace = true;
                    d.nodes.namespaces.push({ file, node: statement });
                    for (const inner of statement.body.statements) {
                        if (ts.isFunctionDeclaration(inner)) {
                            d.statics.set(inner.name.text, tsParams(inner));
                            d.returns.set(`.${inner.name.text}`, inner.type);
                            d.memberNodes.set(`.${inner.name.text}`, { file, node: inner });
                        } else if (ts.isVariableStatement(inner)) {
                            for (const v of inner.declarationList.declarations) {
                                d.props.set(v.name.getText(), v.type);
                                d.memberNodes.set(`prop:${v.name.getText()}`, { file, node: inner });
                            }
                        }
                    }
                } else if (ts.isTypeAliasDeclaration(statement)) {
                    aliases.set(statement.name.text, statement.type);
                } else if (ts.isVariableStatement(statement)) {
                    for (const v of statement.declarationList.declarations) decl("prettyui").props.set(v.name.getText(), v.type);
                }
            }
        }
    }
}

const resolvedCache = new Map();
function resolved(name, seen = new Set()) {
    if (resolvedCache.has(name)) return resolvedCache.get(name);
    const own = decls.get(name);
    const empty = { ctor: undefined, methods: new Map(), statics: new Map(), props: new Map() };
    if (!own || seen.has(name)) return empty;
    seen.add(name);
    const merged = { ctor: own.ctor, methods: new Map(own.methods), statics: new Map(own.statics), props: new Map(own.props) };
    for (const base of own.extends) {
        const parent = resolved(base, seen);
        for (const [k, v] of parent.methods) if (!merged.methods.has(k)) merged.methods.set(k, v);
        for (const [k, v] of parent.props) if (!merged.props.has(k)) merged.props.set(k, v);
    }
    for (const base of own.extendsClass) {
        const parent = resolved(base, seen);
        for (const [k, v] of parent.methods) if (!merged.methods.has(k)) merged.methods.set(k, v);
        for (const [k, v] of parent.statics) if (!merged.statics.has(k)) merged.statics.set(k, v);
        for (const [k, v] of parent.props) if (!merged.props.has(k)) merged.props.set(k, v);
        if (!merged.ctor) merged.ctor = parent.ctor;
    }
    resolvedCache.set(name, merged);
    return merged;
}

function ancestors(name, out = new Set()) {
    if (out.has(name)) return out;
    out.add(name);
    const d = decls.get(name);
    if (d) for (const base of [...d.extends, ...d.extendsClass]) ancestors(base, out);
    return out;
}

function emptyShape() {
    return { ifaces: new Set(), element: undefined, arities: new Set() };
}

function mergeShape(into, from) {
    if (!from) return into;
    for (const i of from.ifaces) into.ifaces.add(i);
    for (const a of from.arities) into.arities.add(a);
    if (from.open) into.open = true;
    if (from.element) {
        if (!into.element) into.element = emptyShape();
        mergeShape(into.element, from.element);
    }
    return into;
}

function shapeKey(shape) {
    const parts = [...shape.ifaces].sort().join("&");
    const fn = shape.arities.size > 0 ? `fn(${[...shape.arities].sort().join("|")})` : "";
    return (shape.element ? `${parts}[${shapeKey(shape.element)}]` : parts) + fn;
}

function isObject(shape) {
    return shape.ifaces.size > 0 || shape.element !== undefined;
}

function useful(shape) {
    return shape !== undefined && (isObject(shape) || shape.arities.size > 0);
}

function resolveType(node, seen = new Set()) {
    const shape = emptyShape();
    if (!node) return shape;
    if (ts.isParenthesizedTypeNode(node)) return resolveType(node.type, seen);
    if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
        for (const t of node.types) mergeShape(shape, resolveType(t, seen));
        return shape;
    }
    if (ts.isArrayTypeNode(node)) {
        shape.element = resolveType(node.elementType, seen);
        return shape;
    }
    if (ts.isFunctionTypeNode(node)) {
        shape.arities.add(node.parameters.filter((p) => p.name.getText() !== "this").length);
        return shape;
    }
    if (ts.isTypeLiteralNode(node)) {
        const text = node.getText().replace(/\s+/g, " ");
        if (!synthetic.has(text)) {
            const name = `{${node.members.map((m) => m.name.getText()).join(", ")}}`;
            const d = decl(`${name}#${synthetic.size}`);
            d.literal = true;
            for (const member of node.members) if (ts.isPropertySignature(member)) d.props.set(member.name.getText(), member.type);
            synthetic.set(text, d.name);
        }
        shape.ifaces.add(synthetic.get(text));
        return shape;
    }
    if (ts.isTypeReferenceNode(node)) {
        const name = node.typeName.getText().replace(/^prettyui\./, "");
        const typeArgs = node.typeArguments ?? [];
        if (name.startsWith("globalThis.")) {
            shape.open = true;
            return shape;
        }
        if (name === "ReadonlyArray" || name === "Array") {
            shape.element = resolveType(typeArgs[0], seen);
            return shape;
        }
        if (["Omit", "Pick", "Partial", "Readonly", "Required"].includes(name)) return resolveType(typeArgs[0], seen);
        if (aliases.has(name)) {
            if (seen.has(name)) return shape;
            seen.add(name);
            return resolveType(aliases.get(name), seen);
        }
        if (decls.has(name)) shape.ifaces.add(name);
        else if (!/^(number|string|boolean|unknown|undefined|null|void|LuaMultiReturn|Record)$/.test(name) && !["V", "T", "K"].includes(name)) shape.open = true;
        return shape;
    }
    return shape;
}

function declaredProps(shape) {
    const out = new Map();
    for (const iface of shape.ifaces) for (const [k, v] of resolved(iface).props) if (!out.has(k)) out.set(k, v);
    return out;
}

function propShape(shape, key) {
    const out = emptyShape();
    for (const iface of shape.ifaces) {
        const d = decls.get(iface);
        if (d?.synthetic) {
            const s = d.synthetic.get(key);
            if (s) mergeShape(out, s);
            continue;
        }
        const type = resolved(iface).props.get(key);
        if (type) mergeShape(out, resolveType(type));
    }
    return out;
}

const produced = new Set();
const paramTyped = new Set();

function addIfaces(shape, into) {
    for (const i of shape.ifaces) into.add(i);
    if (shape.element) addIfaces(shape.element, into);
}

function computeProduced(seeds) {
    for (const d of decls.values()) {
        for (const params of [d.ctor, ...d.methods.values(), ...d.statics.values()]) {
            if (!params) continue;
            for (const p of params) addIfaces(resolveType(p.type), paramTyped);
        }
    }
    const queue = [];
    for (const d of decls.values()) if (d.kind === "class") for (const a of ancestors(d.name)) queue.push(a);
    for (const seed of seeds) {
        if (!seed.returnType) continue;
        const returned = new Set();
        addIfaces(resolveType(seed.returnType), returned);
        if (returned.size === 0) continue;
        const passedThrough = new Set();
        for (let i = 0; i < seed.tsParams.length; i++) {
            const luaParam = seed.params[i];
            if (!luaParam || luaParam.rest) continue;
            const shape = resolveType(seed.tsParams[i].type);
            if (!useful(shape)) continue;
            const rs = returnShapeOf(seed.fn, luaParam.name, shape);
            if (rs) addIfaces(rs, passedThrough);
        }
        for (const i of returned) if (!passedThrough.has(i)) queue.push(i);
    }
    while (queue.length > 0) {
        const name = queue.pop();
        if (produced.has(name)) continue;
        produced.add(name);
        const d = decls.get(name);
        if (!d) continue;
        for (const type of resolved(name).props.values()) {
            const inner = new Set();
            addIfaces(resolveType(type), inner);
            for (const i of inner) if (!paramTyped.has(i) || decls.get(i)?.kind === "class") queue.push(i);
        }
    }
}

function isProduced(shape) {
    if (shape.open) return true;
    for (const i of shape.ifaces) if (produced.has(i) || decls.get(i)?.synthetic) return true;
    return false;
}


function compareParams(where, luaParams, tsList, target) {
    const fix = target ? { kind: "setParams", decl: target.decl, member: target.member, params: luaParams, fn: target.fn } : undefined;
    const luaRest = luaParams.some((p) => p.rest);
    const tsRest = tsList.some((p) => p.rest);
    if (luaRest !== tsRest) {
        fail(`${where}: Lua takes ${describe(luaParams)} but TypeScript declares ${describe(tsList)} (variadic mismatch)`, fix);
        return;
    }
    const luaFixed = luaParams.filter((p) => !p.rest);
    const tsFixed = tsList.filter((p) => !p.rest);
    if (luaFixed.length !== tsFixed.length) {
        fail(`${where}: Lua takes ${luaFixed.length} parameter${luaFixed.length === 1 ? "" : "s"} ${describe(luaParams)} but TypeScript declares ${tsFixed.length} ${describe(tsList)}`, fix);
        return;
    }
    for (let i = 0; i < luaFixed.length; i++) {
        if (luaFixed[i].name.startsWith("_")) continue;
        if (luaFixed[i].name !== tsFixed[i].name) fail(`${where}: parameter ${i + 1} is "${luaFixed[i].name}" in Lua but "${tsFixed[i].name}" in TypeScript`, fix);
    }
}

function assignedIn(text, prop) {
    return new RegExp(`\\.${prop}\\s*(=[^=]|,)|\\b${prop} = |function \\w+[.:]${prop}\\(`).test(text);
}

function checkClass(cls, registry, installed, seeds) {
    const name = cls.ts;
    if (!decls.has(name)) {
        fail(`prettyui.${name} (${cls.file}) is not declared at all`, { kind: "addComponent", cls, registry, installed });
        return { methods: 0, statics: 0 };
    }
    const d = resolved(name);
    const instance = allInstance(cls);
    if (cls.content) {
        for (const entry of registry) {
            if (cls.content === "paired" && !entry.paired) continue;
            if (!instance.has(entry.method)) instance.set(entry.method, { count: entry.argCount, registry: entry });
        }
    }
    if (cls.scroll) for (const [k, v] of installed) if (!instance.has(k)) instance.set(k, v);

    if (cls.ctor) {
        if (!d.ctor) fail(`${name}: Lua constructs with .new${describe(cls.ctor.params)} but TypeScript declares no constructor`, { kind: "addCtor", decl: name, params: cls.ctor.params, fn: cls.ctor.fn });
        else {
            compareParams(`${name} constructor`, cls.ctor.params, d.ctor, { decl: name, member: "ctor", fn: cls.ctor.fn });
            seeds.push({ fn: cls.ctor.fn, params: cls.ctor.params, tsParams: d.ctor, returnType: undefined });
        }
    } else if (d.ctor) fail(`${name}: TypeScript declares a constructor but the Lua has no .new`, { kind: "removeMember", decl: name, member: "ctor" });

    for (const [member, entry] of instance) {
        const declared = d.methods.get(member);
        if (!declared) {
            fail(`${name}: Lua method ${member}${entry.params ? describe(entry.params) : ""} is not declared in TypeScript`, { kind: "addMethod", decl: name, member, params: entry.params, count: entry.count, registry: entry.registry, installed: entry.params !== undefined && entry.fn === undefined, fn: entry.fn, cls });
            continue;
        }
        if (entry.params) {
            compareParams(`${name}.${member}`, entry.params, declared, { decl: name, member: `:${member}`, fn: entry.fn });
            if (entry.fn) seeds.push({ fn: entry.fn, params: entry.params, tsParams: declared, returnType: returnTypeOf(name, `:${member}`) });
        } else {
            const count = declared.filter((p) => !p.rest).length;
            if (count !== entry.count) fail(`${name}.${member}: the library installs it with ${entry.count} argument${entry.count === 1 ? "" : "s"} but TypeScript declares ${declared.length} ${describe(declared)}`, { kind: "setParams", decl: name, member: `:${member}`, count: entry.count });
            else if (!entry.registry.text) seeds.push({ registry: entry.registry, tsParams: declared });
        }
    }
    for (const member of d.methods.keys()) if (!instance.has(member)) fail(`${name}: TypeScript declares method ${member}, which the Lua does not define`, { kind: "removeMember", decl: name, member: `:${member}` });

    for (const [member, entry] of cls.statics) {
        const declared = d.statics.get(member);
        if (!declared) {
            fail(`${name}: Lua function ${cls.luaName}.${member}${describe(entry.params)} is not declared in TypeScript (namespace ${name})`, { kind: "addStatic", decl: name, member, params: entry.params, fn: entry.fn });
            continue;
        }
        compareParams(`${name}.${member}`, entry.params, declared, { decl: name, member: `.${member}`, fn: entry.fn });
        seeds.push({ fn: entry.fn, params: entry.params, tsParams: declared, returnType: returnTypeOf(name, `.${member}`) });
    }
    for (const member of d.statics.keys()) if (!cls.statics.has(member)) fail(`${name}: TypeScript declares function ${name}.${member}, which the Lua does not define`, { kind: "removeMember", decl: name, member: `.${member}` });

    const texts = [cls.info.text];
    const walk = (c) => {
        for (const b of c.bases) {
            texts.push(b.info.text);
            walk(b);
        }
    };
    walk(cls);
    if (cls.scroll || cls.content) texts.push(luaFile("src/core/scroll.lua").text);
    const luaText = texts.join("\n");
    for (const prop of d.props.keys()) {
        if (!assignedIn(luaText, prop) && !(prop === "tooltip" && /Tooltip\.bind\(self, /.test(luaText))) fail(`${name}: TypeScript declares property ${prop}, which nothing in the Lua assigns`, { kind: "removeMember", decl: name, member: `prop:${prop}` });
    }
    if (verbose) console.log(`  ${name}: ctor ${cls.ctor ? describe(cls.ctor.params) : "-"}, ${instance.size} methods, ${cls.statics.size} functions, ${d.props.size} properties`);
    return { methods: instance.size, statics: cls.statics.size };
}

function returnTypeOf(name, member, seen = new Set()) {
    if (seen.has(name)) return undefined;
    seen.add(name);
    const d = decls.get(name);
    if (!d) return undefined;
    if (d.returns.has(member)) return d.returns.get(member);
    for (const base of [...d.extends, ...d.extendsClass]) {
        const found = returnTypeOf(base, member, seen);
        if (found) return found;
    }
    return undefined;
}

function checkReturnedTables(cls, seeds) {
    const d = decls.get(cls.ts);
    if (!d) return [];
    const out = [];
    for (const [member, entry] of cls.statics) {
        const type = returnTypeOf(cls.ts, `.${member}`);
        if (!type) continue;
        const shape = resolveType(type);
        for (const iface of shape.ifaces) {
            for (const [prop, propType] of resolved(iface).props) {
                const target = resolveType(propType);
                for (const inner of target.ifaces) {
                    const innerDecl = resolved(inner);
                    if (innerDecl.methods.size === 0) continue;
                    const literal = new RegExp(`\\b${prop} = (\\w+)\\b`).exec(entry.fn.body);
                    if (!literal) continue;
                    const owner = literal[1];
                    const info = cls.info;
                    const functions = info.functions.filter((f) => f.owner === owner && f.kind === "." && f.startLine > entry.fn.startLine && f.startLine < entry.fn.startLine + entry.fn.lines.length);
                    if (functions.length === 0) continue;
                    const pseudo = { ts: inner, file: info.file, info, luaName: owner, ctor: undefined, instance: new Map(), statics: new Map(functions.map((f) => [f.name, { params: f.params, fn: f }])), bases: [], content: undefined, scroll: false };
                    for (const [k, params] of innerDecl.methods) {
                        const luaFn = pseudo.statics.get(k);
                        if (!luaFn) fail(`${inner}: TypeScript declares ${k}, which ${owner} in ${entry.fn.key} does not define`, { kind: "removeMember", decl: inner, member: `:${k}` });
                        else {
                            compareParams(`${inner}.${k}`, luaFn.params, params, { decl: inner, member: `:${k}`, fn: luaFn.fn });
                            seeds.push({ fn: luaFn.fn, params: luaFn.params, tsParams: params });
                        }
                    }
                    for (const [k, luaFn] of pseudo.statics) if (!innerDecl.methods.has(k)) fail(`${inner}: ${owner}.${k} in ${entry.fn.key} is not declared`, { kind: "addMethod", decl: inner, member: k, params: luaFn.params, fn: luaFn.fn });
                    out.push(pseudo);
                }
            }
        }
    }
    return out;
}


const records = new Map();
const visited = new Map();
const collections = new Map();
const returnShapes = new Map();
const referenced = new Set();

function record(shape) {
    const key = shapeKey(shape);
    if (!records.has(key)) records.set(key, { shape, key, first: new Map(), reads: new Map(), callbacks: new Map(), callbackArgs: new Map() });
    for (const i of shape.ifaces) referenced.add(i);
    return records.get(key);
}

function escapeVar(name) {
    return name.replace(/\./g, "\\.");
}

function balanced(text, open) {
    let depth = 0;
    let quote;
    for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === quote && text[i - 1] !== "\\") quote = undefined;
            continue;
        }
        if (c === '"' || c === "'") quote = c;
        else if (c === "(" || c === "{" || c === "[") depth++;
        else if (c === ")" || c === "}" || c === "]") {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function splitArgs(text) {
    const out = [];
    let depth = 0;
    let current = "";
    let quote;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            current += c;
            if (c === quote && text[i - 1] !== "\\") quote = undefined;
            continue;
        }
        if (c === '"' || c === "'") quote = c;
        if (c === "(" || c === "{" || c === "[") depth++;
        if (c === ")" || c === "}" || c === "]") depth--;
        if (c === "," && depth === 0) {
            out.push(current.trim());
            current = "";
            continue;
        }
        current += c;
    }
    if (current.trim() !== "") out.push(current.trim());
    return out;
}

function callsOf(fn) {
    if (fn.calls) return fn.calls;
    const body = fn.body;
    const out = [];
    const re = /(?<![\w.:])(require\("[^"]+"\)|[A-Za-z_]\w*)((?:[.:][A-Za-z_]\w*)*)\s*\(/g;
    for (const m of body.matchAll(re)) {
        const callee = `${m[1]}${m[2]}`;
        if (/^(if|while|for|function|return|and|or|not|elseif|local|then|do|end)$/.test(callee)) continue;
        if (/function\s+$/.test(body.slice(Math.max(0, m.index - 12), m.index))) continue;
        const open = m.index + m[0].length - 1;
        const close = balanced(body, open);
        if (close < 0) continue;
        out.push({ callee, args: splitArgs(body.slice(open + 1, close)), line: body.slice(0, m.index).split("\n").length - 1 });
    }
    fn.calls = out;
    return out;
}

function literalFields(text) {
    const fields = [];
    for (const field of splitArgs(text.slice(text.indexOf("{") + 1, text.lastIndexOf("}")))) {
        const fm = /^(\w+) = ([\s\S]+)$/.exec(field.trim());
        if (fm) fields.push({ key: fm[1], value: fm[2].trim() });
    }
    return fields;
}

function collectionShape(suffix) {
    const coll = collections.get(suffix);
    if (!coll) return undefined;
    const shape = emptyShape();
    if (coll.direct) mergeShape(shape, coll.direct);
    if (coll.fields.size > 0) {
        const name = `#collection:${suffix}`;
        const d = decl(name);
        d.synthetic = coll.fields;
        shape.ifaces.add(name);
    }
    return isObject(shape) ? shape : undefined;
}

function storeCollection(target, fields, direct) {
    const suffix = target.replace(/\[.*$/, "").split(".").pop();
    if (!collections.has(suffix)) collections.set(suffix, { fields: new Map(), direct: undefined });
    const coll = collections.get(suffix);
    for (const [k, s] of fields) coll.fields.set(k, mergeShape(coll.fields.get(k) ?? emptyShape(), s));
    if (direct) coll.direct = mergeShape(coll.direct ?? emptyShape(), direct);
    collectionsChanged = true;
}
let collectionsChanged = false;

function exprShape(expr, ctx, state, iterating = false) {
    const out = emptyShape();
    let hit = false;
    for (const alt of expr.split(/\s+or\s+/)) {
        let a = alt.trim();
        while (a.startsWith("(") && balanced(a, 0) === a.length - 1) a = a.slice(1, -1).trim();
        if (a === "" || a === "{}" || a === "nil") continue;
        const esc = escapeVar(ctx.name);
        if (a === ctx.name) {
            mergeShape(out, ctx.shape);
            hit = true;
            continue;
        }
        let m = new RegExp(`^${esc}\\.([A-Za-z_]\\w*)$`).exec(a);
        if (m) {
            const s = propShape(ctx.shape, m[1]);
            if (useful(s)) {
                mergeShape(out, s);
                hit = true;
            }
            continue;
        }
        m = new RegExp(`^${esc}\\[[^\\]]+\\]$`).exec(a);
        if (m && ctx.shape.element) {
            mergeShape(out, ctx.shape.element);
            hit = true;
            continue;
        }
        m = /^([\w.]+)(\[[^\]]+\])?$/.exec(a);
        if (m) {
            const suffix = m[1].split(".").pop();
            const cs = m[2] || iterating ? collectionShape(suffix) : undefined;
            if (cs) {
                if (m[2]) mergeShape(out, cs);
                else out.element = mergeShape(out.element ?? emptyShape(), cs);
                hit = true;
                continue;
            }
            if (state?.literals.has(a)) {
                const name = `#literal:${ctx.fn.file}:${ctx.fn.key}:${a}`;
                const d = decl(name);
                d.synthetic = state.literals.get(a);
                out.ifaces.add(name);
                hit = true;
                continue;
            }
        }
        m = /^((?:require\("[^"]+"\)|[A-Za-z_]\w*)(?:[.:][A-Za-z_]\w*)*)\s*\(([\s\S]*)\)$/.exec(a);
        if (m) {
            const callee = resolveCallee(m[1], ctx);
            if (!callee) continue;
            const callArgs = splitArgs(m[2]);
            for (let j = 0; j < callArgs.length; j++) {
                const as = exprShape(callArgs[j], ctx, state);
                const param = callee.fn.params[j];
                if (!useful(as) || !param || param.rest) continue;
                const rs = returnShapeOf(callee.fn, param.name, as, hopBindings(callArgs, callee.fn, ctx));
                if (rs) {
                    mergeShape(out, rs);
                    hit = true;
                }
            }
        }
    }
    return hit ? out : undefined;
}

function resolveCallee(callee, ctx) {
    const info = luaFile(ctx.fn.file);
    if (!info) return undefined;
    const req = /^require\("([^"]+)"\)[.:](\w+)$/.exec(callee);
    if (req) {
        const module = resolveModule(req[1]);
        const fn = module.luaName ? findFunction(module.info, module.luaName, req[2]) : module.info.byKey.get(req[2]);
        return fn ? { fn, info: module.info } : undefined;
    }
    const parts = callee.split(/[.:]/);
    if (parts.length === 1) {
        const local = info.byKey.get(callee);
        return local ? { fn: local, info } : undefined;
    }
    if (parts.length > 2) return undefined;
    const [head, name] = parts;
    if (head === "self") {
        const fn = ctx.fn.owner ? findFunction(info, ctx.fn.owner, name) : undefined;
        if (fn) return { fn, info };
        for (const cls of info.classes) {
            const f = findFunction(info, cls, name);
            if (f) return { fn: f, info };
        }
        return undefined;
    }
    const target = resolveLocal(info, head);
    if (target) {
        const fn = findFunction(target.info, target.luaName ?? head, name) ?? target.info.byKey.get(name);
        if (fn) return { fn, info: target.info };
    }
    const local = findFunction(info, head, name);
    return local ? { fn: local, info } : undefined;
}

function copierParam(fn) {
    for (const param of fn.params) {
        if (!new RegExp(`pairs\\(${param.name}\\)`).test(fn.body)) continue;
        const m = /^\s*return (\w+)\s*$/m.exec(fn.body);
        if (m && (m[1] === param.name || new RegExp(`\\b${m[1]}\\[\\w+\\] = `).test(fn.body))) return param.name;
    }
    return undefined;
}

function returnShapeOf(fn, paramName, shape, bindings = new Map()) {
    const key = `${fn.file}|${fn.key}|${fn.startLine}|${paramName}|${shapeKey(shape)}|${bindingsKey(bindings)}`;
    if (returnShapes.has(key)) return returnShapes.get(key);
    returnShapes.set(key, undefined);
    const state = visit({ fn, name: paramName, shape, bindings });
    let out;
    const add = (s) => {
        if (useful(s)) out = mergeShape(out ?? emptyShape(), s);
    };
    if (copierParam(fn) === paramName) add(shape);
    const ctx = { fn, name: paramName, shape, bindings };
    for (let i = 1; i < fn.lines.length; i++) {
        if (!fn.mask[i]) continue;
        const line = fn.lines[i];
        if (/\bfunction\b/.test(stripStrings(line).replace(/--.*$/, "")) && !/^\s*return /.test(line)) continue;
        const m = /^\s*(?:if .*\bthen\s+)?return (.+?)(?:\s+end)?\s*$/.exec(line);
        if (!m) continue;
        for (const expr of splitArgs(m[1])) {
            if (/^\w+$/.test(expr) && expr !== paramName) {
                const filled = new RegExp(`\\b${expr}\\[[^\\]]+\\] = ((?:require\\("[^"]+"\\)|[A-Za-z_]\\w*)(?:[.:][A-Za-z_]\\w*)*)\\((.*)\\)`).exec(fn.body);
                if (filled) {
                    const callee = resolveCallee(filled[1], ctx);
                    if (callee) {
                        const callArgs = splitArgs(filled[2]);
                        for (let j = 0; j < callArgs.length; j++) {
                            const as = exprShape(callArgs[j], ctx, state) ?? (state?.aliases.get(callArgs[j]) ? { ...state.aliases.get(callArgs[j]) } : undefined);
                            const param = callee.fn.params[j];
                            if (!useful(as) || !param) continue;
                            const inner = returnShapeOf(callee.fn, param.name, as, hopBindings(callArgs, callee.fn, ctx));
                            if (useful(inner)) {
                                out = out ?? emptyShape();
                                out.element = mergeShape(out.element ?? emptyShape(), inner);
                            }
                        }
                    }
                    continue;
                }
                const alias = state?.aliases.get(expr);
                if (alias) add(alias);
                continue;
            }
            add(exprShape(expr, ctx, state));
            const alias = state?.aliases.get(expr.trim());
            if (alias) add(alias);
        }
    }
    returnShapes.set(key, out);
    return out;
}

const NIL = "<nil>";

function evalCondition(condition, bindings) {
    const m = /^\s*(not\s+)?([\w.]+)\s*(==|~=)\s*("[^"]*"|nil)\s*$/.exec(condition) ?? /^\s*(not\s+)?("[^"]*"|nil)\s*(==|~=)\s*([\w.]+)\s*$/.exec(condition);
    if (!m) return undefined;
    const [, negate, left, op, right] = m;
    const literalSide = /^("|nil$)/.test(left) ? left : right;
    const variable = literalSide === left ? right : left;
    const literal = literalSide === "nil" ? NIL : literalSide.slice(1, -1);
    if (!bindings.has(variable)) return undefined;
    let result = (op === "==") === (bindings.get(variable) === literal);
    if (negate) result = !result;
    return result;
}

function hopBindings(callArgs, callee, ctx) {
    const out = new Map();
    for (let j = 0; j < callArgs.length; j++) {
        const param = callee.params[j];
        if (!param || param.rest) continue;
        const literal = /^"([^"]*)"$/.exec(callArgs[j]);
        if (literal) out.set(param.name, literal[1]);
        else if (ctx.bindings.has(callArgs[j])) out.set(param.name, ctx.bindings.get(callArgs[j]));
    }
    return out;
}

function bindingsKey(bindings) {
    return [...bindings].map(([k, v]) => `${k}=${v}`).sort().join(",");
}

function visit(ctx) {
    if (!ctx.bindings) ctx.bindings = new Map();
    const originKey = ctx.origin ? `${ctx.origin.record.key}.${ctx.origin.key}` : "";
    const key = `${ctx.fn.file}|${ctx.fn.key}|${ctx.fn.startLine}|${ctx.name}|${shapeKey(ctx.shape)}|${originKey}|${bindingsKey(ctx.bindings)}`;
    if (visited.has(key)) return visited.get(key);
    const state = { literals: new Map(), aliases: new Map() };
    visited.set(key, state);
    if (trace && (shapeKey(ctx.shape).includes(trace) || ctx.name === trace)) console.log(`trace: ${ctx.fn.file} ${ctx.fn.key} ${ctx.name} : ${shapeKey(ctx.shape)}${ctx.origin ? ` (origin ${ctx.origin.key})` : ""}${ctx.bindings.size > 0 ? ` [${bindingsKey(ctx.bindings)}]` : ""}`);
    const rec = isObject(ctx.shape) ? record(ctx.shape) : undefined;
    const deferred = [];
    const frames = [];
    let deadAfter = false;
    let pendingCondition;
    const esc = escapeVar(ctx.name);
    const lines = ctx.fn.lines;
    const memberRe = new RegExp(`(?<![\\w.:])${esc}\\.([A-Za-z_]\\w*)\\b`, "g");
    const callsByLine = new Map();
    for (const call of callsOf(ctx.fn)) {
        if (!callsByLine.has(call.line)) callsByLine.set(call.line, []);
        callsByLine.get(call.line).push(call);
    }
    const callback = (k, count, callArgs) => {
        if (!rec) return;
        if (!rec.callbacks.has(k)) rec.callbacks.set(k, new Set());
        rec.callbacks.get(k).add(count);
        if (!rec.callbackArgs.has(k)) rec.callbackArgs.set(k, []);
        rec.callbackArgs.get(k).push({ args: callArgs, owner: ctx.fn.owner, fn: ctx.fn });
    };
    const touchRead = (k, where, line) => {
        if (!rec) return;
        if (!rec.first.has(k)) rec.first.set(k, "read");
        if (rec.first.get(k) === "read" && !rec.reads.has(k)) rec.reads.set(k, { where, line, variable: ctx.name, file: ctx.fn.file, fn: ctx.fn });
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const code = stripStrings(line).replace(/--.*$/, "").trim();
        let live = !deadAfter && !frames.some((f) => f.dead);
        if (i > 0) {
            let header = line.trim();
            if (pendingCondition !== undefined) {
                header = `${pendingCondition} ${header}`;
                pendingCondition = undefined;
            }
            if (/^(if|elseif) /.test(header) && !/\bthen\b/.test(code)) {
                pendingCondition = header;
                continue;
            }
            const ifm = /^if (.+?) then\b(.*)$/.exec(header);
            if (ifm && !/\bfunction\b/.test(code)) {
                const ev = evalCondition(ifm[1], ctx.bindings);
                if (/\bend\s*$/.test(code)) {
                    if (ev === false) live = false;
                    else if (ev === true && /\breturn\b/.test(ifm[2]) && live) deadAfter = true;
                } else frames.push({ kind: "if", dead: ev === false, any: ev === true });
            } else if (/^elseif (.+?) then\b/.test(header)) {
                const frame = frames[frames.length - 1];
                if (frame?.kind === "if") {
                    const ev = evalCondition(/^elseif (.+?) then\b/.exec(header)[1], ctx.bindings);
                    frame.dead = frame.any === true || ev === false;
                    if (ev === true && !frame.any) frame.any = true;
                }
            } else if (/^else\s*$/.test(code)) {
                const frame = frames[frames.length - 1];
                if (frame?.kind === "if") frame.dead = frame.any === true;
            } else if (/^(end\b|until\b)/.test(code)) {
                frames.pop();
            } else {
                const opens = (code.match(/\b(function|repeat)\b/g) ?? []).length + (/\b(for|while)\b.*\bdo\s*$/.test(code) || /^do$/.test(code) ? 1 : 0);
                const closes = (code.match(/\bend\b/g) ?? []).length;
                for (let n = 0; n < opens - closes; n++) frames.push({ kind: "block", dead: false });
            }
            live = live && !deadAfter && !frames.some((f) => f.dead);
            if (/^if /.test(header) && !/\bend\s*$/.test(code) && frames[frames.length - 1]?.dead) live = false;
        }
        if (!live) continue;
        const masked = line.replace(/==|~=|<=|>=/g, "##");
        const eq = masked.indexOf("=");
        const lhs = eq >= 0 && /^\s*(?:local )?[\w.\[\]"']+(\s*,\s*[\w.\[\]"']+)*\s*$/.test(masked.slice(0, eq)) ? line.slice(0, eq) : "";
        const rhs = lhs ? line.slice(eq + 1) : line;
        const where = `${ctx.fn.file} ${ctx.fn.key}`;

        for (const m of rhs.matchAll(memberRe)) touchRead(m[1], where, line);

        for (const call of callsByLine.get(i) ?? []) {
            if (ctx.origin && (call.callee === ctx.name || (call.callee === "pcall" && call.args[0] === ctx.name))) {
                const callArgs = call.callee === "pcall" ? call.args.slice(1) : call.args;
                const origin = ctx.origin.record;
                if (!origin.callbacks.has(ctx.origin.key)) origin.callbacks.set(ctx.origin.key, new Set());
                origin.callbacks.get(ctx.origin.key).add(callArgs.length);
                if (!origin.callbackArgs.has(ctx.origin.key)) origin.callbackArgs.set(ctx.origin.key, []);
                origin.callbackArgs.get(ctx.origin.key).push({ args: callArgs, owner: ctx.fn.owner });
                continue;
            }
            if (rec && call.callee.startsWith(`${ctx.name}.`) && /^[A-Za-z_]\w*$/.test(call.callee.slice(ctx.name.length + 1))) {
                callback(call.callee.slice(ctx.name.length + 1), call.args.length, call.args);
                continue;
            }
            if (rec && call.callee === "pcall" && call.args.length > 0) {
                const m = new RegExp(`^${esc}\\.([A-Za-z_]\\w*)$`).exec(call.args[0]);
                if (m) {
                    touchRead(m[1], where, line);
                    callback(m[1], call.args.length - 1, call.args.slice(1));
                }
                continue;
            }
            if (call.callee === "table.insert" && call.args.length === 2) {
                const value = call.args[1];
                if (value.startsWith("{")) {
                    const fields = new Map();
                    for (const f of literalFields(value)) {
                        const s = exprShape(f.value, ctx, state);
                        if (useful(s)) fields.set(f.key, s);
                    }
                    if (fields.size > 0) storeCollection(call.args[0], fields, undefined);
                } else if (state.literals.has(value)) {
                    storeCollection(call.args[0], state.literals.get(value), undefined);
                } else {
                    const s = exprShape(value, ctx, state);
                    if (useful(s)) storeCollection(call.args[0], new Map(), s);
                }
                continue;
            }
            if (call.callee === "ipairs" || call.callee === "pairs" || call.callee === "type" || call.callee === "tostring" || call.callee === "tonumber" || call.callee === "assert" || call.callee === "error") continue;
            const target = resolveCallee(call.callee, ctx);
            if (!target) continue;
            for (let j = 0; j < call.args.length; j++) {
                const s = exprShape(call.args[j], ctx, state);
                if (!useful(s)) continue;
                const param = target.fn.params[j];
                if (!param || param.rest) continue;
                visit({ fn: target.fn, name: param.name, shape: s, origin: originFor(rec, call.args[j], esc) ?? (call.args[j] === ctx.name ? ctx.origin : undefined), bindings: hopBindings(call.args, target.fn, ctx) });
            }
        }

        const loop = /for (\w+)(?:,\s*(\w+))? in (i?pairs)\((.+)\)\s+do/.exec(line);
        if (loop) {
            const s = exprShape(loop[4], ctx, state, true);
            const variable = loop[2];
            if (useful(s) && s.element && variable) visit({ fn: ctx.fn, name: variable, shape: s.element, bindings: ctx.bindings });
            continue;
        }

        if (lhs) {
            const targets = lhs.replace(/^\s*local\s+/, "").trim().split(/\s*,\s*/);
            const valueText = line.slice(eq + 1).trim();
            if (targets.length === 1 && valueText.startsWith("{")) {
                let text = valueText;
                if (balanced(text, 0) < 0) {
                    const rest = lines.slice(i).join("\n");
                    const close = balanced(rest, rest.indexOf("{"));
                    if (close >= 0) text = rest.slice(rest.indexOf("{"), close + 1);
                }
                const fields = new Map();
                for (const f of literalFields(text)) {
                    const s = exprShape(f.value, ctx, state);
                    if (useful(s)) fields.set(f.key, s);
                }
                if (fields.size > 0 && /^\w+$/.test(targets[0])) state.literals.set(targets[0], fields);
                if (/\[[^\]]+\]$/.test(targets[0]) && fields.size > 0) storeCollection(targets[0], fields, undefined);
            } else {
                const values = splitArgs(valueText);
                for (let t = 0; t < targets.length; t++) {
                    const target = targets[t];
                    const value = values[t];
                    if (!value) continue;
                    if (/\[[^\]]+\]$/.test(target)) {
                        if (state.literals.has(value)) storeCollection(target, state.literals.get(value), undefined);
                        else {
                            const s = exprShape(value, ctx, state);
                            if (useful(s)) storeCollection(target, new Map(), s);
                        }
                        continue;
                    }
                    if (ctx.bindings.has(value.trim()) && !target.includes("[")) {
                        ctx.bindings.set(target, ctx.bindings.get(value.trim()));
                        continue;
                    }
                    const s = exprShape(value, ctx, state);
                    if (!useful(s)) continue;
                    if (target === ctx.name) continue;
                    const origin = originFor(rec, value, esc) ?? (value.trim() === ctx.name ? ctx.origin : undefined);
                    if (target.startsWith("self.") && ctx.fn.owner) {
                        const info = luaFile(ctx.fn.file);
                        for (const fn of info.functions) if (fn.owner === ctx.fn.owner && fn.indent === "") deferred.push({ fn, name: target, shape: s, origin, bindings: ctx.bindings });
                    } else if (/^\w+$/.test(target)) {
                        state.aliases.set(target, s);
                        visit({ fn: ctx.fn, name: target, shape: s, origin, bindings: ctx.bindings });
                    }
                }
            }
            for (const m of lhs.matchAll(memberRe)) {
                const after = lhs.slice(m.index + m[0].length);
                if (/^\s*(,|$)/.test(after) && rec && !rec.first.has(m[1])) rec.first.set(m[1], "write");
            }
        }
    }
    for (const next of deferred) visit(next);
    return state;
}

function originFor(rec, expression, esc) {
    if (!rec) return undefined;
    const m = new RegExp(`^${esc}\\.([A-Za-z_]\\w*)`).exec(expression.trim());
    if (!m) return undefined;
    if (!rec.callbacks.has(m[1])) rec.callbacks.set(m[1], new Set());
    return { record: rec, key: m[1] };
}

function isDeclared(shape, key) {
    return key.startsWith("_") || declaredProps(shape).has(key);
}

function runSeeds(seeds) {
    for (const seed of seeds) {
        for (const p of seed.tsParams ?? []) {
            const names = new Set();
            addIfaces(resolveType(p.type), names);
            for (const i of names) seedCounts.set(i, (seedCounts.get(i) ?? 0) + 1);
        }
    }
    for (const seed of seeds) {
        if (seed.registry) {
            const info = luaFile("src/core/content_methods.lua");
            const shape = emptyShape();
            shape.element = resolveType(seed.tsParams[seed.tsParams.length - 1]?.type);
            if (!isObject(shape.element)) continue;
            for (const name of ["addSingle", "addPaired"]) {
                const fn = info.byKey.get(name);
                if (fn) visit({ fn, name: "args", shape, bindings: new Map([["spec.textTitle", seed.registry.text ? "true" : NIL]]) });
            }
            continue;
        }
        for (let i = 0; i < seed.tsParams.length; i++) {
            const luaParam = seed.params[i];
            if (!luaParam || luaParam.rest || luaParam.name.startsWith("_")) continue;
            const shape = resolveType(seed.tsParams[i].type);
            if (useful(shape)) visit({ fn: seed.fn, name: luaParam.name, shape });
        }
    }
    for (let round = 0; round < 6; round++) {
        collectionsChanged = false;
        for (const suffix of [...collections.keys()]) {
            const shape = collectionShape(suffix);
            if (!shape) continue;
            for (const file of allSourceFiles()) {
                const info = luaFile(file);
                for (const fn of info.functions) {
                    for (const m of fn.body.matchAll(new RegExp(`for \\w+,\\s*(\\w+) in ipairs\\([\\w.]*\\b${suffix}\\b`, "g"))) visit({ fn, name: m[1], shape });
                    for (const m of fn.body.matchAll(new RegExp(`^\\s*local (\\w+) = [\\w.]*\\b${suffix}\\[`, "gm"))) visit({ fn, name: m[1], shape });
                }
            }
        }
        if (!collectionsChanged) break;
    }
}

const seedCounts = new Map();

function primaryIface(shape) {
    let best;
    for (const iface of shape.ifaces) {
        const d = decls.get(iface);
        if (!d || d.synthetic || d.literal) continue;
        const count = seedCounts.get(iface) ?? 0;
        if (best === undefined || count < best.count) best = { iface, count };
    }
    return best?.iface;
}

function owningDecl(shape, key) {
    for (const iface of shape.ifaces) {
        for (const a of ancestors(iface)) {
            const d = decls.get(a);
            if (d && d.props.has(key)) return a;
        }
    }
    return undefined;
}

function reportOptions() {
    const readByIface = new Map();
    let keys = 0;
    for (const rec of records.values()) {
        const producedShape = isProduced(rec.shape);
        for (const [k, read] of rec.reads) {
            if (k.startsWith("_")) continue;
            if (!producedShape) keys++;
            if (!producedShape && !isDeclared(rec.shape, k)) {
                const iface = primaryIface(rec.shape);
                fail(`${rec.key}: the Lua reads option "${k}" (${read.where}), which is not declared`, iface ? { kind: "addProp", decl: iface, key: k, read, callbacks: rec.callbackArgs.get(k) } : undefined);
            }
            for (const iface of rec.shape.ifaces) {
                for (const a of ancestors(iface)) {
                    if (!readByIface.has(a)) readByIface.set(a, new Set());
                    readByIface.get(a).add(k);
                }
            }
        }
        if (trace && rec.key.includes(trace)) console.log(`trace: record ${rec.key} produced=${producedShape} callbacks=${JSON.stringify([...rec.callbacks].map(([k, v]) => [k, [...v]]))} reads=${[...rec.reads.keys()].join(",")}`);
        if (producedShape) continue;
        const declared = declaredProps(rec.shape);
        for (const [k, counts] of rec.callbacks) {
            if (!declared.has(k)) continue;
            const expected = propShape(rec.shape, k).arities;
            if (expected.size === 0) continue;
            const seen = counts;
            const owner = owningDecl(rec.shape, k);
            if (seen.size === 0) {
                fail(`${rec.key}: callback "${k}" is declared but the Lua never calls it`, owner ? { kind: "removeMember", decl: owner, member: `prop:${k}` } : undefined);
                continue;
            }
            for (const n of seen) if (!expected.has(n)) fail(`${rec.key}: the Lua calls "${k}" with ${n} argument${n === 1 ? "" : "s"} but TypeScript declares ${[...expected].join(" or ")}`, owner ? { kind: "setCallback", decl: owner, key: k, callbacks: rec.callbackArgs.get(k) } : undefined);
        }
    }
    for (const iface of referenced) {
        const d = decls.get(iface);
        if (!d || d.synthetic || produced.has(iface)) continue;
        const reads = readByIface.get(iface) ?? new Set();
        if (reads.size === 0 && resolved(iface).props.size > 0) {
            fail(`${iface}: no Lua code reads it; either the declaration is unused or the flow could not be followed`);
            continue;
        }
        for (const k of resolved(iface).props.keys()) if (!reads.has(k)) fail(`${iface}: TypeScript declares option "${k}", which the Lua never reads`, d.props.has(k) ? { kind: "removeMember", decl: iface, member: `prop:${k}` } : undefined);
    }
    return keys;
}

function checkProducedInterfaces(allLua) {
    for (const name of produced) {
        const d = decls.get(name);
        if (!d || d.kind === "class" || d.literal || d.synthetic) continue;
        for (const prop of d.props.keys()) {
            if (!assignedIn(allLua, prop)) fail(`${name}: TypeScript declares property ${prop}, which nothing in the Lua assigns`, { kind: "removeMember", decl: name, member: `prop:${prop}` });
        }
    }
}


const OPTIONAL_PARAM = /^(options|notify|triggerEvents|triggerCallback|topOffset|field|quantity|tooltip|hoverHandlers|parentContext|flowManaged|isTitle|eventType|rgba|selectedID|widthAnchor|heightAnchor|action|value)$|Options$/;

function numericPattern(expr) {
    const v = `(?<![\\w.])${expr}(?![\\w])`;
    return new RegExp(
        `(?:tonumber|math\\.\\w+)\\(\\s*${v}|${v}\\s*(?:[-+*/%^]|==|~=|<=|>=|<|>)\\s*-?[\\d.]|-?[\\d.]\\s*[-+*/%^]\\s*${v}|${v}\\s+or\\s+-?[\\d.]|^\\s*(?:local )?${v}\\s*=\\s*-?[\\d.]`,
        "m",
    );
}

function numericInHelpers(text, expr, file, depth) {
    const info = file === undefined ? undefined : luaFile(file);
    if (!info) return false;
    for (const call of text.matchAll(/\b(\w+)\(([^()]*)\)/g)) {
        const helper = info.byKey.get(call[1]);
        if (!helper || helper.owner !== undefined) continue;
        const args = call[2].split(",").map((a) => a.trim());
        const index = args.findIndex((a) => a === expr);
        const param = index < 0 ? undefined : helper.params[index];
        if (param && numericUse(helper.body, param.name, helper.file, depth + 1)) return true;
    }
    return false;
}

function numericUse(text, name, file, depth = 0) {
    if (text === undefined || depth > 2) return false;
    const code = stripStrings(text);
    if (numericPattern(escapeVar(name)).test(code)) return true;
    return numericInHelpers(code, name, file, depth);
}

function typeForParam(name, declName, memberName, fn) {
    if (/Options$/.test(name) || name === "options") {
        const added = /^Add([A-Z]\w*)$/.exec(memberName ?? "");
        if (added && decls.has(`${added[1]}Options`)) return `${added[1]}Options & FlowOptions`;
        const candidate = `${declName}Options`;
        return decls.has(candidate) || scaffoldOptions.has(candidate) ? candidate : "unknown";
    }
    if (fn?.body !== undefined && fn.file !== undefined) {
        const union = unionFromIndexing(name, fn.body, luaFile(fn.file));
        if (union !== undefined) return union;
        const called = callsOf(fn).filter((c) => c.callee === name);
        if (called.length > 0) return callbackTypeText(called.map((c) => ({ args: c.args, owner: fn.owner })), declName);
        const stored = new RegExp(`^\\s*self\\.(\\w+)\\s*=\\s*${escapeVar(name)}\\s*$`, "m").exec(fn.body);
        const info = stored === null ? undefined : luaFile(fn.file);
        const indirect = info === undefined ? [] : info.functions.flatMap((f) => callsOf(f)).filter((c) => c.callee === `self.${stored[1]}`);
        if (indirect.length > 0) return callbackTypeText(indirect.map((c) => ({ args: c.args, owner: fn.owner })), declName);
        for (const call of info === undefined ? [] : info.functions.flatMap((f) => callsOf(f))) {
            const at = call.args.findIndex((a) => a === `self.${stored[1]}`);
            const parts = at < 0 ? null : /^(\w+)([.:])(\w+)$/.exec(call.callee);
            if (parts === null) continue;
            const declared = declaredSignature(tsForLocal(fn, parts[1]), parts[2], parts[3]);
            const type = declared?.params[at]?.type?.getText();
            if (type !== undefined && type !== "unknown") return type;
        }
        for (const call of callsOf(fn)) {
            const at = call.args.findIndex((a) => a === name);
            const parts = at < 0 ? null : /^(\w+)([.:])(\w+)$/.exec(call.callee);
            if (parts === null) continue;
            const declared = declaredSignature(tsForLocal(fn, parts[1]), parts[2], parts[3]);
            const passed = declared?.params[at];
            const type = passed?.type?.getText();
            if (type !== undefined && type !== "unknown") return type;
        }
    }
    if (/^(notify|disabled|enabled|visible|hidden|selected|expanded|clickthrough|scrollable|triggerEvents|triggerCallback|poppedOut|active|isTitle|toggleable|force)$/.test(name)) return "boolean";
    if (/^(x|y|width|height|index|alpha|degrees|delta|position|contentHeight|topOffset|widthAnchor|heightAnchor|xAnchor|yAnchor|columns|rows|quantity|zoom|sourceIndex|destinationIndex|column|row|spriteID|entryHeight|size)$/.test(name)) return "number";
    if (/^(text|label|title|spriteName|placeholder|identifier|content|variant)$/.test(name)) return "string";
    if (/^(colour|color)$/.test(name)) return "Colour";
    if (name === "tooltip") return "TooltipValue | undefined";
    if (name === "parent" || name === "target" || name === "collection" || name === "child") return "Component";
    if (name === "owner") return "FlowOwner";
    if (name === "entryID") return "EntryID";
    if (name === "object") return "ObjTypeProxy | undefined";
    if (name === "cursor") return "CursorValue | undefined";
    if (fn?.body !== undefined && numericUse(fn.body, name, fn.file)) return "number";
    return "unknown";
}

function constructedType(info, expr) {
    const m = /^(\w+)\.new\(/.exec(expr);
    if (!m || info === undefined) return undefined;
    const target = resolveLocal(info, m[1]);
    if (!target || !target.luaName) return undefined;
    return tsByLua.get(`${target.info.file}|${target.luaName}`);
}

function tsForLocal(fn, local) {
    const info = fn.file === undefined ? undefined : luaFile(fn.file);
    if (!info) return undefined;
    if (local === "self") return tsByLua.get(`${info.file}|${fn.owner}`);
    const target = resolveLocal(info, local);
    return target && target.luaName ? tsByLua.get(`${target.info.file}|${target.luaName}`) : undefined;
}

function declaredSignature(target, kind, member) {
    const d = target === undefined ? undefined : decls.get(target);
    if (!d) return undefined;
    const list = kind === "." ? resolved(target).statics.get(member) : resolved(target).methods.get(member);
    if (!list) return undefined;
    return { params: list, returns: returnTypeOf(target, `${kind}${member}`)?.getText() };
}

function delegatedType(fn, value, seen) {
    const call = /^(\w+)([.:])(\w+)\(/.exec(value);
    if (!call) return undefined;
    const declared = declaredSignature(tsForLocal(fn, call[1]), call[2], call[3]);
    if (declared?.returns !== undefined && declared.returns !== "unknown") return declared.returns;
    const info = fn.file === undefined ? undefined : luaFile(fn.file);
    if (!info) return undefined;
    const target = call[1] === "self" ? findFunction(info, fn.owner, call[3]) : (() => {
        const module = resolveLocal(info, call[1]);
        return module ? findFunction(module.info, module.luaName ?? call[1], call[3]) : undefined;
    })();
    if (!target || seen.has(target)) return undefined;
    const type = returnTypeFor(target, seen);
    return type === "unknown" || type === "this" ? undefined : type;
}

function numericExpr(expr, fn, depth = 0) {
    const e = expr.trim();
    if (depth > 6) return false;
    if (/^-?[\d.]+$/.test(e)) return true;
    if (/^(?:math\.\w+|tonumber)\(/.test(e) || /^#/.test(e)) return true;
    if (/[-+*/%^]\s*-?[\d.]/.test(e)) return true;
    const alternatives = e.split(/\s+or\s+/);
    if (alternatives.length > 1) return alternatives.some((part) => numericExpr(part, fn, depth + 1));
    const fileText = fn.file === undefined ? undefined : luaFile(fn.file)?.text;
    for (const text of [fn.body, fileText]) {
        if (text === undefined) continue;
        if (/^[\w.]+$/.test(e) && numericUse(text, e, fn.file)) return true;
        const assigned = /^\w+$/.test(e) ? new RegExp(`^\\s*local ${e}\\s*=\\s*(.+)$`, "m").exec(text) : null;
        if (assigned !== null && numericExpr(assigned[1], fn, depth + 1)) return true;
    }
    return false;
}

function measureExpr(expr) {
    const e = expr.trim();
    if (/["'{]|^(true|false|nil)$/.test(e)) return false;
    return !/^self\.\w+$/.test(e);
}

function sizeAlias() {
    for (const [name, type] of aliases) if (type.getText().replace(/\s+/g, "") === "LuaMultiReturn<[number,number]>") return name;
    return "LuaMultiReturn<[number, number]>";
}

function returnTypeFor(fn, seen = new Set()) {
    if (!fn) return "unknown";
    seen.add(fn);
    const values = [];
    for (let i = 1; i < fn.lines.length; i++) {
        if (!fn.mask[i]) continue;
        const line = fn.lines[i];
        if (/\bfunction\b/.test(stripStrings(line)) && !/^\s*return /.test(line)) continue;
        const m = /^\s*(?:if .*\bthen\s+)?return\b(.*?)(?:\s+end)?\s*$/.exec(line);
        if (m) values.push(m[1].trim());
    }
    if (values.length === 0 || values.every((v) => v === "")) return "void";
    const tuples = values.map((v) => splitArgs(v));
    if (tuples.every((t) => t.length === 2 && t.every((e) => measureExpr(e)) && t.some((e) => numericExpr(e, fn)))) return sizeAlias();
    if (values.every((v) => /^(true|false)$/.test(v))) return "boolean";
    if (values.every((v) => v === "self")) return "this";
    if (values.every((v) => /^-?\d/.test(v))) return "number";
    if (values.every((v) => /^"/.test(v))) return "string";
    if (values.every((v) => /^(#|math\.\w+\()/.test(v))) return "number";
    if (values.every((v) => /^tostring\(/.test(v))) return "string";
    if (values.every((v) => /^tonumber\(/.test(v))) return "number | undefined";
    if (values.every((v) => /[-+*/%^]\s*-?[\d.]|^\(.*\)\s*[-+*/%^]/.test(v))) return "number";
    const info = luaFile(fn.file);
    const constructed = [...new Set(values.map((v) => constructedType(info, v)))];
    if (constructed.length === 1 && constructed[0] !== undefined) return values.length === 1 ? constructed[0] : `${constructed[0]} | undefined`;
    const delegated = [...new Set(values.map((v) => delegatedType(fn, v, seen)))];
    if (delegated.length === 1 && delegated[0] !== undefined) return delegated[0];
    return "unknown";
}

function tableLiteralAt(text, re) {
    const m = re.exec(text);
    if (!m) return undefined;
    const open = text.indexOf("{", m.index);
    if (open < 0) return undefined;
    const close = balanced(text, open);
    return close < 0 ? undefined : text.slice(open, close + 1);
}

function tableLiteralFor(info, expr) {
    if (/^\w+$/.test(expr)) return tableLiteralAt(info.text, new RegExp(`^local ${expr} = \\{`, "m"));
    const parts = /^(\w+)\.(\w+)$/.exec(expr);
    if (!parts) return undefined;
    const target = resolveLocal(info, parts[1]);
    if (!target) return undefined;
    return tableLiteralAt(target.text ?? target.info.text, new RegExp(`^(?:\\s+|${target.luaName ?? parts[1]}\\.)${parts[2]} = \\{`, "m"));
}

function literalKeys(literal) {
    const keys = [];
    for (const field of splitArgs(literal.slice(1, -1))) {
        const m = /^(?:(\w+)|\["([^"]+)"\])\s*=/.exec(field.trim());
        if (m) keys.push(m[1] ?? m[2]);
    }
    return keys;
}

function unionFromIndexing(expr, body, info, depth = 0) {
    if (body === undefined || info === undefined || depth > 2) return undefined;
    const v = `(?<![\\w.])${escapeVar(expr)}(?![\\w])`;
    const index = new RegExp(`([\\w.]+)\\[\\s*${v}[^\\]]*\\]`).exec(body);
    if (index) {
        const literal = tableLiteralFor(info, index[1]);
        const keys = literal === undefined ? [] : literalKeys(literal);
        if (keys.length > 0 && keys.every((k) => /^[a-z]\w*$/.test(k))) return keys.map((k) => `"${k}"`).join(" | ");
    }
    const alias = new RegExp(`^\\s*local (\\w+) = .*${v}.*$`, "m").exec(body);
    if (alias) {
        const found = unionFromIndexing(alias[1], body, info, depth + 1);
        if (found !== undefined) return found;
    }
    for (const call of body.matchAll(/\b(\w+)\(([^()]*)\)/g)) {
        const helper = info.byKey.get(call[1]);
        if (!helper || helper.owner !== undefined) continue;
        const index = call[2]
            .split(",")
            .map((a) => a.trim())
            .findIndex((a) => a === expr);
        const param = index < 0 ? undefined : helper.params[index];
        if (!param) continue;
        const found = unionFromIndexing(param.name, helper.body, luaFile(helper.file), depth + 1);
        if (found !== undefined) return found;
    }
    return undefined;
}

function paramsText(luaParams, existing, declName, memberName, fn) {
    const out = [];
    const fixed = luaParams.filter((p) => !p.rest);
    for (let i = 0; i < fixed.length; i++) {
        const lua = fixed[i];
        const prior = existing?.[i];
        const name = lua.name.startsWith("_") && prior ? prior.name : lua.name;
        const type = prior?.type ? prior.type.getText() : typeForParam(name, declName, memberName, fn);
        const optional = prior ? prior.optional : OPTIONAL_PARAM.test(name) || i > 0;
        out.push(`${name}${optional ? "?" : ""}: ${type}`);
    }
    if (luaParams.some((p) => p.rest)) out.push("...args: unknown[]");
    return out.join(", ");
}

function registryMethodText(member, count, declName, existing, known = (name) => decls.has(name)) {
    const target = member.replace(/^Add/, "");
    const hasTarget = known(target);
    const optionsType = known(`${target}Options`) ? `${target}Options & FlowOptions` : "unknown";
    const params = [];
    for (let i = 0; i < count; i++) {
        const prior = existing ? existing[existing.length - count + i] : undefined;
        if (prior) params.push(`${prior.name}${prior.optional ? "?" : ""}: ${prior.type ? prior.type.getText() : "unknown"}`);
        else if (i === count - 1) params.push(`options?: ${optionsType}`);
        else params.push(`arg${i + 1}: unknown`);
    }
    const paired = declName === "PanelContentMethods" || (decls.get(declName)?.extends ?? []).includes("PanelContentMethods");
    const ret = hasTarget ? (paired ? `Paired<${target}>` : target) : "unknown";
    return `${member}(${params.join(", ")}): ${ret};`;
}

function argType(fn, arg, declName) {
    if (fn === undefined || !fn.params?.some((p) => p.name === arg)) return "unknown";
    return typeForParam(arg, declName.replace(/Options$/, ""), undefined, fn);
}

function callbackTypeText(calls, declName) {
    const longest = (calls ?? []).reduce((best, c) => (c.args.length > (best?.args.length ?? -1) ? c : best), undefined);
    const params = ["this: void"];
    for (let i = 0; i < (longest?.args.length ?? 0); i++) {
        const arg = longest.args[i];
        const known = (n) => n !== undefined && (decls.has(n) || scaffoldNames.has(n));
        if (arg === "self" && known(longest.owner)) params.push(`${longest.owner[0].toLowerCase()}${longest.owner.slice(1)}: ${longest.owner}`);
        else if (arg === "self" || arg === "proxy") params.push(`${declName.replace(/Options$/, "")[0]?.toLowerCase() ?? "c"}${declName.replace(/Options$/, "").slice(1)}: ${known(declName.replace(/Options$/, "")) ? declName.replace(/Options$/, "") : "unknown"}`);
        else if (/^[A-Za-z_]\w*$/.test(arg) && !/^(true|false|nil)$/.test(arg)) params.push(`${arg}: ${argType(longest.fn, arg, declName)}`);
        else if (/^self\.(\w+)$/.test(arg)) {
            const prop = /^self\.(\w+)$/.exec(arg)[1];
            const declared = longest.owner === undefined ? undefined : resolved(tsByLua.get(`${longest.fn?.file}|${longest.owner}`) ?? "").props?.get(prop);
            params.push(`${prop}: ${declared?.getText() ?? "unknown"}`);
        }
        else params.push(`arg${i + 1}: unknown`);
    }
    return `(${params.join(", ")}) => void`;
}

function inferOptionType(fix) {
    const { key, read, callbacks } = fix;
    if (callbacks && callbacks.length > 0) return callbackTypeText(callbacks, fix.decl);
    const line = read?.line ?? "";
    const access = `${escapeVar(read?.variable ?? "options")}\\.${key}`;
    if (new RegExp(`${access}\\s*(==|~=)\\s*(true|false)`).test(line) || /^(disabled|enabled|visible|hidden|selected|inline|absolute|shadowed|modal|resizable|scrollable|toggleable|active|expanded|clickthrough|autoPlay|dragDrop|popout|poppedOut|zoomable|sound|destroyOnClose|constrainToParent|followCursor|edgeToEdge)$/.test(key)) return "boolean";
    if (/^on[A-Z]/.test(key)) return "(this: void, ...args: unknown[]) => void";
    if (/colou?r$|colou?rs$|rgba$|RGBA$/i.test(key)) return /s$/.test(key) ? "Colour[]" : "Colour";
    if (new RegExp(`${access}\\s+or\\s+-?\\d`).test(line) || new RegExp(`(tonumber|math\\.\\w+)\\(${access}`).test(line) || /^(x|y|width|height|size|min|max|step|value|index|gap|interval|capacity|zoom|alpha|rotation|columns|rows|quantity|binWidth|origin|duration|maxLength|entryHeight|font|spriteID|stylesheetID|icon|soundID|indent|offsetX|offsetY|startY|tabGap|tabInset|iconSize|iconWidth|iconHeight|buttonSize|buttonGap|slotGap|itemInset|outlineWidth|maxWidth|maxVisibleEntries|dropdownMaxVisibleEntries|activeIndex|heightAboveGround|backgroundAlpha|popoutBackgroundAlpha|degreesPerLogicUpdate|entryIconScale|boundsMargin|acceptWidth|windowWidth|windowHeight|windowX|windowY|pickerX|pickerY|popoutX|popoutY|popoutWidth|popoutHeight|contentWidth|contentHeight|scrollStep|lineSpacing|maxLines|maxSelected|order|lower|upper|count|id)$|Anchor$|Width$|Height$|Size$|Index$|ID$|Id$|Spacing$|Gap$|Padding(Left|Right|Bottom|Top|X|Y)?$|Margin(Top|Bottom)?$/.test(key)) return "number";
    const union = unionFromIndexing(`${read?.variable ?? "options"}.${key}`, read?.fn?.body ?? line, read?.file === undefined ? undefined : luaFile(read.file));
    if (union !== undefined) return union;
    if (new RegExp(`tostring\\(${access}`).test(line) || new RegExp(`${access}\\s+or\\s+""`).test(line) || /^(text|label|title|placeholder|emptyText|body|identifier|variant|kind|type|flavou?r|orientation|placement|cancelLabel|confirmLabel|confirmVariant|acceptText|acceptVariant|windowTitle|metric|content)$/.test(key)) return "string";
    if (/tooltip$/i.test(key)) return "TooltipValue";
    if (/cursor$/i.test(key)) return "CursorValue";
    if (new RegExp(`ipairs\\(${access}`).test(line) || /^(entries|choices|data|samples|bins|actions|objects|values|tabs|selectedValues)$/.test(key)) return "ReadonlyArray<unknown>";
    if (/^(parent|overlayParent|windowParent)$/.test(key)) return "Component";
    if (/^(layout|textLayout|contentLayout)$/.test(key)) return "LayoutOptions";
    if (numericUse(line, `${read?.variable ?? "options"}.${key}`, read?.file)) return "number";
    const assigned = new RegExp(`[\w.]+\.(\w+)\s*=\s*${access}\b`).exec(line);
    const inherited = assigned === null ? undefined : uniqueCoreMember(assigned[1]);
    if (inherited !== undefined) return inherited;
    return "unknown";
}

function lineSpan(text, node, sf, includeLeading) {
    let start = node.getStart(sf);
    if (includeLeading) {
        const comments = ts.getLeadingCommentRanges(text, node.getFullStart());
        if (comments && comments.length > 0) start = comments[0].pos;
    }
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    let lineEnd = text.indexOf("\n", node.end);
    lineEnd = lineEnd === -1 ? text.length : lineEnd + 1;
    return { start: lineStart, end: lineEnd };
}

function snakeCase(name) {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function loadCoreDeclarations() {
    const dir = path.join(root, "packages", "core", "types");
    if (!fs.existsSync(dir) || coreGlobals.size > 0) return;
    const read = (file) => {
        const sf = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
        const visit = (statements, global) => {
            for (const s of statements) {
                if (ts.isModuleDeclaration(s) && s.body && ts.isModuleBlock(s.body)) {
                    visit(s.body.statements, false);
                    continue;
                }
                if (!(ts.isInterfaceDeclaration(s) || ts.isClassDeclaration(s)) || !s.name) continue;
                if (global) coreGlobals.add(s.name.text);
                const members = coreMembers.get(s.name.text) ?? new Map();
                for (const m of s.members) if ((ts.isPropertySignature(m) || ts.isPropertyDeclaration(m)) && m.type) members.set(m.name.getText(sf), m.type.getText(sf).replace(/\s+/g, " "));
                for (const clause of s.heritageClauses ?? []) for (const t of clause.types) members.set(`extends ${t.expression.getText(sf).replace(/<.*$/, "")}`, "");
                coreMembers.set(s.name.text, members);
            }
        };
        visit(sf.statements, true);
    };
    const walk = (d) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith(".d.ts")) read(full);
        }
    };
    walk(dir);
}

function coreMemberType(typeName, member, seen = new Set()) {
    const members = coreMembers.get(typeName);
    if (!members || seen.has(typeName)) return undefined;
    seen.add(typeName);
    if (members.has(member)) return members.get(member);
    for (const key of members.keys()) {
        const base = /^extends (\w+)$/.exec(key);
        const found = base === null ? undefined : coreMemberType(base[1], member, seen);
        if (found !== undefined) return found;
    }
    return undefined;
}

function uniqueCoreMember(member) {
    loadCoreDeclarations();
    const found = new Set();
    for (const members of coreMembers.values()) if (members.has(member)) found.add(members.get(member));
    return found.size === 1 ? [...found][0] : undefined;
}

function exportedName(name) {
    if (decls.has(name) || scaffoldNames.has(name)) return true;
    for (const ts of tsByLua.values()) if (ts === name) return true;
    return false;
}

function scaffoldPropType(cls, value, info) {
    loadCoreDeclarations();
    const literal = (v) => (/^-?[\d.]+$/.test(v) ? "number" : /^["']/.test(v) ? "string" : /^(true|false)$/.test(v) ? "boolean" : undefined);
    const option = /^options\.\w+\s+or\s+(.+)$/.exec(value);
    if (option) return literal(option[1].trim());
    const direct = literal(value);
    if (direct !== undefined) return direct;
    const field = /^(\w+)\.(\w+)$/.exec(value);
    const param = field === null ? undefined : cls.ctor?.params.find((p) => p.name === field[1]);
    if (param !== undefined) {
        const inherited = coreMemberType(typeForParam(param.name, cls.ts, undefined, cls.ctor.fn), field[2]);
        if (inherited !== undefined) return inherited;
    }
    if (/^\w+$/.test(value) && cls.ctor?.params.some((p) => p.name === value)) {
        const declared = typeForParam(value, cls.ts, undefined, cls.ctor.fn);
        if (declared !== "unknown") return declared;
    }
    if (/^tonumber\(/.test(value)) return "number";
    if (/^tostring\(/.test(value)) return "string";
    const constructed = constructedType(info, value);
    if (constructed !== undefined) return constructed;
    const external = /^(\w+)\.(\w+)\.new\(/.exec(value);
    if (external && info && resolveLocal(info, external[1]) === undefined && coreGlobals.has(external[2])) return exportedName(external[2]) ? `globalThis.${external[2]}` : external[2];
    const helper = /^(\w+)\(/.exec(value);
    if (helper && info) {
        const fn = info.byKey.get(helper[1]);
        if (fn && fn.owner === undefined) {
            const type = returnTypeFor(fn);
            if (type !== "unknown" && type !== "void" && type !== "this") return type;
        }
    }
    if (/^[A-Za-z_]\w*$/.test(value) && info && numericUse(info.text, value, info.file)) return "number";
    if (/^[-+*/%#(]|[-+*/%]\s*-?[\d.]|^math\.\w+\(/.test(value)) return "number";
    return undefined;
}

function scaffoldProps(cls) {
    const fn = cls.ctor?.fn;
    if (!fn) return [];
    const info = luaFile(fn.file);
    const props = new Map();
    for (let i = 1; i < fn.lines.length; i++) {
        const m = /^\s*self\.(\w+)\s*=\s*([^=].*?)\s*$/.exec(fn.lines[i]);
        if (!m || m[1].startsWith("_")) continue;
        const type = scaffoldPropType(cls, m[2].replace(/,$/, ""), info);
        if (type === undefined) continue;
        if (!props.has(m[1])) props.set(m[1], new Set());
        if (fn.mask[i] || props.get(m[1]).size > 0) props.get(m[1]).add(type);
    }
    return [...props]
        .filter(([, types]) => types.size > 0)
        .map(([k, types]) => `        readonly ${k}: ${[...types].join(" | ")};`);
}

function scaffoldClass(cls, registry, installed, inner) {
    const name = cls.ts;
    scaffoldNames.add(name);
    const lines = [];
    const baseNames = cls.bases.map((b) => tsByLua.get(`${b.info.file}|${b.luaName}`)).filter((n) => n !== undefined && n !== name);
    const inherits = cls.bases.length > 0 && baseNames.length === cls.bases.length;
    const instance = inherits ? new Map(cls.instance) : allInstance(cls);
    const ownInstall = inherits ? cls.info.installs.get(cls.luaName) : { content: cls.content, scroll: cls.scroll };
    const hostExtends = [...baseNames];
    if (ownInstall?.content === "single") hostExtends.push("ContentHost");
    if (ownInstall?.content === "paired") hostExtends.push("PanelContentMethods");
    if (ownInstall?.scroll === true) hostExtends.push("ScrollHost");
    const own = [...instance].filter(([k]) => !(cls.content && registry.some((r) => r.method === k)) && !(cls.scroll && installed.has(k)));
    const optionsName = cls.ctor?.params.some((p) => p.name === "options") && !decls.has(`${name}Options`) ? `${name}Options` : undefined;
    if (optionsName) {
        scaffoldOptions.add(optionsName);
        lines.push(`    interface ${optionsName} {`, `    }`, "");
    }
    if (cls.ctor && !inner) {
        lines.push(`    /** @customConstructor prettyui.${name}.new */`, `    class ${name} {`);
        const ctorParams = cls.ctor.params.filter((p) => !p.rest).map((p, i) => `${p.name}${OPTIONAL_PARAM.test(p.name) || i > 0 ? "?" : ""}: ${p.name === "options" && optionsName ? optionsName : typeForParam(p.name, name, undefined, cls.ctor.fn)}`);
        lines.push(`        constructor(${ctorParams.join(", ")});`);
        lines.push(...scaffoldProps(cls));
        for (const [k, entry] of own) lines.push(`        ${k}(${paramsText(entry.params, undefined, name, k, entry.fn)}): ${returnTypeFor(entry.fn)};`);
        lines.push(`    }`);
        if (hostExtends.length > 0) lines.push(`    interface ${name} extends ${hostExtends.join(", ")} {}`);
    } else {
        lines.push(`    interface ${name}${hostExtends.length > 0 ? ` extends ${hostExtends.join(", ")}` : ""} {`);
        lines.push(...scaffoldProps(cls));
        for (const [k, entry] of own) lines.push(`        ${k}(${paramsText(entry.params, undefined, name, k, entry.fn)}): ${returnTypeFor(entry.fn)};`);
        lines.push(`    }`);
    }
    if (cls.statics.size > 0) {
        lines.push(`    namespace ${name} {`);
        for (const [k, entry] of cls.statics) lines.push(`        function ${k}(${paramsText(entry.params, undefined, name, undefined, entry.fn)}): ${returnTypeFor(entry.fn)};`);
        lines.push(`    }`);
    }
    return lines;
}

function applyFixes() {
    const edits = new Map();
    const edit = (file, start, end, text) => {
        if (!edits.has(file)) edits.set(file, []);
        const list = edits.get(file);
        if (list.some((e) => e.start === start && e.end === end && e.text === text)) return false;
        if (list.some((e) => start < e.end && end > e.start && (start !== end || e.start !== e.end))) return false;
        list.push({ start, end, text });
        return true;
    };
    const newFiles = [];
    const seen = new Set();
    let applied = 0;
    const memberIndent = "        ";
    const pendingComponents = new Set(fixes.filter((f) => f.kind === "addComponent").map((f) => f.cls.ts));
    const pendingOptions = new Set(fixes.filter((f) => f.kind === "addComponent" && f.cls.ctor?.params.some((p) => p.name === "options")).map((f) => `${f.cls.ts}Options`));
    const pendingMethods = new Map();
    for (const f of fixes) if (f.kind === "addMethod") pendingMethods.set(`${f.decl}|${f.member}`, f);
    const known = (name) => decls.has(name) || pendingComponents.has(name) || pendingOptions.has(name);
    const report = (line) => console.log(`fix: ${line}`);
    const containerFor = (d, kind) => {
        if (kind === "static") return d.nodes.namespaces[0];
        if (kind === "method") return d.nodes.classes[0] ?? d.nodes.interfaces[0];
        return d.nodes.interfaces[0] ?? d.nodes.classes[0];
    };
    const insertMember = (d, kind, line) => {
        let container = containerFor(d, kind);
        if (!container && kind === "static") {
            const anchor = d.nodes.classes[0] ?? d.nodes.interfaces[0];
            if (!anchor) return false;
            const { text } = sources.get(anchor.file);
            const pos = text.indexOf("\n", anchor.node.end) + 1;
            return edit(anchor.file, pos, pos, `    namespace ${d.name} {\n${memberIndent}${line}\n    }\n`);
        }
        if (!container) return false;
        const { text } = sources.get(container.file);
        const body = text.slice(container.node.getStart(sources.get(container.file).sf), container.node.end);
        if (!body.includes("\n")) {
            const open = container.node.getStart(sources.get(container.file).sf) + body.indexOf("{");
            return edit(container.file, open, container.node.end, `{\n${memberIndent}${line}\n    }`);
        }
        const pos = text.lastIndexOf("\n", container.node.end - 1) + 1;
        return edit(container.file, pos, pos, `${memberIndent}${line}\n`);
    };
    const detach = (declName, member) => {
        const d = decls.get(declName);
        if (!d) return false;
        let changed = false;
        const bases = [...d.extends, ...d.extendsClass].filter((b) => [...ancestors(b)].some((a) => decls.get(a)?.memberNodes.has(member)));
        if (bases.length === 0) return false;
        for (const location of [...d.nodes.classes, ...d.nodes.interfaces]) {
            const { text, sf } = sources.get(location.file);
            for (const clause of location.node.heritageClauses ?? []) {
                const kept = clause.types.filter((t) => !bases.includes(t.expression.getText().replace(/<.*$/, "")));
                if (kept.length === clause.types.length) continue;
                const replacement = kept.length === 0 ? "" : ` extends ${kept.map((t) => t.getText(sf)).join(", ")}`;
                const start = text.lastIndexOf(" ", clause.getStart(sf));
                if (edit(location.file, start, clause.end, replacement)) changed = true;
            }
        }
        const own = new Set([...d.methods.keys()].map((m) => `:${m}`).concat([...d.statics.keys()].map((m) => `.${m}`), [...d.props.keys()].map((m) => `prop:${m}`)));
        for (const base of bases) {
            const inherited = resolved(base);
            for (const [name] of inherited.methods) {
                const key = `:${name}`;
                if (key === member || own.has(key)) continue;
                const location = memberLocation(base, key);
                if (location && insertMember(d, "method", location.node.getText(sources.get(location.file).sf))) changed = true;
            }
            for (const [name] of inherited.props) {
                const key = `prop:${name}`;
                if (key === member || own.has(key)) continue;
                const location = memberLocation(base, key);
                if (location && insertMember(d, "prop", location.node.getText(sources.get(location.file).sf))) changed = true;
            }
            for (const [name] of inherited.statics) {
                const key = `.${name}`;
                if (key === member || own.has(key)) continue;
                const location = memberLocation(base, key);
                if (location && insertMember(d, "static", location.node.getText(sources.get(location.file).sf))) changed = true;
            }
        }
        if (changed) report(`${declName}: no longer extends ${bases.join(", ")}; the Lua classes have diverged`);
        return changed;
    };
    const removeNode = (file, node, includeLeading) => {
        const { text, sf } = sources.get(file);
        const span = lineSpan(text, node, sf, includeLeading);
        edit(file, span.start, span.end, "");
    };
    const memberLocation = (declName, member) => {
        for (const a of ancestors(declName)) {
            const location = decls.get(a)?.memberNodes.get(member);
            if (location) return location;
        }
        return undefined;
    };

    for (const fix of fixes) {
        const id = JSON.stringify([fix.kind, fix.decl ?? fix.cls?.ts ?? fix.name, fix.member ?? fix.key]);
        if (seen.has(id)) continue;
        seen.add(id);
        const d = fix.decl ? decls.get(fix.decl) : undefined;
        switch (fix.kind) {
            case "removeMember": {
                if (!fix.member.startsWith("prop:") && d && !d.memberNodes.has(fix.member) && memberLocation(fix.decl, fix.member)) {
                    if (detach(fix.decl, fix.member)) applied++;
                    break;
                }
                const location = fix.member.startsWith("prop:") ? d?.memberNodes.get(fix.member) : memberLocation(fix.decl, fix.member);
                if (!location) break;
                removeNode(location.file, location.node, false);
                applied++;
                report(`${fix.decl}: removed ${location.node.getText(sources.get(location.file).sf).split("\n")[0].trim()}`);
                break;
            }
            case "removeDeclaration": {
                if (!d) break;
                for (const group of [d.nodes.classes, d.nodes.interfaces, d.nodes.namespaces]) for (const location of group) removeNode(location.file, location.node, true);
                applied++;
                report(`removed prettyui.${fix.decl}`);
                break;
            }
            case "setParams": {
                const location = memberLocation(fix.decl, fix.member);
                if (!location) break;
                const node = location.node;
                const existing = tsParams(node);
                let text;
                if (fix.count !== undefined) {
                    const kept = existing.slice(Math.max(0, existing.length - fix.count));
                    const parts = [];
                    for (let i = 0; i < fix.count; i++) {
                        const prior = kept[i - (fix.count - kept.length)];
                        parts.push(prior ? `${prior.name}${prior.optional ? "?" : ""}: ${prior.type ? prior.type.getText() : "unknown"}` : i === fix.count - 1 ? "options?: unknown" : `arg${i + 1}: unknown`);
                    }
                    text = parts.join(", ");
                } else text = paramsText(fix.params, existing, fix.decl, undefined, fix.fn);
                const thisParam = node.parameters.find((p) => p.name.getText() === "this");
                if (thisParam) text = text === "" ? thisParam.getText() : `${thisParam.getText()}, ${text}`;
                edit(location.file, node.parameters.pos, node.parameters.end, text);
                applied++;
                report(`${fix.decl}: ${fix.member === "ctor" ? "constructor" : fix.member.slice(1)} now takes (${text})`);
                break;
            }
            case "addCtor": {
                if (!d) break;
                const line = `constructor(${paramsText(fix.params, undefined, fix.decl, undefined, fix.fn)});`;
                if (insertMember(d, "method", line)) {
                    applied++;
                    report(`${fix.decl}: added ${line}`);
                }
                break;
            }
            case "addMethod": {
                if (!d) break;
                if ([...ancestors(fix.decl)].some((a) => a !== fix.decl && pendingMethods.has(`${a}|${fix.member}`))) break;
                let target = d;
                let line;
                if (fix.registry) {
                    for (const a of ancestors(fix.decl)) {
                        const candidate = decls.get(a);
                        if (candidate && [...candidate.methods.keys()].some((m) => m !== fix.member && fix.registry !== undefined && /^Add[A-Z]/.test(m))) {
                            target = candidate;
                            break;
                        }
                    }
                    line = registryMethodText(fix.member, fix.count, target.name, undefined, known);
                } else if (fix.installed) {
                    for (const a of ancestors(fix.decl)) {
                        const candidate = decls.get(a);
                        if (candidate && candidate.methods.has("SetContentHeight")) {
                            target = candidate;
                            break;
                        }
                    }
                    line = `${fix.member}(${paramsText(fix.params, undefined, target.name, undefined, fix.fn)}): void;`;
                } else {
                    const added = /^Add([A-Z]\w*)$/.exec(fix.member);
                    const ret = added && known(added[1]) ? (fix.decl === "Panel" ? `Paired<${added[1]}>` : added[1]) : returnTypeFor(fix.fn);
                    line = `${fix.member}(${paramsText(fix.params, undefined, fix.decl, fix.member, fix.fn)}): ${ret};`;
                }
                if (insertMember(target, "method", line)) {
                    applied++;
                    report(`${target.name}: added ${line}`);
                }
                break;
            }
            case "addStatic": {
                if (!d) break;
                const line = `function ${fix.member}(${paramsText(fix.params, undefined, fix.decl, undefined, fix.fn)}): ${returnTypeFor(fix.fn)};`;
                if (insertMember(d, "static", line)) {
                    applied++;
                    report(`${fix.decl}: added ${line}`);
                }
                break;
            }
            case "addProp": {
                if (!d) break;
                const line = fix.readonlyNumber ? `readonly ${fix.key}: ${luaSpriteType(fix.key)};` : `${fix.key}?: ${inferOptionType(fix)};`;
                if (insertMember(d, "prop", line)) {
                    applied++;
                    report(`${fix.decl}: added ${line}`);
                }
                break;
            }
            case "setCallback": {
                const location = memberLocation(fix.decl, `prop:${fix.key}`);
                if (!location || !location.node.type) break;
                const type = callbackTypeText(fix.callbacks, fix.decl);
                edit(location.file, location.node.type.pos, location.node.type.end, ` ${type}`);
                applied++;
                report(`${fix.decl}: ${fix.key} is now ${type}`);
                break;
            }
            case "addInnerClass": {
                const owner = decls.get(fix.owner);
                const anchor = owner?.nodes.classes[0] ?? owner?.nodes.interfaces[0];
                if (!anchor) break;
                const { text, sf } = sources.get(anchor.file);
                const namespace = sf.statements.find((s) => ts.isModuleDeclaration(s) && s.name.text === "prettyui" && s.pos <= anchor.node.pos && s.end >= anchor.node.end);
                if (!namespace) break;
                const pos = text.lastIndexOf("\n", namespace.end - 1) + 1;
                edit(anchor.file, pos, pos, `\n${scaffoldClass(fix.cls, fix.registry, fix.installed, true).join("\n")}\n`);
                applied++;
                report(`added interface ${fix.name} to ${anchor.file}`);
                break;
            }
            case "addGlobal": {
                if (sources.has(fix.file)) {
                    const { text, sf } = sources.get(fix.file);
                    const namespace = sf.statements.find((s) => ts.isModuleDeclaration(s) && s.name.text === "prettyui");
                    if (!namespace) break;
                    const pos = text.lastIndexOf("\n", namespace.end - 1) + 1;
                    if (edit(fix.file, pos, pos, `${fix.lines.join("\n")}\n`)) {
                        applied++;
                        report(`added prettyui.${fix.member} to ${fix.file}`);
                    }
                    break;
                }
                newFiles.push({ file: fix.file, text: `/** @noSelfInFile */\n\ndeclare namespace prettyui {\n${fix.lines.join("\n")}\n}\n` });
                applied++;
                report(`added prettyui.${fix.member} in ${fix.file}`);
                break;
            }
            case "addComponent": {
                const file = `${snakeCase(fix.cls.ts)}.d.ts`;
                newFiles.push({ file, text: `/** @noSelfInFile */\n\ndeclare namespace prettyui {\n${scaffoldClass(fix.cls, fix.registry, fix.installed, false).join("\n")}\n}\n` });
                applied++;
                report(`added prettyui.${fix.cls.ts} in ${file}`);
                break;
            }
            default:
                break;
        }
    }

    for (const [file, list] of edits) {
        let text = sources.get(file).text;
        for (const e of list.sort((a, b) => b.start - a.start || b.end - a.end)) text = text.slice(0, e.start) + e.text + text.slice(e.end);
        fs.writeFileSync(path.join(typesDir, file), text);
    }
    for (const { file, text } of newFiles) {
        const target = path.join(typesDir, file);
        if (fs.existsSync(target)) continue;
        fs.writeFileSync(target, text);
        if (fs.existsSync(indexFile)) {
            const index = fs.readFileSync(indexFile, "utf8");
            const reference = `/// <reference path="./types/${file}" />`;
            if (!index.includes(reference)) fs.writeFileSync(indexFile, `${index.replace(/\n*$/, "")}\n${reference}\n`);
        }
    }
    return applied;
}

function restoreAfterwards() {
    let original;
    try {
        original = source.head(sourceDir);
    } catch {
        return;
    }
    process.on("exit", () => {
        try {
            if (source.head(sourceDir) !== original) source.checkout(sourceDir, original);
        } catch {}
    });
}

function ensureSource() {
    if (flag("--source") !== undefined) {
        if (!fs.existsSync(path.join(sourceDir, "main.lua"))) throw new Error(`${sourceDir} does not look like a PrettyUI checkout (no main.lua)`);
        if (flag("--ref") !== undefined) {
            restoreAfterwards();
            source.checkout(sourceDir, ref);
        }
        return;
    }
    source.ensureClone(sourceDir, sourceInfo.repository);
    restoreAfterwards();
    source.checkout(sourceDir, ref);
}

function main() {
    ensureSource();
    loadDeclarations();

    const pluginJson = JSON.parse(fs.readFileSync(path.join(sourceDir, "plugin.json"), "utf8"));
    let head = "(not a git checkout)";
    try {
        head = source.head(sourceDir);
    } catch {}
    console.log(`PrettyUI ${pluginJson.version} at ${head.slice(0, 12)} (declarations written against ${sourceInfo.pluginVersion} at ${sourceInfo.commit.slice(0, 12)})`);
    if (pluginJson.version !== sourceInfo.pluginVersion) fail(`PrettyUI is now ${pluginJson.version}; review the declarations and update packages/prettyui/data/source.json`);

    const licenceFiles = fs.readdirSync(sourceDir).filter((f) => /^(licen[cs]e|copying|notice)(\..*)?$/i.test(f));
    if (licenceFiles.length > 0 && !sourceInfo.license) fail(`PrettyUI now ships ${licenceFiles.join(", ")}; record its licence in packages/prettyui/data/source.json and update NOTICE.md and README.md`);
    if (licenceFiles.length === 0 && sourceInfo.license) fail(`source.json records licence "${sourceInfo.license}" but the PrettyUI source has no licence file; update NOTICE.md`);

    for (const file of allSourceFiles()) luaFile(file);
    const { exported, hasVersion } = exportsFromMain();
    const classes = [];
    const basesUsed = new Set();
    for (const [name, entry] of exported) {
        if (name === "Sprites") continue;
        const info = luaFile(entry.file);
        let cls;
        if (entry.tableExport) cls = buildTableExport(name, info, entry.tableExport);
        else {
            const module = resolveModule(entry.file);
            if (!module.luaName) {
                fail(`${entry.file}: cannot tell what prettyui.${name} returns (${module.info.returnExpr})`);
                continue;
            }
            cls = buildClass(name, module.info, module.luaName, { exported: true });
        }
        classes.push(cls);
        const walk = (c) => {
            for (const b of c.bases) {
                basesUsed.add(`${b.file}|${b.luaName}`);
                walk(b);
            }
        };
        walk(cls);
    }
    for (const cls of [...classes]) {
        for (const inner of cls.info.classes) {
            if (inner === cls.luaName || basesUsed.has(`${cls.info.file}|${inner}`)) continue;
            if (classes.some((c) => c.info === cls.info && c.luaName === inner)) continue;
            const tsName = decls.has(inner) ? inner : `${cls.ts}${inner}`;
            if (!decls.has(tsName)) {
                fail(`${cls.info.file} defines ${inner}, reachable through prettyui.${cls.ts}; declare it as ${inner} or ${tsName}`, { kind: "addInnerClass", name: tsName, cls: buildClass(tsName, cls.info, inner), owner: cls.ts, registry: contentRegistry(), installed: scrollInstall() });
                continue;
            }
            classes.push(buildClass(tsName, cls.info, inner));
        }
    }
    const prettyuiProps = decls.get("prettyui")?.props ?? new Map();
    if (exported.has("Sprites") && !prettyuiProps.has("Sprites")) {
        fail("main.lua exports prettyui.Sprites, which the declarations do not mention", {
            kind: "addGlobal",
            member: "Sprites",
            file: "sprites.d.ts",
            lines: decls.has("SpriteTable") ? ["    const Sprites: SpriteTable;"] : ["    interface SpriteTable {", "    }", "", "    const Sprites: SpriteTable;"],
        });
    }
    if (hasVersion && !prettyuiProps.has("version")) {
        const assigned = /^PrettyUI\.version\s*=\s*(.+)$/m.exec(luaFile("main.lua").text);
        const type = assigned === null ? "string" : /^["']/.test(assigned[1].trim()) ? "string" : /^-?\d/.test(assigned[1].trim()) ? "number" : "unknown";
        fail("main.lua sets prettyui.version, which the declarations do not mention", { kind: "addGlobal", member: "version", file: "prettyui.d.ts", lines: [`    const version: ${type};`] });
    }
    for (const [name, d] of decls) {
        if (name === "prettyui" || name.startsWith("{") || name.startsWith("#")) continue;
        if ((d.kind === "class" || d.hasNamespace) && !classes.some((c) => c.ts === name)) fail(`TypeScript declares prettyui.${name}, which main.lua does not export`, { kind: "removeDeclaration", decl: name });
    }

    const registry = contentRegistry();
    const installed = scrollInstall();
    const seeds = [];
    let methods = 0;
    let statics = 0;
    for (const cls of classes) tsByLua.set(`${cls.info.file}|${cls.luaName}`, cls.ts);
    for (const cls of classes) {
        const counts = checkClass(cls, registry, installed, seeds);
        methods += counts.methods;
        statics += counts.statics;
        for (const pseudo of checkReturnedTables(cls, seeds)) statics += pseudo.statics.size;
    }

    computeProduced(seeds);
    runSeeds(seeds);
    const optionKeys = reportOptions();
    checkProducedInterfaces([...luaFiles.values()].map((f) => f.text).join("\n"));

    const spriteKeys = luaSpriteKeys();
    const spriteTable = resolved("SpriteTable");
    for (const key of spriteKeys) if (!spriteTable.props.has(key)) fail(`Sprites.${key} exists in the Lua but not in SpriteTable`, { kind: "addProp", decl: "SpriteTable", key, readonlyNumber: true });
    for (const key of spriteTable.props.keys()) if (!spriteKeys.has(key)) fail(`SpriteTable declares ${key}, which Sprites does not have`, { kind: "removeMember", decl: "SpriteTable", member: `prop:${key}` });

    if (problems.length > 0) {
        for (const problem of problems) console.error(`error: ${problem}`);
        console.error(`\n${problems.length} mismatch${problems.length === 1 ? "" : "es"}: the declarations have drifted from the PrettyUI source`);
        if (fixMode && fixes.length > 0 && round <= 4) {
            const applied = applyFixes();
            console.log(`fix: round ${round} applied ${applied} change${applied === 1 ? "" : "s"} to the declarations`);
            if (applied > 0) {
                const next = spawnSync(process.execPath, [__filename, ...args.filter((a, i) => a !== "--round" && args[i - 1] !== "--round"), "--round", String(round + 1)], { stdio: "inherit" });
                process.exitCode = next.status ?? 1;
                return;
            }
        }
        process.exitCode = 1;
        return;
    }
    const interfaces = [...referenced].filter((i) => !i.startsWith("{") && !i.startsWith("#") && !produced.has(i)).length;
    console.log(`${classes.length} components: ${methods} methods and ${statics} functions match by name and parameters; ${interfaces} option tables (${optionKeys} keys) and ${spriteKeys.size} sprite keys match`);
}

const MUTATIONS = [
    { what: "a renamed constructor parameter", file: "window.d.ts", from: "constructor(parent: Component, options?: WindowOptions);", to: "constructor(parent: Component, settings?: WindowOptions);", expect: /Window constructor: parameter 2 is "options" in Lua but "settings" in TypeScript/ },
    { what: "a method with a parameter too many", file: "fields.d.ts", from: "SetPlaceholder(value: string | undefined): void;", to: "SetPlaceholder(value: string | undefined, animate?: boolean): void;", expect: /TextField\.SetPlaceholder: Lua takes 1 parameter \(value\) but TypeScript declares 2/ },
    { what: "a deleted method", file: "selection.d.ts", from: "        GetValue(): number;\n", to: "", expect: /Slider: Lua method GetValue\(\) is not declared in TypeScript/ },
    { what: "an invented method", file: "buttons.d.ts", from: "        SetVariant(variant: FancyButtonVariant): void;", to: "        SetVariant(variant: FancyButtonVariant): void;\n        Flash(): void;", expect: /FancyButton: TypeScript declares method Flash, which the Lua does not define/ },
    { what: "an invented static function", file: "dialogs.d.ts", from: "        function dismissAll(parent: Component | undefined): void;", to: "        function dismissAll(parent: Component | undefined): void;\n        function count(): number;", expect: /Dialog: TypeScript declares function Dialog\.count, which the Lua does not define/ },
    { what: "an invented option", file: "selection.d.ts", from: "        step?: number;", to: "        step?: number;\n        snap?: boolean;", expect: /SliderOptions: TypeScript declares option "snap", which the Lua never reads/ },
    { what: "a missing option", file: "items.d.ts", from: "        outlineWidth?: number;\n        shadowRGBA?: Colour;\n        backgroundSpriteID?: number;", to: "        outlineWidth?: number;\n        shadowRGBA?: Colour;", expect: /the Lua reads option "backgroundSpriteID" \(src\/item_slot\.lua ItemSlot\.new\), which is not declared/ },
    { what: "a callback with the wrong arity", file: "selection.d.ts", from: "onChange?: (this: void, slider: Slider, value: number) => void;", to: "onChange?: (this: void, slider: Slider) => void;", expect: /the Lua calls "onChange" with 2 arguments but TypeScript declares 1/ },
    { what: "an invented property", file: "window.d.ts", from: "        title: string | undefined;", to: "        title: string | undefined;\n        readonly subtitle: string | undefined;", expect: /Window: TypeScript declares property subtitle, which nothing in the Lua assigns/ },
    { what: "a missing Add method on a host", file: "hosts.d.ts", from: "        AddDivider(options?: DividerOptions & FlowOptions): Divider;\n", to: "", expect: /Window: Lua method AddDivider is not declared in TypeScript/ },
    { what: "a wrong argument count on a registry-installed method", file: "hosts.d.ts", from: "AddSlider(options?: SliderOptions & FlowOptions): Slider;", to: "AddSlider(label: string, options?: SliderOptions & FlowOptions): Slider;", expect: /Window\.AddSlider: the library installs it with 1 argument but TypeScript declares 2/ },
    { what: "an invented component", file: "window.d.ts", from: "    interface Window extends ContentHost", to: "    class Popup {}\n    interface Window extends ContentHost", expect: /TypeScript declares prettyui\.Popup, which main\.lua does not export/ },
    { what: "a missing nested-table option", file: "fields.d.ts", from: "        icon?: number;\n        backgroundColour?: Colour;", to: "        backgroundColour?: Colour;", expect: /ListEntryOptions: the Lua reads option "icon"/ },
    { what: "a deleted sprite key", file: "sprites.d.ts", from: "        readonly DIVIDER: number;\n", to: "", expect: /Sprites\.DIVIDER exists in the Lua but not in SpriteTable/ },
];

function runSelfTest() {
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "prettyui-check-"));
    let failures = 0;
    try {
        for (const mutation of MUTATIONS) {
            const copy = path.join(scratch, mutation.what.replace(/\W+/g, "-"));
            fs.cpSync(typesDir, copy, { recursive: true });
            const file = path.join(copy, mutation.file);
            const text = fs.readFileSync(file, "utf8");
            if (!text.includes(mutation.from)) {
                console.error(`self-test: cannot apply "${mutation.what}", ${mutation.file} no longer contains the expected text`);
                failures++;
                continue;
            }
            fs.writeFileSync(file, text.replace(mutation.from, mutation.to));
            const index = path.join(copy, "index.d.ts");
            fs.copyFileSync(indexFile, index);
            const run = (extra) => spawnSync(process.execPath, [__filename, "--source", sourceDir, "--types", copy, "--index", index, ...extra], { encoding: "utf8" });
            const result = run([]);
            const output = `${result.stdout}${result.stderr}`;
            if (result.status === 0) {
                console.error(`self-test: ${mutation.what} was not caught`);
                failures++;
                continue;
            }
            if (!mutation.expect.test(output)) {
                console.error(`self-test: ${mutation.what} failed for the wrong reason:\n${output}`);
                failures++;
                continue;
            }
            const repaired = run(["--fix"]);
            if (repaired.status !== 0) {
                console.error(`self-test: ${mutation.what} was caught but --fix could not repair it:\n${repaired.stdout}${repaired.stderr}`);
                failures++;
                continue;
            }
            console.log(`self-test: caught and repaired ${mutation.what}`);
        }
    } finally {
        fs.rmSync(scratch, { recursive: true, force: true });
    }
    if (failures > 0) {
        console.error(`\nself-test: ${failures} of ${MUTATIONS.length} mutations slipped through or could not be repaired`);
        process.exitCode = 1;
    } else console.log(`self-test: all ${MUTATIONS.length} mutations caught and repaired`);
}

try {
    main();
    if (selfTest && !process.exitCode) runSelfTest();
} catch (error) {
    console.error(`error: ${error instanceof Error ? error.stack : String(error)}`);
    process.exitCode = 1;
}
