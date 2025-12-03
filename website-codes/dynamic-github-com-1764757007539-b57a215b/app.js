document.addEventListener('DOMContentLoaded', function() {

  // Console Logging & Debugging
  console.log('%cWebsite loaded!', 'color: green; font-size: 20px;');
  console.log('%cSource URL: https://github.com/', 'color: blue;');
  console.log('%cImages count: 9', 'color: blue;');
  console.log('%cSections count: 3', 'color: blue;');

  // Smooth Scroll Navigation
  try {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start' // Adjust as needed (start, center, end, nearest)
          });

          // Update URL hash (optional)
          history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Smooth Scroll Error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('section, .fade-in, .slide-up, .scale-up'); // Select elements with animation classes

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible'); // Add 'visible' class to trigger animation
          observer.unobserve(entry.target); // Stop observing after animation
        }
      });
    }, {
      threshold: 0.15 // Adjust threshold as needed
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer Error:', error);
  }

  // Header Scroll Effects
  try {
    const header = document.querySelector('header'); // Adjust selector if needed
    const scrollThreshold = 100; // Adjust the scroll distance
    const headerHeight = header ? header.offsetHeight : 0;

    function handleScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled'); // Add class to change styles on scroll
      } else {
        header.classList.remove('scrolled');
      }
    }

    if(header) {
        window.addEventListener('scroll', handleScroll);

        // Initial check in case the page loads scrolled down
        handleScroll();
    }
  } catch (error) {
    console.error('Header Scroll Effects Error:', error);
  }

  // Image Lazy Loading
  try {
    const images = document.querySelectorAll('img[data-src]'); // Target images with data-src attribute

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src'); // Remove data-src after loading
            img.classList.add('loaded'); // Add a class for fade-in effect

            img.onload = () => {
              imageObserver.unobserve(img);
            }

            img.onerror = () => {
              console.error('Failed to load image:', src);
              imageObserver.unobserve(img);
            };
          } else {
              imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '0px 0px 200px 0px', // Load images 200px before they appear
      threshold: 0
    });

    images.forEach(image => {
      imageObserver.observe(image);
    });
  } catch (error) {
    console.error('Image Lazy Loading Error:', error);
  }

  // Mobile Menu
  try {
    const menuToggle = document.querySelector('.mobile-menu-toggle'); // Adjust selector
    const navMenu = document.querySelector('.nav-menu'); // Adjust selector
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent event from bubbling to document
        navMenu.classList.toggle('active');
      });

      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('active'); // Close menu on link click
        });
      });

      document.addEventListener('click', (event) => {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
          navMenu.classList.remove('active'); // Close menu on outside click
        }
      });
    }
  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }

  // Gallery Interactions (Basic Placeholder)
  try {
    const galleryImages = document.querySelectorAll('.gallery-image'); // Adjust selector

    galleryImages.forEach(image => {
      image.addEventListener('click', function () {
        // Implement lightbox or other interaction here
        console.log('Gallery image clicked:', this.src);
      });
    });
  } catch (error) {
    console.error('Gallery Interactions Error:', error);
  }

  // Form Handling (Basic Placeholder)
  try {
    const form = document.querySelector('form'); // Adjust selector

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Implement form validation and submission logic here
        console.log('Form submitted!');
      });
    }
  } catch (error) {
    console.error('Form Handling Error:', error);
  }

  // Parallax Scrolling (Basic Placeholder)
  try {
    const parallaxElements = document.querySelectorAll('.parallax');

    function parallaxScroll() {
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallaxSpeed) || 0.2; // Default speed
            const yOffset = window.pageYOffset * speed;
            element.style.transform = `translateY(${yOffset}px)`;
        });
    }

    window.addEventListener('scroll', () => {
        requestAnimationFrame(parallaxScroll);
    });
  } catch (error) {
    console.error('Parallax Scrolling Error:', error);
  }
});