# Deep Dive: Data Fetching Implementation

## Complete Fetch Architecture

### 1. Polling System

The application uses a **sophisticated multi-tier polling system**:

```typescript
/**
 * UAS Zones Polling
 * Interval: 60 seconds (60,000ms)
 * Throttle: 5 seconds for user-triggered refreshes
 */
class UASPollingSystem {
  private lastFetchRequestAt: number = 0;
  private fetchingTimeout: NodeJS.Timeout | null = null;
  
  async fetchUAS(force: boolean = false, showLoading: boolean = false) {
    const now = Date.now();
    
    // Throttle: Don't fetch if last request was < 5 seconds ago
    if (!force && (this.lastFetchRequestAt > now - 5000)) {
      // Schedule retry in 5 seconds
      clearTimeout(this.fetchingTimeout);
      this.fetchingTimeout = setTimeout(() => this.fetchUAS(), 5000);
      return;
    }
    
    // Update timestamp
    this.lastFetchRequestAt = now;
    
    // Clear existing timeout
    clearTimeout(this.fetchingTimeout);
    
    // Schedule next automatic fetch in 60 seconds
    this.fetchingTimeout = setTimeout(() => this.fetchUAS(), 60000);
    
    // Build URL
    const HOST = window.ENV.HOST;
    let url = `${HOST}utm/uas.geojson`;
    
    // Add time filtering if browsing
    if (this.browseTime) {
      const start = this.browseTime;
      const end = this.browseTime;
      url += `?start=${start.toISOString()}&end=${end.toISOString()}&buffer=${this.browseBuffer}`;
    }
    
    // Show loading indicator
    if (showLoading) {
      this.isFetchingUAS = true;
    }
    
    // Fetch data
    try {
      const response = await fetch(url);
      
      if (showLoading) {
        this.isFetchingUAS = false;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const geoJsonData = await response.json();
      
      // Update MapLibre source
      const source = this.map.getSource('uas');
      if (source) {
        source.setData(geoJsonData);
      }
      
      return geoJsonData;
    } catch (error) {
      console.error('Failed to fetch UAS zones:', error);
      if (showLoading) {
        this.isFetchingUAS = false;
      }
    }
  }
}
```

### 2. Operation Plans Polling

```typescript
/**
 * Operation Plans Polling
 * Interval: 60 seconds
 * Throttle: 5 seconds
 * Additional: Fetches authorization/activation details for each plan
 */
async fetchPlans(force: boolean = false) {
  const now = Date.now();
  
  // Same throttling as UAS
  if (!force && (this.lastPlansFetchRequestAt > now - 5000)) {
    clearTimeout(this.fetchingPlans);
    this.fetchingPlans = setTimeout(() => this.fetchPlans(), 5000);
    return;
  }
  
  // Check if map is ready
  if (!this.map.map) {
    clearTimeout(this.fetchingPlans);
    this.fetchingPlans = setTimeout(() => this.fetchPlans(), 5000);
    return;
  }
  
  // Schedule next fetch
  clearTimeout(this.fetchingPlans);
  this.fetchingPlans = setTimeout(() => this.fetchPlans(), 60000);
  
  this.lastPlansFetchRequestAt = now;
  
  // Build URL with ID parameter
  const url = new URL(`${HOST}utm/operationplans.geojson`);
  const id = await getUserId();
  url.searchParams.set('id', id);
  
  // Add time filtering if browsing
  if (this.browseTime) {
    url.searchParams.set('start', this.browseTime.toISOString());
    url.searchParams.set('end', this.browseTime.toISOString());
    url.searchParams.set('buffer', this.browseBuffer.toString());
    
    // Update source directly
    this.map.getSource('operationplans')?.setData(url.href);
  } else {
    // Remove time parameters
    url.searchParams.delete('start');
    url.searchParams.delete('end');
    url.searchParams.delete('buffer');
    
    this.map.getSource('operationplans')?.setData(url.href);
  }
  
  // Fetch JSON for detailed plan information
  if (this.user) {
    let jsonUrl = `${HOST}utm/operationplans.json`;
    
    if (this.browseTime) {
      jsonUrl += `?start=${this.browseTime.toISOString()}&end=${this.browseTime.toISOString()}`;
      if (id) jsonUrl += `&id=${id}`;
    } else if (id) {
      jsonUrl += `?id=${id}`;
    }
    
    const response = await fetch(jsonUrl);
    const plans = await response.json();
    
    this.operationplans = plans;
    
    // Fetch authorization/activation for each plan
    for (const plan of plans) {
      await this.fetchPlanDetails(plan.operationPlanId);
    }
  }
}

async fetchPlanDetails(planId: string) {
  for (const type of ['authorization', 'activation']) {
    try {
      const response = await fetch(
        `${HOST}utm/${type}/${planId}`,
        { priority: 'low' }
      );
      
      if (response.ok) {
        const data = await response.json();
        this[`${type}s`][planId] = data;
      }
    } catch (error) {
      console.error(error);
    }
  }
}
```

### 3. Reservations Polling

```typescript
/**
 * Reservations Polling
 * Interval: 60 seconds
 * Throttle: 5 seconds
 * Format: JSON (not GeoJSON)
 */
async fetchReservations(force: boolean = false) {
  if (!force && (this.lastReservationsFetchRequestAt > Date.now() - 5000)) {
    clearTimeout(this.fetchingReservations);
    this.fetchingReservations = setTimeout(() => this.fetchReservations(), 5000);
    return;
  }
  
  clearTimeout(this.fetchingReservations);
  this.fetchingReservations = setTimeout(() => this.fetchReservations(), 60000);
  
  this.lastReservationsFetchRequestAt = Date.now();
  
  // Reload MapLibre source
  this.map.reloadJSON('reservations');
  
  // Fetch JSON data
  const url = `${HOST}utm/reservations.json`;
  const response = await fetch(url);
  const data = await response.json();
  
  this.reservations = data.reservations;
  this.update();
}
```

