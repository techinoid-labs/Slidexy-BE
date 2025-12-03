document.addEventListener('DOMContentLoaded', function() {
  console.log('%cWebsite loaded!', 'color: green;');
  console.log('%cSource URL: https://nextjs.org', 'color: blue;');
  console.log('%cImages count: 7', 'color: purple;');
  console.log('%cSections count: 3', 'color: orange;');

  // Smooth Scroll Navigation
  try {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Update URL hash (optional)
          if (history.pushState) {
            history.pushState(null, null, targetId);
          } else {
            location.hash = targetId;
          }
        }
      });
    });
  } catch (error) {
    console.error('Smooth Scroll Error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('section, div, article'); // Adjust selector as needed

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible'); // Add 'visible' or other class to trigger animation
          observer.unobserve(entry.target); // Stop observing after element is visible
        }
      });
    }, {
      threshold: 0.15 // Adjust as needed
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer Error:', error);
  }

  // Header Scroll Effects
  try {
    const header = document.querySelector('header'); // Or 'nav' if appropriate
    const scrollThreshold = 50; // Adjust as needed

    function handleScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled'); // Add class to change header styles
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', () => {
      requestAnimationFrame(handleScroll);
    });
  } catch (error) {
    console.error('Header Scroll Effects Error:', error);
  }

  // Image Lazy Loading
  try {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('fade-in'); // Add a fade-in effect
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } catch (error) {
    console.error('Image Lazy Loading Error:', error);
  }

  // Mobile Menu (Basic Implementation - Adapt to actual HTML)
  try {
    const menuToggle = document.querySelector('.menu-toggle'); // Adjust selector
    const navList = document.querySelector('.nav-list'); // Adjust selector

    if (menuToggle && navList) {
      menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active'); // Toggle active class
      });

      // Close menu on link click
      const navLinks = navList.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navList.classList.remove('active');
        });
      });

      // Close menu on outside click
      document.addEventListener('click', (event) => {
        if (!navList.contains(event.target) && !menuToggle.contains(event.target) && navList.classList.contains('active')) {
          navList.classList.remove('active');
        }
      });
    }

  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }

  // Form Handling (Basic Placeholder - Adapt to actual form)
  try {
    const form = document.querySelector('form');

    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default submission

        const emailField = form.querySelector('input[type="email"]');
        if (emailField && !isValidEmail(emailField.value)) {
          alert('Please enter a valid email address.'); // Basic validation
          return;
        }

        // Simulate submission
        setTimeout(() => {
          alert('Form submitted!');
        }, 500);
      });

      function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
    }
  } catch (error) {
    console.error('Form Handling Error:', error);
  }

  // Parallax Scrolling (Placeholder - Requires specific HTML structure)
  try {
    const parallaxElements = document.querySelectorAll('.parallax');

    function parallaxScroll() {
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallaxSpeed) || 0.2;
        const yOffset = window.pageYOffset;
        element.style.transform = `translateY(${yOffset * speed}px)`;
      });
    }

    window.addEventListener('scroll', () => {
      requestAnimationFrame(parallaxScroll);
    });
  } catch (error) {
    console.error('Parallax Scrolling Error:', error);
  }

  // Debounce Function
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }
});