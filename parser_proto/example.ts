/**
 * Complete Integration Example - Putting it all together
 * 
 * This demonstrates how to use all the extracted components
 * exactly as utm.eans.ee does
 */

import * as turf from '@turf/turf';
import { fetchUAS, updateUASSource, type UASGeoJSON } from './fetchUAS';
import { createRouteArea, type DrawingPoint } from './routeArea';
import { getIntersectingZones, findZonesAtPoint } from './intersections';
import { sortUASFeatures } from './sorting';
import { COLORS, getRestrictionColor } from './colors';
import { UAS_LAYERS, createUASSource } from './layers';

/**
 * Example: Initialize map with UAS layers
 */
export async function initializeMap(map: any) {
    // Add UAS source
    map.addSource('uas', createUASSource());

    // Add all UAS layers in correct order
    UAS_LAYERS.forEach(layer => {
        map.addLayer(layer);
    });

    // Fetch and display initial data
    const uasData = await fetchUAS();
    updateUASSource(map, uasData);

    return uasData;
}

/**
 * Example: Check route for conflicts
 */
export async function checkRouteConflicts(
    drawingPoints: DrawingPoint[],
    drawingMode: 'circle' | 'line' | 'polygon',
    bufferMeters: number
): Promise<any[]> {
    // 1. Create route area with buffer
    const { routeArea } = createRouteArea({
        currentDrawing: drawingPoints,
        drawingMode,
        buffer: bufferMeters
    });

    // 2. Fetch UAS data
    const uasData = await fetchUAS();

    // 3. Find intersecting zones
    const conflicts = getIntersectingZones(routeArea, uasData);

    // 4. Sort by priority
    sortUASFeatures(conflicts);

    return conflicts;
}

/**
 * Example: Handle map click to show zone info
 */
export async function handleMapClick(
    lngLat: { lng: number; lat: number }
): Promise<any[]> {
    // Fetch UAS data
    const uasData = await fetchUAS();

    // Find zones at click point
    const zones = findZonesAtPoint(lngLat, uasData);

    // Sort by priority
    sortUASFeatures(zones);

    return zones;
}

/**
 * Example: Display zone information
 */
export function displayZoneInfo(zone: any): string {
    const { name, restriction, lowerMeters, upperMeters, reason } = zone.properties;
    const color = getRestrictionColor(restriction);

    return `
    <div style="border-left: 4px solid ${color}; padding-left: 8px;">
      <strong>${name || 'Unnamed Zone'}</strong>
      ${reason ? `<br/>(${reason})` : ''}
      <br/>Restriction: ${restriction}
      <br/>Altitude: ${lowerMeters}m → ${upperMeters}m
    </div>
  `;
}

/**
 * Example: Complete flight planning workflow
 */
export async function planFlight(
    route: DrawingPoint[],
    mode: 'circle' | 'line' | 'polygon',
    bufferMeters: number = 50
) {
    console.log('=== Flight Planning Workflow ===');

    // Step 1: Create route area
    console.log('1. Creating route area...');
    const { routeArea, route: routeGeometry } = createRouteArea({
        currentDrawing: route,
        drawingMode: mode,
        buffer: bufferMeters
    });

    if (!routeArea) {
        console.log('No route defined');
        return;
    }

    // Step 2: Fetch UAS zones
    console.log('2. Fetching UAS zones...');
    const uasData = await fetchUAS();
    console.log(`   Found ${uasData.features.length} zones`);

    // Step 3: Find conflicts
    console.log('3. Checking for conflicts...');
    const conflicts = getIntersectingZones(routeArea, uasData);
    console.log(`   Found ${conflicts.length} intersecting zones`);

    // Step 4: Sort by priority
    console.log('4. Sorting conflicts by priority...');
    sortUASFeatures(conflicts);

    // Step 5: Analyze conflicts
    console.log('5. Analyzing conflicts:');
    const prohibited = conflicts.filter(z => z.properties.restriction === 'PROHIBITED');
    const reqAuth = conflicts.filter(z => z.properties.restriction === 'REQ_AUTHORISATION');
    const conditional = conflicts.filter(z => z.properties.restriction === 'CONDITIONAL');

    console.log(`   - PROHIBITED: ${prohibited.length}`);
    console.log(`   - REQ_AUTHORISATION: ${reqAuth.length}`);
    console.log(`   - CONDITIONAL: ${conditional.length}`);

    // Step 6: Return result
    return {
        routeArea,
        routeGeometry,
        conflicts,
        canFly: prohibited.length === 0,
        needsAuthorization: reqAuth.length > 0 || conditional.length > 0
    };
}

/**
 * Example usage:
 * 
 * // Define a simple route
 * const route: DrawingPoint[] = [
 *   { lng: 24.7266, lat: 59.4511 },
 *   { lng: 24.7366, lat: 59.4611 },
 *   { lng: 24.7466, lat: 59.4511 }
 * ];
 * 
 * // Plan the flight
 * const result = await planFlight(route, 'line', 50);
 * 
 * if (result.canFly) {
 *   console.log('✓ Flight approved');
 * } else {
 *   console.log('✗ Flight conflicts with prohibited zones');
 * }
 */
