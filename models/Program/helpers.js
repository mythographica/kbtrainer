'use strict';

// Shared constants for Program's view machinery. Lowercase on purpose:
// topologica and tactica both skip it — it is not a type.

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

module.exports = { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP };
