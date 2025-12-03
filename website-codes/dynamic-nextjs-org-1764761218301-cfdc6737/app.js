document.addEventListener('DOMContentLoaded', function() {

  // Console Logging & Debugging
  try {
    console.log('%cWebsite loaded', 'color: #2ecc71; font-size: 20px;');
    console.log('%cSource URL: https://nextjs.org/', 'color: #3498db;');
    console.log('%cImages count: 7', 'color: #9b59b6;');
    console.log('%cSections count: 3', 'color: #e74c3c;');
  } catch (error) {
    console.error('Error in console logging:', error);
  }

  // Utility function for debouncing
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

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

          // Update URL hash without triggering scroll
          history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Error in smooth scroll navigation:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('section, .fade-in, .slide-up, .scale-up');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Optional: only animate once
        }
      });
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Error in intersection observer:', error);
  }

  // Header Scroll Effects
  try {
    const header = document.querySelector('header');

    if (header) {
      let lastScrollTop = 0;

      function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop) {
          // Scrolling down
          header.classList.add('header-hidden');
        } else {
          // Scrolling up
          header.classList.remove('header-hidden');
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling

        if (scrollTop > 50) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
      }

      window.addEventListener('scroll', debounce(handleScroll, 20)); // Debounce for performance
    }
  } catch (error) {
    console.error('Error in header scroll effects:', error);
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
            img.removeAttribute('data-src');
            img.classList.add('loaded'); // Add a class for fade-in effect
          }
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(image => {
      imageObserver.observe(image);
    });
  } catch (error) {
    console.error('Error in image lazy loading:', error);
  }

  // Mobile Menu
  try {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuToggle.classList.toggle('active'); // Toggle the hamburger icon
      });

      // Close menu on link click
      const navLinks = nav.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('active');
          menuToggle.classList.remove('active');
        });
      });

      // Close menu on outside click
      document.addEventListener('click', (event) => {
        if (!nav.contains(event.target) && !menuToggle.contains(event.target) && nav.classList.contains('active')) {
          nav.classList.remove('active');
          menuToggle.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Error in mobile menu:', error);
  }

  // Form Handling (Basic example)
  try {
    const form = document.querySelector('form');

    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const messageInput = form.querySelector('textarea');

        let isValid = true;

        if (!emailInput.value.includes('@')) {
          alert('Please enter a valid email address.');
          isValid = false;
        }

        if (messageInput && messageInput.value.trim() === '') {
          alert('Please enter a message.');
          isValid = false;
        }

        if (isValid) {
          // Simulate form submission
          alert('Form submitted successfully!');
          form.reset();
        }
      });
    }
  } catch (error) {
    console.error('Error in form handling:', error);
  }

  // Parallax Scrolling (Simple example, adjust selectors as needed)
  try {
    const parallaxElements = document.querySelectorAll('.parallax-bg');

    function parallaxScroll() {
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallaxSpeed) || 0.5; // Default speed
        const yOffset = window.pageYOffset;
        element.style.backgroundPositionY = `${yOffset * speed}px`;
      });

      requestAnimationFrame(parallaxScroll);
    }

    if (parallaxElements.length > 0) {
        requestAnimationFrame(parallaxScroll);
    }

  } catch (error) {
    console.error('Error in parallax scrolling:', error);
  }

  // Scroll Spy (Highlight active nav link)
  try {
    const sectionsSpy = document.querySelectorAll('section[id]');
    const navLinksSpy = document.querySelectorAll('nav a[href^="#"]');

    function scrollSpy() {
      let currentSection = '';

      sectionsSpy.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinksSpy.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    }

    if(sectionsSpy.length > 0 && navLinksSpy.length > 0){
        window.addEventListener('scroll', debounce(scrollSpy, 50));
    }

  } catch (error) {
    console.error('Error in scroll spy:', error);
  }

});