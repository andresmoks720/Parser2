# Deep Dive: Rendering Implementation

## Complete MapLibre Rendering Pipeline

### 1. Layer Architecture

The application uses a **sophisticated multi-layer system** with altitude-based bifurcation:

```typescript
/**
 * UAS Layer Structure
 * 
 * Layers are split by altitude to handle visual complexity:
 * - Low altitude: < 120m (full opacity)
 * - High altitude: >= 120m (reduced opacity)
 */

const UAS_LAYER_STRUCTURE = {
  // FILLS (Polygons)
  fills: {
    low: {
      id: 'uas-fills',
      filter: ['<', 'lowerMeters', 120],
      opacity: 0.15
    },
    high: {
      id: 'uas-high-fills',
      filter: ['>=', 'lowerMeters', 120],
      opacity: 0.05 // 0.15 / 3
    }
  },
  
  // LINES (Borders)
  lines: {
    becomingActive: {
      id: 'uas-lines-becomingactive',
      filter: ['==', 'becomingActive', true],
      dasharray: [2, 3] // Dashed line
    },
    active: {
      id: 'uas-lines',
      filter: ['!=', 'becomingActive', true],
      dasharray: null // Solid line
    }
  },
  
  // SYMBOLS (Labels)
  symbols: {
    low: {
      id: 'uas-symbols',
      filter: ['<', 'lowerMeters', 120],
      textField: '{name} ({reason})',
      textSize: 8
    },
    high: {
      id: 'uas-high-symbols',
      filter: ['>=', 'lowerMeters', 120],
      textField: '{name} ({reason})',
      textSize: 10 // Larger for high altitude
    }
  }
};
```

### 2. Complete Layer Definitions

