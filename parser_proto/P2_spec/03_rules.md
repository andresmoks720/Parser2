# Rules

## Route Area Generation (createRouteArea)

### Decision Table

| Condition | Output | Example IDs |
| --- | --- | --- |
| `drawingPoints` empty or missing | Return empty `FeatureCollection` | EX-RA-EMPTY |
| `drawingMode = polygon` and points > 2 | Append first point to end (auto-close) before buffering | EX-RA-POLY-CLOSE |
| Exactly one point | Buffer a Point (`bufferMeters / 1000` km) | EX-RA-SINGLE |
| `drawingMode = line` with 2+ points | Split into segment `LineString`s, buffer each via FeatureCollection | EX-RA-LINE-SPLIT |
| `drawingMode = polygon` with 2+ points | Build polygon and buffer | EX-RA-POLY-CLOSE |
| Any other case | Buffer a single LineString (fallback) | EX-RA-FALLBACK |

### Precedence
1. Empty input check.
2. Polygon auto-close.
3. Single point buffer.
4. Line segment splitting (line mode).
5. Polygon buffer.
6. Fallback LineString buffer.

### Defaults
- Buffer conversion: `bufferMeters / 1000` kilometers.

## Midpoint Calculation (calculateMidpoints)

| Condition | Output | Example IDs |
| --- | --- | --- |
| <2 drawing points | Return empty array | EX-RA-EMPTY (empty points) |
| 2+ drawing points | Midpoint between each adjacent pair | EX-MIDPOINTS-PAIR |

## Intersection Filtering (getIntersectingZones)

### Decision Table

| Condition | Output | Example IDs |
| --- | --- | --- |
| `routeArea.features.length === 0` | Return empty array | EX-INT-EMPTY-ROUTE |
| `turf.union` fails during unification | Skip failed union and continue | EX-INT-UNION-FAIL |
| `turf.booleanIntersects` throws for a feature | Log error and treat as non-intersecting | EX-INT-INVALID-GEOM |
| Hidden features present in `uasGeoJson` | No hidden-filtering applied in this function | EX-INT-NO-HIDDEN-FILTER |

### Precedence
1. Empty route-area shortcut.
2. Union into a unified area (best-effort).
3. Boolean-intersects filter.

### Conflict Resolution
- Phase 1 sources disagree on hidden-feature handling for intersection filtering. `EDGE_CASES.md` implies hidden features are skipped in intersection tests (EX-INT-HIDDEN), while the extracted function `getIntersectingZones` does not apply a hidden check (EX-INT-NO-HIDDEN-FILTER). The canonical rule for **getIntersectingZones** is the code observation: no hidden filtering is applied; hidden checks apply only to **findZonesAtPoint**.

## Point Hit-Testing (findZonesAtPoint)

| Condition | Output | Example IDs |
| --- | --- | --- |
| `feature.properties.hidden === true` | Skip feature | EX-INT-HIDDEN |
| `turf.booleanPointInPolygon` throws | Treat as non-match | EX-INT-INVALID-GEOM |

## Sorting (sortFeatures)

### Decision Table

| Pass | Condition | Comparator | Example IDs |
| --- | --- | --- | --- |
| 1 (Altitude) | Compare `lowerMeters`, then `upperMeters` | Ascending numeric | EX-SORT-ALTITUDE |
| 2 (Restriction) | Use `restrictionPriority` or `_rejecting` override | Descending numeric | EX-SORT-UNKNOWN-RESTR, EX-SORT-REJECTING |
| 2a (Missing props) | Missing `properties` treated as empty object; numbers default to 0 | Defaults to 0/undefined | EX-SORT-MISSING-PROP |
| 3 (Source) | Use `sourcePriority` | Descending numeric | EX-SORT-SOURCE |
| 4 (State) | If both source `operationplans`, use `statePriority` | Descending numeric | EX-SORT-STATE |

### Precedence Rules
- The sort is applied in **4 passes**; later passes are more significant and rely on stable sort behavior.
- `_rejecting === true` forces restriction priority to highest.
- Unknown restriction types default to priority 0.
- Unknown source/state priorities default to -1.

## Validation

### Phone Validation
| Condition | Output | Example IDs |
| --- | --- | --- |
| Empty string | Invalid | EX-VAL-PHONE-INVALID |
| First char `+`, remaining digits/spaces | Valid | EX-VAL-PHONE-VALID |
| Any non-digit/non-space (except leading `+`) | Invalid | EX-VAL-PHONE-INVALID |

