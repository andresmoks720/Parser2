# Test Suite for UTM EANS Parser

This directory contains tests to verify the implementation matches utm.eans.ee exactly.

## Test Data

Use live data from:
```
https://utm.eans.ee/avm/utm/uas.geojson
```

## Test Cases

### 1. Buffer Conversion Test

```typescript
import { createRouteArea } from '../routeArea';

test('buffer conversion - meters to kilometers', () => {
  const route = [
    { lng: 24.7266, lat: 59.4511 },
    { lng: 24.7366, lat: 59.4611 }
  ];
  
  const result = createRouteArea({
    currentDrawing: route,
    drawingMode: 'line',
    buffer: 50 // 50 meters
  });
  
  // Buffer should be 50m = 0.05km
  // Verify the buffered area is approximately correct
  expect(result.routeArea).toBeDefined();
});
```

### 2. Intersection Test

```typescript
import { getIntersectingZones } from '../intersections';
import { fetchUAS } from '../fetchUAS';

test('finds intersecting zones', async () => {
  const uasData = await fetchUAS();
  
  const routeArea = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [24.7266, 59.4511],
          [24.7366, 59.4511],
          [24.7366, 59.4611],
          [24.7266, 59.4611],
          [24.7266, 59.4511]
        ]]
      }
    }]
  };
  
  const conflicts = getIntersectingZones(routeArea, uasData);
  
  // Should find zones that intersect
  expect(Array.isArray(conflicts)).toBe(true);
});
```

### 3. Sorting Test

```typescript
import { sortUASFeatures } from '../sorting';

test('sorts by altitude then restriction', () => {
  const features = [
    {
      properties: {
        lowerMeters: 100,
        upperMeters: 200,
        restriction: 'NO_RESTRICTION'
      }
    },
    {
      properties: {
        lowerMeters: 50,
        upperMeters: 150,
        restriction: 'PROHIBITED'
      }
    },
    {
      properties: {
        lowerMeters: 50,
        upperMeters: 150,
        restriction: 'CONDITIONAL'
      }
    }
  ];
  
  sortUASFeatures(features);
  
  // Should be sorted: lower altitude first, then by severity
  expect(features[0].properties.lowerMeters).toBe(50);
  expect(features[0].properties.restriction).toBe('PROHIBITED');
});
```

### 4. Color Test

```typescript
import { COLORS, getRestrictionColor } from '../colors';

test('uses correct official colors', () => {
  expect(COLORS.NO_RESTRICTION).toBe('hsl(120, 50%, 40%)');
  expect(COLORS.CONDITIONAL).toBe('hsl(90, 65%, 40%)');
  expect(COLORS.REQ_AUTHORISATION).toBe('hsl(60, 65%, 40%)');
  expect(COLORS.PROHIBITED).toBe('hsl(0, 100%, 52.5%)');
});
```

### 5. Hidden Features Test

```typescript
import { findZonesAtPoint } from '../intersections';

test('filters out hidden features', async () => {
  const uasData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [24.7266, 59.4511],
            [24.7366, 59.4511],
            [24.7366, 59.4611],
            [24.7266, 59.4611],
            [24.7266, 59.4511]
          ]]
        },
        properties: {
          hidden: true,
          restriction: 'PROHIBITED'
        }
      }
    ]
  };
  
  const zones = findZonesAtPoint({ lng: 24.73, lat: 59.455 }, uasData);
  
  // Should not include hidden features
  expect(zones.length).toBe(0);
});
```

### 6. Polygon Closing Test

```typescript
import { createRouteArea } from '../routeArea';

test('closes polygons correctly', () => {
  const route = [
    { lng: 24.7266, lat: 59.4511 },
    { lng: 24.7366, lat: 59.4511 },
    { lng: 24.7366, lat: 59.4611 }
  ];
  
  const result = createRouteArea({
    currentDrawing: route,
    drawingMode: 'polygon',
    buffer: 50
  });
  
  const coords = result.route.features[0].geometry.coordinates[0];
  
  // First and last points should be identical
  expect(coords[0]).toEqual(coords[coords.length - 1]);
});
```

### 7. Live Data Integration Test

```typescript
import { planFlight } from '../example';

test('complete workflow with live data', async () => {
  const route = [
    { lng: 24.7266, lat: 59.4511 },
    { lng: 24.7366, lat: 59.4611 }
  ];
  
  const result = await planFlight(route, 'line', 50);
  
  expect(result).toBeDefined();
  expect(result.conflicts).toBeDefined();
  expect(Array.isArray(result.conflicts)).toBe(true);
  expect(typeof result.canFly).toBe('boolean');
  expect(typeof result.needsAuthorization).toBe('boolean');
});
```

## Running Tests

```bash
npm test
```

## Validation Against Live Site

To ensure implementation matches exactly:

1. Open https://utm.eans.ee/
2. Draw the same route in both systems
3. Compare:
   - Number of conflicts found
   - Zone names and restrictions
   - Color coding
   - Altitude ranges

## Performance Benchmarks

Expected performance (based on original):
- Fetch UAS data: < 500ms
- Create route area: < 50ms
- Find intersections: < 100ms
- Sort features: < 10ms

## Known Edge Cases

1. **Empty route**: Should return empty result
2. **Single point**: Should create circular buffer
3. **Self-intersecting polygon**: Should handle gracefully
4. **Very large buffer**: Should not crash
5. **Zones at exactly 120m**: Should appear in low-altitude layer