### 4. Real-Time Updates via Socket.IO

```typescript
/**
 * Socket.IO Integration
 * Endpoint: /avm/socket.io/
 * Events: time, alert, operationplan, uas, telemetry
 */
class SocketIOClient {
  private socket: any;
  
  async connect() {
    const HOST = window.ENV.BASE_URL;
    const path = window.ENV.RELATIVE_PATH + 'socket.io/';
    const id = await getUserId();
    
    this.socket = io(HOST, {
      path,
      auth: { id }
    });
    
    // Connection handler
    this.socket.on('connect', async () => {
      // Clear alerts on connect
      this.DATA.alerts = [];
      
      // Fetch initial alerts
      const response = await fetch(`${HOST}utm/alerts.json?id=${id}`);
      const alerts = await response.json();
      
      for (const alert of alerts) {
        this.DATA.alerts.unshift({
          _id: alert.message_id,
          createdAt: alert.time_sent,
          source: alert.source,
          location: alert.location,
          text: alert.free_text,
          severity: alert.severity_type,
          type: alert.type,
          operationPlanIds: alert.operation_plans,
          acknowledged: alert.history.find(h => h.state === 'ACKNOWLEDGED'),
          _own: true
        });
      }
      
      this.update();
    });
    
    // Time sync
    this.socket.on('time', (timestamp: number) => {
      this.DATA.lastTime = Math.round(Date.now() / 1000);
    });
    
    // Alert notifications
    this.socket.on('alert', (data: any[]) => {
      const [id, createdAt, source, location, text, severity, type, planIds, acknowledged] = data;
      
      this.DATA.alerts.unshift({
        _id: id,
        createdAt,
        source,
        location,
        text,
        severity,
        type,
        operationPlanIds: planIds,
        acknowledged
      });
      
      this.update();
    });
    
    // Operation plan updates
    this.socket.on('operationplan', () => {
      this.fetchPlans(true);
    });
    
    // UAS zone updates
    this.socket.on('uas', () => {
      this.fetchUAS(true);
    });
    
    // Telemetry updates
    this.socket.on('telemetry', (data: any[]) => {
      const [id, name, createdAt, lat, lng, velocity, altitudeMeters, type, icon, opacity] = data;
      
      // Remove old telemetry for this entity
      const existing = this.DATA.telemetryLookup[name];
      if (existing) {
        const index = this.DATA.telemetry.indexOf(existing);
        if (index !== -1) {
          this.DATA.telemetry.splice(index, 1);
        }
      }
      
      // Add new telemetry
      const telemetry = {
        _id: id,
        name,
        createdAt,
        latitude: lat,
        longitude: lng,
        velocity,
        altitudeMeters,
        type,
        icon,
        opacity
      };
      
      this.DATA.telemetryLookup[name] = telemetry;
      this.DATA.telemetry.push(telemetry);
      
      // Update map (throttled)
      this.updateTelemetryLayer();
    });
  }
  
  updateTelemetryLayer() {
    if (this.updatingTelemetry) return;
    
    this.updatingTelemetry = requestAnimationFrame(() => {
      this.updatingTelemetry = null;
      
      const source = this.map.getSource('telemetry');
      if (!source) return;
      
      source.setData({
        type: 'FeatureCollection',
        features: this.DATA.telemetry.map(t => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [t.longitude, t.latitude]
          },
          properties: {
            name: t.name,
            altitudeMeters: t.altitudeMeters,
            type: t.type,
            speed: t.velocity ? calculateSpeed(t.velocity) : null,
            bearing: t.velocity ? calculateBearing(t) : null,
            visibleData: formatTelemetryLabel(t),
            icon: t.icon,
            opacity: t.opacity
          }
        }))
      });
    });
  }
}
```

### 5. Data Cleanup

```typescript
/**
 * Automatic data cleanup
 * Interval: 1 second
 * Removes stale data
 */
setInterval(() => {
  const now = Date.now();
  
  // Remove alerts older than 1 hour
  for (let i = 0; i < this.DATA.alerts.length; i++) {
    if (this.DATA.alerts[i].createdAt < now - 3600000) {
      this.DATA.alerts.splice(i--, 1);
    }
  }
  
  // Remove telemetry older than 1 minute
  for (let i = 0; i < this.DATA.telemetry.length; i++) {
    if (this.DATA.telemetry[i].createdAt < now - 60000) {
      this.DATA.telemetry.splice(i--, 1);
    }
  }
}, 1000);
```

## Request Headers

All fetch requests include:

```typescript
const headers = {
  'x-id': await getUserId() // User/session identifier
};
```

## Error Handling

```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
} catch (error) {
  console.error('Failed to fetch:', error);
  // Retry after 5 seconds
  setTimeout(() => this.fetch(), 5000);
}
```

## Summary

The data fetching system uses:
- **60-second polling** for all data sources
- **5-second throttling** to prevent excessive requests
- **Socket.IO** for real-time updates
- **Automatic retry** on errors
- **Data cleanup** to prevent memory leaks
- **User ID tracking** via x-id header