### Longitude Normalization
| Input | Output | Example IDs |
| --- | --- | --- |
| Any numeric longitude | Normalize to `[-180, 180]` using modulo formula | EX-VAL-LON-NORM |

### Numeric Fields
| Field | Condition | Output | Example IDs |
| --- | --- | --- | --- |
| `mtom` | `< 0` | Error key `operationplan.mandatory.mtomNegative` | EX-VAL-MTOM-NEG |
| `maxAltitude` | `< 0` | Error key `operationplan.mandatory.maxAltitudeNegative` | EX-VAL-MAXALT-NEG |

### Time Validation
| Condition | Output | Example IDs |
| --- | --- | --- |
| `startDatetime <= now` | Error `operationplan.error.startBeforeNow` | EX-VAL-TIME-ORDER |
| `endDatetime <= now` | Error `operationplan.error.endBeforeNow` | EX-VAL-TIME-ORDER |
| `endDatetime <= startDatetime` | Error `operationplan.error.endBeforeStart` | EX-VAL-TIME-ORDER |

### Duration Validation
| Condition | Output | Example IDs |
| --- | --- | --- |
| `durationMinutes < MIN_FLIGHT_DURATION` (default 1) | Error `operationplan.error.durationTooShort` | EX-VAL-DURATION-SHORT |
| `durationMinutes > MAX_FLIGHT_DURATION` | Error `operationplan.error.durationTooLong` | EX-VAL-DURATION-LONG |

### Lead-Time Validation
| Condition | Output | Example IDs |
| --- | --- | --- |
| `requiresAuthorization` true and lead time < `REQ_AUTHORIZATION_MIN_LEAD_TIME` (default 5) | Error `operationplan.error.authorizationNeededStartTimeTooSoon` | EX-VAL-LEADTIME |
| `startDatetime` too far ahead of now (> `MAX_PLANNING_AHEAD_DAYS`, default 30) | Error `operationplan.error.flightPlanTooFarAhead` | EX-VAL-PLAN-AHEAD |

### Time Window URL
| Condition | Output | Example IDs |
| --- | --- | --- |
| `buildTimeWindowUrl(base, start, end, buffer)` | Apply `buffer` minutes before/after to ISO strings | EX-TIME-WINDOW, EX-ISO-FORMAT |

### Cleanup Rules
| Condition | Output | Example IDs |
| --- | --- | --- |
| Alerts with `createdAt` <= `now - 3600000` | Removed | EX-CLEANUP-ALERT-REMOVE |
| Alerts with `createdAt` > `now - 3600000` | Kept | EX-CLEANUP-ALERT-KEEP |
| Telemetry with `createdAt` <= `now - 60000` | Removed | EX-CLEANUP-TELEMETRY-REMOVE |
| Missing `createdAt` | Removed (comparison returns false) | EX-CLEANUP-MISSING |

## Operation Plan Computed Status

### Decision Table

| Status | Condition | Example IDs |
| --- | --- | --- |
| `completed = true` | `state === 'CLOSED'` and (`closureReason === 'NOMINAL'` or both authorization & activation `GRANTED`) | EX-OP-COMPLETED |
| `rejected = true` | Alternative OPs with different `timeBegin`, or `state === 'DENIED'` with conflicts, or `state` in `TIMEOUT | ERROR` | EX-OP-REJECTED |
| `cancelled = true` | `closureReason` in `CANCELED | WITHDRAWN` or `state === 'CLOSED'` and not completed/rejected | EX-OP-CANCELLED |
| `active = true` | `state === 'ACTIVATED'` | EX-OP-ACTIVE |
| `pending = true` | `state === 'PROPOSED'` or `state === 'APPROVED'` | EX-OP-PENDING |

## Fetching & URL Construction (fetchUAS)

### Decision Table

| Condition | Output | Example IDs |
| --- | --- | --- |
| `options.browseTime` is undefined | URL = `${HOST}utm/uas.geojson` | EX-FETCH-BASE |
| `options.browseTime` is defined | URL includes `start`, `end` (both `browseTime.toISOString()`), and `buffer` (`browseBuffer || 0`) | EX-FETCH-BROWSE |
| `response.ok` is false | Throw error with HTTP status | EX-FETCH-HTTP-ERROR |
| `fetch` rejects or JSON parse fails | Log error and rethrow | EX-FETCH-ERROR |

### Precedence
1. Determine `HOST` from `window.ENV.HOST` with fallback to `https://utm.eans.ee/avm/`.
2. Build URL using browse parameters if supplied.
3. Perform fetch and throw on non-OK responses.
4. Parse JSON and return `UASGeoJSON`.

## Map Source Configuration (createUASSource, updateUASSource)

