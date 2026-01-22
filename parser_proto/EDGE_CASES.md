# EDGE CASES DOCUMENTATION

This document catalogs **EVERY** edge case handled by the utm.eans.ee implementation.

## 1. Route Area Generation Edge Cases

### Empty Drawing
- **Input**: `drawingPoints = []`
- **Output**: Empty FeatureCollection
- **Reason**: No geometry to buffer

### Single Point
- **Input**: `drawingPoints = [[lng, lat]]`
- **Output**: Single buffered circle
- **Implementation**: `turf.buffer(point, bufferMeters/1000)`

### Polygon Auto-Close
- **Input**: Polygon with >2 points, not closed
- **Action**: Automatically appends first point to end
- **Reason**: Turf.js requires closed polygons

### Line Segment Splitting
- **Input**: Multi-point line
- **Action**: Splits into individual segment LineStrings
- **Reason**: Prevents self-intersection in buffer calculation
- **Critical**: This is the most important edge case

## 2. Intersection Detection Edge Cases

### Hidden Features
- **Check**: `feature.properties.hidden === true`
- **Action**: Skip in intersection tests
- **Reason**: UI may temporarily hide features

### Invalid Geometry
- **Scenario**: Turf.js throws error during `booleanIntersects`
- **Handling**: Wrapped in try/catch, silently continue
- **Logging**: Error logged to console

### Empty Route Area
- **Check**: `routeArea.features.length === 0`
- **Return**: Empty array
- **Reason**: Nothing to intersect

### Union Failures
- **Scenario**: `turf.union()` fails on complex geometry
- **Handling**: Try/catch, return empty array
- **Logging**: Error logged to console

## 3. Sorting Edge Cases

### Equal Altitude
- **Primary**: Compare `lowerMeters`
- **Secondary**: Compare `upperMeters`
- **Tertiary**: Move to restriction comparison

### Unknown Restriction Type
- **Handling**: Defaults to priority 0 (lowest)
- **Map**: `restrictionPriority[type] || 0`

### Missing Properties
- **Check**: `feature.properties || {}`
- **Handling**: Treats as empty object
- **Default values**: 0 for numbers, undefined for strings

### Rejecting Features
- **Priority**: Always highest (3)
- **Check**: `properties._rejecting === true`
- **Overrides**: All other priority calculations

## 4. Validation Edge Cases

### Phone Number

**Valid**:
- `+37212345678`
- `+1 234 567 8900`
- `12345678`
- `123 456 789`

**Invalid**:
- `` (empty)
- `+` (only plus sign)
- `abc123` (letters)
- `+372-12345` (dash)
- `(372) 123` (parentheses)

### Longitude Normalization

**Inputs → Outputs**:
- `0` → `0`
- `180` → `180`
- `-180` → `-180`
- `181` → `-179`
- `360` → `0`
- `540` → `180`
- `-181` → `179`
- `-540` → `-180`

### Negative Values

**MTOM**:
- `-1` → Error: "MTOM cannot be negative"
- `0` → Valid

**Max Altitude**:
- `-1` → Error: "Max altitude cannot be negative"
- `0` → Valid

### Time Ordering

**Valid**:
- `now < start < end`

**Invalid Cases**:
- `start <= now` → "Start time must be in the future"
- `end <= start` → "End time must be after start time"
- `start === end` → "End time must be after start time"

## 5. Time Handling Edge Cases

### Server Offset

**Positive Offset** (server ahead):
- `serverTime = 1000`, `clientTime = 900`
- `offset = +100`
- `getServerTime() = now() + 100`

**Negative Offset** (server behind):
- `serverTime = 900`, `clientTime = 1000`
- `offset = -100`
- `getServerTime() = now() - 100`

**Network Delay**:
- Ignored in current implementation
- Time sync uses instant comparison

### Time Window Buffer

**Example**:
- `start = 10:00`, `end = 11:00`, `buffer = 60`
- `URL param start = 09:00`
- `URL param end = 12:00`

