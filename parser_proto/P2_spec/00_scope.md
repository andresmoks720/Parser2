# Scope

## Purpose
Define a single, implementable specification (“logic IR”) for the UTM EANS parsing logic reconstructed in Phase 1, covering data fetching, route-area generation, intersection filtering, sorting/prioritization, validation/normalization, and operation-plan status derivation.

## In Scope
- UAS zone fetch URL construction and response handling.
- Route area generation (point/line/polygon) and midpoint calculation.
- Spatial intersection filtering and point hit-testing.
- Sorting/prioritization of UAS features.
- Validation and normalization utilities (phone, longitude, altitude snapping, payload normalization, time windows, cleanup).
- Operation-plan computed status classification and error-translation mapping.
- Color/theme mapping and MapLibre layer configuration constants used for UAS visualization.
- Formatting utilities, telemetry/alert parsing, and client-side state-management helpers (throttling, polling, time sync, animation batching).

## Out of Scope
- UI rendering and event wiring beyond the documented layer/config constants.
- Authentication, Keycloak, and whitelabel theming.
- Server-side altitude conflict logic (explicitly handled server-side).
- Throttling/event-loop batching implementations not described in Phase 1 artifacts.

## Assumptions
- GeoJSON coordinates are in WGS84 (EPSG:4326) and ordered as `[lng, lat]`.
- Turf.js operations are available and behave per upstream library semantics.
- Network requests use browser `fetch` and return JSON FeatureCollections.
- Example IDs referenced below map to Phase 1 observations (docs/code) and are the sole source of behavioral claims.

## Terminology (Canonical Vocabulary)
- **UAS GeoJSON**: A GeoJSON `FeatureCollection` of UAS zones.
- **UAS Feature**: A GeoJSON `Feature` within UAS GeoJSON with `properties` including `restriction` and altitude bounds.
- **Drawing points**: Array of `[lng, lat]` coordinates representing user input.
- **Route area**: The buffered geometry derived from drawing points.
- **Drawing mode**: One of `point | line | polygon` determining route-area generation.
- **Intersection filter**: The process of selecting UAS features that intersect the route area.
- **Computed status**: Derived booleans (`completed`, `cancelled`, `rejected`, `active`, `pending`) for an operation plan.

> **Synonym ban**: Use only the terms above (e.g., “route area” instead of “flight corridor” or “buffered path”).
