/**
 * ConstIntel Shopify Tracking Script
 * 
 * This script tracks customer behavior on your Shopify store and sends events
 * to the ConstIntel platform for product intent tracking and customer intelligence.
 * 
 * Installation:
 * 1. Copy this script to your Shopify theme's assets folder
 * 2. Add to theme.liquid: <script src="{{ 'constintel-tracker.js' | asset_url }}" defer></script>
 * 3. Configure API_URL and BRAND_ID below
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  // ⚠️ IMPORTANT: Update these values before using!
  const CONFIG = {
    // Your ConstIntel API URL
    // Examples: 'http://localhost:3000/api' or 'https://your-domain.com/api'
    API_URL: window.CONSTINTEL_API_URL || 'http://localhost:3000/api',
    
    // Your Brand/Store ID (use your store name or a unique identifier)
    // Examples: 'my-shopify-store' or 'store-001'
    BRAND_ID: window.CONSTINTEL_BRAND_ID || 'your-brand-id',
    
    // Enable/disable tracking
    ENABLED: true,
    
    // Debug mode (set to true to see tracking events in console)
    DEBUG: window.CONSTINTEL_DEBUG === 'true' || false,
  };

  // Allow configuration via data attributes on script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-constintel-api]');
  if (scriptTag) {
    if (scriptTag.dataset.constintelApi) CONFIG.API_URL = scriptTag.dataset.constintelApi;
    if (scriptTag.dataset.constintelBrand) CONFIG.BRAND_ID = scriptTag.dataset.constintelBrand;
    if (scriptTag.dataset.constintelDebug) CONFIG.DEBUG = scriptTag.dataset.constintelDebug === 'true';
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Get or create device ID (stored in localStorage)
   */
  function getDeviceId() {
    let deviceId = localStorage.getItem('constintel_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('constintel_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Get customer identifiers from Shopify
   */
  function getCustomerIdentifiers() {
    const identifiers = {
      device_id: getDeviceId(),
    };

    // Try to get customer email from Shopify customer object
    if (typeof window.Shopify !== 'undefined' && window.Shopify.customer) {
      if (window.Shopify.customer.email) {
        identifiers.email = window.Shopify.customer.email;
      }
    }

    // Try to get from meta tags
    const customerEmail = document.querySelector('meta[name="customer-email"]');
    if (customerEmail) {
      identifiers.email = customerEmail.getAttribute('content');
    }

    // Try to get phone number
    const customerPhone = document.querySelector('meta[name="customer-phone"]');
    if (customerPhone) {
      identifiers.phone = customerPhone.getAttribute('content');
    }

    return identifiers;
  }

  /**
   * Get current page type (product, collection, cart, etc.)
   */
  function getPageType() {
    if (window.Shopify && window.Shopify.theme) {
      return window.Shopify.theme.pageType || 'unknown';
    }
    
    // Fallback detection
    if (document.querySelector('[data-product-id]')) return 'product';
    if (document.querySelector('.cart')) return 'cart';
    if (document.querySelector('.collection')) return 'collection';
    if (window.location.pathname.includes('/search')) return 'search';
    return 'other';
  }

  /**
   * Get product information from current page
   */
  function getProductInfo() {
    const productInfo = {
      product_id: null,
      product_name: null,
      category: null,
      price: null,
    };

    // Try to get from Shopify product object
    if (typeof window.Shopify !== 'undefined' && window.Shopify.products) {
      const product = window.Shopify.products[0];
      if (product) {
        productInfo.product_id = product.id?.toString();
        productInfo.product_name = product.title;
        productInfo.category = product.type || product.vendor;
        productInfo.price = product.price ? (product.price / 100).toFixed(2) : null;
      }
    }

    // Fallback: Try to get from data attributes
    const productElement = document.querySelector('[data-product-id]');
    if (productElement && !productInfo.product_id) {
      productInfo.product_id = productElement.getAttribute('data-product-id');
      const nameElement = productElement.querySelector('[data-product-title]') || 
                         productElement.querySelector('h1') ||
                         productElement.querySelector('.product-title');
      if (nameElement) {
        productInfo.product_name = nameElement.textContent.trim();
      }
    }

    // Try to get from meta tags
    const productIdMeta = document.querySelector('meta[property="product:retailer_item_id"]');
    if (productIdMeta && !productInfo.product_id) {
      productInfo.product_id = productIdMeta.getAttribute('content');
    }

    return productInfo;
  }

  /**
   * Get search query from URL
   */
  function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q') || urlParams.get('search');
  }

  /**
   * Track time spent on page
   */
  let pageViewStartTime = Date.now();
  function getViewDuration() {
    return Math.floor((Date.now() - pageViewStartTime) / 1000); // in seconds
  }

  /**
   * Send event to ConstIntel API
   */
  function trackEvent(eventType, payload) {
    if (!CONFIG.ENABLED) return;

    const eventData = {
      brand_id: CONFIG.BRAND_ID,
      event_type: eventType,
      payload: {
        ...payload,
        identifiers: getCustomerIdentifiers(),
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source: 'shopify_web',
      },
    };

    if (CONFIG.DEBUG) {
      console.log('[ConstIntel] Tracking event:', eventType, eventData);
    }

    // Send to API
    fetch(`${CONFIG.API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': CONFIG.BRAND_ID,
      },
      body: JSON.stringify(eventData),
      keepalive: true, // Keep request alive even if page unloads
    })
      .then(response => {
        if (!response.ok && CONFIG.DEBUG) {
          console.warn('[ConstIntel] Event tracking failed:', response.status);
        }
        return response.json();
      })
      .then(data => {
        if (CONFIG.DEBUG) {
          console.log('[ConstIntel] Event tracked:', data);
        }
      })
      .catch(error => {
        if (CONFIG.DEBUG) {
          console.error('[ConstIntel] Error tracking event:', error);
        }
      });
  }

  // ============================================
  // EVENT TRACKERS
  // ============================================

  /**
   * Track product page view
   */
  function trackProductView() {
    const pageType = getPageType();
    if (pageType !== 'product') return;

    const productInfo = getProductInfo();
    if (!productInfo.product_id) return;

    trackEvent('product_view', {
      product_id: productInfo.product_id,
      product_name: productInfo.product_name,
      category: productInfo.category,
      price: productInfo.price,
      view_duration: getViewDuration(),
    });
  }

  /**
   * Track product search
   */
  function trackProductSearch() {
    const searchQuery = getSearchQuery();
    if (!searchQuery) return;

    trackEvent('product_search', {
      search_query: searchQuery,
      page_url: window.location.href,
    });
  }

  /**
   * Track cart addition
   */
  function trackCartAdd(productId, productName, quantity, price) {
    trackEvent('cart_add', {
      product_id: productId,
      product_name: productName,
      quantity: quantity || 1,
      price: price,
    });
  }

  /**
   * Track wishlist addition
   */
  function trackWishlistAdd(productId, productName) {
    trackEvent('wishlist_add', {
      product_id: productId,
      product_name: productName,
    });
  }

  /**
   * Track checkout start
   */
  function trackCheckoutStart() {
    trackEvent('checkout_started', {
      cart_value: getCartValue(),
    });
  }

  /**
   * Get cart value (if available)
   */
  function getCartValue() {
    // Try to get from Shopify cart object
    if (typeof window.Shopify !== 'undefined' && window.Shopify.cart) {
      return window.Shopify.cart.total_price ? (window.Shopify.cart.total_price / 100).toFixed(2) : null;
    }
    return null;
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  /**
   * Initialize tracking
   */
  function init() {
    if (!CONFIG.ENABLED) {
      if (CONFIG.DEBUG) {
        console.log('[ConstIntel] Tracking is disabled');
      }
      return;
    }

    // Track page view on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(trackProductView, 1000); // Wait 1s for page to fully load
        trackProductSearch();
      });
    } else {
      setTimeout(trackProductView, 1000);
      trackProductSearch();
    }

    // Track product view when user scrolls (engagement indicator)
    let scrollTracked = false;
    window.addEventListener('scroll', function() {
      if (!scrollTracked && window.scrollY > 500) {
        scrollTracked = true;
        const pageType = getPageType();
        if (pageType === 'product') {
          const productInfo = getProductInfo();
          if (productInfo.product_id) {
            trackEvent('product_view', {
              product_id: productInfo.product_id,
              product_name: productInfo.product_name,
              category: productInfo.category,
              view_duration: getViewDuration(),
              engaged: true, // User scrolled, showing engagement
            });
          }
        }
      }
    }, { once: true });

    // Track cart additions (listen for AJAX cart updates)
    document.addEventListener('click', function(e) {
      const target = e.target;
      
      // Check if it's an "Add to Cart" button
      if (target.matches('[name="add"]') || 
          target.closest('[name="add"]') ||
          target.matches('.btn-cart, .add-to-cart, [data-add-to-cart]')) {
        
        const form = target.closest('form') || target.closest('[data-product-form]');
        if (form) {
          const productId = form.querySelector('[name="id"]')?.value ||
                           form.getAttribute('data-product-id') ||
                           getProductInfo().product_id;
          
          const productName = getProductInfo().product_name ||
                             form.querySelector('[data-product-title]')?.textContent ||
                             document.querySelector('h1')?.textContent;
          
          const quantity = form.querySelector('[name="quantity"]')?.value || 1;
          const price = getProductInfo().price;

          if (productId) {
            setTimeout(() => {
              trackCartAdd(productId, productName, parseInt(quantity), price);
            }, 500); // Wait for cart to update
          }
        }
      }
    });

    // Track checkout start
    const checkoutButtons = document.querySelectorAll('[name="checkout"], .checkout-button, [href*="/checkout"]');
    checkoutButtons.forEach(button => {
      button.addEventListener('click', function() {
        trackCheckoutStart();
      });
    });

    // Track page visibility changes (user leaves/returns)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        // User left the page - track final view duration
        const pageType = getPageType();
        if (pageType === 'product') {
          const productInfo = getProductInfo();
          if (productInfo.product_id) {
            trackEvent('product_view', {
              product_id: productInfo.product_id,
              product_name: productInfo.product_name,
              view_duration: getViewDuration(),
              page_exit: true,
            });
          }
        }
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', function() {
      const pageType = getPageType();
      if (pageType === 'product') {
        const productInfo = getProductInfo();
        if (productInfo.product_id) {
          trackEvent('product_view', {
            product_id: productInfo.product_id,
            product_name: productInfo.product_name,
            view_duration: getViewDuration(),
            page_exit: true,
          });
        }
      }
    });

    if (CONFIG.DEBUG) {
      console.log('[ConstIntel] Tracking initialized');
    }
  }

  // ============================================
  // START TRACKING
  // ============================================

  // Initialize when script loads
  init();

  // Expose tracking functions globally for manual tracking
  window.ConstIntel = {
    track: trackEvent,
    trackProductView: trackProductView,
    trackProductSearch: trackProductSearch,
    trackCartAdd: trackCartAdd,
    trackWishlistAdd: trackWishlistAdd,
    trackCheckoutStart: trackCheckoutStart,
    config: CONFIG,
  };

})();

