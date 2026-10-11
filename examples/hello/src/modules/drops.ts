import { on } from "rs3-api-extended";

const MIN_VALUE = 50000;

export function init() {
    on(Event.ObjStackEntityAdded, onObjStackAdded);
}

function onObjStackAdded(event: ObjStackEntityAddedRemovedEvent) {
    const obj = event.objType;
    if (obj === undefined || !event.isOwner) {
        return;
    }

    const total = (obj.cost || 0) * event.count;
    if (total < MIN_VALUE) {
        return;
    }

    const where = event.coordGrid;
    print(`${event.count} x ${obj.name} (${total} gp) at ${where.localX}, ${where.localZ}`);
}
