/** The hint prints indented under the message, matching how build problems look. */
export class CliError extends Error {
    readonly hint: string | undefined;

    constructor(message: string, hint?: string | string[]) {
        super(message);
        this.name = "CliError";
        this.hint = Array.isArray(hint) ? hint.join("\n") : hint;
    }
}
