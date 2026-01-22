# UAS Intersection & Conflict Logic Deep-Dive

This document catalogs the exact logic and nuances of how UTM EANS handles intersections between flight paths and restricted zones.

## The Intersection Pipeline

The client-side intersection check is primarily for **UI feedback** and **zone highlighting**. Official conflicts are always returned by the server.

### 1. Geometry Unification
When a route is drawn (especially in `line` mode, which generates multiple segments), the system first unifies these into a single geometry to optimize the intersection check.

```javascript
// EXACT logic from getPlanFeatures
var unified = routeArea.features[0];
for (var i = 1; i < routeArea.features.length; i++) {
  unified = turf.union(turf.featureCollection([unified, routeArea.features[i]]));
}
```

### 2. Spatial Filtering
The client filters the global `uasData` set using `turf.booleanIntersects`. 
> [!IMPORTANT]
> **No Altitude Filtering**: On the client, `getPlanFeatures` performs a purely 2D spatial intersection. It does NOT check if the plan's `maxAltitude` is within the zone's `lowerMeters`/`upperMeters`. This refinement is handled by the server's deconfliction endpoint.

## Priority & Sorting Hierarchy

The application uses a **4-pass hierarchical sort** to determine which features appear on top (both in the map rendering and lists).

| Pass | Criteria | Logic | Priority |
| :--- | :--- | :--- | :--- |
| **1** | **Altitude** | `lowerMeters` first | Lower = Higher Priority |
| **2** | **Restriction** | `PROHIBITED` > `REQ_AUTH` | High Severity = Higher Priority |
| **3** | **Source** | `coordinate` > `operationplan` | Manual Pin = Higher Priority |
| **4** | **Op State** | `ACTIVATED` > `TAKEOFFREQUESTED` | Active Flight = Higher Priority |

### Restriction Ranking
The system assigns numerical weights for the second pass:
- `PROHIBITED`: 3
- `REQ_AUTHORISATION`: 2
- `CONDITIONAL`: 1
- `NO_RESTRICTION`: 0
- `_rejecting`: 3 (Overrides any other restriction)

## Conflict Object Schema
When retrieved from `/utm/operationplan/deconflict`, the conflict object contains:
- `conflictType`: `TEXTUAL_RESTRICTION`, `AUTHORITY_REQUIREMENTS`, `SPATIAL_VIOLATION`.
- `message`: Human-readable localized string.
- `objectId`: The UUID of the zone or plan causing the conflict.
- `objectType`: `UAS_ZONE` or `OPERATION_PLAN`.

## Invisible Nuance: Point Buffering
For "Point" operations (e.g., a simple drone hover), the system applies a **50m buffer** (default) to create a circular polygon before running intersections. This ensures that even a static point has a protected volume.
