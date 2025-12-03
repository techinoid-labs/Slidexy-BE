document.addEventListener('DOMContentLoaded', function() {
  // Console logging & debugging
  try {
    console.log('%cWebsite loaded: https://nextjs.org/', 'color: #2ECC71; font-size: 16px;');
    console.log('%cImages count: 7', 'color: #3498DB; font-size: 14px;');
    console.log('%cSections count: 3', 'color: #9B59B6; font-size: 14px;');
  } catch (error) {
    console.error('Console logging error:', error);
  }

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

          // Update URL hash without triggering scroll
          history.pushState(null, null, targetId);
        }
      });
    });
  } catch (error) {
    console.error('Smooth scroll error:', error);
  }

  // Intersection Observer for animations
  try {
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing after element is visible
        }
      });
    }, {
      threshold: 0.15 // Adjust threshold as needed
    });

    sections.forEach(section => {
      section.classList.add('hidden'); // Initially hide sections
      observer.observe(section);
    });
  } catch (error) {
    console.error('Intersection Observer error:', error);
  }

  // Image lazy loading
  try {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.removeAttribute('data-src');
          lazyImage.classList.add('fade-in'); // Add fade-in class

          lazyImage.onload = () => {
              lazyImage.classList.remove('loading');
          }
          lazyLoadObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(lazyImage => {
        lazyImage.classList.add('loading');
      lazyLoadObserver.observe(lazyImage);
    });
  } catch (error) {
    console.error('Image lazy loading error:', error);
  }

    // Mobile menu
    try {
      const menuToggle = document.querySelector('.menu-toggle');
      const navList = document.querySelector('.nav-list');

      if (menuToggle && navList) {
          menuToggle.addEventListener('click', () => {
              navList.classList.toggle('active');
              menuToggle.classList.toggle('active');
          });

          document.addEventListener('click', (event) => {
              const isClickInsideMenu = navList.contains(event.target) || menuToggle.contains(event.target);
              if (!isClickInsideMenu && navList.classList.contains('active')) {
                  navList.classList.remove('active');
                  menuToggle.classList.remove('active');
              }
          });

          const navLinks = document.querySelectorAll('.nav-list a');
          navLinks.forEach(link => {
              link.addEventListener('click', () => {
                  navList.classList.remove('active');
                  menuToggle.classList.remove('active');
              });
          });
      }
    } catch (error) {
        console.error('Mobile menu error:', error);
    }


  // Gallery interactions (basic placeholder)
  try {
    const galleryImages = document.querySelectorAll('.gallery-image');

    galleryImages.forEach(image => {
      image.addEventListener('click', () => {
        console.log('Gallery image clicked'); // Replace with lightbox logic
      });
    });
  } catch (error) {
    console.error('Gallery interactions error:', error);
  }

  // Form handling (basic placeholder)
  try {
    const form = document.querySelector('form');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted'); // Replace with actual form handling logic
      });
    }
  } catch (error) {
    console.error('Form handling error:', error);
  }

  // Navbar effects (scroll hide/show, shadow, background change)
  try {
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > lastScrollTop) {
        // Scrolling down
        header.classList.add('nav-hidden');
      } else {
        // Scrolling up
        header.classList.remove('nav-hidden');
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For mobile or negative scrolling

        if(scrollTop > 50) {
            header.classList.add('shadow');
        } else {
            header.classList.remove('shadow');
        }
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
    console.error('Navbar effects error:', error);
  }

});