document.addEventListener('DOMContentLoaded', function() {
  console.log('%c devsinc.com website loaded ', 'background: #222; color: #bada55');
  console.log('%c Source URL: https://www.devsinc.com/ ', 'color: #3498db');
  console.log('%c Images count: 10 ', 'color: #e67e22');
  console.log('%c Sections count: 3 ', 'color: #9b59b6');

  // Utility function: Debounce
  const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

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
    console.error('Smooth Scroll Navigation Error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('.animate-fade-in, .animate-slide-up, .animate-scale');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing after animation
        }
      });
    }, {
      threshold: 0.15 // Adjust threshold as needed
    });

    sections.forEach(section => {
      section.classList.add('hidden'); // Initially hide the elements
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer Error:', error);
  }

  // Header Scroll Effects
  try {
    const header = document.querySelector('header'); // Or .navbar or appropriate selector

    if (header) {
      const handleScroll = () => {
        if (window.scrollY > 50) {
          header.classList.add('scrolled'); // Add shadow, background color, etc.
        } else {
          header.classList.remove('scrolled');
        }
      };

      window.addEventListener('scroll', handleScroll);
    }
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
    const mobileMenuButton = document.querySelector('.mobile-menu-button'); // Or appropriate selector
    const mobileMenu = document.querySelector('.mobile-menu'); // Or appropriate selector
    const menuLinks = document.querySelectorAll('.mobile-menu a'); // Or appropriate selector

    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
      });

      menuLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
        });
      });

      document.addEventListener('click', (event) => {
          if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target) && mobileMenu.classList.contains('open')) {
              mobileMenu.classList.remove('open');
          }
      });
    }
  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }

  // Gallery Interactions and Lightbox
  try {
      const galleryImages = document.querySelectorAll('.gallery-image');
      const lightbox = document.createElement('div');
      lightbox.id = 'lightbox';
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
                  if(e.target !== img) {
                      lightbox.classList.remove('active');
                  }
              });
          });
      });
  } catch (error) {
      console.error('Gallery Interactions Error:', error);
  }
  // Basic Form Validation
  try {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      form.addEventListener('submit', function(event) {
        let isValid = true;

        // Email Validation (example)
        const emailInput = this.querySelector('input[type="email"]');
        if (emailInput) {
          const emailValue = emailInput.value.trim();
          if (emailValue === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            isValid = false;
            alert('Please enter a valid email address.'); // Replace with better error display
          }
        }

        // Required Field Validation (example)
        const requiredInputs = this.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
          if (input.value.trim() === '') {
            isValid = false;
            alert('Please fill in all required fields.'); // Replace with better error display
          }
        });

        if (!isValid) {
          event.preventDefault(); // Prevent form submission
        } else {
          // Simulate form submission
          event.preventDefault();
          alert('Form submitted successfully!');
          this.reset(); // Clear the form
        }
      });
    });
  } catch (error) {
    console.error('Form Validation Error:', error);
  }

});