**Negative Buffer**:
- Not validated, could produce invalid range
- **Recommendation**: Validate `buffer >= 0`

### ISO String Formatting

**Format**: `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example**: `2024-01-15T10:30:00.000Z`
- **Timezone**: Always UTC (Z suffix)

## 6. Throttling Edge Cases

### Rapid Calls
- **Scenario**: Function called 10 times in 1 second
- **Behavior**: Only first call executes, others scheduled for retry
- **Retry**: All retries replaced, only last one executes

### Force Override
- **Parameter**: `force = true`
- **Behavior**: Bypasses all throttle checks
- **Use case**: Socket.IO triggered updates

### Concurrent Keys
- **Scenario**: `fetch('uas')` and `fetch('plans')` called simultaneously
- **Behavior**: Both execute (different keys)
- **Isolation**: Each key has independent throttle

### Error Recovery
- **Scenario**: Fetch throws error
- **Behavior**: Automatic retry after 5 seconds
- **Recursion**: Uses same throttle logic

## 7 Data Cleanup Edge Cases

### Alert Timestamp

**Timestamp**: Unix milliseconds
- `createdAt = 1000000`
- `now = 3601000`
- `age = 2601000ms = 43.35 minutes`
- **Result**: Kept (< 1 hour)

**Boundary**:
- `age = 3600000ms = exactly 1 hour`
- **Comparison**: `createdAt > now - 3600000`
- **Result**: `false`, removed

### Telemetry Timestamp

**Boundary**:
- `age = 60000ms = exactly 1 minute`
- **Comparison**: `createdAt > now - 60000`
- **Result**: `false`, removed

### Missing Timestamp
- **Check**: No validation
- **Behavior**: `undefined > number` is `false`
- **Result**: Removed (edge case bug in original?)

## 8. Coordinate Precision Edge Cases

### Decimal Places

**Storage**: Full double precision (15-17 digits)
**Display**: Typically 6 decimal places (~0.1m precision)
**GeoJSON**: No precision loss in JSON.stringify

### Coordinate Order

**Correct**: `[longitude, latitude]` or `[lng, lat]`
**Common mistake**: `[lat, lng]`
**Validation**: None in current implementation

### Invalid Ranges

**Longitude**:
- Valid: `[-180, 180]`
- Values outside normalized by `normalizeLongitude()`

**Latitude**:
- Valid: `[-90, 90]`
- **No validation** in current code
- `turf.point([0, 100])` → Valid Turf point, invalid geography

## 9. Buffer Conversion Edge Cases

## 12. Micro-Logic & UI Edge Cases

### Self-Intersecting Polygon
- **Trigger**: Moving a vertex such that the polygon crosses itself.
- **Handling**: 
    1. Detection via `turf.kinks`.
    2. Revert vertex to previous valid coordinate.
    3. Block submission with `draw.error.intersectingPolygon`.

### Altitude Clamping/Snapping
- **Input**: 45 meters
- **Behavior**: Snaps to `50` (closest in `[10, 30, 50, 80, 100]`).
- **Input**: 120 meters
- **Behavior**: Snaps to `100` (max threshold).

### Midpoint-to-Vertex Transition
- **Action**: Clicking a midpoint handle.
- **State Change**: `currentDrawing` array size increases by 1.
- **Edge Case**: If segment is extremely short, the new point might effectively overlap the old one.

### Activation Window (Time Gating)
- **Constraint**: `leadTimeToStart <= MAX_ACTIVATION_LEAD_TIME`.
- **Edge Case**: If mission starts in 61 minutes and limit is 60, button remains invisible until exactly 60m mark.

### Speed at Rest
- **Telemetry**: Speed `0`.
- **Display**: Output `0 km/h` (no special "at rest" string).

### Bearing at North
- **Input**: `360` degrees.
- **Handling**: `360 % 360 = 0`.
- **Output**: `000°` (padded to 3 digits).

## 10. MapLibre Rendering Edge Cases

### Layer Order
- **Rule**: Layers render in order added
- **Later layers**: Draw on top of earlier layers
- **Cannot**: Reorder without removing and re-adding

### Filter Evaluation
- **Timing**: Per-feature, per-frame
- **Performance**: Cached by MapLibre
- **Update**: Changing filter triggers re-render

### Source setData()
- **Behavior**: Replaces entire dataset
- **Partial updates**: Not supported, must replace all
- **Performance**: Efficient internal diffing

### Hidden Property
- **Check**: `['==', 'hidden', true]` in filter
- **Value types**: `true` vs `1` vs `'true'`
- **Strict**: Uses `===` comparison

## 11. Animation Batching Edge Cases

### Multiple Calls in Same Frame
- **Scenario**: `update('telemetry')` called 10 times in 10ms
- **Behavior**: Only ONE requestAnimationFrame scheduled
- **Result**: Last callback wins

### Cancel Before Execute
- **Scenario**: `cancel()` called before frame fires
- **Behavior**: `cancelAnimationFrame()` prevents execution
- **State**: Key deleted from pending map

## Summary Table

| Edge Case Category | Count | Critical? |
|-------------------|-------|-----------|
| Route Area | 4 | ⭐⭐⭐ |
| Intersection | 4 | ⭐⭐ |
| Sorting | 4 | ⭐⭐ |
| Validation | 12 | ⭐⭐⭐ |
| Time Handling | 6 | ⭐⭐ |
| Throttling | 4 | ⭐⭐⭐ |
| Data Cleanup | 3 | ⭐ |
| Coordinates | 5 | ⭐ |
| Buffer Conversion | 4 | ⭐⭐⭐ |
| Rendering | 4 | ⭐⭐ |
| Animation | 2 | ⭐ |

## 13. Advanced State & Conflict Edge Cases

### Authorization Revocation
- **Trigger**: Closure reason `REVOKED`.
- **Handling**: The mission is forcefully terminated mid-flight.
- **Edge Case**: If telemetry is still received after revocation, the system typically ignores it or moves the aircraft to a "Zombie" state.

### Authorized but not Activated
- **Scenario**: State is `AUTHORIZED`, but mission never moves to `TAKEOFFREQUESTED`.
- **Outcome**: Plan eventually moves to `CLOSED` with `TIMEOUT` closure reason.

### Overlapping Takeoff Requests
- **Scenario**: Two plans for the same pilot/aircraft in `TAKEOFFREQUESTED` simultaneously.
- **Handling**: The first request typically invalidates the timing of the second, leading to a `PROPOSED` state conflict check.

### Conflicting Authority Requirements
- **Scenario**: Conflict type `AUTHORITY_REQUIREMENTS`.
- **Outcome**: Even if spatial intersection is allowed, the mission cannot proceed without manual system-override or external approval flag.

---

## 14. Surgical Parsing & Schema Drift Edge Cases

### Millisecond Sensitivity
- **Scenario**: Date string `2023-10-27T10:00:00.000Z` sent to backend.
- **Handling**: Production logic removes `.000`.
- **Edge Case**: If the backend requires exact matching and the frontend doesn't strip it, the request may fail or return 400.

### OPv3 Payload Drift
- **Scenario**: `OPv3` environment flag is active, but code sends `phone` string instead of `phones` array.
- **Handling**: System must normalize payload type before submission.
- **Edge Case**: If normalized incorrectly, the backend may reject the plan with "Invalid Contact Info" error.

### Operator Rank Ambiguity
- **Scenario**: User is member of a company but has no company registration number.
- **Handling**: Priority drops from `company.registrationNumber` to `user.email`.
- **Edge Case**: If neither exists (unauthenticated profile), the submission is blocked.

### Unit Mixing
- **Scenario**: Import KML with altitudes in `FT` but slider set to `M`.
- **Handling**: System converts to meters internally, then snaps to nearest regulatory threshold.
- **Edge Case**: Rounding errors during `FT` -> `M` conversion might cause snapping to shift by one threshold (e.g., 30m instead of 33m/100ft).
