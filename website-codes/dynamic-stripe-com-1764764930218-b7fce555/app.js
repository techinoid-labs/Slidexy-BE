document.addEventListener('DOMContentLoaded', function() {
  // --- Console Logging & Debugging ---
  console.log('%cWebsite loaded', 'color: green;');
  console.log('%cSource URL: https://www.stripe.com', 'color: blue;');
  console.log('%cImages count: 9', 'color: purple;');
  console.log('%cSections count: 3', 'color: orange;');

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
            block: 'start' // Align the top of the element to the top of the viewport
          });
        }
      });
    });
  } catch (error) {
    console.error('Smooth Scroll Error:', error);
  }

  // --- Intersection Observer for Animations ---
  try {
    const sections = document.querySelectorAll('section'); // Or other relevant selectors

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible'); // Add a class to trigger animations
          observer.unobserve(entry.target); // Optional: stop observing after it's visible
        }
      });
    }, {
      threshold: 0.1 // Adjust threshold as needed
    });

    sections.forEach(section => {
      section.classList.add('hidden'); // Initially hide elements
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer Error:', error);
  }

  // --- Header Scroll Effects ---
  try {
    const header = document.querySelector('header'); // Or your header selector
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > lastScrollTop) {
        // Scrolling down
        header.classList.add('header-hidden'); // Add class to hide header
      } else {
        // Scrolling up
        header.classList.remove('header-hidden'); // Remove class to show header
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
      if (scrollTop > 50) {
          header.classList.add('header-scrolled');
      } else {
          header.classList.remove('header-scrolled');
      }
    }, { passive: true });
  } catch (error) {
    console.error('Header Scroll Effects Error:', error);
  }

  // --- Image Lazy Loading ---
  try {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.onload = () => {
            img.classList.remove('lazy'); // Remove lazy class after loading
            img.classList.add('loaded'); // Add loaded class for fade-in effect
          };
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      img.classList.add('lazy'); // Add lazy class initially
      imageObserver.observe(img);
    });
  } catch (error) {
    console.error('Image Lazy Loading Error:', error);
  }

  // --- Mobile Menu ---
  try {
    const menuButton = document.querySelector('.menu-button'); // Your menu button selector
    const mobileMenu = document.querySelector('.mobile-menu'); // Your mobile menu selector

    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('open');
      });

      // Close menu on link click (inside the menu)
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
        });
      });

      // Close menu on outside click
      document.addEventListener('click', function(event) {
        if (!mobileMenu.contains(event.target) && !menuButton.contains(event.target) && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
        }
      });
    }
  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }

  // --- Debounce Function ---
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // --- Parallax Scrolling (Simple Implementation) ---
  try {
    window.addEventListener('scroll', debounce(function() {
      const parallaxElements = document.querySelectorAll('.parallax'); // Replace with your parallax element selector

      parallaxElements.forEach(element => {
        const scrollPosition = window.pageYOffset;
        const speed = element.dataset.parallaxSpeed || 0.5; // Adjust speed with data-attribute
        element.style.transform = `translateY(${scrollPosition * speed}px)`;
      });
    }, 10), { passive: true });
  } catch (error) {
    console.error('Parallax Scrolling Error:', error);
  }

  // --- Gallery Lightbox (Simple Implementation) ---
  try {
    const galleryImages = document.querySelectorAll('.gallery-image'); // Replace with your gallery image selector
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    document.body.appendChild(lightbox);

    galleryImages.forEach(image => {
      image.addEventListener('click', () => {
        const img = document.createElement('img');
        img.src = image.src;
        while (lightbox.firstChild) {
            lightbox.removeChild(lightbox.firstChild);
        }

        lightbox.appendChild(img);
        lightbox.classList.add('active');

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
          if(e.key === 'Escape'){
            lightbox.classList.remove('active');
          }
        });
      });
    });

  } catch (error) {
    console.error('Gallery Lightbox Error:', error);
  }

  // --- Scroll Spy ---
    try {
      const sectionsSpy = document.querySelectorAll('section[id]');
      const navLinksSpy = document.querySelectorAll('nav a[href^="#"]');

      function activateNavLink(id) {
          navLinksSpy.forEach(link => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${id}`) {
                  link.classList.add('active');
              }
          });
      }

      function scrollSpy() {
          let currentSection = '';

          sectionsSpy.forEach(section => {
              const sectionTop = section.offsetTop;
              if (window.pageYOffset >= sectionTop - 50) {
                  currentSection = section.getAttribute('id');
              }
          });

          activateNavLink(currentSection);
      }

      window.addEventListener('scroll', debounce(scrollSpy, 50));
    } catch (error) {
        console.error('Scroll Spy Error:', error);
    }
});