/**
 * Color Mapping - EXACT implementation from utm.eans.ee
 * 
 * window.COLORS and MapLibre style expressions from main.js
 * This is their OFFICIAL color scheme!
 */

export type RestrictionType = 'NO_RESTRICTION' | 'CONDITIONAL' | 'REQ_AUTHORISATION' | 'PROHIBITED';

/**
 * EXACT color sanitization from utm.eans.ee
 * 
 * Removes all spaces from color strings before processing.
 * 
 * @param color - Color string (hex, rgb, hsl)
 * @returns Sanitized color string
 */
export function sanitizeColor(color: string): string {
    return color.replace(/ /g, "");
}

/**
 * EXACT theme inversion logic (Invisible Logic)
 * 
 * For the EANS dark theme, the system performs a lightness inversion on HSL colors.
 * This is handled by the internal `rt` function.
 */
export function formatHSLWithInversion(h: number, s: number, l: number, isDarkTheme: boolean = true): string {
    const finalLightness = isDarkTheme ? (1 - (l / 100)) * 100 : l;
    return `hsl(${h}, ${s}%, ${finalLightness}%)`;
}

/**
 * EXACT Bilinear Lightness Interpolation
 * Logic from HSL-to-RGB conversion in main.js
 * 
 * Handles the lightness threshold for saturation scaling.
 */
export function bilinearInterpolateLightness(u: number, l: number): number {
    return u <= 0.5 ? u * (l + 1) : u + l - u * l;
}

/**
 * Official color mapping for UAS zone restrictions
 * 
 * EXACT values from window.COLORS in main.js
 */
export const COLORS: Record<RestrictionType, string> = {
    NO_RESTRICTION: 'hsl(120, 50%, 40%)',
    CONDITIONAL: 'hsl(90, 65%, 40%)',
    REQ_AUTHORISATION: 'hsl(60, 65%, 40%)',
    PROHIBITED: 'hsl(0, 100%, 52.5%)'
};

/**
 * Gets color for a restriction type
 */
export function getRestrictionColor(restriction: RestrictionType): string {
    return COLORS[restriction];
}

/**
 * MapLibre GL style expression for fill color
 * 
 * EXACT expression from main.js layer definition
 */
export const FILL_COLOR_EXPRESSION = [
    'match',
    ['get', 'restriction'],
    'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
    'PROHIBITED', 'hsl(0, 100%, 52.5%)',
    'CONDITIONAL', 'hsl(90, 65%, 40%)',
    'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
    'hsl(90, 65%, 40%)' // Default
];

/**
 * MapLibre GL style expression for line color
 * 
 * EXACT expression from main.js layer definition
 */
export const LINE_COLOR_EXPRESSION = [
    'match',
    ['get', 'restriction'],
    'NO_RESTRICTION', 'hsl(120, 50%, 40%)',
    'PROHIBITED', 'hsl(0, 100%, 52.5%)',
    'CONDITIONAL', 'hsl(90, 65%, 40%)',
    'REQ_AUTHORISATION', 'hsl(60, 65%, 40%)',
    'hsl(90, 65%, 40%)' // Default
];

/**
 * Fill opacity for UAS zones
 * 
 * EXACT value from main.js (const $e = .15)
 */
export const FILL_OPACITY = 0.15;

/**
 * Fill opacity expression with hidden feature support
 * 
 * EXACT expression from main.js
 */
export const FILL_OPACITY_EXPRESSION = [
    'case',
    ['==', ['get', 'hidden'], true],
    0,
    FILL_OPACITY
];

/**
 * Line opacity expression with hidden feature support
 * 
 * EXACT expression from main.js
 */
export const LINE_OPACITY_EXPRESSION = [
    'case',
    ['==', ['get', 'hidden'], true],
    0,
    1
];

/**
 * Alternative color scheme for AustroControl theme
 * 
 * From ot() function in main.js
 */
export const AUSTROCONTROL_COLORS: Record<RestrictionType, string> = {
    NO_RESTRICTION: 'hsl(196, 48%, 49%)',
    CONDITIONAL: 'hsl(209, 100%, 20%)',
    REQ_AUTHORISATION: 'hsl(38, 93%, 48%)',
    PROHIBITED: 'hsl(1, 98%, 55%)'
};

/**
 * Gets color scheme based on theme
 */
export function getColorScheme(theme: string = 'default'): Record<RestrictionType, string> {
    const scheme = theme === 'austrocontrol' ? AUSTROCONTROL_COLORS : COLORS;
    const isDarkTheme = theme !== 'light'; // Simple heuristic found in main.js

    const processedScheme: any = {};
    for (const key in scheme) {
        const rawColor = scheme[key as RestrictionType];

        // Match HSL values for inversion
        const hslMatch = rawColor.match(/hsl\((\d+),\s*(\d+)%,\s*([\d.]+)%\)/);
        if (hslMatch && isDarkTheme) {
            const h = parseInt(hslMatch[1]);
            const s = parseInt(hslMatch[2]);
            const l = parseFloat(hslMatch[3]);
            processedScheme[key] = sanitizeColor(formatHSLWithInversion(h, s, l, true));
        } else {
            processedScheme[key] = sanitizeColor(rawColor);
        }
    }
    return processedScheme;
}
