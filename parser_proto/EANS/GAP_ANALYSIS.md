# GAP ANALYSIS - Previously Missed Implementation Details

This document captures ALL details discovered during exhaustive verification that were NOT fully documented before.

---

## 🔴 CRITICAL GAPS FOUND

### 1. Coordinate Precision (MISSED!)

**Original Logic**: All coordinates are formatted to **exactly 6 decimal places**

```typescript
// EXACT: They use .toFixed(6) for all coordinate output
coordinate.toFixed(6)  // NOT toFixed(5) or unspecified

// This means:
// 24.7266000 → "24.726600" (6 decimal places)
// 59.4511234567 → "59.451123" (truncated to 6)
```

**Why it matters**: 6 decimal places = ~0.1 meter precision

---

### 2. Altitude Conversion Constants (INCOMPLETE!)

**Previously documented**: `3.28084` (meters to feet)

**ALSO USED**: `0.3048` (feet to meters)

```typescript
// EXACT: Two constants for conversion
const METERS_TO_FEET = 3.28084;
const FEET_TO_METERS = 0.3048;

// Usage:
altitudeFeet = altitudeMeters * 3.28084;
altitudeMeters = altitudeFeet * 0.3048;  // NOT / 3.28084
```

---

### 3. Telemetry Speed Conversion (MISSED!)

**Ground speed calculation uses `* 3.6` to convert m/s to km/h**

```typescript
// EXACT formula for speed display
const speedKmh = groundSpeedMps * 3.6;

// Example:
// 10 m/s → 36 km/h
```

---

### 4. Bearing Formatting (MISSED!)

**Bearing is normalized AND padded to 3 digits with degree symbol**

```typescript
// EXACT bearing normalization
bearing = (Math.round(val) % 360 + 360) % 360;

// EXACT bearing display formatting
bearingStr = ("00" + bearing).slice(-3) + "°";

// Examples:
// 45 → "045°"
// 180 → "180°"
// 5 → "005°"
```

---

### 5. helloInit Delay (MISSED!)

**Authentication has a specific 100ms delay before first fetchPlans**

```typescript
// EXACT: Wait 100ms after auth handshake before fetching plans
setTimeout(() => {
  this.fetchPlans();
}, 100);  // NOT 0, NOT immediate
```

**Why it matters**: Ensures authentication context is ready

---

### 6. Whitespace-Sensitive String Operations (MISSED!)

#### Color Code Sanitization
```typescript
// EXACT: Remove ALL spaces from color codes before processing
colorCode.replace(/ /g, "")

// Example:
// "hsl( 120, 50%, 40% )" → "hsl(120,50%,40%)"
```

#### State Transition Delimiter
```typescript
// EXACT: Alert titles use specific arrow delimiter
const delimiter = " –> ";  // Note: This may be en-dash, not hyphen!

// Format: "OLD_STATE –> NEW_STATE"
```

#### Altitude String Sanitization
```typescript
// EXACT: Replace uppercase M with lowercase m in telemetry
altitudeStr.replace("M", "m")

// Example: "120M" → "120m"
```

#### Pilot Name Normalization
```typescript
// EXACT: Remove parenthetical metadata from last name
lastName.split("(")[0].trim()

// Example: "Smith (Instructor)" → "Smith"
```

---

### 7. Default Buffer Values (INCOMPLETE!)

```typescript
// EXACT buffer defaults and limits
const DEFAULT_BUFFER = 50;    // meters
const MAX_BUFFER = 2000;      // meters (NOT 1000!)

// Validation:
if (buffer > 2000) buffer = 2000;
if (buffer < 0) buffer = 0;
```

---

### 8. Map Symbol Scaling (MISSED!)

```typescript
// EXACT MapLibre symbol scaling
{
  "icon-size": [
    "interpolate",
    ["linear"],
    ["zoom"],
    1, 0.1,    // At zoom 1, size is 0.1
    7, 1.25    // At zoom 7, size is 1.25
  ]
}

// Wind/METAR icons
{
  "icon-size": 0.675  // EXACT value
}
```

---

### 9. Cleanup Interval (INCOMPLETE!)

**Previously documented**: Alert cleanup runs "periodically"

**EXACT**: Cleanup runs every **1000ms (1 second)**

```typescript
setInterval(() => {
  this.cleanupAlerts();
  this.cleanupTelemetry();
}, 1000);  // 1 second, NOT on every data update
```

---

### 10. Operation Plan Complex State Logic (INCOMPLETE!)

#### Completed Status (EXACT)
```typescript
const completed = (
  state === "CLOSED" && closureReason === "NOMINAL"
) || (
  state === "CLOSED" && 
  authorization?.state === "GRANTED" && 
  activation?.state === "GRANTED"
);
```

#### Cancelled Status (EXACT)
```typescript
const cancelled = (
  closureReason === "CANCELED" || 
  closureReason === "WITHDRAWN"
) || (
  !completed && 
  state === "CLOSED" && 
  !rejected
);
```

