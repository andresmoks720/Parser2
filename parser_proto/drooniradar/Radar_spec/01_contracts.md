# Contracts

## Entry Points

### `acquireNotams(sourceConfig)`
- **Purpose**: Fetch NOTAM data from a configured authority source.
- **Input**: `sourceConfig` (object; includes source type, access method, auth, and polling schedule).
- **Output**: Raw NOTAM payloads plus acquisition metadata.

### `scheduleAcquisition(sourceType)`
- **Purpose**: Determine polling cadence and retry behavior per source type.
- **Input**: `sourceType` (enum: `ICAO_GLOBAL`, `NATIONAL_AUTHORITY`, `MILITARY_EXERCISES`, `EMERGENCY_NOTICES`, `FACILITY_CHANGES`, `WEATHER_HAZARDS`).
- **Output**: `{ frequency, priority, retryPolicy }` configuration object.

### `parseNotamPayload(rawPayload)`
- **Purpose**: Detect format, extract fields, validate structure, and enrich content.
- **Input**: Raw NOTAM payload (string/object depending on source).
- **Output**: Structured NOTAM record or validation errors.

### `enrichNotamRecord(record)`
- **Purpose**: Apply geographic assignments, visual styling, priority, and cross-references.
- **Input**: Structured NOTAM record.
- **Output**: Enhanced record ready for transformation and map integration.

### `publishNotamUpdate(recordBatch)`
- **Purpose**: Distribute validated/enhanced NOTAM data to downstream consumers.
- **Input**: Array of enhanced NOTAM records.
- **Output**: Acknowledgement of distribution to clients/subsystems.

### `AirZone(feature)`
- **Purpose**: Provides normalized accessors for a GeoJSON Feature’s restriction and metadata.
- **Input**: `feature` (object; GeoJSON Feature with `properties` and `geometry`).
- **Output**: An AirZone instance exposing getters described in the data model.

### `AirZone.getLocalisedMessage(lang)`
- **Input**: `lang` (string language code, e.g., `"et"`, `"en"`; may be null/undefined).
- **Output**: Message string or `null`.
- **Behavior**: Returns localized message if present, otherwise falls back to `properties.message`, otherwise `null`.

### `AirZone.checkViolation(pos)`
- **Input**: `pos` object `{ lat: number, lng: number, alt: number }`.
- **Output**: Violation object or `null`.
- **Side Effects**: None.

### `isPointInPolygon(point, polygon)`
- **Input**: `point` = `[lng, lat]` array of numbers.
- **Input**: `polygon` = array of `[lng, lat]` points forming a ring.
- **Output**: boolean.

### `isPointInFeature(point, feature)`
- **Input**: `point` = `[lng, lat]` array of numbers.
- **Input**: `feature` = GeoJSON Feature (Polygon or MultiPolygon).
- **Output**: boolean.

### `getAirZoneStyle(feature)`
- **Input**: `feature` (GeoJSON Feature).
- **Output**: Leaflet-style object `{ fillOpacity, color, weight, opacity, className }`.

### `prepareAirZones(data)`
- **Input**: `data` = GeoJSON FeatureCollection.
- **Output**: FeatureCollection with filtered features.

### `transformFeature(rawFeature)`
- **Input**: `rawFeature` = GeoJSON Feature.
- **Output**: Unified Airspace Schema Feature (normalized `properties` fields).

## Inputs/Outputs and Constraints

- **Acquisition sources** must be registered with access method and credential requirements before scheduling; each source type has a configured frequency and retry policy.
- **Credential handling** must support multiple authentication methods per authority (OAuth tokens, API keys, MFA, email-based renewals) with fallback to backup credentials when the primary method fails.
- **Raw payload formats** vary per authority; parsing must first detect format before extraction.
- **GeoJSON Feature** must contain `geometry.type` of `Polygon` or `MultiPolygon` to be spatially testable; other types return `false` from `isPointInFeature`.
- **FeatureCollection** is expected to have a `features` array; missing arrays are treated as empty.
- **Altitude fields**
  - `lower`: string or null; default `"AGL"`.
  - `upper`: string or null; default `null`.
  - `pos.alt`: numeric altitude used for comparisons (assumed same reference as parsed limits).
- **Coordinate order**: All geometry checks assume `[lng, lat]` ordering as used by GeoJSON. No validation or reordering occurs in Phase 1 logic.
- **Ring structure**: Polygon coordinates are treated as `[exterior, ...holes]`. No explicit ring-closure validation is performed.

## Error Taxonomy
No explicit exceptions are thrown in the Phase 1 logic. Error cases are represented by:
- `null` return values for missing or unmatched data (e.g., `checkViolation`, `getLocalisedMessage`).
- `false` returns for invalid geometry or point containment checks.
- Fallback defaults for missing properties (e.g., restriction default, lower/upper defaults).

## Side Effects & Ordering Guarantees
- All functions are pure relative to inputs (no persistent side effects).
- Ordering of `prepareAirZones` preserves original feature order except for excluded identifiers.
