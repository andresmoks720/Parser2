/**
 * MapLibre Layer Definitions - EXACT implementation from utm.eans.ee
 * 
 * Layer configuration from main.js - these are the OFFICIAL layer definitions
 */

import { FILL_COLOR_EXPRESSION, LINE_COLOR_EXPRESSION, FILL_OPACITY, FILL_OPACITY_EXPRESSION, LINE_OPACITY_EXPRESSION } from './colors';

/**
 * UAS fills layer (low altitude < 120m)
 * 
 * EXACT layer definition from main.js
 */
export const UAS_FILLS_LAYER = {
    id: 'uas-fills',
    type: 'fill' as const,
    source: 'uas',
    paint: {
        'fill-color': FILL_COLOR_EXPRESSION,
        'fill-opacity': FILL_OPACITY_EXPRESSION
    },
    filter: [
        'all',
        ['<', 'lowerMeters', 120],
        ['!has', 'fillColor']
    ]
};

/**
 * UAS fills layer with custom colors
 * 
 * EXACT layer definition from main.js
 */
export const UAS_FILLS_CUSTOM_LAYER = {
    id: 'uas-fills-custom',
    type: 'fill' as const,
    source: 'uas',
    paint: {
        'fill-color': ['get', 'fillColor']
    },
    filter: [
        'all',
        ['<', 'lowerMeters', 120],
        ['has', 'fillColor']
    ]
};

/**
 * UAS fills layer (high altitude >= 120m)
 * 
 * EXACT layer definition from main.js
 */
export const UAS_HIGH_FILLS_LAYER = {
    id: 'uas-high-fills',
    type: 'fill' as const,
    source: 'uas',
    paint: {
        'fill-color': FILL_COLOR_EXPRESSION,
        'fill-opacity': [
            'case',
            ['==', ['get', 'hidden'], true],
            0,
            FILL_OPACITY / 3 // Reduced opacity for high altitude
        ]
    },
    filter: [
        'all',
        ['>=', 'lowerMeters', 120],
        ['!has', 'fillColor']
    ]
};

/**
 * UAS lines layer (becoming active - dashed)
 * 
 * EXACT layer definition from main.js
 */
export const UAS_LINES_BECOMING_ACTIVE_LAYER = {
    id: 'uas-lines-becomingactive',
    type: 'line' as const,
    source: 'uas',
    paint: {
        'line-color': LINE_COLOR_EXPRESSION,
        'line-width': 1.5,
        'line-dasharray': [2, 3],
        'line-opacity': LINE_OPACITY_EXPRESSION
    },
    filter: ['==', 'becomingActive', true]
};

/**
 * UAS lines layer (active - solid)
 * 
 * EXACT layer definition from main.js
 */
export const UAS_LINES_LAYER = {
    id: 'uas-lines',
    type: 'line' as const,
    source: 'uas',
    paint: {
        'line-color': LINE_COLOR_EXPRESSION,
        'line-width': 1.5,
        'line-opacity': LINE_OPACITY_EXPRESSION
    },
    filter: [
        'all',
        ['!=', 'becomingActive', true],
        ['<', 'lowerMeters', 120],
        ['!has', 'strokeColor']
    ]
};

/**
 * UAS symbols layer (labels)
 * 
 * EXACT layer definition from main.js
 */
export const UAS_SYMBOLS_LAYER = {
    id: 'uas-symbols',
    type: 'symbol' as const,
    source: 'uas',
    layout: {
        'text-field': '{name} ({reason})',
        'text-font': ['Inter SemiBold'],
        'text-size': 8,
        'text-offset': [0, 1],
        'symbol-placement': 'line' as const
    },
    minzoom: 4,
    paint: {
        'text-color': '#000',
        'text-halo-color': 'hsl(0, 0%, 90%)',
        'text-halo-width': 1,
        'text-opacity': LINE_OPACITY_EXPRESSION
    },
    filter: ['<', 'lowerMeters', 120]
};

/**
 * EXACT highlight layer configuration
 * 
 * Displayed when a feature is selected or hovered.
 */
export const HIGHLIGHT_LAYER: any = {
    id: 'highlight-line',
    type: 'line',
    source: 'highlight',
    paint: {
        'line-color': '#000000',
        'line-opacity': 0.8,
        'line-width': 3
    }
};

/**
 * EXACT icon scaling configuration
 * 
 * Uses zoom-based interpolation for symbol sizes.
 */
export const ICON_SCALING_EXPRESSION = [
    'interpolate',
    ['linear'],
    ['zoom'],
    1, 0.1,
    7, 1.25
];

export const WIND_ICON_SIZE = 0.675;

/**
 * All UAS layers in correct order
 * 
 * EXACT order from main.js
 */
export const UAS_LAYERS: any[] = [
    UAS_FILLS_LAYER,
    UAS_FILLS_CUSTOM_LAYER,
    UAS_HIGH_FILLS_LAYER,
    UAS_LINES_BECOMING_ACTIVE_LAYER,
    UAS_LINES_LAYER,
    UAS_SYMBOLS_LAYER,
    HIGHLIGHT_LAYER,
    {
        id: 'uas-symbols-icons', // Renamed to avoid ID conflict with UAS_SYMBOLS_LAYER
        type: 'symbol',
        source: 'uas',
        layout: {
            'icon-image': ['get', 'icon'],
            'icon-size': ICON_SCALING_EXPRESSION,
            'icon-allow-overlap': true
        }
    }
];

/**
 * Operation Plans symbols layer
 */
export const OPERATION_PLANS_SYMBOLS_LAYER = {
    id: 'operationplans-symbols',
    type: 'symbol' as const,
    source: 'operationplans',
    layout: {
        'text-field': '{name} ({state})',
        'text-font': ['Inter SemiBold'],
        'text-size': 9,
        'symbol-placement': 'line' as const,
        'text-allow-overlap': false,
        'icon-image': ['get', 'icon'],
        'icon-size': ICON_SCALING_EXPRESSION
    }
};

/**
 * Telemetry symbols layer
 * EXACT: icon-allow-overlap is true for safety
 */
export const TELEMETRY_SYMBOLS_LAYER = {
    id: 'telemetry-symbols',
    type: 'symbol' as const,
    source: 'telemetry',
    layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': ICON_SCALING_EXPRESSION,
        'icon-allow-overlap': true,
        'text-field': '{name}\n{label}',
        'text-font': ['Inter SemiBold'],
        'text-size': 8,
        'text-offset': [0, 1.5],
        'text-anchor': 'top' as const
    },
    paint: {
        'icon-opacity': ['get', 'opacity'],
        'text-opacity': ['get', 'opacity'],
        'text-color': '#000',
        'text-halo-color': '#fff',
        'text-halo-width': 1
    }
};

/**
 * EXACT Rendering Stack Order (Bottom-to-Top)
 */
export const FULL_LAYER_STACK = [
    'basemap',
    'clouds',
    'operationplans-fills',
    'operationplans-lines',
    'operationplans-symbols',
    'weather-fills',
    'weather-observations',
    'metars',
    'wind-grid',
    'uas-fills',
    'uas-high-fills',
    'uas-lines',
    'uas-symbols',
    'telemetry-symbols',
    'route-area',
    'route-line',
    'route-point-symbols',
    'highlight-line'
];