```typescript
/**
 * EXACT layer definitions from main.js
 * Order matters! Layers are rendered bottom-to-top
 */

// 1. UAS FILLS (Low Altitude)
map.addLayer({
  id: 'uas-fills',
  type: 'fill',
  source: 'uas',
  paint: {
    'fill-color': [
      'match',
      ['get', 'restriction'],
      'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
      'PROHIBITED', 'hsl(0, 100%, 52.5%)',
      'CONDITIONAL', 'hsl(90, 65%, 40%)',
      'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
      'hsl(90, 65%, 40%)' // Default
    ],
    'fill-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      0.15
    ]
  },
  filter: [
    'all',
    ['<', 'lowerMeters', 120],
    ['!has', 'fillColor']
  ]
});

// 2. UAS FILLS CUSTOM (Low Altitude with custom colors)
map.addLayer({
  id: 'uas-fills-custom',
  type: 'fill',
  source: 'uas',
  paint: {
    'fill-color': ['get', 'fillColor']
  },
  filter: [
    'all',
    ['<', 'lowerMeters', 120],
    ['has', 'fillColor']
  ]
});

// 3. UAS HIGH FILLS (High Altitude)
map.addLayer({
  id: 'uas-high-fills',
  type: 'fill',
  source: 'uas',
  paint: {
    'fill-color': [
      'match',
      ['get', 'restriction'],
      'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
      'PROHIBITED', 'hsl(0, 100%, 52.5%)',
      'CONDITIONAL', 'hsl(90, 65%, 40%)',
      'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
      'hsl(90, 65%, 40%)'
    ],
    'fill-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      0.05 // Reduced opacity for high altitude
    ]
  },
  filter: [
    'all',
    ['>=', 'lowerMeters', 120],
    ['!has', 'fillColor']
  ]
});

// 4. UAS HIGH FILLS CUSTOM
map.addLayer({
  id: 'uas-high-fills-custom',
  type: 'fill',
  source: 'uas',
  paint: {
    'fill-color': ['get', 'fillColor']
  },
  filter: [
    'all',
    ['>=', 'lowerMeters', 120],
    ['has', 'fillColor']
  ]
});

// 5. UAS LINES BECOMING ACTIVE (Dashed)
map.addLayer({
  id: 'uas-lines-becomingactive',
  type: 'line',
  source: 'uas',
  paint: {
    'line-color': [
      'match',
      ['get', 'restriction'],
      'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
      'PROHIBITED', 'hsl(0, 100%, 52.5%)',
      'CONDITIONAL', 'hsl(90, 65%, 40%)',
      'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
      'hsl(90, 65%, 40%)'
    ],
    'line-width': 1.5,
    'line-dasharray': [2, 3],
    'line-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      1
    ]
  },
  filter: ['==', 'becomingActive', true]
});

// 6. UAS LINES (Solid)
map.addLayer({
  id: 'uas-lines',
  type: 'line',
  source: 'uas',
  paint: {
    'line-color': [
      'match',
      ['get', 'restriction'],
      'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
      'PROHIBITED', 'hsl(0, 100%, 52.5%)',
      'CONDITIONAL', 'hsl(90, 65%, 40%)',
      'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
      'hsl(90, 65%, 40%)'
    ],
    'line-width': 1.5,
    'line-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      1
    ]
  },
  filter: [
    'all',
    ['!=', 'becomingActive', true],
    ['<', 'lowerMeters', 120],
    ['!has', 'strokeColor']
  ]
});

// 7. UAS LINES CUSTOM
map.addLayer({
  id: 'uas-lines-custom',
  type: 'line',
  source: 'uas',
  paint: {
    'line-color': ['get', 'strokeColor'],
    'line-width': 1.5
  },
  filter: [
    'all',
    ['!=', 'becomingActive', true],
    ['<', 'lowerMeters', 120],
    ['has', 'strokeColor']
  ]
});

// 8. UAS HIGH LINES
map.addLayer({
  id: 'uas-high-lines',
  type: 'line',
  source: 'uas',
  paint: {
    'line-color': [
      'match',
      ['get', 'restriction'],
      'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
      'PROHIBITED', 'hsl(0, 100%, 52.5%)',
      'CONDITIONAL', 'hsl(90, 65%, 40%)',
      'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
      'hsl(90, 65%, 40%)'
    ],
    'line-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      0.333 // 1/3 opacity for high altitude
    ],
    'line-width': 1.5
  },
  filter: [
    'all',
    ['!=', 'becomingActive', true],
    ['>=', 'lowerMeters', 120],
    ['!has', 'strokeColor']
  ]
});

// 9. UAS HIGH LINES CUSTOM
map.addLayer({
  id: 'uas-high-lines-custom',
  type: 'line',
  source: 'uas',
  paint: {
    'line-color': ['get', 'strokeColor'],
    'line-width': 1.5
  },
  filter: [
    'all',
    ['!=', 'becomingActive', true],
    ['>=', 'lowerMeters', 120],
    ['has', 'strokeColor']
  ]
});

// 10. UAS SYMBOLS (Low Altitude Labels)
map.addLayer({
  id: 'uas-symbols',
  type: 'symbol',
  source: 'uas',
  layout: {
    'text-field': '{name} ({reason})',
    'text-font': ['Inter SemiBold'],
    'text-size': 8,
    'text-offset': [0, 1],
    'symbol-placement': 'line'
  },
  minzoom: 4,
  paint: {
    'text-color': '#000',
    'text-halo-color': 'hsl(0, 0%, 90%)',
    'text-halo-width': 1,
    'text-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      1
    ]
  },
  filter: ['<', 'lowerMeters', 120]
});

// 11. UAS HIGH SYMBOLS (High Altitude Labels)
map.addLayer({
  id: 'uas-high-symbols',
  type: 'symbol',
  source: 'uas',
  layout: {
    'text-field': '{name} ({reason})',
    'text-font': ['Inter SemiBold'],
    'text-size': 10, // Larger for visibility
    'text-offset': [0, 1],
    'symbol-placement': 'line'
  },
  minzoom: 4,
  paint: {
    'text-color': '#000',
    'text-halo-color': 'hsl(0, 0%, 90%)',
    'text-halo-width': 1,
    'text-opacity': [
      'case',
      ['==', ['get', 'hidden'], true],
      0,
      1
    ]
  },
  filter: ['>=', 'lowerMeters', 120]
});
```

