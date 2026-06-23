declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

/**
 * Helper to determine if Meta Pixel tracking should be enabled.
 * Excludes localhost, 127.0.0.1, AI Studio preview environments (*.run.app), and cloud development containers.
 * This guarantees Pixel events are ONLY sent from the deployed/live (Vercel) URL.
 */
export const isTrackingAllowed = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return !(
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    hostname.includes("run.app") ||
    hostname.includes("webcontainer") ||
    hostname.includes("stackblitz")
  );
};

/**
 * Dynamically injects and initializes the Meta Pixel script.
 * Uses a non-blocking localStorage cache to eliminate any startup fetch latency.
 * Falls back to environment variables or the default ID.
 */
export const initMetaPixel = () => {
  if (typeof window === "undefined") return;

  // Verify hostname to avoid polluting production pixel events during testing/development environment
  if (!isTrackingAllowed()) {
    console.log(`[Meta Pixel] Bypassing initialization on dev/preview domain: "${window.location.hostname}". Events will only fire on your deployed (Vercel) URL.`);
    return;
  }

  // 1. Get cached Pixel ID instantly from localStorage or fallback to Env/Hardcoded default
  const cachedPixelId = localStorage.getItem("meta_pixel_id_cache");
  const envPixelId = import.meta.env.VITE_META_PIXEL_ID;
  const defaultFallbackId = '4024543217840998';
  
  const initialPixelId = cachedPixelId || envPixelId || defaultFallbackId;

  // 2. Initialize the Pixel immediately with the initial ID to prevent any blocking/delay
  runPixelScriptInjection(initialPixelId);

  // 3. Fire-and-forget background fetch to update the cache with any runtime DB changes
  fetch("/api/settings")
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error("Failed to fetch settings from DB");
    })
    .then((settings) => {
      if (settings && settings.meta_pixel_id) {
        const freshPixelId = settings.meta_pixel_id.trim();
        
        // If the dynamic/admin ID changed, update the cache
        if (freshPixelId !== cachedPixelId) {
          localStorage.setItem("meta_pixel_id_cache", freshPixelId);
          console.log(`[Meta Pixel Cache] Updated cached Pixel ID to: ${freshPixelId}. This will load instantly on the next page view.`);
          
          // If the page doesn't have fbq yet or was initialized with a different fallback, re-init
          if (!window.fbq || window.fbq.instanceId !== freshPixelId) {
            console.log(`[Meta Pixel] Re-initializing with updated ID: ${freshPixelId}`);
            runPixelScriptInjection(freshPixelId);
          }
        }
      }
    })
    .catch((err) => {
      console.warn("[Meta Pixel Cache] Could not fetch remote settings, using default/cached values:", err);
    });
};

/**
 * Handles the actual injection/initialization logic for the Facebook Pixel script.
 */
function runPixelScriptInjection(pixelId: string) {
  if (!pixelId) return;

  try {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    // Custom property to keep track of initialized ID
    if (window.fbq) {
      window.fbq.instanceId = pixelId;
    }

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    console.log("[Meta Pixel] Initialized/Synced tracking with Pixel ID:", pixelId);
  } catch (error) {
    console.error("Error during Meta Pixel script injection:", error);
  }
}

/**
 * Tracks standard Page View event.
 */
export const trackPixelPageView = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

/**
 * Tracks custom or standard Meta Pixel events.
 * 
 * @param eventName Standard Meta Pixel event name (e.g. Purchase, InitiateCheckout, Lead, ViewContent)
 * @param data Optional event properties
 */
export const trackPixelEvent = (eventName: string, data?: any) => {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      if (data) {
        window.fbq('track', eventName, data);
      } else {
        window.fbq('track', eventName);
      }
    } catch (error) {
      console.error(`Error tracking Meta Pixel event ${eventName}:`, error);
    }
  }
};

/**
 * Standard product view content
 */
export const trackPixelViewContent = (name: string, type: string, value?: number) => {
  trackPixelEvent('ViewContent', {
    content_name: name,
    content_category: type,
    value: value || 0,
    currency: 'NGN'
  });
};

/**
 * Standard Checkout Start Event
 */
export const trackPixelInitiateCheckout = (itemName: string, type: string) => {
  trackPixelEvent('InitiateCheckout', {
    content_name: itemName,
    content_category: type,
    currency: 'NGN'
  });
};

/**
 * Standard Completed Purchase Event
 */
export const trackPixelPurchase = (itemName: string, amount: number) => {
  trackPixelEvent('Purchase', {
    content_name: itemName,
    value: amount,
    currency: 'NGN'
  });
};

/**
 * Standard Lead Event (for consultation requests)
 */
export const trackPixelLead = (illness: string) => {
  trackPixelEvent('Lead', {
    content_category: 'Consultation',
    content_name: illness
  });
};
