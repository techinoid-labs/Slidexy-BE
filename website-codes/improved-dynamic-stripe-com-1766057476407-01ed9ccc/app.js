// --- UTILITY FUNCTIONS ---
const debounce = (func, delay = 100) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const throttle = (func, limit = 100) => {
  let inThrottle;
  let lastResult;
  return function(...args) {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastResult = func.apply(this, args);
    }
    return lastResult;
  };
};

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const html = document.documentElement; // For global focus detection

  // --- 1. MOBILE MENU TOGGLE ---
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const mainNavLinkElements = mainNav ? mainNav.querySelectorAll('a[href], button:not([hidden]), input:not([hidden]), select:not([hidden]), textarea:not([hidden]), [tabindex]:not([tabindex="-1"])') : [];
  let prevFocusedElement = null; // To store focus before menu opens

  const toggleMenu = (open) => {
    if (!mobileMenuToggle || !mainNav) return;

    const isOpen = open === undefined ? mobileMenuToggle.getAttribute('aria-expanded') === 'true' : open;
    const willBeOpen = !isOpen; // Determine the new state

    mobileMenuToggle.setAttribute('aria-expanded', willBeOpen);
    mainNav.classList.toggle('is-open', willBeOpen);
    body.classList.toggle('no-scroll', willBeOpen); // Prevent background scroll

    if (willBeOpen) { // Menu is opening
      prevFocusedElement = document.activeElement; // Store previously focused element
      // Focus first focusable element in menu, if any, using requestAnimationFrame for better timing
      if (mainNavLinkElements.length > 0) {
        requestAnimationFrame(() => mainNavLinkElements[0].focus());
      }
    } else { // Menu is closing
      // Return focus to the toggle button or previous element
      if (prevFocusedElement) {
        requestAnimationFrame(() => prevFocusedElement.focus());
        prevFocusedElement = null;
      } else {
        requestAnimationFrame(() => mobileMenuToggle.focus());
      }
    }
  };

  if (mobileMenuToggle && mainNav) {
    // Set initial ARIA attributes for accessibility
    mobileMenuToggle.setAttribute('aria-controls', mainNav.id || 'main-navigation-menu');
    if (!mainNav.id) {
        mainNav.id = 'main-navigation-menu';
    }
    mobileMenuToggle.setAttribute('aria-expanded', 'false');

    // Toggle on click
    mobileMenuToggle.addEventListener('click', () => toggleMenu());

    // Close on click outside
    document.addEventListener('click', (e) => {
      const isMenuOpen = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      if (isMenuOpen && !mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Close on Escape key and trap focus within menu
    document.addEventListener('keydown', (e) => {
      const isMenuOpen = mobileMenuToggle.getAttribute('aria-expanded') === 'true';

      // Close on Escape key
      if (e.key === 'Escape' && isMenuOpen) {
        e.preventDefault(); // Prevent browser default actions (e.g., history back)
        toggleMenu(false);
      }

      // Trap focus within menu when open
      if (e.key === 'Tab' && isMenuOpen) {
        const focusableElements = Array.from(mainNavLinkElements).filter(el => !el.hidden); // Filter out hidden elements
        if (focusableElements.length === 0) {
          e.preventDefault(); // No focusable elements, prevent tab from leaving menu area
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement || !mainNav.contains(document.activeElement)) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement || !mainNav.contains(document.activeElement)) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  // --- 2. SMOOTH SCROLL ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      // If href is just "#" or references a non-existent element, let default behavior happen
      if (targetId === "#" || !document.querySelector(targetId)) return;

      e.preventDefault();

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const siteHeader = document.querySelector('.site-header');
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0; // Get header height for offset

        // Calculate target position, accounting for fixed header
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL hash after scroll completes
        // Use a timeout to ensure hash update after the smooth scroll animation has a chance to complete
        // The duration should roughly match the CSS smooth-scroll duration or a bit longer.
        const smoothScrollDuration = 700; // Common duration, adjust if your CSS differs
        setTimeout(() => {
          // Check if user is still near the target after scroll to prevent hash update on accidental clicks
          const currentScrollTop = window.pageYOffset;
          const targetOffsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
          const scrollDifference = Math.abs(currentScrollTop - (targetOffsetTop - headerHeight));

          // Only update hash if we are "close enough" to the target
          if (scrollDifference < 20) { // Tolerance of 20px
            history.pushState(null, '', targetId);
          }
        }, smoothScrollDuration);

        // Close mobile menu if open and an anchor inside it was clicked
        if (mobileMenuToggle && mobileMenuToggle.getAttribute('aria-expanded') === 'true' && mainNav.contains(anchor)) {
          toggleMenu(false);
        }
      }
    });
  });

  // --- 3. SCROLL EFFECTS ---
  const siteHeader = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;
  const headerHeight = siteHeader ? siteHeader.offsetHeight : 0; // Ensure headerHeight is available

  const handleScrollEffects = () => {
    const currentScrollY = window.scrollY;
    const scrollThreshold = 50; // Pixels scrolled before header effects kick in

    if (!siteHeader) return;

    // Add shadow to header when scrolled
    if (currentScrollY > scrollThreshold) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }

    // Show/hide header on scroll (only if header has height)
    if (headerHeight > 0) {
      if (currentScrollY > lastScrollY && currentScrollY > headerHeight) {
        // Scrolling down and past header
        siteHeader.classList.add('hide-header');
      } else if (currentScrollY < lastScrollY || currentScrollY <= scrollThreshold) {
        // Scrolling up or at the very top
        siteHeader.classList.remove('hide-header');
      }
    }

    lastScrollY = currentScrollY;
  };

  if (siteHeader) {
    // Initial check for header shadow/state
    handleScrollEffects();
    // Debounce scroll event for performance, wrap DOM changes in requestAnimationFrame
    window.addEventListener('scroll', debounce(() => {
      requestAnimationFrame(handleScrollEffects);
    }, 50), { passive: true });
  }

  // Animate elements on scroll (intersection observer)
  const animateObserverOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -100px 0px', // Trigger 100px before element enters viewport bottom
    threshold: 0.1 // Trigger when 10% of element is visible
  };

  const animateObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Stop observing after animation
      }
    });
  }, animateObserverOptions);

  document.querySelectorAll('[data-animate]').forEach(el => animateObserver.observe(el));

  // Lazy load images (intersection observer)
  const lazyImageObserverOptions = {
    root: null, // viewport
    rootMargin: '0px 0px 200px 0px', // Load 200px before element enters viewport
    threshold: 0 // Trigger as soon as 1px is visible
  };

  const lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');

        if (src) {
          img.src = src;
        }
        if (srcset) {
          img.srcset = srcset;
        }

        // Remove data attributes to prevent re-processing and mark as loaded
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.classList.add('lazy-loaded'); // Optional: for styling or further JS logic

        observer.unobserve(img); // Stop observing after image is loaded
      }
    });
  }, lazyImageObserverOptions);

  document.querySelectorAll('img[data-src], img[data-srcset]').forEach(img => {
    // Add loading="lazy" for browser-level lazy loading as a fallback/enhancement
    // This is useful for browsers that support it natively.
    img.setAttribute('loading', 'lazy');
    lazyImageObserver.observe(img);
  });

  // --- 4. ACCESSIBILITY ---
  // Skip link functionality
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = skipLink.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Make target focusable, focus it, then remove tabindex to avoid interfering with natural tab order
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
        targetElement.addEventListener('blur', () => {
          targetElement.removeAttribute('tabindex');
        }, { once: true }); // Remove attribute only once when blur occurs
      }
    });
  }

  // Keyboard navigation focus outline enhancement
  // This approach helps to only show focus outlines for keyboard users.
  // CSS `outline: 0` on `:focus` and then `outline: 1px dotted` on `.user-is-tabbing :focus` (or similar)
  // or use `focus-visible` polyfill if complex state management is needed.
  let isUserTabbing = false;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      body.classList.add('user-is-tabbing');
      isUserTabbing = true;
    }
  });

  window.addEventListener('mousedown', () => {
    if (isUserTabbing) {
      body.classList.remove('user-is-tabbing');
      isUserTabbing = false;
    }
  });
});