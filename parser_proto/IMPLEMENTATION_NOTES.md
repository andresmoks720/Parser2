/**
 * Implementation Notes - Critical Details from utm.eans.ee
 * 
 * This document contains CRITICAL implementation details that must be followed
 * exactly to ensure compatibility with the official EANS data.
 */

## 1. Buffer Conversion (CRITICAL!)

The most important detail: **Buffer values must be divided by 1000**

```typescript
// ❌ WRONG - will create buffer 1000x too large
turf.buffer(geometry, bufferMeters, { units: 'kilometers' });

// ✅ CORRECT - as implemented in utm.eans.ee
turf.buffer(geometry, bufferMeters / 1000, { units: 'kilometers' });
```

**Why?** 
- UI input is in METERS
- Turf.js buffer() expects KILOMETERS
- Original code: `turf.buffer(s, e.buffer/1e3, {units: "kilometers"})`

## 2. Coordinate Order

Always use `[longitude, latitude]` order (GeoJSON standard):

```typescript
// ✅ CORRECT
const point = [24.7266, 59.4511]; // [lng, lat]

// ❌ WRONG
const point = [59.4511, 24.7266]; // [lat, lng]
```

## 3. Hidden Features

Always check the `hidden` property:

```typescript
// From original click handler
if (feature.properties.hidden) {
  return false;
}
```

## 4. Polygon Closing

Polygons must have first and last points identical:

```typescript
// EXACT logic from createRouteArea
if (drawingMode === 'polygon' && n > 2) {
  coords = [...currentDrawing, currentDrawing[0]];
}
```

## 5. Line Segmentation

Line mode creates individual segments:

```typescript
// EXACT logic from createRouteArea
if (drawingMode === 'line' && feature.geometry.type !== 'Point') {
  spatialFilter = {
    type: 'FeatureCollection',
    features: segmentCoords.reduce((acc, current, idx) => {
      if (idx > 0) {
        acc.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [segmentCoords[idx - 1], current]
          }
        });
      }
      return acc;
    }, [])
  };
}
```

## 6. Union Before Intersection

Always union route area features before checking intersection:

```typescript
// EXACT logic from getPlanFeatures
let unifiedArea = routeArea.features[0];
for (let i = 1; i < routeArea.features.length; i++) {
  unifiedArea = turf.union(
    turf.featureCollection([unifiedArea, routeArea.features[i]])
  );
}
```

## 7. Sorting Order

Features are sorted in multiple passes:

1. **Altitude** (lower first)
2. **Restriction severity** (most restrictive first)
3. **Feature type** (coordinate > operationplans > weather-observations)
4. **Operation state** (ACTIVATED > TAKEOFFREQUESTED > APPROVED > PROPOSED > CLOSED)

Each sort is a separate `features.sort()` call, not combined.

## 8. Error Handling

Always wrap Turf operations in try-catch:

```typescript
try {
  return turf.booleanIntersects(
    turf.feature(zoneFeature.geometry),
    unifiedArea
  );
} catch (e) {
  console.error(e);
  return false;
}
```

## 9. Time Filtering

When browsing historical/future data:

```typescript
const url = `${HOST}utm/uas.geojson?start=${start.toISOString()}&end=${end.toISOString()}&buffer=${buffer}`;
```

## 10. Fill Opacity

- Low altitude (< 120m): `0.15`
- High altitude (>= 120m): `0.15 / 3 = 0.05`

```typescript
// From main.js: const $e = .15
export const FILL_OPACITY = 0.15;
```

## 11. MapLibre Source Updates

Always check if source exists before updating:

```typescript
const source = map.getSource('uas');
if (source) {
  source.setData(geoJsonData);
}
```

## 12. Feature Properties

Standard UAS zone properties:
- `name`: Zone name
- `restriction`: NO_RESTRICTION | CONDITIONAL | REQ_AUTHORISATION | PROHIBITED
- `lowerMeters`: Lower altitude limit
- `upperMeters`: Upper altitude limit
- `hidden`: Boolean flag
- `zoneId` or `identifier`: Unique identifier
- `reason`: Restriction reason
- `becomingActive`: Boolean for upcoming restrictions

## 13. Geometry Types

Supported geometry types:
- `Point` (single location)
- `LineString` (route)
- `Polygon` (area)
- `MultiPolygon` (complex area)

## 14. No Coordinate Transformation

**CRITICAL**: Do NOT transform coordinates!

- Input: WGS84 (EPSG:4326)
- Processing: WGS84 (EPSG:4326)
- Output: WGS84 (EPSG:4326)
- MapLibre handles display projection automatically

## 15. Turf.js Version

The original uses Turf.js with these specific functions:
- `turf.buffer()`
- `turf.booleanIntersects()`
- `turf.booleanPointInPolygon()`
- `turf.union()`
- `turf.featureCollection()`
- `turf.feature()`
- `turf.point()`
- `turf.midpoint()`

## 16. Testing Against Live Data

Always test against the live endpoint:
```
https://utm.eans.ee/avm/utm/uas.geojson
```

This ensures your implementation works with real-world data.

## 17. Environment Configuration

The original fetches configuration from:
```
https://utm.eans.ee/avm/env
```

This returns `window.ENV` object with:
- `HOST`: Base URL
- `THEME`: Color theme
- Other configuration options

## Common Mistakes to Avoid

1. ❌ Using meters instead of kilometers for buffer
2. ❌ Using [lat, lng] instead of [lng, lat]
3. ❌ Not closing polygons
4. ❌ Transforming coordinates to Web Mercator
5. ❌ Not checking for hidden features
6. ❌ Not unioning route segments before intersection
7. ❌ Combining sort operations instead of separate passes
8. ❌ Not wrapping Turf operations in try-catch
9. ❌ Using wrong color values
10. ❌ Not checking if source exists before updating
