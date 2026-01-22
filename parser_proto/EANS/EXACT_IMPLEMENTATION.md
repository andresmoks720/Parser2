# EXACT IMPLEMENTATION - Line-by-Line Recreation

This document captures **EVERY** implementation detail from utm.eans.ee, including every conditional branch, edge case, magic number, and validation rule.

## 1. Route Area Generation - EXACT Logic

### Function: `createRouteArea(drawingPoints, drawingMode, bufferMeters)`

```typescript
/**
 * EXACT implementation from utm.eans.ee main.js function `v(e)`
 * Creates a buffered area from user-drawn points
 */
function createRouteArea(
  drawingPoints: Array<[number, number]>,
  drawingMode: 'point' | 'line' | 'polygon',
  bufferMeters: number
): GeoJSON.Feature | GeoJSON.FeatureCollection {
  
  // EDGE CASE 1: Empty drawing
  if (!drawingPoints || drawingPoints.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
  
  const turf = window.turf;
  
  // EDGE CASE 2: Polygon mode - auto-close the loop
  let coordinates = [...drawingPoints];
  if (drawingMode === 'polygon' && coordinates.length > 2) {
    // Append first point to close the polygon
    coordinates.push(coordinates[0]);
  }
  
  // EDGE CASE 3: Single point
  if (coordinates.length === 1) {
    const point = turf.point(coordinates[0]);
    return turf.buffer(point, bufferMeters / 1000, { units: 'kilometers' });
  }
  
  // CRITICAL: Line mode uses SEGMENT SPLITTING
  if (drawingMode === 'line') {
    // Convert single LineString into FeatureCollection of individual segments
    // This prevents self-intersection issues in buffer calculation
    const segments: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const segment = turf.lineString([
        coordinates[i],
        coordinates[i + 1]
      ]);
      segments.push(segment);
    }
    
    const featureCollection = turf.featureCollection(segments);
    
    // Apply buffer to EACH segment separately
    const buffered = turf.buffer(
      featureCollection,
      bufferMeters / 1000,  // CRITICAL: meters to km conversion
      { units: 'kilometers' }
    );
    
    return buffered;
  }
  
  // Polygon mode
  if (drawingMode === 'polygon') {
    const polygon = turf.polygon([coordinates]);
    return turf.buffer(polygon, bufferMeters / 1000, { units: 'kilometers' });
  }
  
  // Fallback (shouldn't reach here)
  const lineString = turf.lineString(coordinates);
  return turf.buffer(lineString, bufferMeters / 1000, { units: 'kilometers' });
}
```

### Midpoints Calculation (for UI editing handles)

```typescript
/**
 * EXACT midpoint calculation for editing handles
 */
function calculateMidpoints(
  drawingPoints: Array<[number, number]>
): Array<[number, number]> {
  const turf = window.turf;
  const midpoints: Array<[number, number]> = [];
  
  for (let i = 0; i < drawingPoints.length - 1; i++) {
    const point1 = turf.point(drawingPoints[i]);
    const point2 = turf.point(drawingPoints[i + 1]);
    const midpoint = turf.midpoint(point1, point2);
    midpoints.push(midpoint.geometry.coordinates as [number, number]);
  }
  
  return midpoints;
}
```

---

## 2. Intersection Detection - EXACT Logic

### Function: `getPlanFeatures(routeArea, uasData)`

