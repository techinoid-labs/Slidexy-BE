document.addEventListener('DOMContentLoaded', function() {

  // Console Logging & Debugging
  try {
    console.log('%cWebsite loaded!', 'color: green; font-size: 20px;');
    console.log('%cSource URL: https://nextjs.org/', 'color: blue;');
    console.log('%cImages count: 6', 'color: purple;');
    console.log('%cSections count: 2', 'color: orange;');
  } catch (error) {
    console.error('Console logging error:', error);
  }

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
            block: 'start'
          });

          // Update URL without triggering navigation
          history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Smooth scroll error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('section, .fade-in, .slide-up, .scale-up');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Observe only once
        }
      });
    }, {
      threshold: 0.15 // Trigger when 15% of the element is visible
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer error:', error);
  }

  // Header Scroll Effects
  try {
    const header = document.querySelector('header');
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

      if (scrollTop > 50) {
        header.classList.add('header-shadow');
        header.classList.add('header-background'); //Added background class
      } else {
        header.classList.remove('header-shadow');
        header.classList.remove('header-background'); //Removed background class
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    }

    window.addEventListener('scroll', function() {
      requestAnimationFrame(handleScroll);
    });
  } catch (error) {
    console.error('Header scroll effects error:', error);
  }

  // Image Lazy Loading
  try {
    const images = document.querySelectorAll('img[data-src]');

    const imgObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src'); // prevent multiple loading
            img.classList.add('fade-in'); // Add a fade-in class
          }
          imgObserver.unobserve(img);
        }
      });
    }, {
      threshold: 0.2 // Load when 20% of the image is visible
    });

    images.forEach(image => {
      imgObserver.observe(image);
    });
  } catch (error) {
    console.error('Image lazy loading error:', error);
  }

  // Mobile Menu
  try {
    const menuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuLinks = document.querySelectorAll('.mobile-menu a');

    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
      });

      menuLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
        });
      });

      document.addEventListener('click', (event) => {
        if (!mobileMenu.contains(event.target) && !menuButton.contains(event.target) && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Mobile menu error:', error);
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

  // Performance: Throttle resize events
  try {
    const handleResize = debounce(() => {
      // Code to execute on resize
    }, 250); // Delay of 250ms

    window.addEventListener('resize', handleResize);
  } catch (error) {
    console.error('Resize handling error:', error);
  }

});