### 3. Source Configuration

```typescript
/**
 * UAS Source Configuration
 * Type: geojson
 * Data: Dynamic URL with optional time filtering
 */
map.addSource('uas', {
  type: 'geojson',
  data: 'https://utm.eans.ee/avm/utm/uas.geojson'
});

/**
 * Updating the source
 */
function updateUASSource(geoJsonData: any) {
  const source = map.getSource('uas');
  if (source) {
    source.setData(geoJsonData);
  }
}
```

### 4. Operation Plans Layers

```typescript
/**
 * Operation Plans use similar structure
 * but with state-based coloring
 */

// Operation Plans Fills
map.addLayer({
  id: 'operationplans-fills',
  type: 'fill',
  source: 'operationplans',
  paint: {
    'fill-color': [
      'match',
      ['get', 'state'],
      'PROPOSED', 'hsl(45, 100%, 50%)',
      'APPROVED', 'hsl(220, 75%, 30%)',
      'AUTHORIZED', 'hsl(220, 75%, 30%)',
      'TAKEOFFREQUESTED', 'hsl(200, 75%, 30%)',
      'TAKEOFFGRANTED', 'hsl(180, 75%, 30%)',
      'ACTIVATED', 'hsl(120, 75%, 30%)',
      'CLOSED', 'hsl(0, 0%, 75%)',
      'hsl(0, 0%, 50%)' // Default
    ],
    'fill-opacity': 0.25
  }
});

// Operation Plans Lines (Becoming Active - Dashed)
map.addLayer({
  id: 'operationplans-becomingactive-lines',
  type: 'line',
  source: 'operationplans',
  paint: {
    'line-color': [
      'match',
      ['get', 'state'],
      'PROPOSED', 'hsl(45, 100%, 50%)',
      'APPROVED', 'hsl(220, 75%, 30%)',
      'TAKEOFFREQUESTED', 'hsl(200, 75%, 30%)',
      'TAKEOFFGRANTED', 'hsl(180, 75%, 30%)',
      'ACTIVATED', 'hsl(120, 75%, 30%)',
      'CLOSED', 'hsl(0, 0%, 75%)',
      'hsl(0, 0%, 50%)'
    ],
    'line-width': 1.5,
    'line-dasharray': [2, 3]
  },
  filter: ['!=', 'active', true]
});

// Operation Plans Lines (Active - Solid)
map.addLayer({
  id: 'operationplans-lines',
  type: 'line',
  source: 'operationplans',
  paint: {
    'line-color': [
      'match',
      ['get', 'state'],
      'PROPOSED', 'hsl(45, 100%, 50%)',
      'APPROVED', 'hsl(220, 75%, 30%)',
      'TAKEOFFREQUESTED', 'hsl(200, 75%, 30%)',
      'TAKEOFFGRANTED', 'hsl(180, 75%, 30%)',
      'ACTIVATED', 'hsl(120, 75%, 30%)',
      'CLOSED', 'hsl(0, 0%, 75%)',
      'hsl(0, 0%, 50%)'
    ],
    'line-width': 1.5
  },
  filter: ['==', 'active', true]
});

// Operation Plans Symbols
map.addLayer({
  id: 'operationplans-symbols',
  type: 'symbol',
  source: 'operationplans',
  layout: {
    'text-field': '{name}',
    'text-font': ['Inter SemiBold'],
    'text-size': 10,
    'text-offset': [0, 1],
    'symbol-placement': 'line'
  },
  minzoom: 4,
  paint: {
    'text-color': [
      'match',
      ['get', 'state'],
      'PROPOSED', 'hsl(45, 100%, 50%)',
      'APPROVED', 'hsl(220, 75%, 30%)',
      'TAKEOFFREQUESTED', 'hsl(210, 75%, 30%)',
      'TAKEOFFGRANTED', 'hsl(170, 75%, 30%)',
      'ACTIVATED', 'hsl(120, 75%, 30%)',
      'CLOSED', 'hsl(0, 0%, 75%)',
      'hsl(0, 0%, 50%)'
    ],
    'text-halo-color': 'hsl(0, 0%, 90%)',
    'text-halo-width': 1
  }
});

// Operation Plans Clustering
map.addSource('operationplans_labels', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: []
  },
  cluster: true,
  clusterRadius: 50
});

map.addLayer({
  id: 'operationplans-clusters',
  source: 'operationplans_labels',
  type: 'circle',
  paint: {
    'circle-radius': 6,
    'circle-opacity': 0.8,
    'circle-color': '#000'
  },
  minzoom: 7,
  filter: ['>=', ['get', 'point_count'], 2]
});

map.addLayer({
  id: 'operationplans-cluster-count',
  source: 'operationplans_labels',
  type: 'symbol',
  layout: {
    'text-field': '{point_count}',
    'text-font': ['Inter SemiBold'],
    'text-size': 8
  },
  minzoom: 7,
  paint: {
    'text-color': '#fff'
  },
  filter: ['>=', ['get', 'point_count'], 2]
});
```

