# Contracts

## Entry Points

### Data Fetching
- `fetchUAS(options?: UASFetchOptions): Promise<UASGeoJSON>`
  - Builds UAS GeoJSON URL from `window.ENV.HOST` (fallback to `https://utm.eans.ee/avm/`).
  - Optional time-window query string when `options.browseTime` is provided.
- `createUASSource(baseUrl?: string): object`
- `updateUASSource(map, geoJsonData): void`

### Route Area & Geometry
- `createRouteArea(drawingPoints, drawingMode, bufferMeters): Feature | FeatureCollection`
- `calculateMidpoints(drawingPoints): [lng, lat][]`
- `createRouteAreaWithMidpoints(state): { routeArea, midpoints, coordinates, mode, bufferMeters }`

### Intersection Filtering
- `getIntersectingZones(routeArea, uasGeoJson): Feature[]`
- `findZonesAtPoint(lngLat, uasData): Feature[]`
- `hasSelfIntersection(geometry): boolean`

### Sorting & Prioritization
- `sortFeatures(features): void` (in-place)

### Validation & Normalization
- `validatePhone(phone): boolean`
- `normalizeLongitude(lng): number`
- `snapAltitude(altitude): number`
- `metersToFeet(meters): number`
- `feetToMeters(feet): number`
- `sanitizePilotName(name): string`
- `normalizePayload(data, isV3 = true): any`
- `sanitizeColor(color): string`
- `formatHSLWithInversion(h, s, l, isDarkTheme = true): string`
- `bilinearInterpolateLightness(u, l): number`
- `validatePolygonSafety(coords): boolean` (may throw on malformed input)
- `validateOperationPlan(plan, env): string[]`
- `buildTimeWindowUrl(baseUrl, startTime, endTime, bufferMinutes = 60): string`
- `cleanupAlerts(alerts): alerts`
- `cleanupTelemetry(telemetry): telemetry`
- `anonymizeUserId(userId): Promise<string>`

### Operation Plan Status
- `isCompleted(plan): boolean`
- `isRejected(plan): boolean`
- `isCancelled(plan): boolean`
- `isActive(plan): boolean`
- `isPending(plan): boolean`
- `getComputedStatus(plan): ComputedOperationPlanStatus`
- `shouldTranslateError(errorMessage): string | null`

### Color & Styling Utilities
- `getRestrictionColor(restriction): string`
- `getColorScheme(theme = 'default'): Record<RestrictionType, string>`

### Formatting & Identifiers
- `normalizeCyclic(val, limit): number`
- `wrapLongitude(lng): number`
- `normalizeCoordinates(coord): { lat; lng }`
- `formatCoordinate(value): string`
- `formatISODate(date): string`
- `snapToRegulatoryAltitude(h): number`
- `generatePlatformUUID(): string`
- `formatBearing(bearing): string`
- `mpsToKmh(mps): number`
- `formatSpeed(mps): string`
- `sanitizeColorCode(colorCode): string`
- `sanitizeAltitudeString(altitude): string`
- `normalizePilotName(lastName): string`
- `formatDate(date): string`
- `formatDateISO(date): string`
- `generateUUID(): string`
- `generateUUIDv1(): string`
- `generateSessionID(): string`
- `clampBuffer(buffer): number`

### Telemetry & Alerts
- `parseTelemetryArray(data): TelemetryData`
- `parseAlertArray(data): AlertData`
- `telemetryToGeoJSON(data): Feature`
- `loadIcon(id): void`

### State Management
- `StorageKeys` enum
- `DEFAULT_HEADERS` constant
- `ThrottledFetcher` class
- `TimeSync` class
- `PollingManager` class
- `AnimationBatcher` class
- `initializeApplication(): Promise<void>`

## Inputs / Outputs (Constraints Summary)
- **Drawing points**: Array of `[lng, lat]` numbers. Empty arrays are allowed.
- **Drawing mode**: `point | line | polygon`.
- **Buffer meters**: numeric, interpreted as meters and converted to kilometers for Turf buffers.
- **UAS GeoJSON**: `FeatureCollection` with `Polygon`/`MultiPolygon` geometries and required `restriction`, `lowerMeters`, `upperMeters` properties.
- **Operation plan**: Requires names, phone, mtom, altitude, and time window fields.
- **Color schemes**: Restriction-to-color mappings derived from `COLORS` or `AUSTROCONTROL_COLORS`.

## Error Taxonomy
- **Network/HTTP errors**: `fetchUAS` throws if `fetch` fails or response is not `ok`.
- **Geometry errors**:
  - `getIntersectingZones` catches union/intersection errors and skips failed pieces.
  - `findZonesAtPoint` catches point-in-polygon errors and treats as non-match.
  - `validatePolygonSafety` may throw if Turf cannot build a polygon from malformed coordinates.
- **Validation errors**: `validateOperationPlan` returns translated error keys (strings) for each violated rule; it does **not** throw.

## Side Effects & Ordering Guarantees
- `fetchUAS` performs network I/O and logs to console on error.
- `getIntersectingZones` logs console errors for failed intersections.
- `validatePolygonSafety` logs the intersecting polygon key when kinks are detected.
- `updateUASSource` (if used) mutates a MapLibre source via `setData`.
- `sortFeatures` is a multi-pass sort (stable-sort dependency); the order of passes is part of the observable behavior.
