# Traceability (Spec → Examples → Sources)

## Map by Spec Section

### 03_rules.md
| Rule / Section | Example IDs | Legacy Observation Source |
| --- | --- | --- |
| Route area generation | EX-RA-EMPTY, EX-RA-SINGLE, EX-RA-POLY-CLOSE, EX-RA-LINE-SPLIT | EDGE_CASES.md lines 7-26 |
| Route area fallback & midpoints | EX-RA-FALLBACK, EX-MIDPOINTS-PAIR | routeArea.ts lines 82-112 |
| Intersection filtering | EX-INT-HIDDEN, EX-INT-INVALID-GEOM, EX-INT-EMPTY-ROUTE, EX-INT-UNION-FAIL | EDGE_CASES.md lines 30-48 |
| Intersection hidden behavior | EX-INT-NO-HIDDEN-FILTER | intersections.ts lines 20-48 |
| Fetching & URL construction | EX-FETCH-BASE, EX-FETCH-BROWSE, EX-FETCH-HTTP-ERROR, EX-FETCH-ERROR | fetchUAS.ts lines 47-74 |
| Map source configuration | EX-SOURCE-DEFAULT, EX-SOURCE-OVERRIDE, EX-SOURCE-UPDATE, EX-SOURCE-NOOP | API.md lines 214-256; fetchUAS.ts lines 82-89 |
| Unit conversion | EX-UNIT-M2FT, EX-UNIT-FT2M | validation.ts lines 61-79 |
| Formatting utilities | EX-FMT-NORMALIZE-CYCLIC, EX-FMT-WRAP-LNG, EX-FMT-NORMALIZE-COORD, EX-FMT-COORD-6, EX-FMT-ISO-TRIM, EX-FMT-DATE-EE, EX-FMT-DATE-ISO, EX-FMT-SNAP-ALT, EX-FMT-BEARING, EX-FMT-MPS-KMH, EX-FMT-SPEED, EX-FMT-COLORCODE, EX-FMT-ALT-STRING, EX-FMT-PILOT-NAME, EX-FMT-UUID, EX-FMT-UUID-PLATFORM, EX-FMT-UUID-V1, EX-FMT-SESSION-ID, EX-FMT-M2FT, EX-FMT-FT2M-ROUND, EX-FMT-CLAMP-BUFFER, EX-FMT-STATE-DELIM, EX-FMT-TIMING, EX-FMT-SYMBOL-STOPS | formatting.ts lines 8-334 |
| Sorting | EX-SORT-ALTITUDE, EX-SORT-UNKNOWN-RESTR, EX-SORT-MISSING-PROP, EX-SORT-REJECTING | EDGE_CASES.md lines 52-69 |
| Sorting priorities (source/state) | EX-SORT-SOURCE, EX-SORT-STATE | sorting.ts lines 61-88 |
| Phone validation | EX-VAL-PHONE-VALID, EX-VAL-PHONE-INVALID | EDGE_CASES.md lines 73-86 |
| Longitude normalization | EX-VAL-LON-NORM | EDGE_CASES.md lines 88-98 |
| Numeric validation | EX-VAL-MTOM-NEG, EX-VAL-MAXALT-NEG | EDGE_CASES.md lines 100-108 |
| Time ordering validation | EX-VAL-TIME-ORDER | EDGE_CASES.md lines 110-118 |
| Duration & lead-time validation | EX-VAL-DURATION-SHORT, EX-VAL-DURATION-LONG, EX-VAL-LEADTIME, EX-VAL-PLAN-AHEAD | validation.ts lines 293-322 |
| Time window & ISO formatting | EX-TIME-WINDOW, EX-ISO-FORMAT | EDGE_CASES.md lines 138-153 |
| Cleanup rules | EX-CLEANUP-ALERT-KEEP, EX-CLEANUP-ALERT-REMOVE, EX-CLEANUP-TELEMETRY-REMOVE, EX-CLEANUP-MISSING | EDGE_CASES.md lines 179-202 |
| Altitude snapping | EX-ALTITUDE-SNAP-45 | EDGE_CASES.md lines 240-244 |
| Operation plan computed status | EX-OP-COMPLETED, EX-OP-REJECTED, EX-OP-CANCELLED, EX-OP-ACTIVE, EX-OP-PENDING | operationPlanState.ts lines 72-189 |
| Self-intersection detection | EX-SELF-INTERSECT, EX-SELF-INTERSECT-ERROR, EX-SELF-INTERSECT-NONE | intersections.ts lines 61-68 |
| Pilot name sanitization | EX-NAME-SANITIZE, EX-NAME-SANITIZE-NONE | validation.ts lines 156-166 |
| Payload normalization | EX-PAYLOAD-V3, EX-PAYLOAD-V2 | validation.ts lines 169-190 |
| Polygon safety validation | EX-POLY-THROW, EX-POLY-KINKS, EX-POLY-OK | validation.ts lines 216-237 |
| Anonymization | EX-ANON-SHA256 | validation.ts lines 82-97 |
| Color mapping & theme logic | EX-COLOR-RESTRICTION, EX-COLOR-SCHEME-DEFAULT, EX-COLOR-SCHEME-AUSTRO, EX-COLOR-INVERT, EX-COLOR-INVERT-OFF, EX-COLOR-SANITIZE, EX-COLOR-BILINEAR-LOW, EX-COLOR-BILINEAR-HIGH | colors.ts lines 10-158 |
| Layer configuration | EX-LAYER-UAS-LOW, EX-LAYER-UAS-HIGH, EX-LAYER-HIDDEN, EX-LAYER-BECOMING-ACTIVE, EX-LAYER-LABELS, EX-LAYER-STACK, EX-LAYER-OPS-LABELS, EX-LAYER-TELEMETRY, EX-ICON-SCALING, EX-WIND-ICON-SIZE | layers.ts lines 9-262 |
| Style expressions | EX-STYLE-FILL-COLOR, EX-STYLE-LINE-COLOR, EX-STYLE-FILL-OPACITY, EX-STYLE-LINE-OPACITY | colors.ts lines 62-121 |
| Telemetry & alerts | EX-TEL-PARSE, EX-ALERT-PARSE, EX-TEL-BEARING, EX-TEL-BEARING-ZERO, EX-TEL-ICON, EX-TEL-LABEL, EX-TEL-STALE, EX-ICON-RETRY | telemetry.ts lines 8-150 |
| State management | EX-STATE-STORAGE, EX-STATE-HEADERS, EX-STATE-THROTTLE, EX-STATE-FORCE, EX-STATE-RETRY, EX-STATE-TIMESYNC, EX-STATE-DURATION, EX-STATE-AUTOSYNC, EX-STATE-POLL, EX-STATE-STOPALL, EX-STATE-ANIM, EX-STATE-ANIM-CANCEL, EX-STATE-AUTHSTALL | stateManagement.ts lines 3-361 |