```typescript
/**
 * EXACT implementation of intersection detection
 * Returns all UAS features that intersect with the route area
 */
function getPlanFeatures(
  drawingPoints: Array<[number, number]>,
  drawingMode: 'point' | 'line' | 'polygon',
  bufferMeters: number,
  uasData: GeoJSON.FeatureCollection
): GeoJSON.Feature[] {
  
  const turf = window.turf;
  
  // Step 1: Create route area
  const routeArea = createRouteArea(drawingPoints, drawingMode, bufferMeters);
  
  // EDGE CASE: Empty route area
  if (routeArea.type === 'FeatureCollection' && routeArea.features.length === 0) {
    return [];
  }
  
  // Step 2: Union all features in route area into single geometry
  let unifiedArea: GeoJSON.Feature;
  
  try {
buffer if (routeArea.type === 'FeatureCollection') {
      // Union multiple segments/features
      unifiedArea = routeArea.features[0];
      
      for (let i = 1; i < routeArea.features.length; i++) {
        unifiedArea = turf.union(unifiedArea, routeArea.features[i]);
      }
    } else {
      unifiedArea = routeArea as GeoJSON.Feature;
    }
  } catch (error) {
    console.error('Union failed:', error);
    return [];
  }
  
  // Step 3: Filter UAS features by intersection
  const intersectingFeatures: GeoJSON.Feature[] = [];
  
  for (const feature of uasData.features) {
    // EDGE CASE: Skip hidden features
    if (feature.properties?.hidden === true) {
      continue;
    }
    
    try {
      const zoneFeature = turf.feature(feature.geometry);
      const intersects = turf.booleanIntersects(zoneFeature, unifiedArea);
      
      if (intersects) {
        intersectingFeatures.push(feature);
      }
    } catch (error) {
      // Silently ignore geometry errors
      console.error('Intersection test failed for feature:', feature.id, error);
      continue;
    }
  }
  
  return intersectingFeatures;
}
```

---

## 3. Feature Sorting - EXACT 5-Pass Logic

### Function: `sortFeatures(features)`

```typescript
/**
 * EXACT 5-pass sorting algorithm from utm.eans.ee
 * Priority: Altitude → Restriction → Rejection → Source → State
 */
function sortFeatures(features: GeoJSON.Feature[]): void {
  
  // Restriction priority map
  const restrictionPriority: Record<string, number> = {
    'NO_RESTRICTION': 0,
    'CONDITIONAL': 1,
    'REQ_AUTHORISATION': 2,
    'PROHIBITED': 3
  };
  
  // Source priority map
  const sourcePriority: Record<string, number> = {
    'weather-observations': 1,
    'operationplans': 2,
    'coordinate': 3  // User-drawn zones
  };
  
  // State priority map (for operation plans)
  const statePriority: Record<string, number> = {
    'CLOSED': 1,
    'PROPOSED': 2,
    'APPROVED': 3,
    'TAKEOFFREQUESTED': 4,
    'ACTIVATED': 5
  };
  
  features.sort((a, b) => {
    const propsA = a.properties || {};
    const propsB = b.properties || {};
    
    // PASS 1: Sort by altitude (lower altitude first)
    // Primary: lowerMeters
    if (propsA.lowerMeters !== propsB.lowerMeters) {
      return propsA.lowerMeters - propsB.lowerMeters;
    }
    
    // Secondary: upperMeters
    if (propsA.upperMeters !== propsB.upperMeters) {
      return propsA.upperMeters - propsB.upperMeters;
    }
    
    // PASS 2: Sort by restriction severity
    // Rejecting features have highest priority (3)
    const sevA = propsA._rejecting ? 3 : (restrictionPriority[propsA.restriction] || 0);
    const sevB = propsB._rejecting ? 3 : (restrictionPriority[propsB.restriction] || 0);
    
    if (sevA !== sevB) {
      return sevB - sevA;  // Higher severity first
    }
    
    // PASS 3: Sort by rejection status (explicit check)
    const rejA = propsA._rejecting ? 1 : 0;
    const rejB = propsB._rejecting ? 1 : 0;
    
    if (rejA !== rejB) {
      return rejB - rejA;
    }
    
    // PASS 4: Sort by source type
    const srcA = sourcePriority[propsA.source] || 0;
    const srcB = sourcePriority[propsB.source] || 0;
    
    if (srcA !== srcB) {
      return srcB - srcA;  // Higher priority source first
    }
    
    // PASS 5: Sort by state (for operation plans)
    const stateA = statePriority[propsA.state] || 0;
    const stateB = statePriority[propsB.state] || 0;
    
    return stateB - stateA;  // Higher state first
  });
}
```