### Decision Table

| Condition | Output | Example IDs |
| --- | --- | --- |
| `createUASSource()` with no `baseUrl` | Uses default base URL `https://utm.eans.ee/avm/` | EX-SOURCE-DEFAULT |
| `createUASSource(baseUrl)` provided | Uses provided base URL | EX-SOURCE-OVERRIDE |
| `updateUASSource` and source exists | Calls `source.setData(geoJsonData)` | EX-SOURCE-UPDATE |
| `updateUASSource` and source missing | No-op | EX-SOURCE-NOOP |

## Self-Intersection Detection (hasSelfIntersection)

| Condition | Output | Example IDs |
| --- | --- | --- |
| `turf.kinks` returns any features | Return `true` | EX-SELF-INTERSECT |
| `turf.kinks` throws | Return `true` (treat invalid geometry as intersecting) | EX-SELF-INTERSECT-ERROR |
| `turf.kinks` returns empty | Return `false` | EX-SELF-INTERSECT-NONE |

## Payload & Name Normalization

### Pilot Name Sanitization (sanitizePilotName)
| Condition | Output | Example IDs |
| --- | --- | --- |
| Name contains `(` | Return substring before `(`, trimmed | EX-NAME-SANITIZE |
| Name lacks `(` | Return trimmed input | EX-NAME-SANITIZE-NONE |

### OP Payload Normalization (normalizePayload)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `isV3 = true` | Ensure `phones` array and `aircraftInfos` array | EX-PAYLOAD-V3 |
| `isV3 = false` | Ensure `phone` string and `uasRegistrations` array | EX-PAYLOAD-V2 |

## Polygon Safety Validation (validatePolygonSafety)

| Condition | Output | Example IDs |
| --- | --- | --- |
| `turf.polygon` throws | Propagate error (no catch) | EX-POLY-THROW |
| `turf.kinks` returns any features | Log `draw.error.intersectingPolygon` and return `false` | EX-POLY-KINKS |
| No kinks detected | Return `true` | EX-POLY-OK |

## Unit Conversion

### Meters ⇄ Feet (validation.ts)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `metersToFeet(m)` | Return `m * 3.28084` | EX-UNIT-M2FT |
| `feetToMeters(ft)` | Return `ft / 3.28084` | EX-UNIT-FT2M |

### Meters ⇄ Feet (formatting.ts)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `metersToFeet(m)` | Return `m * ALTITUDE_CONSTANTS.METERS_TO_FEET` | EX-FMT-M2FT |
| `feetToMeters(ft)` | Return `Math.round(ft * ALTITUDE_CONSTANTS.FEET_TO_METERS)` | EX-FMT-FT2M-ROUND |

### Conflict Resolution
- There are two `feetToMeters` implementations. The **validation.ts** version divides by `3.28084` without rounding, while the **formatting.ts** version multiplies by `0.3048` and rounds. Use the module-local behavior as written; do not mix the two.
## Anonymization (anonymizeUserId)

| Condition | Output | Example IDs |
| --- | --- | --- |
| Valid `userId` string | Return SHA-256 hex digest | EX-ANON-SHA256 |

## Color & Styling

### Restriction Color Mapping (getRestrictionColor)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `restriction` in `RestrictionType` | Return `COLORS[restriction]` | EX-COLOR-RESTRICTION |

### Theme Color Scheme (getColorScheme)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `theme === 'austrocontrol'` | Use `AUSTROCONTROL_COLORS` | EX-COLOR-SCHEME-AUSTRO |
| Any other theme | Use `COLORS` | EX-COLOR-SCHEME-DEFAULT |
| `theme !== 'light'` and HSL input | Invert lightness and sanitize (remove spaces) | EX-COLOR-INVERT |

### Color Sanitization (sanitizeColor)
| Condition | Output | Example IDs |
| --- | --- | --- |
| Color string with spaces | Remove all spaces | EX-COLOR-SANITIZE |

### HSL Inversion Formatting (formatHSLWithInversion)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `isDarkTheme = true` | Lightness becomes `(1 - l/100) * 100` | EX-COLOR-INVERT |
| `isDarkTheme = false` | Lightness unchanged | EX-COLOR-INVERT-OFF |

### Lightness Interpolation (bilinearInterpolateLightness)
| Condition | Output | Example IDs |
| --- | --- | --- |
| `u <= 0.5` | Return `u * (l + 1)` | EX-COLOR-BILINEAR-LOW |
| `u > 0.5` | Return `u + l - u * l` | EX-COLOR-BILINEAR-HIGH |

