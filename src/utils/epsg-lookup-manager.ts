/**
 * EPSG Lookup Worker Manager
 * 
 * Manages the lifecycle of the EPSG lookup web worker:
 * - Lazy initialization on first use
 * - Automatic cleanup after idle timeout
 * - Promise-based API for easy integration
 */

declare const __WEBMAPX_VERSION__: string;
const DATA_BASE_URL = typeof __WEBMAPX_VERSION__ !== 'undefined'
  ? `https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@${__WEBMAPX_VERSION__}/public`
  : '';

export interface EpsgLookupResult {
  success: boolean;
  countryCode?: string;
  countryName?: string;
  epsgCodes?: string[];
  primaryEpsg?: string;
  alternativeMatches?: Array<{countryCode: string; countryName: string; epsgCodes: string[]; primaryEpsg: string}>;
  error?: string;
}

interface PendingRequest {
  resolve: (result: EpsgLookupResult) => void;
  reject: (error: Error) => void;
}

const DEFAULT_IDLE_TIMEOUT = 60000; // 1 minute

class EpsgLookupWorkerManager {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestCounter: number = 0;
  private idleTimeout: number | null = null;
  private idleTimeoutMs: number = DEFAULT_IDLE_TIMEOUT;
  
  /**
   * Set the idle timeout duration in milliseconds
   */
  setIdleTimeout(timeoutMs: number): void {
    this.idleTimeoutMs = timeoutMs;
  }
  
  /**
   * Initialize the worker and load data
   */
  private async initialize(): Promise<void> {
    // If already initializing, return existing promise
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // If already ready, return immediately
    if (this.isReady && this.worker) {
      return Promise.resolve();
    }
    
    this.isInitializing = true;
    
    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create worker - Vite will handle the worker bundling
        this.worker = new Worker(
          new URL('../workers/epsg-lookup.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Set up unified message handler that handles both init and ongoing messages
        this.worker.onmessage = (event: MessageEvent) => {
          const message = event.data;
          
          // Handle initialization messages
          if (message.type === 'worker-initialized') {
            // Worker is ready, now load the data using relative path
            this.worker?.postMessage({
              type: 'loadData',
              baseUrl: DATA_BASE_URL
            });
          } else if (message.type === 'ready') {
            if (message.success) {
              this.isReady = true;
              this.isInitializing = false;
              this.resetIdleTimeout();
              resolve();
            } else {
              this.isInitializing = false;
              this.cleanup();
              reject(new Error(message.error || 'Failed to load data'));
            }
          } else {
            // Handle ongoing lookup messages
            this.handleWorkerMessage(event);
          }
        };
        
        // Set up error handler
        this.worker.onerror = (error) => {
          console.error('EPSG Lookup Worker error:', error);
          this.cleanup();
          reject(new Error('Worker initialization failed'));
        };
        
        // Set timeout for initialization
        setTimeout(() => {
          if (this.isInitializing) {
            this.cleanup();
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000);
        
      } catch (error) {
        this.isInitializing = false;
        this.cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const message = event.data;
    
    if (message.type === 'lookup-result') {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        this.pendingRequests.delete(message.requestId);
        
        const result: EpsgLookupResult = {
          success: message.success,
          countryCode: message.countryCode,
          countryName: message.countryName,
          epsgCodes: message.epsgCodes,
          primaryEpsg: message.primaryEpsg,
          alternativeMatches: message.alternativeMatches,
          error: message.error
        };
        
        pending.resolve(result);
        
        // Reset idle timeout after each successful request
        this.resetIdleTimeout();
      }
    }
  }
  
  /**
   * Reset the idle timeout
   */
  private resetIdleTimeout(): void {
    // Clear existing timeout
    if (this.idleTimeout !== null) {
      clearTimeout(this.idleTimeout);
    }
    
    // Set new timeout
    this.idleTimeout = window.setTimeout(() => {
      this.cleanup();
    }, this.idleTimeoutMs);
  }
  
  /**
   * Look up EPSG codes for given coordinates
   */
  async lookup(lat: number, lng: number): Promise<EpsgLookupResult> {
    try {
      // Initialize worker if needed
      if (!this.isReady) {
        await this.initialize();
      }
      
      if (!this.worker) {
        throw new Error('Worker not available');
      }
      
      // Generate request ID
      const requestId = `req_${++this.requestCounter}_${Date.now()}`;
      
      // Create promise for this request
      const promise = new Promise<EpsgLookupResult>((resolve, reject) => {
        this.pendingRequests.set(requestId, { resolve, reject });
        
        // Set timeout for request
        setTimeout(() => {
          const pending = this.pendingRequests.get(requestId);
          if (pending) {
            this.pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }
        }, 5000);
      });
      
      // Send lookup request to worker
      this.worker.postMessage({
        type: 'lookup',
        lat,
        lng,
        requestId
      });
      
      return await promise;
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Manually cleanup the worker
   */
  cleanup(): void {
    // Clear idle timeout
    if (this.idleTimeout !== null) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    
    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      pending.reject(new Error('Worker terminated'));
    });
    this.pendingRequests.clear();
    
    // Send shutdown message to worker
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'shutdown' });
      } catch (_e) {
        // Worker might already be terminated
      }
      
      // Terminate worker
      this.worker.terminate();
      this.worker = null;
    }
    
    this.isReady = false;
    this.isInitializing = false;
    this.initPromise = null;
  }
  
  /**
   * Check if worker is ready
   */
  get ready(): boolean {
    return this.isReady;
  }
}

// Export singleton instance
export const epsgLookupManager = new EpsgLookupWorkerManager();
