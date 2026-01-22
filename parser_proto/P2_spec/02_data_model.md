# Data Model

## UAS GeoJSON

| Field | Type | Constraints |
| --- | --- | --- |
| `type` | `'FeatureCollection'` | Constant string. |
| `features` | `UASFeature[]` | Array of UAS features. |

### UASFeature

| Field | Type | Constraints |
| --- | --- | --- |
| `type` | `'Feature'` | Constant string. |
| `geometry.type` | `'Polygon' | 'MultiPolygon'` | UAS zones are polygonal. |
| `geometry.coordinates` | `number[][][] | number[][][][]` | GeoJSON coordinates in `[lng, lat]` order. |
| `properties.restriction` | `'NO_RESTRICTION' | 'CONDITIONAL' | 'REQ_AUTHORISATION' | 'PROHIBITED'` | Required. |
| `properties.lowerMeters` | `number` | Required. |
| `properties.upperMeters` | `number` | Required. |
| `properties.hidden` | `boolean?` | Optional; when true, feature is skipped in hit-testing. |
| `properties._rejecting` | `boolean?` | Optional; when true, elevates restriction priority. |
| `properties.state` | `string?` | Operation plan state when `source === 'operationplans'`. |
| `properties.*` | `any` | Additional fields allowed. |
| `source` | `'coordinate' | 'operationplans' | 'weather-observations' | string` | Optional; used for sorting. |

## Drawing Inputs

### DrawingPoint
`[lng: number, lat: number]`

### DrawingState
| Field | Type | Constraints |
| --- | --- | --- |
| `currentDrawing` | `DrawingPoint[]` | May be empty. |
| `drawingMode` | `'point' | 'line' | 'polygon'` | Required. |
| `buffer` | `number` | Buffer in meters. |

### RouteAreaOutput
| Field | Type | Constraints |
| --- | --- | --- |
| `routeArea` | `Feature | FeatureCollection` | Buffered geometry. |
| `midpoints` | `DrawingPoint[]` | Derived midpoints; empty if <2 points. |
| `coordinates` | `DrawingPoint[]` | Echo of input points. |
| `mode` | `'point' | 'line' | 'polygon'` | Echo of input mode. |
| `bufferMeters` | `number` | Echo of input buffer. |

## Operation Plan Validation

### OperationPlanValidation
| Field | Type | Constraints |
| --- | --- | --- |
| `firstName` | `string` | Required, non-empty after trimming. |
| `lastName` | `string` | Required, non-empty after trimming. |
| `phone` | `string` | Required; `validatePhone` must pass. |
| `mtom` | `number` | Must be >= 0. |
| `maxAltitude` | `number` | Must be >= 0. |
| `startDatetime` | `Date` | Must be future. |
| `endDatetime` | `Date` | Must be after `startDatetime` and future. |
| `requiresAuthorization` | `boolean?` | Optional flag; triggers lead-time rule. |

### EnvironmentConfig
| Field | Type | Constraints |
| --- | --- | --- |
| `REQ_AUTHORIZATION_MIN_LEAD_TIME` | `number` | Minutes; default 5 if missing. |
| `MAX_PLANNING_AHEAD_DAYS` | `number?` | Days; default 30 if missing. |
| `MIN_FLIGHT_DURATION` | `number?` | Minutes; default 1 if missing. |
| `MAX_FLIGHT_DURATION` | `number?` | Minutes; optional upper bound. |

## Operation Plan State

### OperationPlanData
| Field | Type | Constraints |
| --- | --- | --- |
| `operationPlanId` | `string` | Required. |
| `state` | `OperationPlanState` | Required. |
| `closureReason` | `ClosureReason?` | Optional. |
| `authorization.state` | `GrantState?` | Optional. |
| `activation.state` | `GrantState?` | Optional. |
| `alternativeOPs` | `{ timeBegin: string }[]?` | Optional. |
| `conflicts` | `any[]?` | Optional. |
| `timeBegin` | `string` | Required. |

### Enumerations
- `OperationPlanState = 'PROPOSED' | 'APPROVED' | 'AUTHORIZED' | 'ACTIVATED' | 'TAKEOFFREQUESTED' | 'TAKEOFFGRANTED' | 'CLOSED' | 'DENIED' | 'TIMEOUT' | 'ERROR'`
- `ClosureReason = 'NOMINAL' | 'CANCELED' | 'WITHDRAWN' | 'REJECTED' | 'REVOKED' | 'TIMEOUT' | null`
- `GrantState = 'GRANTED' | 'DENIED' | 'PENDING' | null`

## Normalization Rules
- **Longitude**: `((lng + 180) % 360 + 360) % 360 - 180`.
- **Pilot name**: Split on `(` and trim the left portion.
- **Altitude snap**: Snap to nearest value in `[10, 30, 50, 80, 100]`.
- **Payload normalization**:
  - v3: ensure `phones` array and `aircraftInfos` array.
  - v2: ensure `phone` string and `uasRegistrations` array.