### 06_examples.feature
| Scenario | Example IDs | Legacy Observation Source |
| --- | --- | --- |
| Route area scenarios | EX-RA-EMPTY, EX-RA-SINGLE, EX-RA-POLY-CLOSE, EX-RA-LINE-SPLIT | EDGE_CASES.md lines 7-26 |
| Route area fallback & midpoint scenarios | EX-RA-FALLBACK, EX-MIDPOINTS-PAIR | routeArea.ts lines 82-112 |
| Intersection scenarios | EX-INT-EMPTY-ROUTE, EX-INT-HIDDEN, EX-INT-INVALID-GEOM, EX-INT-UNION-FAIL | EDGE_CASES.md lines 30-48 |
| Intersection hidden behavior scenario | EX-INT-NO-HIDDEN-FILTER | intersections.ts lines 20-48 |
| Fetching scenarios | EX-FETCH-BASE, EX-FETCH-BROWSE, EX-FETCH-HTTP-ERROR, EX-FETCH-ERROR | fetchUAS.ts lines 47-74 |
| Map source scenarios | EX-SOURCE-DEFAULT, EX-SOURCE-OVERRIDE, EX-SOURCE-UPDATE, EX-SOURCE-NOOP | API.md lines 214-256; fetchUAS.ts lines 82-89 |
| Unit conversion scenarios | EX-UNIT-M2FT, EX-UNIT-FT2M | validation.ts lines 61-79 |
| Formatting scenarios | EX-FMT-NORMALIZE-CYCLIC, EX-FMT-WRAP-LNG, EX-FMT-NORMALIZE-COORD, EX-FMT-COORD-6, EX-FMT-ISO-TRIM, EX-FMT-DATE-EE, EX-FMT-DATE-ISO, EX-FMT-SNAP-ALT, EX-FMT-BEARING, EX-FMT-MPS-KMH, EX-FMT-SPEED, EX-FMT-COLORCODE, EX-FMT-ALT-STRING, EX-FMT-PILOT-NAME, EX-FMT-UUID, EX-FMT-UUID-PLATFORM, EX-FMT-UUID-V1, EX-FMT-SESSION-ID, EX-FMT-M2FT, EX-FMT-FT2M-ROUND, EX-FMT-CLAMP-BUFFER, EX-FMT-STATE-DELIM, EX-FMT-TIMING, EX-FMT-SYMBOL-STOPS | formatting.ts lines 8-334 |
| Sorting scenarios | EX-SORT-ALTITUDE, EX-SORT-UNKNOWN-RESTR, EX-SORT-REJECTING, EX-SORT-MISSING-PROP | EDGE_CASES.md lines 52-69 |
| Sorting source/state scenarios | EX-SORT-SOURCE, EX-SORT-STATE | sorting.ts lines 61-88 |
| Validation scenarios | EX-VAL-PHONE-VALID, EX-VAL-PHONE-INVALID, EX-VAL-LON-NORM, EX-VAL-MTOM-NEG, EX-VAL-MAXALT-NEG, EX-VAL-TIME-ORDER | EDGE_CASES.md lines 73-118 |
| Duration/lead-time scenarios | EX-VAL-DURATION-SHORT, EX-VAL-DURATION-LONG, EX-VAL-LEADTIME, EX-VAL-PLAN-AHEAD | validation.ts lines 293-322 |
| Time window scenarios | EX-TIME-WINDOW, EX-ISO-FORMAT | EDGE_CASES.md lines 138-153 |
| Cleanup scenarios | EX-CLEANUP-ALERT-KEEP, EX-CLEANUP-ALERT-REMOVE, EX-CLEANUP-TELEMETRY-REMOVE, EX-CLEANUP-MISSING | EDGE_CASES.md lines 179-202 |
| Altitude snapping scenarios | EX-ALTITUDE-SNAP-45 | EDGE_CASES.md lines 240-244 |
| Computed status scenarios | EX-OP-COMPLETED, EX-OP-REJECTED, EX-OP-CANCELLED, EX-OP-ACTIVE, EX-OP-PENDING | operationPlanState.ts lines 72-189 |
| Self-intersection scenarios | EX-SELF-INTERSECT, EX-SELF-INTERSECT-ERROR, EX-SELF-INTERSECT-NONE | intersections.ts lines 61-68 |
| Name/payload normalization scenarios | EX-NAME-SANITIZE, EX-NAME-SANITIZE-NONE, EX-PAYLOAD-V3, EX-PAYLOAD-V2 | validation.ts lines 156-190 |
| Polygon safety scenarios | EX-POLY-THROW, EX-POLY-KINKS, EX-POLY-OK | validation.ts lines 216-237 |
| Anonymization scenario | EX-ANON-SHA256 | validation.ts lines 82-97 |
| Color & styling scenarios | EX-COLOR-RESTRICTION, EX-COLOR-SCHEME-DEFAULT, EX-COLOR-SCHEME-AUSTRO, EX-COLOR-INVERT, EX-COLOR-INVERT-OFF, EX-COLOR-SANITIZE, EX-COLOR-BILINEAR-LOW, EX-COLOR-BILINEAR-HIGH, EX-LAYER-UAS-LOW, EX-LAYER-UAS-HIGH, EX-LAYER-HIDDEN, EX-LAYER-BECOMING-ACTIVE, EX-LAYER-LABELS, EX-LAYER-STACK, EX-LAYER-OPS-LABELS, EX-LAYER-TELEMETRY, EX-ICON-SCALING, EX-WIND-ICON-SIZE, EX-STYLE-FILL-COLOR, EX-STYLE-LINE-COLOR, EX-STYLE-FILL-OPACITY, EX-STYLE-LINE-OPACITY | colors.ts lines 10-158; layers.ts lines 9-262 |
| Telemetry scenarios | EX-TEL-PARSE, EX-ALERT-PARSE, EX-TEL-BEARING, EX-TEL-BEARING-ZERO, EX-TEL-ICON, EX-TEL-LABEL, EX-TEL-STALE, EX-ICON-RETRY | telemetry.ts lines 8-150 |
| State management scenarios | EX-STATE-STORAGE, EX-STATE-HEADERS, EX-STATE-THROTTLE, EX-STATE-FORCE, EX-STATE-RETRY, EX-STATE-TIMESYNC, EX-STATE-DURATION, EX-STATE-AUTOSYNC, EX-STATE-POLL, EX-STATE-STOPALL, EX-STATE-ANIM, EX-STATE-ANIM-CANCEL, EX-STATE-AUTHSTALL | stateManagement.ts lines 3-361 |

