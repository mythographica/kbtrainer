// The vite import.meta.glob view of the models tree — the only place
// import.meta may live (vitest and vite handle it; the main-process tsc
// build is CJS and must never see this file, hence the tsconfig exclude).

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ModuleMap } from "./loadTopology";

export const globModels = () : ModuleMap =>
	import.meta.glob('../../models/**/*.{js,ts,mjs}', { eager : true }) as ModuleMap;
