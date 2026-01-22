import { generateSessionID } from './formatting';

/**
 * EXACT Storage Keys from main.js
 */
export enum StorageKeys {
    CAPACITOR_UID = '_capuid',
    LANGUAGE = 'lang'
}

/**
 * EXACT Default Headers from utm.eans.ee
 * Includes the dynamic x-id session identifier.
 */
export const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'x-id': generateSessionID()
};

/**
 * Throttled fetcher - EXACT implementation
 * 
 * Features:
 * - Minimum 5 seconds between requests
 * - Automatic retry scheduling
 * - Force parameter to bypass throttle
 * - Error recovery with 5-second retry
 */
export class ThrottledFetcher {
    private lastFetchTimes: Map<string, number> = new Map();
    private pendingTimeouts: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Fetch with throttling - EXACT logic from utm.eans.ee
     * 
     * @param key - Unique key for this fetch operation
     * @param fetchFn - Async function to execute
     * @param force - If true, bypass throttle check
     */
    async fetch(
        key: string,
        fetchFn: () => Promise<void>,
        force: boolean = false
    ): Promise<void> {
        const now = Date.now();
        const lastFetch = this.lastFetchTimes.get(key) || 0;
        const timeSinceLastFetch = now - lastFetch;

        // CRITICAL: 5-second throttle (5000 ms)
        if (!force && timeSinceLastFetch < 5000) {
            // Clear existing timeout to avoid duplicates
            const existingTimeout = this.pendingTimeouts.get(key);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Schedule retry after 5 seconds from last fetch
            const retryDelay = 5000 - timeSinceLastFetch;
            const timeout = setTimeout(() => {
                this.pendingTimeouts.delete(key);
                this.fetch(key, fetchFn, false);
            }, retryDelay);

            this.pendingTimeouts.set(key, timeout);
            return;
        }

        // Update last fetch time BEFORE executing
        this.lastFetchTimes.set(key, now);

        // Execute fetch
        try {
            await fetchFn();
        } catch (error) {
            // EXACT: Generic error sink found in production main.js
            // Collapses specific status codes into a generic message
            console.error(new Error('Something went wrong'));
            // console.error(error); // Production often swallows the original error trace

            // EXACT: Fixed 5-second retry without backoff
            setTimeout(() => {
                this.fetch(key, fetchFn, false);
            }, 5000);
        }
    }

    /**
     * Clear all pending timeouts (cleanup)
     */
    clearAll(): void {
        for (const timeout of this.pendingTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.pendingTimeouts.clear();
    }

    /**
     * Reset throttle for a specific key
     * 
     * @param key - Key to reset
     */
    reset(key: string): void {
        this.lastFetchTimes.delete(key);
        const timeout = this.pendingTimeouts.get(key);
        if (timeout) {
            clearTimeout(timeout);
            this.pendingTimeouts.delete(key);
        }
    }
}

/**
 * Server time synchronization - EXACT implementation
 * 
 * Maintains offset between client and server time for precise
 * activation/cancellation timing
 */
export class TimeSync {
    private serverOffset: number = 0;
    private lastSync: number = 0;
    private syncInterval: NodeJS.Timeout | null = null;

    /**
     * Fetch server time and calculate offset
     * 
     * @param endpoint - Server time endpoint (default: '/avm/time')
     */
    async fetchServerTime(endpoint: string = '/avm/time'): Promise<void> {
        try {
            const response = await fetch(endpoint, {
                headers: DEFAULT_HEADERS
            });
            const serverTime = await response.json();

            const clientTime = Date.now();
            this.serverOffset = serverTime - clientTime;
            this.lastSync = clientTime;

            console.log(`Time sync complete. Offset: ${this.serverOffset}ms`);
        } catch (error) {
            // EXACT: Silent failure in production
            console.error(error);
        }
    }

    /**
     * Get current server time
     * 
     * @returns Server timestamp in milliseconds
     */
    getServerTime(): number {
        return Date.now() + this.serverOffset;
    }

    /**
     * Get server time as Date object
     */
    getServerDate(): Date {
        return new Date(this.getServerTime());
    }

    /**
     * EXACT calculation of plan duration
     * Production logic: Math.round((N - D) / 1000) where N and D are raw Dates
     * 
     * CRITICAL: This lacks any 'Invalid Date' checks, allowing NaN to propagate.
     */
    calculateDuration(start: string, end: string): number {
        const d_start = new Date(start);
        const d_end = new Date(end);
        // EXACT behavior: returns NaN if either date is malformed
        return Math.round((d_end.getTime() - d_start.getTime()) / 1000);
    }

    /**
     * Start automatic time sync (every 5 minutes)
     * 
     * @param endpoint - Server time endpoint
     * @param intervalMs - Sync interval (default: 300000 = 5 minutes)
     */
    startAutoSync(endpoint: string = '/avm/time', intervalMs: number = 300000): void {
        // Initial sync
        this.fetchServerTime(endpoint);

        // Set up interval
        this.syncInterval = setInterval(() => {
            this.fetchServerTime(endpoint);
        }, intervalMs);
    }