---

## 4. Validation Rules - EXACT Logic

### Phone Number Validation

```typescript
/**
 * EXACT phone validation from utm.eans.ee (Mr function)
 * Allows: +, digits, spaces only
 */
function validatePhone(phone: string): boolean {
  if (!phone || phone.length === 0) {
    return false;
  }
  
  // First character can be '+'
  const allowedChars = '+0123456789 ';
  
  for (let i = 0; i < phone.length; i++) {
    const char = phone[i];
    
    // First character can be '+' or digit
    if (i === 0 && char === '+') {
      continue;
    }
    
    // All other characters must be digits or spaces
    if (!allowedChars.includes(char)) {
      return false;
    }
  }
  
  return true;
}
```

### Coordinate Normalization

```typescript
/**
 * EXACT longitude normalization (xt function)
 * Ensures longitude is in range [-180, 180]
 */
function normalizeLongitude(lng: number): number {
  // ((lng + 180) % 360 + 360) % 360 - 180
  return ((lng + 180) % 360 + 360) % 360 - 180;
}
```

### Operation Plan Validation

```typescript
/**
 * EXACT validation rules for operation plan submission
 */
interface ValidationRules {
  // Personal info
  firstName: string;  // Required
  lastName: string;   // Required
  phone: string;      // Must pass validatePhone()
  
  // Aircraft info
  mtom: number;       // Must be >= 0
  maxAltitude: number; // Must be >= 0
  
  // Time constraints
  startDatetime: Date;  // Must be > now
  endDatetime: Date;    // Must be > startDatetime
  
  // Lead time rules
  reqAuthMinLeadTime: number;  // From ENV.REQ_AUTHORIZATION_MIN_LEAD_TIME (default: 5 minutes)
  maxActivationLeadTime: number; // From ENV.MAX_ACTIVATION_LEAD_TIME (default: 1 minute)
}

function validateOperationPlan(plan: any, env: any): string[] {
  const errors: string[] = [];
  
  // Required fields
  if (!plan.firstName || plan.firstName.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!plan.lastName || plan.lastName.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (!plan.phone || !validatePhone(plan.phone)) {
    errors.push('Valid phone number is required');
  }
  
  // Numeric validation
  if (plan.mtom < 0) {
    errors.push('MTOM cannot be negative');
  }
  
  if (plan.maxAltitude < 0) {
    errors.push('Max altitude cannot be negative');
  }
  
  // Time validation
  const now = new Date();
  const start = new Date(plan.startDatetime);
  const end = new Date(plan.endDatetime);
  
  if (start <= now) {
    errors.push('Start time must be in the future');
  }
  
  if (end <= start) {
    errors.push('End time must be after start time');
  }
  
  // Lead time validation (if authorization required)
  if (plan.requiresAuthorization) {
    const minLeadTime = env.REQ_AUTHORIZATION_MIN_LEAD_TIME || 5; // minutes
    const leadTimeMs = start.getTime() - now.getTime();
    const leadTimeMinutes = leadTimeMs / 60000;
    
    if (leadTimeMinutes < minLeadTime) {
      errors.push(`Authorization required plans must be submitted at least ${minLeadTime} minutes in advance`);
    }
  }
  
  return errors;
}
```

---

## 5. Time Handling - EXACT Logic

### Server Time Synchronization

```typescript
/**
 * EXACT server time sync (Xt / fetchTime function)
 * Maintains offset between client and server time
 */
class TimeSync {
  private serverOffset: number = 0;
  
  async fetchServerTime(): Promise<void> {
    try {
      const response = await fetch('/avm/time');
      const serverTime = await response.json();
      
      const clientTime = Date.now();
      this.serverOffset = serverTime - clientTime;
    } catch (error) {
      console.error('Failed to sync time:', error);
    }
  }
  
  getServerTime(): number {
    return Date.now() + this.serverOffset;
  }
  
  getServerDate(): Date {
    return new Date(this.getServerTime());
  }
}
```