### 5. Telemetry Layer

```typescript
/**
 * Telemetry (Real-time aircraft/drone positions)
 */
map.addLayer({
  id: 'telemetry-symbols',
  type: 'symbol',
  source: 'telemetry',
  layout: {
    'icon-image': [
      'match',
      ['get', 'icon'],
      'plane', 'plane',
      'plane-emergency', 'plane-emergency',
      'uas-emergency', 'uas-emergency',
      'uas' // Default
    ],
    'icon-allow-overlap': true,
    'icon-size': {
      stops: [
        [1, 0.1],
        [7, 1.25]
      ]
    },
    'icon-rotate': {
      type: 'identity',
      property: 'bearing'
    },
    'text-field': '{visibleData}',
    'text-font': ['Inter SemiBold'],
    'text-size': 9,
    'text-radial-offset': 1.25,
    'text-variable-anchor': [
      'bottom', 'top', 'right', 'left',
      'top-right', 'top-left', 'bottom-right', 'bottom-left'
    ],
    'text-optional': true
  },
  paint: {
    'icon-opacity': {
      type: 'identity',
      property: 'opacity'
    },
    'text-color': 'hsl(0, 0%, 25%)',
    'text-halo-color': 'hsl(0, 0%, 90%)',
    'text-halo-width': 1
  }
});
```

### 6. Rendering Update Cycle

```typescript
/**
 * Map update is triggered by requestAnimationFrame
 * to batch multiple changes
 */
class MapRenderer {
  private updating: number | null = null;
  
  update() {
    if (this.updating) return;
    
    this.updating = requestAnimationFrame(() => {
      this.updating = null;
      
      // Update all layers
      this.updateUASLayer();
      this.updateOperationPlansLayer();
      this.updateTelemetryLayer();
      
      // Trigger app update
      this.app.update(this.state);
    });
  }
}
```

### 7. Layer Visibility Control

```typescript
/**
 * Toggle layer visibility
 */
function setLayerVisibility(layerId: string, visible: boolean) {
  map.setLayoutProperty(
    layerId,
    'visibility',
    visible ? 'visible' : 'none'
  );
}

// Example: Toggle weather layers
setLayerVisibility('clouds', true);
setLayerVisibility('metars', true);
setLayerVisibility('weather-observations', true);
```

## Performance Optimizations

1. **Altitude Bifurcation**: Reduces visual clutter by separating low/high altitude zones
2. **Clustering**: Operation plans are clustered at lower zoom levels
3. **Min Zoom**: Labels only appear at zoom level 4+
4. **requestAnimationFrame**: Batches updates to prevent excessive redraws
5. **Filter Expressions**: MapLibre evaluates filters on GPU for performance

## Summary

The rendering system uses:
- **11 UAS layers** (fills, lines, symbols × altitude levels)
- **Altitude-based opacity** (0.15 for low, 0.05 for high)
- **State-based coloring** for operation plans
- **Clustering** for dense areas
- **Real-time updates** via requestAnimationFrame
- **GPU-accelerated filtering** via MapLibre expressions
