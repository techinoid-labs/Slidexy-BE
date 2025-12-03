document.addEventListener('DOMContentLoaded', function() {
  // Console Logging & Debugging
  console.log('%cWebsite loaded!', 'color: green;');
  console.log('%cSource URL: https://nextjs.org/', 'color: blue;');
  console.log('%cImages count: 7', 'color: magenta;');
  console.log('%cSections count: 3', 'color: cyan;');

  // Smooth Scroll Navigation
  try {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          window.scroll({
            top: targetElement.offsetTop,
            left: 0,
            behavior: 'smooth'
          });

          // Optionally adjust for header height:
          // const headerHeight = document.querySelector('header').offsetHeight;
          // window.scroll({
          //   top: targetElement.offsetTop - headerHeight,
          //   left: 0,
          //   behavior: 'smooth'
          // });
        }
      });
    });
  } catch (error) {
    console.error('Smooth Scroll Navigation Error:', error);
  }

  // Intersection Observer for Animations
  try {
    const sections = document.querySelectorAll('section, .animate-on-scroll');
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // observer.unobserve(entry.target); // Uncomment to observe only once
        } else {
          entry.target.classList.remove('visible'); // Remove to re-animate on scroll up
        }
      });
    }, options);

    sections.forEach(section => {
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer Error:', error);
  }

  // Header Scroll Effects
  try {
    const header = document.querySelector('header');
    const scrollThreshold = 50;

    function handleScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      requestAnimationFrame(handleScroll);
    }
    requestAnimationFrame(handleScroll);

    // Debounce function
    function debounce(func, delay) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
      };
    }

  } catch (error) {
    console.error('Header Scroll Effects Error:', error);
  }

  // Image Lazy Loading
  try {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const lazyLoadOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.removeAttribute('data-src');
          lazyImage.classList.add('loaded');
          lazyLoadObserver.unobserve(lazyImage);
        }
      });
    }, lazyLoadOptions);

    lazyImages.forEach(lazyImage => {
      lazyLoadObserver.observe(lazyImage);
    });
  } catch (error) {
    console.error('Image Lazy Loading Error:', error);
  }

  // Mobile Menu
  try {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.mobile-menu a');

    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
        this.classList.toggle('active');
      });

      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        });
      });

      document.addEventListener('click', (event) => {
        if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target) && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          menuToggle.classList.remove('active');
        }
      });
    }
  } catch (error) {
    console.error('Mobile Menu Error:', error);
  }
});