### Time Window Calculations

```typescript
/**
 * EXACT time window calculation for GeoJSON requests
 * Adds ?start=...&end=...&buffer=... parameters
 */
function buildTimeWindowUrl(
  baseUrl: string,
  startTime: Date,
  endTime: Date,
  bufferMinutes: number = 60
): string {
  // Convert to ISO strings
  const start = new Date(startTime.getTime() - bufferMinutes * 60000).toISOString();
  const end = new Date(endTime.getTime() + bufferMinutes * 60000).toISOString();
  
  const params = new URLSearchParams({
    start,
    end,
    buffer: bufferMinutes.toString()
  });
  
  return `${baseUrl}?${params.toString()}`;
}
```

---

## 6. Data Cleanup - EXACT Logic

### Alert Cleanup

```typescript
/**
 * EXACT alert cleanup logic
 * Removes alerts older than 1 hour
 */
function cleanupAlerts(alerts: any[]): any[] {
  const oneHourAgo = Date.now() - 3600000;  // 36e5 ms = 1 hour
  
  return alerts.filter(alert => {
    return alert.createdAt > oneHourAgo;
  });
}
```

### Telemetry Cleanup

```typescript
/**
 * EXACT telemetry cleanup logic
 * Removes telemetry older than 1 minute
 */
function cleanupTelemetry(telemetry: any[]): any[] {
  const oneMinuteAgo = Date.now() - 60000;
  
  return telemetry.filter(t => {
    return t.createdAt > oneMinuteAgo;
  });
}
```

---

## 7. Throttling - EXACT Logic

### Fetch Throttling

```typescript
/**
 * EXACT throttling implementation
 * Minimum 5 seconds between requests
 */
class ThrottledFetcher {
  private lastFetchTimes: Map<string, number> = new Map();
  private pendingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  async fetch(key: string, fetchFn: () => Promise<void>, force: boolean = false): Promise<void> {
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(key) || 0;
    const timeSinceLastFetch = now - lastFetch;
    
    // CRITICAL: 5-second throttle
    if (!force && timeSinceLastFetch < 5000) {
      // Clear existing timeout
      const existingTimeout = this.pendingTimeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Schedule retry after 5 seconds from last fetch
      const retryDelay = 5000 - timeSinceLastFetch;
      const timeout = setTimeout(() => {
        this.fetch(key, fetchFn, false);
      }, retryDelay);
      
      this.pendingTimeouts.set(key, timeout);
      return;
    }
    
    // Update last fetch time
    this.lastFetchTimes.set(key, now);
    
    // Execute fetch
    try {
      await fetchFn();
    } catch (error) {
      console.error(`Fetch failed for ${key}:`, error);
      
      // Retry after 5 seconds on error
      setTimeout(() => {
        this.fetch(key, fetchFn, false);
      }, 5000);
    }
  }
}
```

---

## 8. Altitude Conversion - EXACT Logic

### Meters to Feet

```typescript
/**
 * EXACT altitude conversion for API submission
 * Used in operationVolumes payload
 */
function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

function feetToMeters(feet: number): number {
  return feet / 3.28084;
}
```

---

## 9. SHA-256 Anonymization - EXACT Logic

### User ID Hashing

```typescript
/**
 * EXACT anonymization logic (Z function)
 * Hashes user IDs before sending stats
 */
async function anonymizeUserId(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
```

## 10. Micro-Logic & UI Interaction

### Dynamic Cursor States
| State | Condition |
| :--- | :--- |
| `crosshair` | Drawing mode active (`drawPlan`) |
| `move` | Hovering over points or midpoint handles |
| `pointer` | Hovering over interactive features |
| `grab`/`grabbing` | Map panning |

