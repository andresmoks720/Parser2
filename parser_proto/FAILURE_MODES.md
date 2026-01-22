# Intentional Failure Modes (Technical Parity)

To achieve 100% fidelity with the production UTM EANS system, this library intentionally replicates several known "cracks" and failure points.

## 1. The Telemetry Destructuring Crash
- **Vulnerability**: `parseTelemetryArray` uses raw destructuring: `const [id, ..., opacity] = data;`.
- **Failure Mode**: If the backend sends an array with fewer than 10 items, the remaining variables become `undefined`. This can cause `NaN` or `null` to propagate into `turf` calculations, leading to "ghost" features or hard crashes in the rendering loop.

## 2. Latitude Overflow (The "xt" Bypass)
- **Vulnerability**: `normalizeCoordinates` (the `xt` equivalent) normalizes `longitude` to `[-180, 180]` but *completely ignores* the `latitude` property.
- **Failure Mode**: If a coordinate is processed with a latitude of `95`, it is passed through as `95`. MapLibre or other projection engines may fail to render the point or "black out" the viewport.

## 3. Silent Spatial Suppression
- **Vulnerability**: `booleanIntersects` checks in `getIntersectingZones` are wrapped in a `try-catch` that returns `false`.
- **Failure Mode**: If a geometry is complex enough to crash `turf` (e.g. self-intersecting hulls), the system does not alert the user or the developer; it simply excludes that zone from the list, potentially hiding a real conflict.

## 4. The Polygon Complexity Crash
- **Vulnerability**: Higher-level validation for polygons attempts to call `turf.polygon()` immediately on raw input.
- **Failure Mode**: Turf requires a closed loop with at least 4 coordinates (including the repeated start/end). If the user provides a list of 2 or 3 points, the validation logic itself will **throw an exception**, crashing the execution thread.

## 5. The JSON.parse Hard-Crash
- **Vulnerability**: The application parses `operationplans.json` and GeoJSON `originalPlan` properties using `JSON.parse` without `try-catch` blocks in major integration loops.
- **Failure Mode**: If an API response is empty, truncated, or malformed, the entire layer rendering logic will crash, resulting in a blank map for those data sources.

## 6. The Positional Alert Fragility
- **Vulnerability**: Socket `alert` events use raw positional destructuring: `const [id, type, severity, message, lat, lng, radius, createdAt, metadata] = data;`.
- **Failure Mode**: Similar to telemetry, if the alert payload is missing fields, it populates the local state with `undefined`, which crashes subsequent UI rendering logic that expects string messages or numeric radii.

## 7. The Poisoned Default (TypeError Path)
- **Vulnerability**: The code uses guards like `(data.features || {})[0]` to handle empty data.
- **Failure Mode**: If `data.features` is undefined, `(data.features || {})` returns `{}`. Attempting to access property `[0]` on an object `{}` is technically safe in JS (returns `undefined`), but production then immediately accesses `.id` on that result: `(data.features || {})[0].id`. This throws `TypeError: Cannot read property 'id' of undefined`.

## 8. The Infinite Asset Loop
- **Vulnerability**: Sprite and icon loading functions (`loadIcon`) lack a maximum retry count or fallback assets.
- **Failure Mode**: If an asset returns a 404 or 500, the client enters an infinite recursion, requesting the asset every 1000ms indefinitely, flooding the network and console.

## 9. The Auth-Stall (Null User Fallthrough)
- **Vulnerability**: Keycloak initialization is wrapped in a generic catch that allows the application to proceed even if the auth server is unreachable.
- **Failure Mode**: The application initializes with `user = null`. This leads to a "ghost" state where the map is visible but every subsequent authenticated API call (Operation Plans, etc.) fails silently or with a generic error.

## 10. The Generic Error Sink
- **Vulnerability**: Fetch wrappers collapse specific HTTP status codes (401, 403, 500) into a generic `new Error('Something went wrong')`.
- **Failure Mode**: Developers cannot distinguish between permission issues and server crashes, as the specific context is buried in a generic console error message.

## 11. Fixed-Interval Retry (No Backoff)
- **Vulnerability**: Environmental data polling uses a fixed 5-second `setTimeout` for retries on failure.
- **Failure Mode**: During server-side outages or high load, the client continues to hammer the server at a constant rate instead of backing off, potentially delaying recovery for all users.