## Example ID Index
| Example ID | Description | Source |
| --- | --- | --- |
| EX-RA-EMPTY | Empty drawing yields empty FeatureCollection | EDGE_CASES.md lines 7-10 |
| EX-RA-SINGLE | Single point buffers into circle | EDGE_CASES.md lines 12-15 |
| EX-RA-POLY-CLOSE | Polygon auto-close behavior | EDGE_CASES.md lines 17-20 |
| EX-RA-LINE-SPLIT | Line mode segment splitting | EDGE_CASES.md lines 22-26 |
| EX-RA-FALLBACK | Fallback LineString buffering | routeArea.ts lines 82-84 |
| EX-MIDPOINTS-PAIR | Midpoints between adjacent pairs | routeArea.ts lines 95-112 |
| EX-INT-HIDDEN | Hidden features skipped | EDGE_CASES.md lines 30-33 |
| EX-INT-INVALID-GEOM | Invalid geometry skipped with logging | EDGE_CASES.md lines 35-38 |
| EX-INT-EMPTY-ROUTE | Empty route area returns empty list | EDGE_CASES.md lines 40-43 |
| EX-INT-UNION-FAIL | Union failures skipped | EDGE_CASES.md lines 45-48 |
| EX-INT-NO-HIDDEN-FILTER | Intersection filter does not check `hidden` | intersections.ts lines 20-48 |
| EX-FETCH-BASE | Base URL when browseTime missing | fetchUAS.ts lines 47-52 |
| EX-FETCH-BROWSE | Browse time adds start/end/buffer query | fetchUAS.ts lines 53-58 |
| EX-FETCH-HTTP-ERROR | HTTP non-ok throws | fetchUAS.ts lines 60-66 |
| EX-FETCH-ERROR | Fetch/parse errors logged and rethrown | fetchUAS.ts lines 60-74 |
| EX-SOURCE-DEFAULT | createUASSource default base URL | API.md lines 214-228 |
| EX-SOURCE-OVERRIDE | createUASSource uses provided baseUrl | API.md lines 214-224 |
| EX-SOURCE-UPDATE | updateUASSource sets data on source | fetchUAS.ts lines 82-89 |
| EX-SOURCE-NOOP | updateUASSource no-op when missing | fetchUAS.ts lines 82-89 |
| EX-UNIT-M2FT | Meters to feet conversion | validation.ts lines 61-69 |
| EX-UNIT-FT2M | Feet to meters conversion | validation.ts lines 72-78 |
| EX-FMT-M2FT | Formatting meters to feet conversion | formatting.ts lines 278-284 |
| EX-FMT-FT2M-ROUND | Formatting feet to meters conversion | formatting.ts lines 286-292 |
| EX-FMT-NORMALIZE-CYCLIC | Double modulo normalization | formatting.ts lines 8-14 |
| EX-FMT-WRAP-LNG | Longitude wrap formula | formatting.ts lines 16-25 |
| EX-FMT-NORMALIZE-COORD | Normalize coordinates (longitude only) | formatting.ts lines 27-39 |
| EX-FMT-COORD-6 | Coordinate formatting to 6 decimals | formatting.ts lines 41-50 |
| EX-FMT-ISO-TRIM | ISO .000 removal | formatting.ts lines 52-62 |
| EX-FMT-DATE-EE | Estonian date format | formatting.ts lines 170-185 |
| EX-FMT-DATE-ISO | ISO date format | formatting.ts lines 187-195 |
| EX-FMT-SNAP-ALT | Regulatory altitude snap | formatting.ts lines 65-75 |
| EX-FMT-BEARING | Bearing formatting | formatting.ts lines 100-113 |
| EX-FMT-MPS-KMH | m/s to km/h conversion | formatting.ts lines 115-124 |
| EX-FMT-SPEED | Speed formatting | formatting.ts lines 126-135 |
| EX-FMT-COLORCODE | Color code sanitization | formatting.ts lines 137-146 |
| EX-FMT-ALT-STRING | Altitude string sanitization | formatting.ts lines 148-157 |
| EX-FMT-PILOT-NAME | Pilot name normalization | formatting.ts lines 159-168 |
| EX-FMT-UUID | UUID v4 generation | formatting.ts lines 197-207 |
| EX-FMT-UUID-PLATFORM | Platform UUID prefix | formatting.ts lines 85-98 |
| EX-FMT-UUID-V1 | UUID v1 generation | formatting.ts lines 209-253 |
| EX-FMT-SESSION-ID | Session ID construction | formatting.ts lines 255-260 |
| EX-FMT-CLAMP-BUFFER | Buffer clamp | formatting.ts lines 294-313 |
| EX-FMT-STATE-DELIM | State transition delimiter | formatting.ts lines 263-267 |
| EX-FMT-TIMING | Timing constants | formatting.ts lines 316-326 |
| EX-FMT-SYMBOL-STOPS | Symbol scaling stops | formatting.ts lines 328-334 |
| EX-SORT-ALTITUDE | Equal altitude tie-breakers | EDGE_CASES.md lines 52-55 |
| EX-SORT-UNKNOWN-RESTR | Unknown restriction defaults to 0 | EDGE_CASES.md lines 57-59 |
| EX-SORT-MISSING-PROP | Missing properties default values | EDGE_CASES.md lines 61-64 |
| EX-SORT-REJECTING | Rejecting features highest priority | EDGE_CASES.md lines 66-69 |
| EX-SORT-SOURCE | Source priority order | sorting.ts lines 61-71 |
| EX-SORT-STATE | Operation plan state priority order | sorting.ts lines 73-88 |
| EX-VAL-PHONE-VALID | Valid phone formats | EDGE_CASES.md lines 75-80 |
| EX-VAL-PHONE-INVALID | Invalid phone formats | EDGE_CASES.md lines 81-86 |
| EX-VAL-LON-NORM | Longitude normalization cases | EDGE_CASES.md lines 88-98 |
| EX-VAL-MTOM-NEG | Negative MTOM invalid | EDGE_CASES.md lines 100-104 |
| EX-VAL-MAXALT-NEG | Negative max altitude invalid | EDGE_CASES.md lines 106-108 |
| EX-VAL-TIME-ORDER | Time ordering constraints | EDGE_CASES.md lines 110-118 |
| EX-VAL-DURATION-SHORT | Duration below minimum invalid | validation.ts lines 293-298 |
| EX-VAL-DURATION-LONG | Duration above maximum invalid | validation.ts lines 300-302 |
| EX-VAL-LEADTIME | Lead time below minimum invalid | validation.ts lines 304-312 |
| EX-VAL-PLAN-AHEAD | Start too far in future invalid | validation.ts lines 315-322 |
| EX-TIME-WINDOW | Time window buffer example | EDGE_CASES.md lines 138-144 |
| EX-ISO-FORMAT | ISO string formatting example | EDGE_CASES.md lines 149-153 |
| EX-CLEANUP-ALERT-KEEP | Alert younger than 1 hour kept | EDGE_CASES.md lines 179-186 |
| EX-CLEANUP-ALERT-REMOVE | Alert at 1 hour boundary removed | EDGE_CASES.md lines 187-190 |
| EX-CLEANUP-TELEMETRY-REMOVE | Telemetry at 1 minute boundary removed | EDGE_CASES.md lines 192-197 |
| EX-CLEANUP-MISSING | Missing timestamp removed | EDGE_CASES.md lines 199-202 |
| EX-ALTITUDE-SNAP-45 | 45m snaps to 50m | EDGE_CASES.md lines 240-244 |
| EX-OP-COMPLETED | Completed status logic | operationPlanState.ts lines 72-98 |
| EX-OP-REJECTED | Rejected status logic | operationPlanState.ts lines 101-131 |
| EX-OP-CANCELLED | Cancelled status logic | operationPlanState.ts lines 134-162 |
| EX-OP-ACTIVE | Active status logic | operationPlanState.ts lines 164-168 |
| EX-OP-PENDING | Pending status logic | operationPlanState.ts lines 171-175 |
| EX-SELF-INTERSECT | Self-intersection detected | intersections.ts lines 61-65 |
| EX-SELF-INTERSECT-ERROR | Self-intersection errors treated as true | intersections.ts lines 61-68 |
| EX-SELF-INTERSECT-NONE | No self-intersection | intersections.ts lines 61-65 |
| EX-NAME-SANITIZE | Parenthetical metadata stripped | validation.ts lines 156-166 |
| EX-NAME-SANITIZE-NONE | Names without parentheses preserved | validation.ts lines 156-166 |
| EX-PAYLOAD-V3 | v3 payload normalization | validation.ts lines 169-183 |
| EX-PAYLOAD-V2 | v2 payload normalization | validation.ts lines 184-188 |
| EX-POLY-THROW | Invalid polygon throws | validation.ts lines 224-226 |
| EX-POLY-KINKS | Kinks detection returns false | validation.ts lines 228-233 |
| EX-POLY-OK | Valid polygon returns true | validation.ts lines 228-237 |
| EX-ANON-SHA256 | User ID SHA-256 hex digest | validation.ts lines 82-97 |
| EX-COLOR-RESTRICTION | Restriction color mapping | colors.ts lines 43-60 |
| EX-COLOR-SCHEME-DEFAULT | Default color scheme | colors.ts lines 135-156 |
| EX-COLOR-SCHEME-AUSTRO | Austrocontrol color scheme | colors.ts lines 123-156 |
| EX-COLOR-INVERT | HSL inversion for dark theme | colors.ts lines 22-30, 135-156 |
| EX-COLOR-INVERT-OFF | HSL inversion disabled | colors.ts lines 22-30 |
| EX-COLOR-SANITIZE | Strip spaces in color strings | colors.ts lines 10-20 |
| EX-COLOR-BILINEAR-LOW | Bilinear lightness interpolation low | colors.ts lines 33-40 |
| EX-COLOR-BILINEAR-HIGH | Bilinear lightness interpolation high | colors.ts lines 33-40 |
| EX-LAYER-UAS-LOW | UAS low-altitude fill layer | layers.ts lines 9-27 |
| EX-LAYER-UAS-HIGH | UAS high-altitude fill layer | layers.ts lines 48-71 |
| EX-LAYER-HIDDEN | Hidden opacity expressions | colors.ts lines 99-121 |
| EX-LAYER-BECOMING-ACTIVE | Becoming active dashed lines | layers.ts lines 73-89 |
| EX-LAYER-LABELS | Symbol layer label format | layers.ts lines 113-137 |
| EX-LAYER-STACK | Full layer stack order | layers.ts lines 240-262 |
| EX-STYLE-FILL-COLOR | Fill color match expression | colors.ts lines 62-75 |
| EX-STYLE-LINE-COLOR | Line color match expression | colors.ts lines 77-90 |
| EX-STYLE-FILL-OPACITY | Fill opacity expression | colors.ts lines 99-109 |
| EX-STYLE-LINE-OPACITY | Line opacity expression | colors.ts lines 111-121 |
| EX-LAYER-OPS-LABELS | Operation plans symbols layer | layers.ts lines 195-210 |
| EX-LAYER-TELEMETRY | Telemetry symbols layer | layers.ts lines 213-238 |
| EX-ICON-SCALING | Icon scaling expression | layers.ts lines 155-166 |
| EX-WIND-ICON-SIZE | Wind icon size constant | layers.ts lines 168-168 |
| EX-TEL-PARSE | Telemetry positional array mapping | telemetry.ts lines 24-49 |
| EX-ALERT-PARSE | Alert positional array mapping | telemetry.ts lines 52-70 |
| EX-TEL-BEARING | Bearing computed from velocity | telemetry.ts lines 85-99 |
| EX-TEL-BEARING-ZERO | Bearing zero when speed zero | telemetry.ts lines 85-99 |
| EX-TEL-ICON | Telemetry icon mapping | telemetry.ts lines 101-108 |
| EX-TEL-LABEL | Telemetry label formatting | telemetry.ts lines 109-125 |
| EX-TEL-STALE | Telemetry staleness constant | telemetry.ts lines 73-77 |
| EX-ICON-RETRY | Recursive icon loading | telemetry.ts lines 128-150 |
| EX-STATE-STORAGE | Storage keys constants | stateManagement.ts lines 3-9 |
| EX-STATE-HEADERS | Default headers include x-id | stateManagement.ts lines 11-18 |
| EX-STATE-THROTTLE | Throttle delay and retry scheduling | stateManagement.ts lines 45-65 |
| EX-STATE-FORCE | Force bypasses throttle | stateManagement.ts lines 40-65 |
| EX-STATE-RETRY | Error retry without backoff | stateManagement.ts lines 71-84 |
| EX-STATE-TIMESYNC | Server offset calculation | stateManagement.ts lines 123-153 |
| EX-STATE-DURATION | Duration calculation with NaN propagation | stateManagement.ts lines 162-173 |
| EX-STATE-AUTOSYNC | Auto sync every 300000ms | stateManagement.ts lines 175-189 |
| EX-STATE-POLL | Polling starts with immediate fetch | stateManagement.ts lines 220-244 |
| EX-STATE-STOPALL | Polling stopAll clears intervals and throttles | stateManagement.ts lines 269-278 |
| EX-STATE-ANIM | Animation batcher dedupe | stateManagement.ts lines 300-313 |
| EX-STATE-ANIM-CANCEL | Animation batcher cancel | stateManagement.ts lines 315-325 |
| EX-STATE-AUTHSTALL | Auth-stall initialization | stateManagement.ts lines 339-361 |
