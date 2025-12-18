const debounce = (func, delay = 100) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

const getFocusableElements = (container) => {
  return Array.from(
    container.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
};

document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Menu Toggle ---
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const primaryNavUl = document.querySelector('.primary-nav'); // Assuming this is the <ul> inside mainNav
  const siteHeader = document.querySelector('.site-header');

  let menuOpen = false;
  let lastFocusedElement;

  const closeMobileMenu = () => {
    if (!menuOpen) return;
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', handleMenuKeydown);
    document.removeEventListener('click', handleOutsideClick);
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
    menuOpen = false;
  };

  const openMobileMenu = () => {
    if (menuOpen) return;
    lastFocusedElement = document.activeElement;
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
    mainNav.classList.add('is-open');
    document.body.classList.add('no-scroll');

    const focusableElements = getFocusableElements(mainNav);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleMenuKeydown);
    document.addEventListener('click', handleOutsideClick);
    menuOpen = true;
  };

  const toggleMobileMenu = () => {
    if (menuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  const handleMenuKeydown = (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
      return;
    }

    if (event.key === 'Tab' && menuOpen) {
      const focusableElements = getFocusableElements(mainNav);
      if (focusableElements.length === 0) return;

      const firstFocusableEl = focusableElements[0];
      const lastFocusableEl = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusableEl || document.activeElement === mobileMenuToggle) {
          lastFocusableEl.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus();
          event.preventDefault();
        }
      }
    }
  };

  const handleOutsideClick = (event) => {
    if (menuOpen && !mainNav.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
      closeMobileMenu();
    }
  };

  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);

    // Close menu on resize for desktop
    let isDesktopView = window.innerWidth >= 992; // Adjust breakpoint as needed
    const handleResize = debounce(() => {
      const currentIsDesktopView = window.innerWidth >= 992;
      if (isDesktopView && !currentIsDesktopView) { // Transitioned from desktop to mobile
        // nothing special here, menu should be closed by default
      } else if (!isDesktopView && currentIsDesktopView) { // Transitioned from mobile to desktop
        if (menuOpen) {
          closeMobileMenu();
        }
      }
      isDesktopView = currentIsDesktopView;
    }, 200);

    window.addEventListener('resize', handleResize);

    // Initialize ARIA attributes
    mobileMenuToggle.setAttribute('aria-controls', mainNav.id || 'main-navigation');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    if (!mainNav.id) {
      mainNav.id = 'main-navigation';
    }
    if (primaryNavUl) {
      primaryNavUl.setAttribute('role', 'list'); // or 'menu' if it's an interactive menu, not just links
    }
  }


  // --- Smooth Scroll ---
  const fixedHeaderHeight = siteHeader ? siteHeader.offsetHeight : 0; // Get initial height

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        // Close mobile menu if open
        if (menuOpen) {
          closeMobileMenu();
        }

        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - fixedHeaderHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL hash without page reload
        history.pushState(null, '', targetId);

        // For accessibility, ensure the target element receives focus after scroll
        // This must be done after the scroll has completed.
        // For simplicity, we can do it immediately, but ideally, wait for 'scrollend' event or use a timeout.
        const focusTarget = () => {
          target.focus({
            preventScroll: true
          }); // Prevent refire scroll
          if (target.matches(':focus')) return; // Check if focus was successful
          target.setAttribute('tabindex', '-1'); // Make it focusable if not already
          target.focus();
        };

        // Modern browsers have 'scrollend' but it's not widely supported yet.
        // A simple timeout or IntersectionObserver could also work to know when scrolling stops.
        setTimeout(focusTarget, 600); // Give smooth scroll time to complete
      }
    });
  });


  // --- Scroll Effects ---
  let lastScrollY = 0;
  let headerScrolled = false;
  let headerHidden = false;

  const updateHeaderOnScroll = () => {
    const currentScrollY = window.pageYOffset;

    // Header Shadow effect
    if (currentScrollY > 50 && !headerScrolled) {
      siteHeader.classList.add('scrolled');
      headerScrolled = true;
    } else if (currentScrollY <= 50 && headerScrolled) {
      siteHeader.classList.remove('scrolled');
      headerScrolled = false;
    }

    // Header Show/Hide effect
    // Only apply if scrolling down past header height, and not already hidden
    if (currentScrollY > lastScrollY && currentScrollY > fixedHeaderHeight && !headerHidden) {
      siteHeader.classList.add('header-hidden');
      headerHidden = true;
    }
    // Show header if scrolling up, or if at the very top
    else if (currentScrollY < lastScrollY && headerHidden) {
      siteHeader.classList.remove('header-hidden');
      headerHidden = false;
    } else if (currentScrollY <= fixedHeaderHeight && headerHidden) { // Ensure header is shown at the top
      siteHeader.classList.remove('header-hidden');
      headerHidden = false;
    }

    lastScrollY = currentScrollY;
  };

  // Debounce and use requestAnimationFrame for scroll-based updates for performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateHeaderOnScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, {
    passive: true
  });


  // --- Animate elements on scroll (Intersection Observer) ---
  const animateElements = document.querySelectorAll('[data-animate]');
  if (animateElements.length > 0) {
    const animationObserverOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -10% 0px', // Trigger when 10% from bottom of viewport
      threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.animationDelay ? parseInt(entry.target.dataset.animationDelay, 10) : 0;
          if (delay) {
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
          } else {
            entry.target.classList.add('is-visible');
          }
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, animationObserverOptions);

    animateElements.forEach(el => {
      animationObserver.observe(el);
    });
  }


  // --- Lazy Load Images (Intersection Observer) ---
  const lazyImages = document.querySelectorAll('img.lazyload, [data-bg-lazyload]');
  if (lazyImages.length > 0) {
    const lazyObserverOptions = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0
    };

    // Use native lazy loading if supported
    if ('loading' in HTMLImageElement.prototype) {
      lazyImages.forEach(img => {
        if (img.tagName === 'IMG' && img.dataset.src) {
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
          img.classList.add('loaded'); // Add loaded class immediately
        } else if (img.dataset.bgLazyload) {
          img.style.backgroundImage = `url(${img.dataset.bgLazyload})`;
          img.removeAttribute('data-bg-lazyload');
          img.classList.add('loaded');
        }
      });
    } else {
      // Fallback for browsers that don't support native lazy loading
      const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.tagName === 'IMG' && el.dataset.src) {
              el.src = el.dataset.src;
              if (el.dataset.srcset) {
                el.srcset = el.dataset.srcset;
              }
              el.removeAttribute('data-src');
              el.removeAttribute('data-srcset');
            } else if (el.dataset.bgLazyload) {
              el.style.backgroundImage = `url(${el.dataset.bgLazyload})`;
              el.removeAttribute('data-bg-lazyload');
            }
            el.classList.add('loaded');
            observer.unobserve(el);
          }
        });
      }, lazyObserverOptions);

      lazyImages.forEach(img => lazyLoadObserver.observe(img));
    }
  }


  // --- Accessibility: Skip Link functionality ---
  const skipLink = document.querySelector('.skip-link');
  const mainContent = document.getElementById('main-content');

  if (skipLink && mainContent) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Calculate target position with header offset
      const targetPosition = mainContent.getBoundingClientRect().top + window.pageYOffset - fixedHeaderHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // After scrolling, focus on the main content
      // Use a timeout to ensure scroll completes before focusing, preventing scroll jump
      setTimeout(() => {
        mainContent.setAttribute('tabindex', '-1'); // Make sure it's focusable
        mainContent.focus();
        mainContent.removeAttribute('tabindex'); // Remove tabindex once focused if not needed for other purposes
      }, 500);
    });
  }

  // Set initial header state based on scroll position
  if (window.pageYOffset > 50) {
    siteHeader.classList.add('scrolled');
    headerScrolled = true;
  }
});