### Layer Configuration (UAS layers)
| Condition | Output | Example IDs |
| --- | --- | --- |
| Low altitude fill layers | `lowerMeters < 120` with fill opacity | EX-LAYER-UAS-LOW |
| High altitude fill layers | `lowerMeters >= 120` with opacity reduced to `FILL_OPACITY / 3` | EX-LAYER-UAS-HIGH |
| Hidden features | Opacity `0` for hidden in fill/line expressions | EX-LAYER-HIDDEN |
| Becoming active | Dashed line with `line-dasharray: [2, 3]` | EX-LAYER-BECOMING-ACTIVE |
| Labels | Symbol layer uses `{name} ({reason})` | EX-LAYER-LABELS |
| Full stack | Render in `FULL_LAYER_STACK` order | EX-LAYER-STACK |

### Style Expressions
| Condition | Output | Example IDs |
| --- | --- | --- |
| `restriction` mapping for fills | `FILL_COLOR_EXPRESSION` match on restriction | EX-STYLE-FILL-COLOR |
| `restriction` mapping for lines | `LINE_COLOR_EXPRESSION` match on restriction | EX-STYLE-LINE-COLOR |
| Hidden opacity (fill) | `FILL_OPACITY_EXPRESSION` yields `0` when hidden | EX-STYLE-FILL-OPACITY |
| Hidden opacity (line) | `LINE_OPACITY_EXPRESSION` yields `0` when hidden | EX-STYLE-LINE-OPACITY |

### Additional Layer Config
| Condition | Output | Example IDs |
| --- | --- | --- |
| Operation plans symbols layer | Label uses `{name} ({state})` and icon size uses `ICON_SCALING_EXPRESSION` | EX-LAYER-OPS-LABELS |
| Telemetry symbols layer | `icon-allow-overlap` true and `text-field` uses `{name}\\n{label}` | EX-LAYER-TELEMETRY |
| Icon scaling | Zoom interpolation `[1, 0.1]` to `[7, 1.25]` | EX-ICON-SCALING |
| Wind icon size | Constant `0.675` | EX-WIND-ICON-SIZE |

## Formatting Utilities

### Cyclic Normalization
| Condition | Output | Example IDs |
| --- | --- | --- |
| `normalizeCyclic(val, limit)` | Return `((val % limit) + limit) % limit` | EX-FMT-NORMALIZE-CYCLIC |
| `wrapLongitude(lng)` | Return `normalizeCyclic(lng + 180, 360) - 180` | EX-FMT-WRAP-LNG |
| `normalizeCoordinates({ lat, lng })` | Mutate and return with normalized `lng`, ignore `lat` clamping | EX-FMT-NORMALIZE-COORD |

### Coordinate & Date Formatting
| Condition | Output | Example IDs |
| --- | --- | --- |
| `formatCoordinate(value)` | Return `value.toFixed(6)` | EX-FMT-COORD-6 |
| `formatISODate(date)` | Return `date.toISOString()` without `.000` | EX-FMT-ISO-TRIM |
| `formatDate(date)` | Return `DD.MM.YYYY HH:mm` with zero-padded fields | EX-FMT-DATE-EE |
| `formatDateISO(date)` | Return `date.toISOString()` | EX-FMT-DATE-ISO |

### Altitude & Speed Formatting
| Condition | Output | Example IDs |
| --- | --- | --- |
| `snapToRegulatoryAltitude(h)` | Return nearest value in `[10, 30, 50, 80, 100]` | EX-FMT-SNAP-ALT |
| `formatBearing(bearing)` | Round, normalize 0-359, pad to 3 digits with `°` | EX-FMT-BEARING |
| `mpsToKmh(mps)` | Return `mps * 3.6` | EX-FMT-MPS-KMH |
| `formatSpeed(mps)` | Return `${Math.round(mps * 3.6)} km/h` | EX-FMT-SPEED |

### String Sanitization
| Condition | Output | Example IDs |
| --- | --- | --- |
| `sanitizeColorCode(colorCode)` | Remove all spaces | EX-FMT-COLORCODE |
| `sanitizeAltitudeString(altitude)` | Replace `M` with `m` | EX-FMT-ALT-STRING |
| `normalizePilotName(lastName)` | Split on `(` and trim | EX-FMT-PILOT-NAME |

### UUIDs & Session IDs
| Condition | Output | Example IDs |
| --- | --- | --- |
| `generateUUID()` | Standard UUID v4 string | EX-FMT-UUID |
| `generatePlatformUUID()` | UUID v4 with `flyk-` prefix | EX-FMT-UUID-PLATFORM |
| `generateUUIDv1()` | UUID v1 with Gregorian offset | EX-FMT-UUID-V1 |
| `generateSessionID()` | `${Date.now()}.${generateUUIDv1()}` | EX-FMT-SESSION-ID |

