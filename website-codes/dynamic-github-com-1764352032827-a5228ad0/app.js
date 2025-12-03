document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('%cWebsite loaded!', 'color: green; font-size: 20px;');
    console.log('%cSource URL: https://www.github.com/', 'color: blue;');
    console.log('%cImages count: 9', 'color: blue;');
    console.log('%cSections count: 3', 'color: blue;');
  } catch (error) {
    console.error('Error during initial console logging:', error);
  }

  // 1. SMOOTH SCROLL NAVIGATION
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
        }
      });
    });
  } catch (error) {
    console.error('Error during smooth scroll navigation:', error);
  }

  // 2. INTERSECTION OBSERVER (for animations)
  try {
    const sections = document.querySelectorAll('section, .fade-in, .slide-up, .scale-up');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing after animating once
        }
      });
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Error during intersection observer setup:', error);
  }

  // 3. HEADER SCROLL EFFECTS
  try {
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    if (header) {
      window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop) {
          // Scrolling down
          if (scrollTop > 100) {
            header.classList.add('header-hidden');
          }
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

      }, { passive: true });
    }
  } catch (error) {
    console.error('Error during header scroll effects:', error);
  }

  // 4. IMAGE LAZY LOADING
  try {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } catch (error) {
    console.error('Error during image lazy loading:', error);
  }

  // 5. MOBILE MENU
  try {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuLinks = document.querySelectorAll('.mobile-menu a');

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
    console.error('Error during mobile menu functionality:', error);
  }

  // 7. FORM HANDLING (Basic Example)
  try {
    const form = document.querySelector('form');

    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const requiredInputs = form.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
          if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
          } else {
            input.classList.remove('error');
          }
        });

        if (emailInput && !isValidEmail(emailInput.value)) {
          emailInput.classList.add('error');
          isValid = false;
        } else if (emailInput){
          emailInput.classList.remove('error');
        }

        if (isValid) {
          // Simulate form submission
          console.log('Form submitted successfully!');
        } else {
          console.log('Form has errors. Please correct them.');
        }
      });

      function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
    }
  } catch (error) {
    console.error('Error during form handling:', error);
  }
});