#### Rejected Status (EXACT - COMPLEX!)
```typescript
const rejected = (
  // Check for alternative OP timeBegin mismatch
  alternativeOPs?.some(alt => alt.timeBegin !== plan.timeBegin)
) || (
  // Check for conflicts when DENIED
  state === "DENIED" && conflicts?.length > 0
) || (
  // TIMEOUT and ERROR are rejections
  state === "TIMEOUT" || state === "ERROR"
);
```

---

### 11. UUID Generation (MISSED!)

```typescript
// EXACT: Standard UUID v4 generation with specific masks
// Magic numbers used:
const mask1 = 0x3f;   // 63
const mask2 = 0x80;   // 128
const shift = 24;     // >>> 24 & 255

// Formula (simplified):
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

---

### 12. Center of Mass Calculation (MISSING DETAIL!)

**Clustering uses specific centroid calculation order**

```typescript
// EXACT: Two-step centroid for clusters
// Step 1: Calculate center of mass for each feature
const featureCentroids = features.map(f => turf.centerOfMass(f));

// Step 2: Calculate center of ALL centroids
const groupCenter = turf.center(turf.points(
  featureCentroids.map(c => c.geometry.coordinates)
));
```

---

### 13. API Header Requirements (INCOMPLETE!)

#### x-id Header
```typescript
// EXACT: Injected via fetch wrapper
headers: {
  "x-id": Preferences.get("id") || ""  // Empty string if not set
}
```

#### Authenticated Endpoints
```typescript
// EXACT headers for UAS/Drone endpoints
headers: {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "orgId": this.user.orgId  // Organization ID required
}
```

---

### 14. Additional API Endpoints (MISSING!)

```
Previously documented:
- utm/uas.geojson
- utm/operationplans.geojson
- utm/reservations.json

NEWLY FOUND:
- utm/operationplans.json (detailed list, NOT just geometry)
- auth/skyzr/hello (authentication handshake)
- weather/ee/forecast.json (Estonia-specific weather)
- weather/wind?alt=[ALT]&bbox=[BBOX] (dynamic wind grid)
```

---

### 15. Error Message Mapping (MISSED!)

```typescript
// EXACT: Specific error messages are caught and translated
if (errorMessage.includes("end time has been exceeded")) {
  displayMessage = i18n.t("operationplan.exceeded");
}

// VLOS bounding box limit
if (errorMessage.includes("VLOS") && errorMessage.includes("bounding box")) {
  displayMessage = i18n.t("operationplan.vlos_bbox_exceeded");
}
```

---

### 16. Sorting Source Priority (CORRECTED!)

**Previously documented**: Missing "coordinate" and default

```typescript
// EXACT source priority map (with default)
const sourcePriority = {
  "coordinate": 3,           // User-drawn zones (HIGHEST)
  "operationplans": 2,
  "weather-observations": 1,
  // default: -1              // Unknown sources get -1
};

const priority = sourcePriority[source] ?? -1;  // Use -1 for unknown
```

---

### 17. Date Formatting (INCOMPLETE!)

```typescript
// EXACT: All date segments are padded with .padStart(2, "0")
const hour = String(date.getHours()).padStart(2, "0");
const minute = String(date.getMinutes()).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");
const month = String(date.getMonth() + 1).padStart(2, "0");

// Format: "DD.MM.YYYY HH:mm"
const formatted = `${day}.${month}.${date.getFullYear()} ${hour}:${minute}`;
```

---

## Summary of Gaps

| Category | Previous | Now Found | Status |
|----------|----------|-----------|--------|
| Coordinate Precision | Not specified | `.toFixed(6)` | 🔴 NEW |
| Altitude Constants | 1 | 2 (both ways) | 🟡 Enhanced |
| Speed Conversion | Missing | `* 3.6` | 🔴 NEW |
| Bearing Format | Missing | 3-digit padded | 🔴 NEW |
| helloInit Delay | Missing | 100ms | 🔴 NEW |
| Color Sanitization | Missing | `replace(/ /g, "")` | 🔴 NEW |
| State Delimiter | Missing | ` –> ` | 🔴 NEW |
| Altitude String | Missing | `replace("M", "m")` | 🔴 NEW |
| Name Normalization | Missing | `split("(")[0].trim()` | 🔴 NEW |
| Buffer Limits | 1000 | 2000 | 🔴 WRONG |
| Symbol Scaling | Missing | Exact stops | 🔴 NEW |
| Cleanup Interval | "periodic" | 1000ms | 🟡 Enhanced |
| State Logic | Partial | Complete | 🔴 INCOMPLETE |
| UUID Constants | Missing | 0x3f, 0x80 | 🔴 NEW |
| Centroid Logic | Missing | 2-step | 🔴 NEW |
| API Headers | Partial | Complete | 🟡 Enhanced |
| Endpoints | 4 | 7 | 🔴 INCOMPLETE |
| Error Mapping | Missing | Exact strings | 🔴 NEW |
| Source Priority | Missing -1 | Added default | 🔴 INCOMPLETE |
| Date Formatting | Missing | padStart(2,"0") | 🔴 NEW |

**Total Gaps Found**: 20
**Critical Gaps**: 15 (marked 🔴)
**Enhancements**: 5 (marked 🟡)

---

This document should be used to update all implementation files!
