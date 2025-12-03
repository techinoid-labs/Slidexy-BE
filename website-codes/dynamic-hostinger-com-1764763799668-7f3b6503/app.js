document.addEventListener('DOMContentLoaded', function() {
  console.log('%c Website loaded!', 'color: green; font-size: 20px;');
  console.log('%c Source URL: https://www.hostinger.com', 'color: blue;');
  console.log('%c Images count: 10', 'color: blue;');
  console.log('%c Sections count: 3', 'color: blue;');

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
            behavior: 'smooth'
          });
        }
      });
    });
  } catch (error) {
    console.error('Smooth Scroll Error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('section, .animate-on-scroll');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Only animate once
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
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    let lastScrollTop = 0;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > headerHeight) {
        header.classList.add('header-shadow');
      } else {
        header.classList.remove('header-shadow');
      }

      if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
        // Scrolling down
        header.classList.add('header-hidden');
      } else {
        // Scrolling up
        header.classList.remove('header-hidden');
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    };

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
          img.classList.add('fade-in'); // Add fade-in class
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

  // Mobile Menu
  try {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav a');

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
      });

      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('active');
        });
      });

      document.addEventListener('click', (event) => {
        if (!nav.contains(event.target) && !menuToggle.contains(event.target) && nav.classList.contains('active')) {
          nav.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }

  // Gallery Interactions (Simple Lightbox)
  try {
    const galleryImages = document.querySelectorAll('.gallery-image');
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    document.body.appendChild(lightbox);

    const img = document.createElement('img');
    lightbox.appendChild(img);

    const closeButton = document.createElement('span');
    closeButton.classList.add('lightbox-close');
    closeButton.innerHTML = '&times;'; // X symbol
    lightbox.appendChild(closeButton);

    galleryImages.forEach(image => {
      image.addEventListener('click', () => {
        img.src = image.src;
        lightbox.classList.add('active');
      });
    });

    closeButton.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    });
  } catch (error) {
    console.error('Gallery Lightbox Error:', error);
  }

  // Form Handling (Basic Validation)
  try {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        let isValid = true;

        // Basic validation (add more specific validation as needed)
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error'); // Add error class for styling
          } else {
            field.classList.remove('error');
          }
        });

        if (!isValid) {
          e.preventDefault(); // Prevent form submission
          alert('Please fill in all required fields.');
        }
      });
    });
  } catch (error) {
    console.error('Form Validation Error:', error);
  }
});