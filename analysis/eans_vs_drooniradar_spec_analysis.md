# EANS vs. drooniradar implementation analysis (spec-driven)

## Sources reviewed

- EANS `P2_spec` documents: scope, contracts, data model, rules, state machine, invariants.
- drooniradar `Radar_spec` documents: scope, contracts, data model, rules, state machine, invariants.

This analysis enumerates similarities and differences strictly based on those spec folders.

## High-level similarities

1. **GeoJSON-centric inputs and coordinate assumptions**
   - Both implementations operate on GeoJSON `Feature` inputs with `Polygon`/`MultiPolygon` geometries.
   - Both explicitly treat coordinates as `[lng, lat]` and do not perform coordinate reordering/transforms.

2. **Restriction classification and styling hooks**
   - Both define a restriction concept that drives styling/color mappings.
   - Both specifications treat restriction fields as canonical inputs for map layer styling.

3. **Pure/predictable function behavior for core checks**
   - Both specs document deterministic decision tables and invariants for core logic (e.g., geometry checks, restriction mappings, filtering rules).

4. **Explicit rule ordering and precedence**
   - Both specs capture precedence rules (e.g., EANS sorting passes; drooniradar restriction derivation overrides).

## Key differences

### 1. Problem domain and scope

- **Common baseline**: Both implementations ingest **restricted area data** (airspace/zone GeoJSON) from authoritative sources and process it for **polygon visualization**. They share the expectation of polygonal zones and restriction-based styling.
- **EANS** extends this with **UTM client logic**: fetching UAS zones, generating buffered route areas from user drawings, intersection filtering, sorting/prioritization, validation/normalization utilities, operation plan status derivation, telemetry parsing, and map-layer constants.
- **drooniradar** extends this with **NOTAM acquisition and Air Zone evaluation**: multi-source polling schedules, parsing/validation/enrichment pipelines, AirZone abstraction, restriction derivation, localized messages, point-in-geometry checks, violation detection, and a unified airspace schema transformation.

**Implication**: Both systems start from the same restricted-area polygon data and converge on visualization, but they diverge on **what they do next**—EANS adds route-planning and operational-plan UX, while drooniradar adds acquisition pipelines and position-violation checks.

### 2. Entry points and core capabilities

- **EANS entry points** include route-area construction (`createRouteArea`, `calculateMidpoints`), intersection filtering (`getIntersectingZones`, `findZonesAtPoint`), sorting (`sortFeatures`), extensive validation/normalization utilities, operation plan status classifiers, and client-side polling/state management.
- **drooniradar entry points** include acquisition (`acquireNotams`, `scheduleAcquisition`), parsing/enrichment (`parseNotamPayload`, `enrichNotamRecord`), AirZone accessors and checks (`AirZone`, `checkViolation`), geometry tests (`isPointInPolygon`, `isPointInFeature`), styling (`getAirZoneStyle`), filtering (`prepareAirZones`), and transformation to unified schema (`transformFeature`).

**Implication**: EANS exposes many client UX/data utilities; drooniradar exposes a pipeline for external source ingestion and transformation plus a runtime violation check.

### 3. Data model differences

- **EANS UAS features** include `restriction` values of `NO_RESTRICTION`, `CONDITIONAL`, `REQ_AUTHORISATION`, `PROHIBITED`, along with `lowerMeters` and `upperMeters`, plus optional `hidden` and `_rejecting` flags used for filtering and priority.
- **drooniradar AirZone properties** include `restriction`, `reason`, `lower`, `upper`, `name`, `identifier`, and `localizedMessages`. Restriction is **derived** via `reason` and only maps to `NO_RESTRICTION`, `REQ_AUTHORISATION`, or `PROHIBITED`.
- **EANS** has extensive models for operation plan validation, telemetry data, and formatting constants; **drooniradar** includes NOTAM record structures and acquisition metadata.

**Implication**: EANS models are tailored to operational planning and map UX; drooniradar models are tailored to airspace notice ingestion and message/violation reporting.

### 4. Geometry and spatial logic

- **Common baseline**: Both treat restricted zones as polygons and rely on geometric containment/intersection logic to drive visualization decisions.
- **EANS** uses Turf-based buffering, union, and intersects logic to generate and filter by **route areas** derived from user drawings (point/line/polygon). It also checks self-intersections and uses multi-pass sorting to prioritize zones.
- **drooniradar** uses point-in-polygon tests to determine whether a **single position** is inside a zone, then checks altitude range to decide whether a violation exists.

**Implication**: EANS is optimized for corridor/area intersection and prioritization, while drooniradar is optimized for direct point containment and altitude violation checks.

### 5. Validation and normalization behavior

- **EANS** provides rich validation and normalization (phones, longitude wrap, altitude snapping, payload normalization, time window calculations, pilot name sanitization) plus cleanup logic for telemetry/alerts.
- **drooniradar** focuses on normalization of restriction via `reason` and parsing altitude values (`parseAlt`) for transformation, but otherwise defaults missing values without extensive input validation.

**Implication**: EANS emphasizes user input validation and downstream UX safety, while drooniradar emphasizes normalization of external data for a consistent schema.

### 6. State machines and system lifecycle

- **EANS** treats the system as largely stateless; the only explicit lifecycle is operation plan status derived from backend fields (completed/rejected/cancelled/active/pending).
- **drooniradar** defines a stateful acquisition pipeline with scheduling, fetching, validating, publishing, retry, and emergency boost states.

**Implication**: EANS state logic is derived from external operation plan state; drooniradar has an explicit multi-stage pipeline with retries and emergency modes.

### 7. Styling and visualization

- **EANS** defines MapLibre-oriented styling: color schemes, match expressions, opacity rules for hidden features, and a full layer stack.
- **drooniradar** defines Leaflet-style feature styling with fixed base style plus simple color mapping by restriction.

**Implication**: EANS is tightly bound to MapLibre layer config; drooniradar is renderer-agnostic aside from Leaflet-style properties.

## Notable overlaps (but not identical behavior)

- **Restriction handling**
  - Both rely on `restriction` as a core classification and map it to colors/priority.
  - EANS additionally supports `CONDITIONAL` and `_rejecting` priority, while drooniradar uses `reason`-based override rules and maps to a numeric `restrictionLevel`.

- **Feature filtering**
  - EANS filters hidden features only in point hit-testing; its intersection filtering does not apply hidden filtering.
  - drooniradar filters out specific identifiers (`EERZout`, `EYVLOUT`) via `prepareAirZones`.

## Summary of alignment opportunities

- If aligning implementations, the primary intersection is the **shared restricted-area polygon pipeline**: ingest authoritative zone GeoJSON, normalize restriction metadata, and visualize polygons with restriction-based styling.
- Beyond that shared pipeline, the systems diverge in **post-ingestion responsibilities**: EANS emphasizes route-area generation and operational planning UX, while drooniradar emphasizes acquisition pipelines and position-violation checks.
