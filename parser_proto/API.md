# API Reference - UTM EANS Parser

Complete API documentation for all extracted functions.

## fetchUAS

Fetches UAS zone data from the official endpoint.

```typescript
function fetchUAS(options?: UASFetchOptions): Promise<UASGeoJSON>
```

### Parameters

- `options.browseTime` (Date, optional): Time to fetch zones for (historical/future)
- `options.browseBuffer` (number, optional): Time buffer in minutes
- `options.showLoading` (boolean, optional): Show loading indicator

### Returns

Promise resolving to UASGeoJSON FeatureCollection

### Example

```typescript
// Fetch current zones
const zones = await fetchUAS();

// Fetch zones for specific time
const futureZones = await fetchUAS({
  browseTime: new Date('2024-12-31T12:00:00Z'),
  browseBuffer: 60
});
```

---

## createRouteArea

Creates buffered route area from drawing points.

```typescript
function createRouteArea(input: RouteAreaInput): RouteAreaOutput
```

### Parameters

- `input.currentDrawing` (DrawingPoint[]): Array of points
- `input.drawingMode` ('circle' | 'line' | 'polygon'): Drawing mode
- `input.buffer` (number): Buffer in **METERS**

### Returns

Object containing:
- `routeArea`: Buffered FeatureCollection
- `route`: Original route geometry
- `routePoints`: Point features for each vertex
- `routeMidpoints`: Midpoint features between vertices

### Example

```typescript
const result = createRouteArea({
  currentDrawing: [
    { lng: 24.7266, lat: 59.4511 },
    { lng: 24.7366, lat: 59.4611 }
  ],
  drawingMode: 'line',
  buffer: 50 // 50 meters
});
```

---

## getIntersectingZones

Finds UAS zones that intersect with route area.

```typescript
function getIntersectingZones(
  routeArea: turf.FeatureCollection | undefined,
  uasData: UASGeoJSON
): UASFeature[]
```

### Parameters

- `routeArea`: Buffered route area from createRouteArea
- `uasData`: UAS zones from fetchUAS

### Returns

Array of intersecting UAS features

### Example

```typescript
const uasData = await fetchUAS();
const { routeArea } = createRouteArea({...});
const conflicts = getIntersectingZones(routeArea, uasData);
```

---

## findZonesAtPoint

Finds UAS zones at a specific point (for click interactions).

```typescript
function findZonesAtPoint(
  lngLat: { lng: number; lat: number },
  uasData: UASGeoJSON
): UASFeature[]
```

### Parameters

- `lngLat`: Point coordinates
- `uasData`: UAS zones from fetchUAS

### Returns

Array of zones containing the point (excludes hidden features)

### Example

```typescript
const zones = findZonesAtPoint(
  { lng: 24.7266, lat: 59.4511 },
  uasData
);
```

---

## sortUASFeatures

Sorts UAS features by priority (in-place).

```typescript
function sortUASFeatures(features: SortableFeature[]): void
```

### Parameters

- `features`: Array of features to sort (modified in-place)

### Sorting Order

1. Altitude (lower first)
2. Restriction severity (PROHIBITED > REQ_AUTHORISATION > CONDITIONAL > NO_RESTRICTION)
3. Feature type (coordinate > operationplans > weather-observations)
4. Operation state (ACTIVATED > TAKEOFFREQUESTED > APPROVED > PROPOSED > CLOSED)

### Example

```typescript
const conflicts = getIntersectingZones(routeArea, uasData);
sortUASFeatures(conflicts);
// conflicts is now sorted by priority
```

---

## getRestrictionColor

Gets color for a restriction type.

```typescript
function getRestrictionColor(restriction: RestrictionType): string
```

### Parameters

- `restriction`: 'NO_RESTRICTION' | 'CONDITIONAL' | 'REQ_AUTHORISATION' | 'PROHIBITED'

### Returns

HSL color string

### Example

```typescript
const color = getRestrictionColor('PROHIBITED');
// Returns: 'hsl(0, 100%, 52.5%)'
```

---

## getColorScheme

Gets color scheme for a theme.

```typescript
function getColorScheme(theme?: string): Record<RestrictionType, string>
```

### Parameters

- `theme` ('default' | 'austrocontrol', optional): Theme name

### Returns

Object mapping restriction types to colors

### Example

```typescript
const colors = getColorScheme('austrocontrol');
```

---

## createUASSource

Creates MapLibre source configuration.

```typescript
function createUASSource(baseUrl?: string): object
```

### Parameters

- `baseUrl` (string, optional): Base URL (default: 'https://utm.eans.ee/avm/')

### Returns

MapLibre source configuration object

### Example

```typescript
map.addSource('uas', createUASSource());
```

---

## updateUASSource

Updates MapLibre source with new data.

```typescript
function updateUASSource(map: any, geoJsonData: UASGeoJSON): void
```

### Parameters

- `map`: MapLibre map instance
- `geoJsonData`: UAS data from fetchUAS

### Example

```typescript
const uasData = await fetchUAS();
updateUASSource(map, uasData);
```

---

## Constants

### COLORS

Official color mapping for restrictions.

```typescript
const COLORS: Record<RestrictionType, string> = {
  NO_RESTRICTION: 'hsl(120, 50%, 40%)',
  CONDITIONAL: 'hsl(90, 65%, 40%)',
  REQ_AUTHORISATION: 'hsl(60, 65%, 40%)',
  PROHIBITED: 'hsl(0, 100%, 52.5%)'
};
```

### FILL_OPACITY

Fill opacity for UAS zones.

```typescript
const FILL_OPACITY = 0.15;
```

### UAS_LAYERS

Array of all UAS layer definitions.

```typescript
const UAS_LAYERS: LayerDefinition[];
```

---

## Types

### DrawingPoint

```typescript
interface DrawingPoint {
  lng: number;
  lat: number;
}
```

### UASGeoJSON

```typescript
interface UASGeoJSON {
  type: 'FeatureCollection';
  features: UASFeature[];
}
```

### UASFeature

```typescript
interface UASFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    name?: string;
    restriction: RestrictionType;
    lowerMeters: number;
    upperMeters: number;
    hidden?: boolean;
    zoneId?: string;
    identifier?: string;
    reason?: string;
    [key: string]: any;
  };
}
```

### RestrictionType

```typescript
type RestrictionType = 
  | 'NO_RESTRICTION' 
  | 'CONDITIONAL' 
  | 'REQ_AUTHORISATION' 
  | 'PROHIBITED';
```

---

## Error Handling

All functions that use Turf.js wrap operations in try-catch:

```typescript
try {
  return turf.booleanIntersects(geometry1, geometry2);
} catch (e) {
  console.error(e);
  return false;
}
```

This matches the original implementation exactly.
