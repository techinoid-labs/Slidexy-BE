document.addEventListener('DOMContentLoaded', function() {
  // --- Console Logging & Debugging ---
  try {
    console.log('%c Website Loaded!', 'color: green; font-size: 20px;');
    console.log('%c Source URL: https://www.siteinspire.com/websites', 'color: blue;');
    console.log('%c Images Count: 7', 'color: blue;');
    console.log('%c Sections Count: 3', 'color: blue;');
  } catch (error) {
    console.error('Console logging error:', error);
  }

  // --- Smooth Scroll Navigation ---
  try {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start' // Adjust as needed: 'start', 'center', 'end', 'nearest'
          });

          // Optional: Update URL hash without triggering scroll
          history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Smooth scroll navigation error:', error);
  }

  // --- Intersection Observer (for Animations) ---
  try {
    const sections = document.querySelectorAll('section, .fade-in, .slide-up, .scale-up'); // Add selectors for animated elements

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible'); // Or your specific visibility class
          observer.unobserve(entry.target); // Stop observing after animation
        }
      });
    }, {
      threshold: 0.15 // Adjust as needed
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer error:', error);
  }

  // --- Header Scroll Effects ---
  try {
    const header = document.querySelector('header'); // Or your header selector
    const threshold = 50; // Scroll threshold for effects
    const headerHeight = header ? header.offsetHeight : 0;

    function handleScroll() {
      if (window.scrollY > threshold) {
        header.classList.add('scrolled'); // Add scrolled class for styling
      } else {
        header.classList.remove('scrolled');
      }

      // Example: Hide header on scroll down, show on scroll up (optional)
      let lastScrollTop = 0;
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScrollTop > lastScrollTop && currentScrollTop > headerHeight) {
          header.classList.add('hide');
      } else {
          if (currentScrollTop + window.innerHeight < document.documentElement.scrollHeight) {
              header.classList.remove('hide');
          }
      }
      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    }

    let ticking = false;

    window.addEventListener('scroll', function(e) {
      if (!ticking) {
        requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  } catch (error) {
    console.error('Header scroll effects error:', error);
  }

  // --- Image Lazy Loading ---
  try {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src'); // Remove attribute once loaded
            img.classList.add('loaded'); // Add a class for fade-in effect

            img.onload = () => {
              imageObserver.unobserve(img); // Stop observing
            };
          }

        }
      });
    }, {
      threshold: 0.2, // Adjust as needed
      rootMargin: "0px 0px 50px 0px"
    });

    images.forEach(image => {
      imageObserver.observe(image);
    });
  } catch (error) {
    console.error('Image lazy loading error:', error);
  }

  // --- Mobile Menu ---
  try {
    const menuToggle = document.querySelector('.menu-toggle'); // Your menu toggle button
    const navMenu = document.querySelector('.nav-menu'); // Your navigation menu
    const navLinks = document.querySelectorAll('.nav-menu a'); // Navigation links inside the menu

    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active'); // Or your class for showing the menu
        menuToggle.classList.toggle('active');
      });

      // Close menu on link click
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        });
      });

      // Close menu on outside click
      document.addEventListener('click', function(event) {
        const isClickInsideMenu = navMenu.contains(event.target) || menuToggle.contains(event.target);
        if (!isClickInsideMenu && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Mobile menu error:', error);
  }

  // --- Gallery Interactions ---
  try {
    const galleryImages = document.querySelectorAll('.gallery-image'); // Your gallery image selector

    if (galleryImages.length > 0) {
        let lightbox = null; // Define lightbox outside the loop
        galleryImages.forEach(image => {
          image.addEventListener('click', function() {
              const imageUrl = this.src;
              // Create a simple lightbox
              lightbox = document.createElement('div');
              lightbox.classList.add('lightbox');

              const lightboxImage = document.createElement('img');
              lightboxImage.src = imageUrl;
              lightboxImage.alt = 'Lightbox Image';

              const closeButton = document.createElement('button');
              closeButton.classList.add('lightbox-close');
              closeButton.innerHTML = '&times;'; // X symbol
              closeButton.addEventListener('click', closeLightbox);

              lightbox.appendChild(closeButton);
              lightbox.appendChild(lightboxImage);

              document.body.appendChild(lightbox);
              document.body.classList.add('lightbox-open'); // Prevent scrolling

              function closeLightbox() {
                document.body.removeChild(lightbox);
                document.body.classList.remove('lightbox-open');
                lightbox = null;
              }

              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && lightbox) {
                  closeLightbox();
                }
              });
          });
        });
    }

  } catch (error) {
    console.error('Gallery interactions error:', error);
  }

  // --- Form Handling ---
  try {
    const form = document.querySelector('form'); // Your form selector
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default submission

        let isValid = true;

        // Basic validation (example)
        const nameInput = form.querySelector('[name="name"]');
        const emailInput = form.querySelector('[name="email"]');

        if (nameInput && nameInput.value.trim() === '') {
          isValid = false;
          // Display error message (replace with your error handling)
           alert('Name is required.');
        }

        if (emailInput && !isValidEmail(emailInput.value.trim())) {
          isValid = false;
            alert('Valid email is required.');
        }

        if (isValid) {
          // Form submission logic (e.g., AJAX request)
          const formData = new FormData(form);

          fetch(form.action, {
            method: form.method,
            body: formData
          })
          .then(response => {
            if (response.ok) {
              // Handle successful submission
               alert('Form submitted successfully!');
              form.reset();
            } else {
              // Handle error
              alert('Form submission failed.');
            }
          })
          .catch(error => {
            console.error('Form submission error:', error);
             alert('An error occurred during form submission.');
          });
        }
      });

      function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
    }
  } catch (error) {
    console.error('Form handling error:', error);
  }

  // --- Parallax Scrolling ---
  try {
      const parallaxElements = document.querySelectorAll('.parallax');

      function parallaxScroll() {
          parallaxElements.forEach(element => {
              const speed = parseFloat(element.dataset.parallaxSpeed) || 0.2; // Use data attribute for speed
              const distance = window.pageYOffset * speed;
              element.style.transform = `translateY(${distance}px)`;
          });
      }

      let ticking = false;

      window.addEventListener('scroll', function() {
          if (!ticking) {
              requestAnimationFrame(function() {
                  parallaxScroll();
                  ticking = false;
              });
              ticking = true;
          }
      });
  } catch (error) {
      console.error('Parallax scrolling error:', error);
  }

  // --- Scroll Spy ---
  try {
    const sectionsSpy = document.querySelectorAll('section[id]'); // Select sections with IDs
    const navLinksSpy = document.querySelectorAll('.nav-menu a[href^="#"]'); // Select nav links

    function highlightNavLink() {
      let currentSection = null;

      sectionsSpy.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - (window.innerHeight / 3)) {
          currentSection = section.id;
        }
      });

      navLinksSpy.forEach(link => {
        link.classList.remove('active'); // Remove active class from all links
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active'); // Add active class to the corresponding link
        } else if (currentSection === null && link.getAttribute('href') === '#home') {
            link.classList.add('active'); //add active class to home if no current section
        }
      });
    }

    let tickingScrollSpy = false;

    window.addEventListener('scroll', function() {
      if (!tickingScrollSpy) {
        requestAnimationFrame(function() {
          highlightNavLink();
          tickingScrollSpy = false;
        });
        tickingScrollSpy = true;
      }
    });
  } catch (error) {
    console.error('Scroll spy error:', error);
  }

  // --- Debounce Utility ---
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }
});