document.addEventListener('DOMContentLoaded', function() {
  // Console Logging & Debugging
  console.log('%cWebsite loaded!', 'color: green; font-size: 20px;');
  console.log('%cSource URL: https://www.hostinger.com', 'color: blue;');
  console.log('%cImages count: 10', 'color: blue;');
  console.log('%cSections count: 3', 'color: blue;');

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

          // Optional: Adjust scroll position if there's a fixed header
          const headerHeight = document.querySelector('header')?.offsetHeight || 0; // Get header height if it exists
          window.scrollBy(0, -headerHeight);

          // Update URL hash (optional)
          history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Smooth Scroll Navigation Error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('.section-fade-in, .section-slide-up, .section-scale');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Observe only once
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
    const header = document.querySelector('header');
    if (header) {
      let lastScrollTop = 0;

      window.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
          let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          // Scroll Down
          if (scrollTop > lastScrollTop) {
              if (scrollTop > header.offsetHeight) {
                  header.classList.add('header-hidden');
              }
          }
          // Scroll Up
          else {
              header.classList.remove('header-hidden');
          }

          lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling

          if (scrollTop > 50) {
            header.classList.add('header-scrolled');
          } else {
            header.classList.remove('header-scrolled');
          }
        });
      });
    }
  } catch (error) {
    console.error('Header Scroll Effects Error:', error);
  }

  // Image Lazy Loading
  try {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src'); // Prevent multiple loads
            img.classList.add('fade-in'); // Add fade-in class
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      threshold: 0.2 // Adjust as needed
    });

    images.forEach(image => {
      imageObserver.observe(image);
    });
  } catch (error) {
    console.error('Image Lazy Loading Error:', error);
  }

  // Mobile Menu
  try {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav'); // Or the appropriate selector
    const navLinks = document.querySelectorAll('nav a'); // Or the appropriate selector

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent jumping to top
        nav.classList.toggle('mobile-menu-active');
      });

      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('mobile-menu-active');
        });
      });

      document.addEventListener('click', (event) => {
        const isClickInsideMenu = nav.contains(event.target) || menuToggle.contains(event.target);
        if (!isClickInsideMenu && nav.classList.contains('mobile-menu-active')) {
          nav.classList.remove('mobile-menu-active');
        }
      });
    }
  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }

   // Form Handling
   try {
    const form = document.querySelector('form');

    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Basic validation example (email and required fields)
        const emailField = form.querySelector('input[type="email"]');
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        if (emailField) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(emailField.value)) {
            alert('Please enter a valid email address.');
            isValid = false;
          }
        }

        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            alert('Please fill in all required fields.');
            isValid = false;
          }
        });

        if (isValid) {
          // Simulate form submission
          alert('Form submitted successfully!');
          form.reset();
        }
      });
    }
  } catch (error) {
    console.error('Form Handling Error:', error);
  }

});