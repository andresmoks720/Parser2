# UTM EANS Parsing Logic - Complete Reverse Engineering

This directory contains the **exact** reverse-engineered implementation from https://utm.eans.ee/

## 📚 Documentation

### Quick Start
- **[README.md](README.md)** - This file (overview)
- **[SUMMARY.md](SUMMARY.md)** - Complete project summary
- **[API.md](API.md)** - API reference for all functions

### Ultra-Deep Dives
- **[EXACT_IMPLEMENTATION.md](EXACT_IMPLEMENTATION.md)** - Line-by-line exact logic
  - Every conditional branch
  - All validation rules
  - Magic numbers explained
  - Critical edge cases
- **[EDGE_CASES.md](EDGE_CASES.md)** - Complete edge case catalog
  - 52 documented edge cases
  - Input/output examples
  - Boundary conditions
  - Error scenarios
- **[GAP_ANALYSIS.md](GAP_ANALYSIS.md)** - ⭐ VERIFICATION: 20 missed details found
  - Coordinate precision (.toFixed(6))
  - Bearing formatting (3-digit pad)
  - helloInit delay (100ms)
  - Speed conversion (* 3.6)
  - Complete state logic

### Deep Dives
- **[DEEP_DIVE_FETCHING.md](DEEP_DIVE_FETCHING.md)** - Complete data fetching architecture
  - 60-second polling system
  - Socket.IO real-time updates
  - Throttling mechanisms
  - Error handling
- **[DEEP_DIVE_RENDERING.md](DEEP_DIVE_RENDERING.md)** - Complete MapLibre rendering pipeline
- **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)** - ⭐ NEW: Frameworks (RE:DOM), Auth (Keycloak), and White-labeling (Flyk)
  - All 11 UAS layers
  - Altitude-based bifurcation
  - Layer ordering and z-index
  - Performance optimizations
- **[HIDDEN_DETAILS.md](HIDDEN_DETAILS.md)** - Positional Array Schema, Event Bus Registry, and Platform Hacks
- **[PARSING_NUANCES.md](PARSING_NUANCES.md)** - Surgical Regex, ISO Hacks, and Schema Drift
- **[GAP_ANALYSIS_REPORT.md](GAP_ANALYSIS_REPORT.md)** - ⭐ FINAL: 100% Parity Audit & Implementation Gaps

### Implementation Guides
- **[IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)** - Critical implementation details
- **[COMPLETE_INTEGRATION.md](COMPLETE_INTEGRATION.md)** - Full system integration guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Visual diagrams and architecture
- **[TESTS.md](TESTS.md)** - Test suite and validation

## Overview

The UTM EANS system uses a client-side architecture with:
- **MapLibre GL JS** for map rendering (WGS84-native GeoJSON)
- **Turf.js** for spatial analysis
- **Socket.IO** for real-time updates
- **60-second polling** with 5-second throttling
- **11 UAS layers** with altitude-based rendering
- **No coordinate transformation** (everything is WGS84/EPSG:4326)

## Data Sources

### Primary Endpoint
```
https://utm.eans.ee/avm/utm/uas.geojson
```

### Additional Endpoints
- Operation Plans: `operationplans.geojson`
- METARs: `metars.geojson`
- Observations: `observations.geojson`
- Reservations: `reservations.geojson`

### Real-Time Updates
- Socket.IO: `/avm/socket.io/`
- Events: `time`, `alert`, `operationplan`, `uas`, `telemetry`

### Configuration
```
https://utm.eans.ee/avm/env
```

## Core Implementation Files

| File | Description | Complexity |
|------|-------------|------------|
| `fetchUAS.ts` | Data fetching with polling | ⭐⭐⭐⭐⭐ |
| `routeArea.ts` | Route generation with buffer | ⭐⭐⭐⭐⭐⭐⭐ |
| `intersections.ts` | Spatial analysis | ⭐⭐⭐⭐⭐⭐ |
| `sorting.ts` | Multi-level priority sorting | ⭐⭐⭐⭐⭐⭐ |
| `colors.ts` | Official color scheme | ⭐⭐⭐⭐ |
| `layers.ts` | MapLibre layer definitions | ⭐⭐⭐⭐⭐ |
| `example.ts` | Integration examples | ⭐⭐⭐⭐⭐⭐⭐ |

## Key Implementation Details

### Coordinate System
- **Format**: GeoJSON FeatureCollection
- **CRS**: WGS84 (EPSG:4326)
- **Coordinates**: `[longitude, latitude]` in decimal degrees

### Restriction Types & Colors

| Restriction | HSL Color | Meaning |
|------------|-----------|---------|
| NO_RESTRICTION | `hsl(120, 50%, 40%)` | Green (Open) |
| CONDITIONAL | `hsl(90, 65%, 40%)` | Lime/Yellow |
| REQ_AUTHORISATION | `hsl(60, 65%, 40%)` | Yellow/Gold |
| PROHIBITED | `hsl(0, 100%, 52.5%)` | Red (No-fly) |

### Buffer Logic (CRITICAL!)
**CRITICAL**: The buffer is always divided by 1000 because:
- UI input is in **meters**
- Turf.js `buffer()` expects **kilometers**

```javascript
turf.buffer(geometry, bufferMeters / 1000, { units: "kilometers" })
```

### Polling System
- **UAS Zones**: 60 seconds
- **Operation Plans**: 60 seconds
- **Reservations**: 60 seconds
- **Throttle**: 5 seconds minimum between requests
- **Real-time**: Socket.IO for instant updates

### Layer Architecture
- **11 UAS layers** total
- **Altitude split**: < 120m (full opacity) vs >= 120m (reduced opacity)
- **Opacity**: 0.15 for low, 0.05 for high altitude
- **Dashed lines**: For zones becoming active

## Quick Start

```typescript
import { planFlight } from './parser_proto';

const route = [
  { lng: 24.7266, lat: 59.4511 },
  { lng: 24.7366, lat: 59.4611 }
];

const result = await planFlight(route, 'line', 50);

if (result.canFly) {
  console.log('✓ Flight approved');
} else {
  console.log('✗ Conflicts:', result.conflicts);
}
```

## Testing

All implementations should be tested against live data from:
```
https://utm.eans.ee/avm/utm/uas.geojson
```

See **[TESTS.md](TESTS.md)** for complete test suite.

## References

- Original Site: https://utm.eans.ee/
- MapLibre GL JS: https://maplibre.org/
- Turf.js: https://turfjs.org/
- Socket.IO: https://socket.io/