### Buffer & Timing Constants
| Condition | Output | Example IDs |
| --- | --- | --- |
| `clampBuffer(buffer)` | Clamp to `[0, 2000]` | EX-FMT-CLAMP-BUFFER |
| `STATE_TRANSITION_DELIMITER` | Constant `" –> "` | EX-FMT-STATE-DELIM |
| `TIMING_CONSTANTS` | Fixed timing constants (100, 5000, 1000, 3600000, 60000) | EX-FMT-TIMING |
| `SYMBOL_SCALING.STOPS` | `[[1, 0.1], [7, 1.25]]` | EX-FMT-SYMBOL-STOPS |

## Telemetry & Alerts

### Positional Array Parsing
| Condition | Output | Example IDs |
| --- | --- | --- |
| `parseTelemetryArray(data)` | Map indexes `[0..9]` to `TelemetryData` fields without length checks | EX-TEL-PARSE |
| `parseAlertArray(data)` | Map indexes `[0..8]` to alert fields | EX-ALERT-PARSE |

### Telemetry to GeoJSON
| Condition | Output | Example IDs |
| --- | --- | --- |
| `speedKmh > 0` | Bearing from velocity displacement | EX-TEL-BEARING |
| `speedKmh = 0` | Bearing remains `0` | EX-TEL-BEARING-ZERO |
| `icon` mapping | `plane`, `plane-emergency`, `uas-emergency`, else `uas` | EX-TEL-ICON |
| Label | `(${bearingNormalizedPadded}°)` | EX-TEL-LABEL |

### Telemetry Staleness
| Condition | Output | Example IDs |
| --- | --- | --- |
| `TELEMETRY_STALENESS_MS` | Constant `60000` | EX-TEL-STALE |

### Icon Loading
| Condition | Output | Example IDs |
| --- | --- | --- |
| `loadIcon(id)` 404 | Retry after 1000ms (recursive, no max) | EX-ICON-RETRY |

## State Management

### Storage & Headers
| Condition | Output | Example IDs |
| --- | --- | --- |
| `StorageKeys` | `_capuid`, `lang` | EX-STATE-STORAGE |
| `DEFAULT_HEADERS` | `Accept: application/json`, `x-id` = `generateSessionID()` | EX-STATE-HEADERS |

### ThrottledFetcher
| Condition | Output | Example IDs |
| --- | --- | --- |
| Calls within 5000ms and not forced | Schedule retry after remaining delay | EX-STATE-THROTTLE |
| `force = true` | Bypass throttle | EX-STATE-FORCE |
| `fetchFn` throws | Log generic error and retry after 5000ms | EX-STATE-RETRY |

### TimeSync
| Condition | Output | Example IDs |
| --- | --- | --- |
| `fetchServerTime` success | `serverOffset = serverTime - clientTime` | EX-STATE-TIMESYNC |
| `getServerTime()` | `Date.now() + serverOffset` | EX-STATE-TIMESYNC |
| `calculateDuration` | `Math.round((end - start) / 1000)` (NaN propagates) | EX-STATE-DURATION |
| `startAutoSync` | Initial sync then interval (default 300000ms) | EX-STATE-AUTOSYNC |

### PollingManager
| Condition | Output | Example IDs |
| --- | --- | --- |
| `startPolling` | Stop existing, fetch immediately, then interval (default 60000ms) | EX-STATE-POLL |
| `forceFetch` | Calls throttler with `force = true` | EX-STATE-FORCE |
| `stopAll` | Clears intervals and pending throttles | EX-STATE-STOPALL |

### AnimationBatcher
| Condition | Output | Example IDs |
| --- | --- | --- |
| `update` called repeatedly for same key | Only one frame scheduled; last callback runs | EX-STATE-ANIM |
| `cancel` | Cancels pending frame | EX-STATE-ANIM-CANCEL |

### Initialization
| Condition | Output | Example IDs |
| --- | --- | --- |
| Auth init fails or user null | Log warning and continue (Auth-Stall) | EX-STATE-AUTHSTALL |

## Codex Coverage Review (Flagged Gaps)
- **Uncovered branch**: None remaining; all rules in this section have example IDs tied to Phase 1 observation sources.

> The gaps above are flagged for additional observation capture; they are **not** new requirements.

### Codex Review Status
- Codex review was **not** executed in this environment. If run later, outputs must be tied to an observation source or explicitly labeled as an **assumption**.