- **Time window URLs**: Start and end are ISO strings with buffer minutes subtracted/added.
- **Trimming**: Only applied in `sanitizePilotName` and name validation checks; other fields are not trimmed unless explicitly stated.
- **Case folding**: No case folding is performed unless explicitly stated.
- **Rounding**: No numeric rounding is performed beyond altitude snapping; raw numeric values are otherwise preserved.

## Telemetry & Alerts

### TelemetryData
| Field | Type | Constraints |
| --- | --- | --- |
| `id` | `string` | From positional array index 0. |
| `name` | `string` | From positional array index 1. |
| `createdAt` | `number` | Unix ms timestamp at index 2. |
| `latitude` | `number` | Index 3. |
| `longitude` | `number` | Index 4. |
| `velocity.latitude` | `number` | Index 5, nested latitude component. |
| `velocity.longitude` | `number` | Index 5, nested longitude component. |
| `altitudeMeters` | `number` | Index 6. |
| `type` | `string` | Index 7. |
| `icon` | `string` | Index 8. |
| `opacity` | `number` | Index 9. |

### AlertData
| Field | Type | Constraints |
| --- | --- | --- |
| `id` | `string` | Array index 0. |
| `type` | `string` | Index 1. |
| `severity` | `string` | Index 2. |
| `message` | `string` | Index 3. |
| `latitude` | `number` | Index 4. |
| `longitude` | `number` | Index 5. |
| `radius` | `number` | Index 6. |
| `createdAt` | `number` | Index 7. |
| `metadata` | `any` | Index 8. |

### Telemetry Constants
| Field | Type | Constraints |
| --- | --- | --- |
| `TELEMETRY_STALENESS_MS` | `number` | `60000`. |

## Formatting Constants

| Constant | Type | Constraints |
| --- | --- | --- |
| `UNIT_CONVERSION.M_TO_FT` | `number` | `3.28084`. |
| `UNIT_CONVERSION.FT_TO_M` | `number` | `0.3048`. |
| `STATE_TRANSITION_DELIMITER` | `string` | `" –> "` (en-dash). |
| `ALTITUDE_CONSTANTS.METERS_TO_FEET` | `number` | `3.28084`. |
| `ALTITUDE_CONSTANTS.FEET_TO_METERS` | `number` | `0.3048`. |
| `BUFFER_LIMITS.DEFAULT` | `number` | `50`. |
| `BUFFER_LIMITS.MIN` | `number` | `0`. |
| `BUFFER_LIMITS.MAX` | `number` | `2000`. |
| `TIMING_CONSTANTS.HELLO_INIT_DELAY` | `number` | `100`. |
| `TIMING_CONSTANTS.THROTTLE_DELAY` | `number` | `5000`. |
| `TIMING_CONSTANTS.CLEANUP_INTERVAL` | `number` | `1000`. |
| `TIMING_CONSTANTS.ALERT_CLEANUP_THRESHOLD` | `number` | `3600000`. |
| `TIMING_CONSTANTS.TELEMETRY_CLEANUP_THRESHOLD` | `number` | `60000`. |
| `SYMBOL_SCALING.STOPS` | `[number, number][]` | `[[1, 0.1], [7, 1.25]]`. |
| `SYMBOL_SCALING.WIND_ICON_SIZE` | `number` | `0.675`. |

## Color & Styling Data

### RestrictionType
`'NO_RESTRICTION' | 'CONDITIONAL' | 'REQ_AUTHORISATION' | 'PROHIBITED'`

### ColorScheme
| Field | Type | Constraints |
| --- | --- | --- |
| `NO_RESTRICTION` | `string` | HSL string from theme mapping. |
| `CONDITIONAL` | `string` | HSL string from theme mapping. |
| `REQ_AUTHORISATION` | `string` | HSL string from theme mapping. |
| `PROHIBITED` | `string` | HSL string from theme mapping. |

### MapLibre Style Expressions
| Field | Type | Constraints |
| --- | --- | --- |
| `FILL_COLOR_EXPRESSION` | `any[]` | Match expression over `restriction`. |
| `LINE_COLOR_EXPRESSION` | `any[]` | Match expression over `restriction`. |
| `FILL_OPACITY_EXPRESSION` | `any[]` | Hidden-aware opacity (`0` when `hidden === true`). |
| `LINE_OPACITY_EXPRESSION` | `any[]` | Hidden-aware opacity (`0` when `hidden === true`). |

### Layer Definitions (UAS)
| Field | Type | Constraints |
| --- | --- | --- |
| `UAS_LAYERS` | `object[]` | Ordered layer list for UAS visualization. |
| `FULL_LAYER_STACK` | `string[]` | Ordered rendering stack from bottom to top. |
