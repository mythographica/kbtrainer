// Renderer-side replay of @mnemonica/topologica's nesting rules.
//
// The real loader walks the fs with require(); a browser bundle can't, so
// we replay the exact same rules over a caller-supplied module map
// (import.meta.glob from globModels.ts — kept apart so this file stays
// compilable as plain CJS for the preload boot). The parity test
// (tests/topology.test.ts) proves this adapter produces the same graph the
// real topologica loader produces on disk.
const isCapitalized = (name) => {
    if (!name || name.length === 0) {
        return false;
    }
    const first = name.charAt(0);
    return first === first.toUpperCase() && first !== first.toLowerCase();
};
const collectInliners = (type, handler) => {
    Object.entries(handler)
        .filter((entry) => entry[1] instanceof Function)
        .forEach(([name, nestedHandler]) => {
        const sub = type.define(name, nestedHandler);
        collectInliners(sub, nestedHandler);
    });
};
const buildTree = (modules) => {
    const root = { path: '', entries: new Map() };
    for (const [fullPath, mod] of Object.entries(modules)) {
        const rel = fullPath.replace(/^.*\/models\//, '');
        const segments = rel.split('/');
        const file = segments.pop();
        const baseName = file.replace(/\.(js|ts|mjs)$/, '');
        let dir = root;
        for (const segment of segments) {
            let entry = dir.entries.get(segment);
            if (!entry) {
                entry = { kind: 'dir', node: { path: dir.path + '/' + segment, entries: new Map() } };
                dir.entries.set(segment, entry);
            }
            dir = entry.node;
        }
        if (baseName === 'index') {
            dir.indexMod = mod;
        }
        else {
            dir.entries.set(baseName, { kind: 'file', mod });
        }
    }
    return root;
};
const defineFromModule = (mod, baseName, dir, defineFn, topology) => {
    // CJS interop: `module.exports = fn` surfaces as the default export.
    const direct = typeof mod.default === 'function' ? mod.default : null;
    const handlers = direct ?
        [[direct.name || baseName, direct]] :
        Object.entries(mod).filter(([key, value]) => key !== "default" && value instanceof Function);
    for (const [exportName, handler] of handlers) {
        const constructorName = handler.name || exportName;
        if (!isCapitalized(constructorName)) {
            continue;
        }
        const type = defineFn(constructorName, handler);
        let kids = {};
        const nested = dir.entries.get(constructorName);
        if (nested && nested.kind === 'dir') {
            kids = processDir(nested.node, type.define.bind(type));
            dir.entries.delete(constructorName);
        }
        collectInliners(type, handler);
        topology[constructorName] = {
            name: constructorName,
            path: dir.path + '/' + baseName,
            type,
            kids: Object.values(kids)
        };
    }
};
const processDir = (dir, defineFn, topology = {}) => {
    for (const [name, entry] of dir.entries) {
        if (!isCapitalized(name)) {
            continue;
        }
        if (entry.kind === 'dir') {
            const child = entry.node;
            if (child.indexMod) {
                const starter = child.indexMod;
                const handler = typeof starter.default === 'function' ?
                    starter.default :
                    starter[name];
                if (!handler) {
                    continue;
                }
                const type = defineFn(name, handler);
                const kids = processDir(child, type.define.bind(type));
                topology[name] = {
                    name,
                    path: child.path,
                    type,
                    kids: Object.values(kids)
                };
                collectInliners(type, handler);
            }
            else {
                // Directory without index: flatten into the current scope.
                processDir(child, defineFn, topology);
            }
        }
        else {
            defineFromModule(entry.mod, name, dir, defineFn, topology);
        }
    }
    return topology;
};
// Same contract as topologica: loadTopology(define, modules) -> { topology }.
// The modules map comes from the caller (globModels.ts in browser-ish
// contexts) so this file carries no import.meta and compiles as plain CJS.
export const loadTopology = (defineFn, modules) => {
    const root = buildTree(modules);
    return { topology: processDir(root, defineFn) };
};
