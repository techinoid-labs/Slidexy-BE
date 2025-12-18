document.addEventListener('DOMContentLoaded', () => {
  // --- UTILITY FUNCTIONS ---
  /**
   * Debounces a function call.
   * @param {Function} func The function to debounce.
   * @param {number} delay The debounce delay in milliseconds.
   * @returns {Function} The debounced function.
   */
  const debounce = (func, delay = 100) => {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  /**
   * Throttles a function call using requestAnimationFrame.
   * @param {Function} func The function to throttle.
   * @returns {Function} The throttled function.
   */
  const throttleRAF = (func) => {
    let ticking = false;
    return function (...args) {
      const context = this;
      if (!ticking) {
        requestAnimationFrame(() => {
          func.apply(context, args);
          ticking = false;
        });
        ticking = true;
      }
    };
  };

  // --- SELECTORS ---
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const siteHeader = document.querySelector('.site-header');
  const skipLink = document.querySelector('.skip-link');
  const mainContent = document.querySelector('main');
  const scrollAnimationElements = document.querySelectorAll('[data-animate]');
  const lazyImages = document.querySelectorAll('img[data-src], source[data-srcset]');
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)'); // Exclude skip link from smooth scroll

  // --- 1. MOBILE MENU TOGGLE ---
  if (mobileMenuToggle && mainNav) {
    const navLinks = mainNav.querySelectorAll('a');
    let firstNavLink = navLinks[0];
    let lastNavLink = navLinks[navLinks.length - 1];

    const closeMenu = (returnFocus = true) => {
      mainNav.classList.remove('is-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      mainNav.setAttribute('aria-hidden', 'true');
      navLinks.forEach(link => link.setAttribute('tabindex', '-1'));
      if (returnFocus) {
        mobileMenuToggle.focus();
      }
    };

    const openMenu = () => {
      mainNav.classList.add('is-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'true');
      mainNav.setAttribute('aria-hidden', 'false');
      navLinks.forEach(link => link.removeAttribute('tabindex'));
      firstNavLink = mainNav.querySelector('a'); // Re-evaluate in case DOM changed
      if (firstNavLink) {
        firstNavLink.focus();
      }
    };

    mobileMenuToggle.addEventListener('click', () => {
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const isClickInsideMenu = mainNav.contains(event.target);
      const isClickOnToggle = mobileMenuToggle.contains(event.target);
      const isMenuOpen = mainNav.classList.contains('is-open');

      if (isMenuOpen && !isClickInsideMenu && !isClickOnToggle) {
        closeMenu();
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
        event.preventDefault(); // Prevent browser default behavior
        closeMenu();
      }
      
      // Keyboard navigation within menu
      if (event.key === 'Tab' && mainNav.classList.contains('is-open')) {
        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstNavLink) {
            event.preventDefault();
            lastNavLink.focus();
          }
        } else { // Tab
          if (document.activeElement === lastNavLink) {
            event.preventDefault();
            firstNavLink.focus();
          }
        }
      }
    });

    // Initialize ARIA attributes
    mobileMenuToggle.setAttribute('aria-controls', mainNav.id || 'main-navigation');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mainNav.setAttribute('aria-hidden', 'true');
    mainNav.id = mainNav.id || 'main-navigation'; // Ensure mainNav has an ID
    navLinks.forEach(link => link.setAttribute('tabindex', '-1')); // Initially make links not tabbable
  }

  // --- 2. SMOOTH SCROLL ---
  if (anchorLinks.length > 0) {
    anchorLinks.forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const target = document.querySelector(targetId);

        if (target) {
          // Close mobile menu if open
          if (mainNav && mainNav.classList.contains('is-open')) {
            closeMenu(false); // Do not return focus, let the scroll handle it.
          }

          const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;
          const targetPosition = target.offsetTop - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL hash without causing a jump
          if (history.pushState) {
            history.pushState(null, null, targetId);
          } else {
            window.location.hash = targetId;
          }

          // Ensure focus lands on the target after scrolling for accessibility
          target.setAttribute('tabindex', '-1'); // Make it programmatically focusable
          target.focus();
          target.removeAttribute('tabindex'); // Remove tabindex after focusing
        }
      });
    });
  }

  // --- 3. SCROLL EFFECTS ---
  let lastScrollY = 0;
  let scrollDirection = 'down';

  const handleHeaderOnScroll = () => {
    if (!siteHeader) return;

    const currentScrollY = window.scrollY;

    // Add shadow when scrolled
    if (currentScrollY > 50) { // Threshold for shadow
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }

    // Show/hide header
    if (currentScrollY > lastScrollY && currentScrollY > 100) { // Scrolling down past initial scroll
      siteHeader.classList.add('header-hidden');
      siteHeader.classList.remove('header-visible');
      scrollDirection = 'down';
    } else if (currentScrollY < lastScrollY && currentScrollY > 50) { // Scrolling up
      siteHeader.classList.remove('header-hidden');
      siteHeader.classList.add('header-visible');
      scrollDirection = 'up';
    } else if (currentScrollY <= 50) { // At or near the top
      siteHeader.classList.remove('header-hidden', 'header-visible');
      scrollDirection = 'up'; // Default to up when at top
    }

    lastScrollY = currentScrollY;
  };

  // Debounce and throttle scroll events for performance
  const throttledScrollHandler = throttleRAF(handleHeaderOnScroll);
  window.addEventListener('scroll', throttledScrollHandler, { passive: true });

  // Intersection Observer for scroll animations
  if (scrollAnimationElements.length > 0) {
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -100px 0px', // Trigger when 100px from bottom of viewport
      threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const animateOnScrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, observerOptions);

    scrollAnimationElements.forEach(el => animateOnScrollObserver.observe(el));
  }

  // Lazy load images with Intersection Observer
  if (lazyImages.length > 0) {
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          const srcset = img.dataset.srcset;

          if (img.tagName === 'IMG' && src) {
            img.src = src;
            if (srcset) img.srcset = srcset;
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
          } else if (img.tagName === 'SOURCE' && srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
          }
          // Optionally add native lazy loading for browsers that support it
          if (img.tagName === 'IMG') {
            img.setAttribute('loading', 'lazy');
          }
          
          observer.unobserve(img); // Stop observing once loaded
        }
      });
    }, { rootMargin: '0px 0px 200px 0px' }); // Load when 200px from viewport

    lazyImages.forEach(img => lazyLoadObserver.observe(img));
  }

  // --- 4. ACCESSIBILITY ---
  // Skip link functionality
  if (skipLink && mainContent) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      mainContent.setAttribute('tabindex', '-1'); // Make main content focusable
      mainContent.focus();
      mainContent.removeAttribute('tabindex'); // Remove tabindex after focus
    });
  }

  // Initial header state check (e.g., if page loaded with scroll position)
  if (window.scrollY > 50 && siteHeader) {
    siteHeader.classList.add('scrolled');
  }
});