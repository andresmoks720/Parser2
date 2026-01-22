Feature: UTM EANS parsing logic examples

  # Route area generation
  Scenario: Empty drawing produces empty route area (EX-RA-EMPTY)
    Given drawingPoints is empty
    When createRouteArea is executed
    Then an empty FeatureCollection is returned

  Scenario: Single point buffers into a circle (EX-RA-SINGLE)
    Given drawingPoints contains one [lng, lat]
    When createRouteArea is executed with any buffer
    Then a buffered Point is returned using bufferMeters/1000

  Scenario: Polygon auto-close before buffer (EX-RA-POLY-CLOSE)
    Given drawingMode is polygon and there are more than two points
    When createRouteArea is executed
    Then the first point is appended to close the polygon before buffering

  Scenario: Line mode splits into segments (EX-RA-LINE-SPLIT)
    Given drawingMode is line with multiple points
    When createRouteArea is executed
    Then each adjacent point pair becomes a LineString segment that is buffered

  Scenario: Fallback uses LineString buffer (EX-RA-FALLBACK)
    Given drawingMode is not point, line, or polygon
    When createRouteArea is executed with multiple points
    Then a single LineString is buffered using bufferMeters/1000

  Scenario: Midpoints are generated for adjacent pairs (EX-MIDPOINTS-PAIR)
    Given drawingPoints has at least two points
    When calculateMidpoints is executed
    Then a midpoint is created for each adjacent pair

  # Intersection filtering
  Scenario: Empty route area returns no intersections (EX-INT-EMPTY-ROUTE)
    Given routeArea has zero features
    When getIntersectingZones is executed
    Then an empty list is returned

  Scenario: Hidden features are skipped in point hit-testing (EX-INT-HIDDEN)
    Given a feature has properties.hidden = true
    When findZonesAtPoint is executed
    Then that feature is excluded from results

  Scenario: Hidden features are not filtered during intersection (EX-INT-NO-HIDDEN-FILTER)
    Given a feature has properties.hidden = true
    When getIntersectingZones is executed
    Then the feature is still eligible for intersection checks

  Scenario: Invalid geometry during intersection is ignored (EX-INT-INVALID-GEOM)
    Given booleanIntersects throws for a feature
    When getIntersectingZones is executed
    Then the feature is treated as non-intersecting and processing continues

  Scenario: Union failures are skipped (EX-INT-UNION-FAIL)
    Given union fails while unifying routeArea features
    When getIntersectingZones is executed
    Then the failure is ignored and remaining features still process

  # Fetching & URL construction
  Scenario: Fetch uses base URL when browsing is disabled (EX-FETCH-BASE)
    Given browseTime is undefined
    When fetchUAS builds the URL
    Then the URL is HOST + "utm/uas.geojson"

  Scenario: Fetch adds browse query params (EX-FETCH-BROWSE)
    Given browseTime is set and browseBuffer is provided
    When fetchUAS builds the URL
    Then the URL includes start/end ISO strings and buffer minutes

  Scenario: Fetch throws on HTTP error (EX-FETCH-HTTP-ERROR)
    Given the HTTP response is not ok
    When fetchUAS is executed
    Then an error is thrown with the response status

  Scenario: Fetch logs and rethrows on failure (EX-FETCH-ERROR)
    Given fetch rejects or JSON parsing fails
    When fetchUAS is executed
    Then the error is logged and rethrown

  # Map source configuration
  Scenario: UAS source uses default base URL (EX-SOURCE-DEFAULT)
    Given createUASSource is called without baseUrl
    When the source configuration is created
    Then the base URL defaults to https://utm.eans.ee/avm/

  Scenario: UAS source uses provided base URL (EX-SOURCE-OVERRIDE)
    Given createUASSource is called with a baseUrl
    When the source configuration is created
    Then the base URL matches the provided value

  Scenario: UAS source updates when present (EX-SOURCE-UPDATE)
    Given a MapLibre map has a uas source
    When updateUASSource is executed
    Then setData is called with the provided GeoJSON

  Scenario: UAS source update is a no-op when missing (EX-SOURCE-NOOP)
    Given a MapLibre map has no uas source
    When updateUASSource is executed
    Then nothing happens

  # Unit conversion
  Scenario: Meters to feet conversion (EX-UNIT-M2FT)
    Given a meters value
    When metersToFeet is executed
    Then the result equals meters multiplied by 3.28084

  Scenario: Feet to meters conversion (EX-UNIT-FT2M)
    Given a feet value
    When feetToMeters is executed
    Then the result equals feet divided by 3.28084

  Scenario: Formatting meters to feet conversion (EX-FMT-M2FT)
    Given a meters value
    When formatting.metersToFeet is executed
    Then the result equals meters multiplied by 3.28084

  Scenario: Formatting feet to meters conversion rounds (EX-FMT-FT2M-ROUND)
    Given a feet value
    When formatting.feetToMeters is executed
    Then the result equals Math.round(feet * 0.3048)

  # Sorting
  Scenario: Equal altitude uses lower then upper meters (EX-SORT-ALTITUDE)
    Given two features with equal lowerMeters
    When sortFeatures is executed
    Then upperMeters is used as the secondary comparator

  Scenario: Unknown restriction types default to priority 0 (EX-SORT-UNKNOWN-RESTR)
    Given a feature has an unknown restriction type
    When sortFeatures is executed
    Then its restriction priority is treated as 0

  Scenario: Rejecting features take highest restriction priority (EX-SORT-REJECTING)
    Given a feature has properties._rejecting = true
    When sortFeatures is executed
    Then its restriction priority is treated as highest

  Scenario: Missing properties default to safe values (EX-SORT-MISSING-PROP)
    Given a feature has no properties object
    When sortFeatures is executed
    Then numeric fields default to 0 and sorting continues

  Scenario: Source priority influences sorting (EX-SORT-SOURCE)
    Given features from coordinate, operationplans, and weather-observations sources
    When sortFeatures is executed
    Then source priority orders coordinate above operationplans above weather-observations

  Scenario: Operation plan state priority influences sorting (EX-SORT-STATE)
    Given operationplan features with different states
    When sortFeatures is executed
    Then higher state priority sorts above lower state priority

  # Validation & normalization
  Scenario: Phone validation accepts digits and spaces with leading plus (EX-VAL-PHONE-VALID)
    Given a phone string in the valid set
    When validatePhone is executed
    Then it returns true

  Scenario: Phone validation rejects invalid characters (EX-VAL-PHONE-INVALID)
    Given a phone string with letters or invalid symbols
    When validatePhone is executed
    Then it returns false

  Scenario: Longitude normalization wraps values into range (EX-VAL-LON-NORM)
    Given a longitude outside [-180, 180]
    When normalizeLongitude is executed
    Then the result is within [-180, 180]

  Scenario: Negative MTOM is rejected (EX-VAL-MTOM-NEG)
    Given mtom < 0
    When validateOperationPlan is executed
    Then an mtom-negative error key is returned

  Scenario: Negative max altitude is rejected (EX-VAL-MAXALT-NEG)
    Given maxAltitude < 0
    When validateOperationPlan is executed
    Then a max-altitude-negative error key is returned

  Scenario: Time ordering violations return errors (EX-VAL-TIME-ORDER)
    Given startDatetime <= now or endDatetime <= startDatetime
    When validateOperationPlan is executed
    Then time-ordering error keys are returned

  Scenario: Duration below minimum is rejected (EX-VAL-DURATION-SHORT)
    Given a plan duration shorter than MIN_FLIGHT_DURATION
    When validateOperationPlan is executed
    Then the duration-too-short error key is returned

  Scenario: Duration above maximum is rejected (EX-VAL-DURATION-LONG)
    Given a plan duration longer than MAX_FLIGHT_DURATION
    When validateOperationPlan is executed
    Then the duration-too-long error key is returned

  Scenario: Authorization lead-time too short is rejected (EX-VAL-LEADTIME)
    Given requiresAuthorization is true and lead time is below the minimum
    When validateOperationPlan is executed
    Then the authorization-needed-start-time-too-soon error key is returned

  Scenario: Planning too far ahead is rejected (EX-VAL-PLAN-AHEAD)
    Given the start time is beyond MAX_PLANNING_AHEAD_DAYS
    When validateOperationPlan is executed
    Then the flight-plan-too-far-ahead error key is returned

  Scenario: Time window URL uses buffered ISO strings (EX-TIME-WINDOW) (EX-ISO-FORMAT)
    Given a start and end time with buffer minutes
    When buildTimeWindowUrl is executed
    Then the URL includes ISO start/end adjusted by buffer

  Scenario: Alert cleanup removes items older than 1 hour (EX-CLEANUP-ALERT-REMOVE)
    Given an alert with createdAt older than now - 3600000
    When cleanupAlerts is executed
    Then it is removed

  Scenario: Alert cleanup keeps items younger than 1 hour (EX-CLEANUP-ALERT-KEEP)
    Given an alert with createdAt newer than now - 3600000
    When cleanupAlerts is executed
    Then it is kept

  Scenario: Telemetry cleanup removes items older than 1 minute (EX-CLEANUP-TELEMETRY-REMOVE)
    Given telemetry with createdAt older than now - 60000
    When cleanupTelemetry is executed
    Then it is removed

  Scenario: Missing timestamps are treated as expired (EX-CLEANUP-MISSING)
    Given telemetry with missing createdAt
    When cleanupTelemetry is executed
    Then it is removed

  Scenario: Altitude snaps to nearest threshold (EX-ALTITUDE-SNAP-45)
    Given an altitude of 45 meters
    When snapAltitude is executed
    Then the result is 50

  # Operation plan computed status
  Scenario: Completed status with nominal closure (EX-OP-COMPLETED)
    Given an operation plan is CLOSED with closureReason NOMINAL
    When getComputedStatus is executed
    Then completed is true

  Scenario: Rejected status from conflicts or timeout (EX-OP-REJECTED)
    Given an operation plan is DENIED with conflicts or in TIMEOUT/ERROR
    When getComputedStatus is executed
    Then rejected is true

  Scenario: Cancelled status from closure reasons (EX-OP-CANCELLED)
    Given an operation plan closureReason is CANCELED or WITHDRAWN
    When getComputedStatus is executed
    Then cancelled is true

  Scenario: Active status (EX-OP-ACTIVE)
    Given an operation plan state is ACTIVATED
    When getComputedStatus is executed
    Then active is true

  Scenario: Pending status (EX-OP-PENDING)
    Given an operation plan state is PROPOSED or APPROVED
    When getComputedStatus is executed
    Then pending is true

  # Self-intersection detection
  Scenario: Self-intersection is detected (EX-SELF-INTERSECT)
    Given turf.kinks returns one or more features
    When hasSelfIntersection is executed
    Then the result is true

  Scenario: Self-intersection treats errors as true (EX-SELF-INTERSECT-ERROR)
    Given turf.kinks throws
    When hasSelfIntersection is executed
    Then the result is true

  Scenario: No self-intersection returns false (EX-SELF-INTERSECT-NONE)
    Given turf.kinks returns no features
    When hasSelfIntersection is executed
    Then the result is false

  # Normalization
  Scenario: Pilot name sanitization strips parentheses (EX-NAME-SANITIZE)
    Given a name includes parentheses metadata
    When sanitizePilotName is executed
    Then the portion before "(" is returned trimmed

  Scenario: Pilot name sanitization leaves plain names (EX-NAME-SANITIZE-NONE)
    Given a name does not include parentheses
    When sanitizePilotName is executed
    Then the name is returned trimmed

  Scenario: v3 payload normalization uses phones array (EX-PAYLOAD-V3)
    Given isV3 is true and phone is a string
    When normalizePayload is executed
    Then phones is an array and aircraftInfos is normalized

  Scenario: v2 payload normalization uses phone string (EX-PAYLOAD-V2)
    Given isV3 is false and phone is an array
    When normalizePayload is executed
    Then phone is a string and uasRegistrations is normalized

  # Polygon safety validation
  Scenario: Malformed polygon throws (EX-POLY-THROW)
    Given polygon coordinates are invalid for turf.polygon
    When validatePolygonSafety is executed
    Then the error is thrown

  Scenario: Self-intersecting polygon returns false (EX-POLY-KINKS)
    Given turf.kinks detects self-intersection
    When validatePolygonSafety is executed
    Then it returns false and logs the intersecting polygon key

  Scenario: Valid polygon returns true (EX-POLY-OK)
    Given turf.kinks detects no intersections
    When validatePolygonSafety is executed
    Then it returns true

  # Anonymization
  Scenario: User ID anonymization returns SHA-256 hex (EX-ANON-SHA256)
    Given a userId string
    When anonymizeUserId is executed
    Then a SHA-256 hex digest string is returned

  # Color & styling
  Scenario: Restriction color mapping (EX-COLOR-RESTRICTION)
    Given a restriction type
    When getRestrictionColor is executed
    Then the color matches the restriction mapping

  Scenario: Default color scheme selection (EX-COLOR-SCHEME-DEFAULT)
    Given theme is not austrocontrol
    When getColorScheme is executed
    Then COLORS mapping is used

  Scenario: Austrocontrol color scheme selection (EX-COLOR-SCHEME-AUSTRO)
    Given theme is austrocontrol
    When getColorScheme is executed
    Then AUSTROCONTROL_COLORS mapping is used

  Scenario: HSL inversion applied for dark theme (EX-COLOR-INVERT)
    Given an HSL color in a dark theme
    When getColorScheme is executed
    Then the lightness is inverted and spaces are removed

  Scenario: HSL inversion disabled for light theme (EX-COLOR-INVERT-OFF)
    Given an HSL color and theme is light
    When formatHSLWithInversion is executed
    Then the lightness remains unchanged

  Scenario: Color sanitization removes spaces (EX-COLOR-SANITIZE)
    Given a color string with spaces
    When sanitizeColor is executed
    Then all spaces are removed

  Scenario: Bilinear interpolation for low u (EX-COLOR-BILINEAR-LOW)
    Given u <= 0.5
    When bilinearInterpolateLightness is executed
    Then u * (l + 1) is returned

  Scenario: Bilinear interpolation for high u (EX-COLOR-BILINEAR-HIGH)
    Given u > 0.5
    When bilinearInterpolateLightness is executed
    Then u + l - u*l is returned

  Scenario: UAS low altitude fill layer (EX-LAYER-UAS-LOW)
    Given lowerMeters < 120
    When UAS layer filters are evaluated
    Then low-altitude fill layers apply

  Scenario: UAS high altitude fill layer (EX-LAYER-UAS-HIGH)
    Given lowerMeters >= 120
    When UAS layer filters are evaluated
    Then high-altitude fill layer applies with reduced opacity

  Scenario: Hidden features are transparent (EX-LAYER-HIDDEN)
    Given a feature has hidden = true
    When fill or line opacity expressions are evaluated
    Then opacity is 0

  Scenario: Becoming active uses dashed lines (EX-LAYER-BECOMING-ACTIVE)
    Given becomingActive = true
    When UAS lines becoming active layer is used
    Then the line dash array is [2, 3]

  Scenario: Labels include name and reason (EX-LAYER-LABELS)
    Given a UAS feature has name and reason
    When the UAS symbols layer is used
    Then the label text is \"{name} ({reason})\"

  Scenario: Full layer stack order is preserved (EX-LAYER-STACK)
    Given the map layer stack is built
    When FULL_LAYER_STACK is used
    Then layers are ordered from basemap to highlight-line

  Scenario: Fill color expression maps restriction (EX-STYLE-FILL-COLOR)
    Given a restriction value
    When FILL_COLOR_EXPRESSION is evaluated
    Then the fill color matches the restriction mapping

  Scenario: Line color expression maps restriction (EX-STYLE-LINE-COLOR)
    Given a restriction value
    When LINE_COLOR_EXPRESSION is evaluated
    Then the line color matches the restriction mapping

  Scenario: Fill opacity expression hides hidden features (EX-STYLE-FILL-OPACITY)
    Given hidden = true
    When FILL_OPACITY_EXPRESSION is evaluated
    Then opacity is 0

  Scenario: Line opacity expression hides hidden features (EX-STYLE-LINE-OPACITY)
    Given hidden = true
    When LINE_OPACITY_EXPRESSION is evaluated
    Then opacity is 0

  Scenario: Operation plans symbols layer labels (EX-LAYER-OPS-LABELS)
    Given an operation plan feature has name and state
    When OPERATION_PLANS_SYMBOLS_LAYER is used
    Then the label text is \"{name} ({state})\"

  Scenario: Telemetry symbols layer layout (EX-LAYER-TELEMETRY)
    Given a telemetry feature has name and label
    When TELEMETRY_SYMBOLS_LAYER is used
    Then icon overlap is allowed and label uses \"{name}\\n{label}\"

  Scenario: Icon scaling expression (EX-ICON-SCALING)
    Given zoom level values
    When ICON_SCALING_EXPRESSION is evaluated
    Then sizes interpolate from 0.1 at zoom 1 to 1.25 at zoom 7

  Scenario: Wind icon size constant (EX-WIND-ICON-SIZE)
    Given wind symbol rendering
    When WIND_ICON_SIZE is used
    Then the size is 0.675

  # Formatting utilities
  Scenario: Normalize cyclic values (EX-FMT-NORMALIZE-CYCLIC)
    Given a value and limit
    When normalizeCyclic is executed
    Then the result is within [0, limit)

  Scenario: Wrap longitude (EX-FMT-WRAP-LNG)
    Given a longitude outside [-180, 180]
    When wrapLongitude is executed
    Then the result is wrapped into [-180, 180]

  Scenario: Normalize coordinates ignores latitude clamp (EX-FMT-NORMALIZE-COORD)
    Given a coordinate with out-of-range latitude
    When normalizeCoordinates is executed
    Then only longitude is normalized

  Scenario: Format coordinate to 6 decimals (EX-FMT-COORD-6)
    Given a coordinate value
    When formatCoordinate is executed
    Then the output has 6 decimal places

  Scenario: Format ISO date trims milliseconds (EX-FMT-ISO-TRIM)
    Given a Date with .000 milliseconds
    When formatISODate is executed
    Then the .000 is removed

  Scenario: Format date in Estonian format (EX-FMT-DATE-EE)
    Given a Date value
    When formatDate is executed
    Then the output is DD.MM.YYYY HH:mm

  Scenario: Format date ISO (EX-FMT-DATE-ISO)
    Given a Date value
    When formatDateISO is executed
    Then the output is an ISO string

  Scenario: Snap to regulatory altitude (EX-FMT-SNAP-ALT)
    Given an altitude value
    When snapToRegulatoryAltitude is executed
    Then the nearest regulatory altitude is returned

  Scenario: Format bearing (EX-FMT-BEARING)
    Given a bearing value
    When formatBearing is executed
    Then the output is a 3-digit degree string

  Scenario: Convert m/s to km/h (EX-FMT-MPS-KMH)
    Given a speed in meters per second
    When mpsToKmh is executed
    Then the result is multiplied by 3.6

  Scenario: Format speed (EX-FMT-SPEED)
    Given a speed in meters per second
    When formatSpeed is executed
    Then the result is rounded km/h with units

  Scenario: Sanitize color code (EX-FMT-COLORCODE)
    Given a color string with spaces
    When sanitizeColorCode is executed
    Then spaces are removed

  Scenario: Sanitize altitude string (EX-FMT-ALT-STRING)
    Given an altitude string with M suffix
    When sanitizeAltitudeString is executed
    Then M is replaced with m

  Scenario: Normalize pilot name (EX-FMT-PILOT-NAME)
    Given a name with parentheses
    When normalizePilotName is executed
    Then parenthetical metadata is removed

  Scenario: Generate UUID v4 (EX-FMT-UUID)
    Given a UUID request
    When generateUUID is executed
    Then a UUID v4 string is returned

  Scenario: Generate platform UUID (EX-FMT-UUID-PLATFORM)
    Given a UUID request for platform
    When generatePlatformUUID is executed
    Then the UUID is prefixed with flyk-

  Scenario: Generate UUID v1 (EX-FMT-UUID-V1)
    Given a UUID v1 request
    When generateUUIDv1 is executed
    Then a time-based UUID string is returned

  Scenario: Generate session ID (EX-FMT-SESSION-ID)
    Given a session ID request
    When generateSessionID is executed
    Then the output is Date.now() plus a UUID v1

  Scenario: Clamp buffer values (EX-FMT-CLAMP-BUFFER)
    Given a buffer outside allowed limits
    When clampBuffer is executed
    Then the result is clamped between 0 and 2000

  Scenario: State transition delimiter constant (EX-FMT-STATE-DELIM)
    Given state transition formatting
    When STATE_TRANSITION_DELIMITER is used
    Then the delimiter is \" –> \"

  Scenario: Timing constants are fixed (EX-FMT-TIMING)
    Given timing constants
    When TIMING_CONSTANTS is read
    Then values match the documented milliseconds

  Scenario: Symbol scaling stops constant (EX-FMT-SYMBOL-STOPS)
    Given symbol scaling configuration
    When SYMBOL_SCALING.STOPS is read
    Then stops are [[1, 0.1], [7, 1.25]]

  # Telemetry & alerts
  Scenario: Parse telemetry positional array (EX-TEL-PARSE)
    Given a telemetry array of length 10
    When parseTelemetryArray is executed
    Then fields map by index without length checks

  Scenario: Parse alert positional array (EX-ALERT-PARSE)
    Given an alert array of length 9
    When parseAlertArray is executed
    Then fields map by index

  Scenario: Telemetry bearing uses velocity (EX-TEL-BEARING)
    Given telemetry with non-zero velocity
    When telemetryToGeoJSON is executed
    Then bearing is computed from displacement

  Scenario: Telemetry bearing zero when stationary (EX-TEL-BEARING-ZERO)
    Given telemetry with zero velocity
    When telemetryToGeoJSON is executed
    Then bearing is 0

  Scenario: Telemetry icon mapping (EX-TEL-ICON)
    Given telemetry icon values plane or emergency
    When telemetryToGeoJSON is executed
    Then the sprite is mapped or defaults to uas

  Scenario: Telemetry label formatting (EX-TEL-LABEL)
    Given telemetry bearing value
    When telemetryToGeoJSON is executed
    Then label is a padded degree string in parentheses

  Scenario: Telemetry staleness constant (EX-TEL-STALE)
    Given telemetry staleness rules
    When TELEMETRY_STALENESS_MS is read
    Then it equals 60000

  Scenario: Icon loading retries indefinitely (EX-ICON-RETRY)
    Given loadIcon receives a 404
    When loadIcon is executed
    Then it retries every 1000ms without a max

  # State management
  Scenario: Storage keys constants (EX-STATE-STORAGE)
    Given StorageKeys enum
    When values are read
    Then CAPACITOR_UID is _capuid and LANGUAGE is lang

  Scenario: Default headers include x-id (EX-STATE-HEADERS)
    Given DEFAULT_HEADERS
    When headers are built
    Then x-id is generateSessionID and Accept is application/json

  Scenario: Throttled fetcher enforces delay (EX-STATE-THROTTLE)
    Given two fetch calls within 5 seconds without force
    When ThrottledFetcher.fetch is executed
    Then the second is scheduled for retry

  Scenario: Throttled fetcher force bypass (EX-STATE-FORCE)
    Given a forced fetch
    When ThrottledFetcher.fetch is executed
    Then throttle checks are bypassed

  Scenario: Throttled fetcher retries on error (EX-STATE-RETRY)
    Given a fetch function throws
    When ThrottledFetcher.fetch is executed
    Then a generic error is logged and retry scheduled

  Scenario: Time sync offset calculation (EX-STATE-TIMESYNC)
    Given server time and client time
    When TimeSync.fetchServerTime is executed
    Then serverOffset is set to serverTime - clientTime

  Scenario: Duration calculation allows NaN (EX-STATE-DURATION)
    Given invalid start or end dates
    When TimeSync.calculateDuration is executed
    Then NaN can be returned

  Scenario: Auto sync scheduling (EX-STATE-AUTOSYNC)
    Given TimeSync.startAutoSync is called
    When the interval is set
    Then an immediate sync and 300000ms interval occur by default

  Scenario: Polling manager starts polling (EX-STATE-POLL)
    Given a polling key and fetch function
    When PollingManager.startPolling is executed
    Then it fetches immediately and repeats every 60000ms

  Scenario: Polling manager stopAll (EX-STATE-STOPALL)
    Given active pollers
    When PollingManager.stopAll is executed
    Then intervals and pending timeouts are cleared

  Scenario: Animation batcher dedupes updates (EX-STATE-ANIM)
    Given multiple updates with the same key
    When AnimationBatcher.update is executed
    Then only one animation frame is scheduled

  Scenario: Animation batcher cancels updates (EX-STATE-ANIM-CANCEL)
    Given a pending animation update
    When AnimationBatcher.cancel is executed
    Then the pending frame is cancelled

  Scenario: Initialization continues without user (EX-STATE-AUTHSTALL)
    Given auth initialization fails
    When initializeApplication is executed
    Then initialization continues with a null user warning