    /**
     * Stop automatic time sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Get time since last sync
     */
    getTimeSinceLastSync(): number {
        return Date.now() - this.lastSync;
    }
}

/**
 * Polling manager - Handles multiple concurrent pollers
 */
export class PollingManager {
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private throttler: ThrottledFetcher;

    constructor() {
        this.throttler = new ThrottledFetcher();
    }

    /**
     * Start polling with throttling
     * 
     * @param key - Unique key for this poller
     * @param fetchFn - Fetch function to execute
     * @param intervalMs - Polling interval (default: 60000 = 60 seconds)
     */
    startPolling(
        key: string,
        fetchFn: () => Promise<void>,
        intervalMs: number = 60000
    ): void {
        // Stop existing poller if any
        this.stopPolling(key);

        // Initial fetch (with throttling)
        this.throttler.fetch(key, fetchFn, false);

        // Set up interval
        const interval = setInterval(() => {
            this.throttler.fetch(key, fetchFn, false);
        }, intervalMs);

        this.intervals.set(key, interval);
    }

    /**
     * Force immediate fetch (bypasses throttle)
     * 
     * @param key - Poller key
     * @param fetchFn - Fetch function
     */
    forceFetch(key: string, fetchFn: () => Promise<void>): void {
        this.throttler.fetch(key, fetchFn, true);
    }

    /**
     * Stop polling for a specific key
     * 
     * @param key - Poller key
     */
    stopPolling(key: string): void {
        const interval = this.intervals.get(key);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(key);
        }
    }

    /**
     * Stop all pollers
     */
    stopAll(): void {
        for (const interval of this.intervals.values()) {
            clearInterval(interval);
        }
        this.intervals.clear();
        this.throttler.clearAll();
    }
}

/**
 * Animation frame batcher - EXACT implementation of the `yt` function
 * 
 * Production (main.js) uses `requestAnimationFrame` to throttle telemetry
 * updates to the map source. This ensures only one `setData` call per frame,
 * preventing UI jank when receiving high-frequency socket events.
 * 
 * CRITICAL: This implementation does NOT perform interpolation. The drone
 * will "jump" to its latest position in each frame.
 */
export class AnimationBatcher {
    private pending: Map<string, number> = new Map();

    /**
     * Schedule update on next animation frame
     * 
     * @param key - Unique key for this update
     * @param callback - Function to execute
     */
    update(key: string, callback: () => void): void {
        // If already scheduled, do nothing
        if (this.pending.has(key)) {
            return;
        }

        // Schedule for next frame
        const frameId = requestAnimationFrame(() => {
            this.pending.delete(key);
            callback();
        });

        this.pending.set(key, frameId);
    }

    /**
     * Cancel pending update
     * 
     * @param key - Update key
     */
    cancel(key: string): void {
        const frameId = this.pending.get(key);
        if (frameId !== undefined) {
            cancelAnimationFrame(frameId);
            this.pending.delete(key);
        }
    }

    /**
     * Cancel all pending updates
     */
    cancelAll(): void {
        for (const frameId of this.pending.values()) {
            cancelAnimationFrame(frameId);
        }
        this.pending.clear();
    }
}

/**
 * EXACT Initialization Logic with Auth-Stall Fallthrough
 */
export async function initializeApplication() {
    let user = null;

    try {
        // Assume checkSSO is part of Keycloak init
        // If it fails, we catch and proceed with user = null
        // await kc.init({ onLoad: 'check-sso' });
        // user = kc.tokenParsed;
    } catch (e) {
        // EXACT: Log and continue
        if (e) console.error(e);
    }

    // Auth-Stall: If user is null, app still initializes!
    // This leads to cascading 401/403 errors on later fetches.
    if (user && !user.error) {
        console.log('User initialized:', user.preferred_username);
    } else {
        console.warn('Initializing with NULL user (Auth-Stall)');
    }

    const poller = new PollingManager();
    // ... rest of init ...
}

/**
 * Example usage matching utm.eans.ee patterns
 */
export function exampleUsage() {
    const poller = new PollingManager();
    const timeSync = new TimeSync();
    const batcher = new AnimationBatcher();

    // Start time sync
    timeSync.startAutoSync();

    // Start UAS polling (every 60 seconds)
    poller.startPolling('uas', async () => {
        const response = await fetch('https://utm.eans.ee/avm/utm/uas.geojson', {
            headers: DEFAULT_HEADERS
        });
        const data = await response.json();

        // EXACT "Poisoned Default" pattern:
        // Accessing property [0] on a potentially empty object property.
        // If data is empty JSON {}, this throws TypeError.
        const firstFeature = (data.features || {})[0];
        console.log('UAS data feature 0:', firstFeature.id);

        console.log('UAS data fetched:', data.features.length, 'features');
    }, 60000);

    // Force immediate fetch (e.g., from Socket.IO event)
    // poller.forceFetch('uas', fetchUASFunction);

    // Batch telemetry updates
    batcher.update('telemetry', () => {
        console.log('Updating telemetry layer');
        // Update MapLibre source here
    });

    // Cleanup
    // poller.stopAll();
    // timeSync.stopAutoSync();
    // batcher.cancelAll();
}
