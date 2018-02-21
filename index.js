'use strict';

(function() {
  var instance = null;
  var instancesCount = 0;
  var ticking = false;
  var supportsPassiveOption = false;

  var EVENT_NAME = 'window-scroll';

  // ------------------------------------------------
  // Passive event support detection
  // ------------------------------------------------
  if (typeof window !== 'undefined') {
    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/dom/passiveeventlisteners.js
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function() {
          supportsPassiveOption = true;
        }
      });
      window.addEventListener('test', null, opts);
    } catch (e) {}
  }

  // ------------------------------------------------
  // CustomEvent polyfill
  // ------------------------------------------------
  if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
    var CustomEventPollyfill = function(event, userParams) {
      var params = {
        bubbles: userParams.bubbles || false,
        cancelable: userParams.cancelable || false,
        detail: userParams.detail || undefined // eslint-disable-line no-undefined
      };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };

    CustomEventPollyfill.prototype = window.Event.prototype;

    window.CustomEvent = CustomEventPollyfill;
  }

  // ------------------------------------------------
  // Scroll manager
  // ------------------------------------------------
  function ScrollManager() {
    if (typeof window === 'undefined') {
      // Silently return null if it is used on server
      return null;
    }

    // Increase reference count
    instancesCount++;

    // If singleton instance exists, return it rather than creating a new one
    if (instance) {
      return instance;
    }

    // Save singleton instance
    instance = this;

    // Bind handlers
    this.handleScroll = this.handleScroll.bind(this);

    // Use passive listener when supported with fallback to capture option
    this.eventListenerOptions = supportsPassiveOption ? { passive: true } : true;

    // Add scroll listener
    window.addEventListener('scroll', this.handleScroll, this.eventListenerOptions);
  }

  ScrollManager.prototype.removeListener = function() {
    instancesCount--;

    // There is not components listening to our event
    if (instancesCount === 0) {
      this.destroy();
    }
  };

  ScrollManager.prototype.destroy = function() {
    // Remove event listener
    window.removeEventListener('scroll', this.handleScroll, this.eventListenerOptions);

    // Clear singleton instance and count
    instance = null;
    instancesCount = 0;
  };

  ScrollManager.prototype.getScrollPosition = function() {
    // Get scroll position, with IE fallback
    return window.scrollY || document.documentElement.scrollTop;
  };


  ScrollManager.prototype.handleScroll = function() {
    // Fire the event only when scroll position is changed
    if (!ticking) {
      ticking = true;
      var self = this;

      window.requestAnimationFrame(function() {
        self.scrollPosition = self.getScrollPosition();

        var event = new CustomEvent(EVENT_NAME, {
          detail: {
            scrollPosition: self.scrollPosition
          }
        });

        // Dispatch the event.
        window.dispatchEvent(event);
        ticking = false;
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    ScrollManager.default = ScrollManager;
    module.exports = ScrollManager;
  } else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) { // eslint-disable-line no-undef
    // register as 'window-scroll-manager', consistent with npm package name
    define('window-scroll-manager', [], function() { // eslint-disable-line no-undef
      return ScrollManager;
    });
  } else {
    window.ScrollManager = ScrollManager;
  }
}).call(this);