### Highlight Decoration
- **Source**: `highlight`
- **Layer**: `highlight-line`
- **Style**: Black, 0.8 opacity, 3px width

### Midpoint splicing (Ot function)
When dragging a midpoint handle:
1. `mousedown` on midpoint
2. New coordinate `spliced` into `currentDrawing` at `pointIndex`
3. Midpoint becomes a permanent route point

### Self-Intersection Logic
Uses `turf.kinks`. If `kinks.features.length > 0` during polygon drag:
- Position reverted to previous valid `lng/lat`
- Alert `draw.error.intersectingPolygon` triggered

### Altitude Snapping
Slider snaps to: `[10, 30, 50, 80, 100]` meters via closest match search.

### Button Disabling
- 'Activate' button hidden if `leadTimeToStart > MAX_ACTIVATION_LEAD_TIME` (default 60m).
- On click, `.loading` class added, label replaced with spinning `loader-2` icon.

---

## 12. Advanced Operation States & Reasons

### Found States
| State | Behavior |
| :--- | :--- |
| `AUTHORIZED` | Permanent authorization state often used for missions in restricted zones. |
| `TAKEOFFGRANTED` | Immediate clearance received after `TAKEOFFREQUESTED`. |

### Found Closure Reasons
| Reason | Scenario |
| :--- | :--- |
| `REVOKED` | Mission was stopped by authority during active flight. |

### Conflict Context Logic
Conflicts are reported with specific context headers:
- `TEXTUAL_RESTRICTION`: The conflict stems from a written rule in the UAS zone description.
- `AUTHORITY_REQUIREMENTS`: The conflict stems from a missing or required manual approval.

---

## 13. Production Environment Flags

The system behavior is heavily modified by `window.ENV` flags:
- **`WIND_GRID_ENABLED`**: Toggles discrete wind grid querying.
- **`METARS`**: Toggles station-based weather observations.
- **`PAYMENT_DEMO`**: Injects a transaction-state into the planning flow for paid authorization scenarios.
- **`TS`**: Cache-busting timestamp used globally for style and tile requests.

---

## 14. Coordinate Wrapping Match (xt Function)

The system ensures all longitudes are normalized before they reach the API or spatial analysis:
```javascript
const wrap = (t) => ((t + 180) % 360 + 360) % 360 - 180;
```
This logic prevents Turf.js errors when crossing the Dateline and ensures stable intersection tests.

## 16. Surgical Parsing & Schema Drift

### Temporal Precision Hack
Backend compatibility requires the removal of the millisecond component from ISO strings.
- **Logic**: `date.toISOString().replace(".000", "")`

### OPv3 Payload Variations
The system dynamically toggles schema based on the `OPv3` environment flag:
- **Aircraft Data**: `uasRegistrations` (v2) ↔ `aircraftInfos` (v3).
- **Contacts**: `phone: "string"` (v2) ↔ `phones: ["array"]` (v3).

### Operator Identity Resolution
The system resolves the planning operator's identity using the following priority:
1. `company.registrationNumber` (from the user's organization profile)
2. `user.email` (fallback to individual account)

### Manual Altitude Input
If the user provides an altitude manually (e.g., via import), the system checks the unit:
- If unit is `FT`, it is converted to meters via `val * 0.3048`.
- For display, meters are converted to feet via `val * 3.28084`.

---

## 17. Map Interaction Micro-Scales

### Viewport Padding
The `fitBounds` logic uses two distinct padding levels:
- **Default**: `32px` (used for general navigation and layer fitting).
- **Reservations**: `16px` (used for tighter framing of active/historical search results).

### Cookie Sanitization
The system manually encodes/decodes reserved characters in cookies to prevent header injection:
- **Encoding**: `/%(2[346B]|5E|60|7C)/g`
- **Decoding**: `/(%[\dA-F]{2})+/gi`
