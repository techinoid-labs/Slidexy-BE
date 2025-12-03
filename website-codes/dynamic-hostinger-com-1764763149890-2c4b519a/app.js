document.addEventListener('DOMContentLoaded', function() {
  // Website loaded message and info
  console.log('%cHostinger Website Loaded', 'color: #fff; background-color: #007bff; padding: 5px;');
  console.log('%cSource URL: https://www.hostinger.com', 'color: #007bff;');
  console.log('%cImages Count: 10', 'color: #007bff;');
  console.log('%cSections Count: 3', 'color: #007bff;');

  // Smooth scroll navigation
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

           // Handle URL change, if desired (optional)
           // history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Smooth scroll error:', error);
  }

  // Intersection Observer for animations
  try {
    const sections = document.querySelectorAll('section'); // Or specific sections with animation

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible'); // Or specific animation class
          observer.unobserve(entry.target); // Stop observing once visible
        }
      });
    }, {
      threshold: 0.1 // Adjust threshold as needed
    });

    sections.forEach(section => {
      section.classList.add('hidden'); // Initially hide the elements
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer error:', error);
  }

  // Header scroll effects
  try {
    const header = document.querySelector('header'); // Or your header selector

    if (header) {
      const scrollThreshold = 50; // Adjust scroll distance

      const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
          header.classList.add('header-scrolled'); // Add class on scroll
        } else {
          header.classList.remove('header-scrolled'); // Remove class on scroll up
        }
      };

      window.addEventListener('scroll', handleScroll);
      window.addEventListener('load', handleScroll); // Check on initial load
    }
  } catch (error) {
    console.error('Header scroll effects error:', error);
  }

  // Image lazy loading
  try {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded'); // Add a class for fade-in effect
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } catch (error) {
    console.error('Image lazy loading error:', error);
  }

  // Mobile menu
  try {
    const menuToggle = document.querySelector('.menu-toggle'); // Or your menu toggle button
    const mobileMenu = document.querySelector('.mobile-menu'); // Or your mobile menu container

    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        menuToggle.classList.toggle('active'); // Toggle an icon for the button if needed
      });

      // Close menu on link click
      const menuLinks = mobileMenu.querySelectorAll('a');
      menuLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        });
      });

      // Close menu on outside click
      document.addEventListener('click', (event) => {
        if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target) && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Mobile menu error:', error);
  }

  // Parallax scrolling
    try {
      const parallaxElements = document.querySelectorAll('.parallax');

      const parallaxScroll = () => {
        parallaxElements.forEach(element => {
          const speed = parseFloat(element.dataset.parallaxSpeed) || 0.2; // Default speed
          const offset = window.pageYOffset * speed;
          element.style.transform = `translateY(${offset}px)`;
        });
      };

      window.addEventListener('scroll', () => {
        requestAnimationFrame(parallaxScroll);
      });
    } catch (error) {
      console.error('Parallax scrolling error:', error);
    }

  // Debounce function
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
});