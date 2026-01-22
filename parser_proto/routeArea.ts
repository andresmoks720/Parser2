/**
 * EXACT route area generation from utm.eans.ee
 * 
 * This is a pixel-perfect recreation of the `v(e)` function from main.js
 * 
 * Key features:
 * - Handles point/line/polygon drawing modes
 * - CRITICAL: Segment splitting for line mode to prevent self-intersection
 * - Auto-closes polygons
 * - Meters to kilometers conversion for buffer
 * 
 * @param drawingPoints - Array of [lng, lat] coordinates
 * @param drawingMode - Drawing mode: 'point' | 'line' | 'polygon'
 * @param bufferMeters - Buffer distance in METERS
 * @returns Buffered GeoJSON feature or feature collection
 */

import * as turf from '@turf/turf';

export function createRouteArea(
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

    // EDGE CASE 2: Polygon mode - auto-close the loop
    let coordinates = [...drawingPoints];
    if (drawingMode === 'polygon' && coordinates.length > 2) {
        // Append first point to close the polygon
        coordinates.push(coordinates[0]);
    }

    // EDGE CASE 3: Single point
    if (coordinates.length === 1) {
        const point = turf.point(coordinates[0]);
        // CRITICAL: Buffer conversion meters → kilometers
        return turf.buffer(point, bufferMeters / 1000, { units: 'kilometers' });
    }

    // CRITICAL LOGIC: Line mode uses SEGMENT SPLITTING
    // This prevents self-intersection issues in the buffer calculation
    if (drawingMode === 'line') {
        // Convert single LineString into FeatureCollection of individual segments
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
        // CRITICAL: Buffer conversion meters → kilometers
        const buffered = turf.buffer(
            featureCollection,
            bufferMeters / 1000,
            { units: 'kilometers' }
        );

        return buffered;
    }

    // Polygon mode
    if (drawingMode === 'polygon') {
        const polygon = turf.polygon([coordinates]);
        // CRITICAL: Buffer conversion meters → kilometers
        return turf.buffer(polygon, bufferMeters / 1000, { units: 'kilometers' });
    }

    // Fallback for any other case (shouldn't reach here in normal operation)
    const lineString = turf.lineString(coordinates);
    return turf.buffer(lineString, bufferMeters / 1000, { units: 'kilometers' });
}

/**
 * Calculate midpoints for editing handles - EXACT implementation
 * 
 * Used by the UI to provide drag-and-drop handles between points
 * 
 * @param drawingPoints - Array of [lng, lat] coordinates
 * @returns Array of midpoint coordinates
 */
export function calculateMidpoints(
    drawingPoints: Array<[number, number]>
): Array<[number, number]> {

    if (!drawingPoints || drawingPoints.length < 2) {
        return [];
    }

    const midpoints: Array<[number, number]> = [];

    for (let i = 0; i < drawingPoints.length - 1; i++) {
        const point1 = turf.point(drawingPoints[i]);
        const point2 = turf.point(drawingPoints[i + 1]);
        const midpoint = turf.midpoint(point1, point2);
        midpoints.push(midpoint.geometry.coordinates as [number, number]);
    }

    return midpoints;
}

/**
 * EXACT types matching utm.eans.ee state structure
 */
export interface DrawingState {
    currentDrawing: Array<[number, number]>;
    drawingMode: 'point' | 'line' | 'polygon';
    buffer: number;  // in meters
}

/**
 * Complete route area generation with midpoints
 * 
 * This matches the full state object used in utm.eans.ee
 * 
 * @param state - Drawing state object
 * @returns Object containing buffered area and midpoints
 */
export function createRouteAreaWithMidpoints(state: DrawingState) {
    const routeArea = createRouteArea(
        state.currentDrawing,
        state.drawingMode,
        state.buffer
    );

    const midpoints = calculateMidpoints(state.currentDrawing);

    return {
        routeArea,
        midpoints,
        coordinates: state.currentDrawing,
        mode: state.drawingMode,
        bufferMeters: state.buffer
    };
}
