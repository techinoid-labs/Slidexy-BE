document.addEventListener('DOMContentLoaded', function() {
    // --- Console Logging & Debugging ---
    try {
        const sourceUrl = 'https://www.techinoid.com';
        const imagesCount = document.querySelectorAll('img').length;
        const sectionsCount = document.querySelectorAll('section').length;

        console.log('%c🚀 Techinoid.com Website Loaded!', 'color: #4CAF50; font-size: 18px; font-weight: bold;');
        console.log(`%c🔗 Source URL: ${sourceUrl}`, 'color: #2196F3;');
        console.log(`%c🖼️ Total Images: ${imagesCount}`, 'color: #FFC107;');
        console.log(`%c📄 Total Sections: ${sectionsCount}`, 'color: #FF9800;');
        console.log('%c🔍 Debugging: All features initialized.', 'color: #9E9E9E;');
    } catch (error) {
        console.error('%cError in console logging:', 'color: #F44336;', error);
    }

    // --- Utility Functions ---

    /**
     * @function debounce
     * @description Limits the rate at which a function can fire.
     * @param {function} func - The function to debounce.
     * @param {number} delay - The delay in milliseconds.
     * @returns {function} The debounced function.
     */
    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    /**
     * @function throttle
     * @description Limits the rate at which a function can fire (executes immediately and then after delay).
     * @param {function} func - The function to throttle.
     * @param {number} limit - The limit in milliseconds.
     * @returns {function} The throttled function.
     */
    const throttle = (func, limit) => {
        let inThrottle;
        let lastResult;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
                lastResult = func.apply(context, args);
            }
            return lastResult;
        };
    };

    // --- DOM Element Caching ---
    const header = document.getElementById('header');
    const mainNavLinks = document.querySelectorAll('#navbar .main-menu a[href*="#"]');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const sections = document.querySelectorAll('section');
    const lazyImages = document.querySelectorAll('img[data-src]');
    const animatedElements = document.querySelectorAll('[data-aos]'); // Using data-aos as a marker for animatable elements
    const portfolioItems = document.querySelectorAll('.portfolio-item a.portfolio-lightbox');
    const contactForm = document.querySelector('.php-email-form');

    // --- 1. SMOOTH SCROLL NAVIGATION ---
    try {
        const headerHeight = header ? header.offsetHeight : 0;

        mainNavLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                // Check if the link is an internal anchor on the current page
                if (this.pathname === window.location.pathname && this.hash) {
                    event.preventDefault(); // Prevent default link behavior

                    const targetId = this.hash;
                    const targetElement = document.querySelector(targetId);

                    if (targetElement) {
                        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });

                        // Close mobile menu after clicking a link if it's open
                        if (document.body.classList.contains('mobile-nav-active')) {
                            toggleMobileNav();
                        }
                    }
                }
            });
        });
        console.log('%c✔️ Smooth Scroll Navigation initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Smooth Scroll Navigation:', 'color: #F44336;', error);
    }

    // --- 2. INTERSECTION OBSERVER (for animations) ---
    try {
        const animateOnScroll = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const animationClass = target.dataset.aos; // e.g., 'fade-up'
                    const animationDelay = target.dataset.aosDelay || '0'; // e.g., '100'

                    // Add a generic class to trigger CSS animations
                    target.classList.add('aos-animate');

                    // Apply delay if specified (using a simple setTimeout for simplicity)
                    if (animationDelay !== '0') {
                        target.style.transitionDelay = `${parseInt(animationDelay) / 1000}s`;
                    }
                    
                    // Specific animation classes could be added here based on data-aos,
                    // but for a general approach, 'aos-animate' is sufficient if CSS handles it.
                    // For example: target.classList.add(`animate__${animationClass}`);

                    observer.unobserve(target); // Stop observing once animated
                }
            });
        };

        const animationObserverOptions = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // Trigger when 10% of the element is visible
        };

        const animationObserver = new IntersectionObserver(animateOnScroll, animationObserverOptions);

        animatedElements.forEach(element => {
            // Add initial hidden state class (assuming CSS defines this)
            if (!element.classList.contains('aos-animate')) {
                element.style.opacity = '0'; // Hide by default for fade animations
                element.style.transform = 'translateY(20px)'; // Example for slide-up
                element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            }
            animationObserver.observe(element);
        });
        console.log('%c✔️ Intersection Observer for Animations initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Intersection Observer for Animations:', 'color: #F44336;', error);
    }

    // --- 3. HEADER SCROLL EFFECTS ---
    try {
        const handleHeaderScroll = () => {
            if (!header) return;
            if (window.scrollY > 50) { // Add scrolled class after 50px scroll
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        };

        // Initialize on load
        handleHeaderScroll();

        // Use requestAnimationFrame for scroll event for better performance
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(handleHeaderScroll);
        });
        console.log('%c✔️ Header Scroll Effects initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Header Scroll Effects:', 'color: #F44336;', error);
    }

    // --- 4. IMAGE LAZY LOADING ---
    try {
        const lazyLoadImages = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;

                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src'); // Clean up attribute

                        img.addEventListener('load', () => {
                            img.classList.add('loaded'); // Add a class for fade-in transition
                        }, { once: true });

                        if (!img.complete) { // If image is not in cache, add a loading indicator
                            img.classList.add('loading');
                        } else {
                            img.classList.add('loaded'); // If image is cached, add loaded class immediately
                        }
                    }
                    observer.unobserve(img); // Stop observing once loaded
                }
            });
        };

        const lazyLoadOptions = {
            root: null, // viewport
            rootMargin: '0px 0px 100px 0px', // Load images 100px before they enter the viewport
            threshold: 0 // Trigger as soon as any part of the image is visible
        };

        const imageObserver = new IntersectionObserver(lazyLoadImages, lazyLoadOptions);

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
        console.log('%c✔️ Image Lazy Loading initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Image Lazy Loading:', 'color: #F44336;', error);
    }

    // --- 5. MOBILE MENU ---
    let mobileNavActive = false;
    let mobileNavOverlay;

    /**
     * @function toggleMobileNav
     * @description Toggles the mobile navigation menu visibility.
     */
    const toggleMobileNav = () => {
        mobileNavActive = !mobileNavActive;
        document.body.classList.toggle('mobile-nav-active', mobileNavActive);

        if (mobileNavActive) {
            // Show overlay
            if (!mobileNavOverlay) {
                mobileNavOverlay = document.createElement('div');
                mobileNavOverlay.classList.add('mobile-nav-overlay');
                document.body.appendChild(mobileNavOverlay);
            }
            mobileNavOverlay.addEventListener('click', toggleMobileNav);
            mobileNavOverlay.style.display = 'block'; // Make visible
            requestAnimationFrame(() => {
                mobileNavOverlay.style.opacity = '1';
            });
        } else {
            // Hide overlay
            if (mobileNavOverlay) {
                mobileNavOverlay.style.opacity = '0';
                mobileNavOverlay.removeEventListener('click', toggleMobileNav);
                mobileNavOverlay.addEventListener('transitionend', function handler() {
                    if (!mobileNavActive) { // Ensure it's still inactive before hiding
                        mobileNavOverlay.style.display = 'none';
                    }
                    mobileNavOverlay.removeEventListener('transitionend', handler);
                });
            }
        }
    };

    try {
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', toggleMobileNav);

            // Close mobile nav on link click
            mainNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (mobileNavActive) {
                        toggleMobileNav();
                    }
                });
            });

            // Close mobile nav on outside click (handled by overlay)
            // CSS for .mobile-nav-overlay and .mobile-nav-active body class will handle animations
            const style = document.createElement('style');
            style.textContent = `
                .mobile-nav-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(14, 29, 52, 0.8);
                    z-index: 999;
                    transition: all 0.3s ease-in-out;
                    opacity: 0;
                    display: none;
                }
                body.mobile-nav-active .mobile-nav-overlay {
                    display: block;
                    opacity: 1;
                }
                /* Assuming #navbar is the mobile menu, adjust as per actual HTML */
                #navbar {
                    position: fixed;
                    top: 0;
                    right: -100%; /* Start off-screen */
                    width: 280px;
                    height: 100vh;
                    background: #fff;
                    z-index: 1000;
                    transition: right 0.3s ease-in-out;
                    overflow-y: auto;
                    padding: 60px 0 0 0;
                }
                body.mobile-nav-active #navbar {
                    right: 0;
                }
                .mobile-nav-toggle {
                    position: fixed;
                    right: 15px;
                    top: 15px;
                    z-index: 1001; /* Above overlay and menu */
                    cursor: pointer;
                    font-size: 24px;
                    color: #fff;
                    background: #007bff; /* Example background */
                    border-radius: 5px;
                    padding: 5px 8px;
                    display: none; /* Hide by default, show via media query */
                }
                @media (max-width: 991px) {
                    .mobile-nav-toggle {
                        display: inline-block;
                    }
                    #navbar {
                        display: none; /* Hide desktop nav */
                    }
                    body.mobile-nav-active #navbar {
                        display: block; /* Show mobile nav */
                    }
                }
            `;
            document.head.appendChild(style);
        } else {
            console.warn('%cMobile nav toggle button not found. Mobile menu feature might be incomplete.', 'color: #FFA000;');
        }
        console.log('%c✔️ Mobile Menu initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Mobile Menu:', 'color: #F44336;', error);
    }

    // --- 6. GALLERY INTERACTIONS (Lightbox) ---
    let currentLightboxImageIndex = 0;
    let lightboxContainer;
    let lightboxImage;
    let prevButton;
    let nextButton;

    /**
     * @function createLightbox
     * @description Creates the lightbox DOM elements if they don't exist.
     */
    const createLightbox = () => {
        lightboxContainer = document.createElement('div');
        lightboxContainer.id = 'techinoid-lightbox';
        lightboxContainer.classList.add('lightbox-closed'); // Start closed
        lightboxContainer.innerHTML = `
            <div class="lightbox-content">
                <span class="lightbox-close">&times;</span>
                <img src="" alt="Gallery Image" class="lightbox-image">
                <button class="lightbox-nav lightbox-prev">&lsaquo;</button>
                <button class="lightbox-nav lightbox-next">&rsaquo;</button>
            </div>
        `;
        document.body.appendChild(lightboxContainer);

        lightboxImage = lightboxContainer.querySelector('.lightbox-image');
        prevButton = lightboxContainer.querySelector('.lightbox-prev');
        nextButton = lightboxContainer.querySelector('.lightbox-next');

        lightboxContainer.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        prevButton.addEventListener('click', showPrevImage);
        nextButton.addEventListener('click', showNextImage);

        document.addEventListener('keydown', handleKeyboardNav);

        // Add CSS for lightbox
        const style = document.createElement('style');
        style.textContent = `
            #techinoid-lightbox {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease-in-out;
            }
            #techinoid-lightbox.lightbox-open {
                opacity: 1;
                pointer-events: auto;
            }
            .lightbox-content {
                position: relative;
                max-width: 90%;
                max-height: 90%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .lightbox-image {
                max-width: 100%;
                max-height: 100%;
                display: block;
                border: 5px solid #fff;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
                transform: scale(0.8);
                opacity: 0;
                transition: transform 0.3s ease-out, opacity 0.3s ease-out;
            }
            #techinoid-lightbox.lightbox-open .lightbox-image {
                transform: scale(1);
                opacity: 1;
            }
            .lightbox-close {
                position: absolute;
                top: -25px;
                right: -25px;
                color: #fff;
                font-size: 40px;
                cursor: pointer;
                z-index: 2001;
                background: #007bff;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            .lightbox-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.5);
                color: #fff;
                border: none;
                padding: 10px 15px;
                font-size: 30px;
                cursor: pointer;
                transition: background 0.3s ease;
                user-select: none;
                border-radius: 5px;
            }
            .lightbox-nav:hover {
                background: rgba(0, 0, 0, 0.8);
            }
            .lightbox-prev {
                left: -60px;
            }
            .lightbox-next {
                right: -60px;
            }
            @media (max-width: 768px) {
                .lightbox-prev { left: 10px; }
                .lightbox-next { right: 10px; }
                .lightbox-close { top: 10px; right: 10px; font-size: 30px; width: 40px; height: 40px;}
            }
        `;
        document.head.appendChild(style);
    };

    /**
     * @function openLightbox
     * @description Opens the lightbox with a specified image.
     * @param {string} src - The URL of the image to display.
     */
    const openLightbox = (src) => {
        if (!lightboxContainer) {
            createLightbox();
        }
        lightboxImage.src = src;
        lightboxContainer.classList.add('lightbox-open');
        document.body.style.overflow = 'hidden'; // Prevent body scroll
    };

    /**
     * @function closeLightbox
     * @description Closes the lightbox.
     */
    const closeLightbox = () => {
        if (lightboxContainer) {
            lightboxContainer.classList.remove('lightbox-open');
            document.body.style.overflow = ''; // Restore body scroll
            // Clear image src to stop loading if it hasn't finished
            lightboxImage.src = '';
        }
    };

    /**
     * @function showPrevImage
     * @description Shows the previous image in the gallery.
     */
    const showPrevImage = () => {
        if (portfolioItems.length === 0) return;
        currentLightboxImageIndex = (currentLightboxImageIndex - 1 + portfolioItems.length) % portfolioItems.length;
        openLightbox(portfolioItems[currentLightboxImageIndex].href);
    };

    /**
     * @function showNextImage
     * @description Shows the next image in the gallery.
     */
    const showNextImage = () => {
        if (portfolioItems.length === 0) return;
        currentLightboxImageIndex = (currentLightboxImageIndex + 1) % portfolioItems.length;
        openLightbox(portfolioItems[currentLightboxImageIndex].href);
    };

    /**
     * @function handleKeyboardNav
     * @description Handles keyboard navigation for the lightbox (Escape, left/right arrows).
     * @param {KeyboardEvent} event - The keyboard event.
     */
    const handleKeyboardNav = (event) => {
        if (!lightboxContainer || !lightboxContainer.classList.contains('lightbox-open')) return;

        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'ArrowLeft') {
            showPrevImage();
        } else if (event.key === 'ArrowRight') {
            showNextImage();
        }
    };

    try {
        if (portfolioItems.length > 0) {
            portfolioItems.forEach((item, index) => {
                item.addEventListener('click', function(event) {
                    event.preventDefault();
                    currentLightboxImageIndex = index; // Set current index
                    openLightbox(this.href);
                });
            });
            console.log('%c✔️ Gallery Lightbox initialized.', 'color: #8BC34A;');
        } else {
            console.log('%cGallery items not found. Lightbox not initialized.', 'color: #FFA000;');
        }
    } catch (error) {
        console.error('%cError in Gallery Interactions (Lightbox):', 'color: #F44336;', error);
    }

    // --- 7. FORM HANDLING (Contact Form) ---
    try {
        if (contactForm) {
            const nameInput = contactForm.querySelector('input[name="name"]');
            const emailInput = contactForm.querySelector('input[name="email"]');
            const subjectInput = contactForm.querySelector('input[name="subject"]');
            const messageInput = contactForm.querySelector('textarea[name="message"]');
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const loadingDiv = document.createElement('div');
            const errorMessageDiv = document.createElement('div');
            const successMessageDiv = document.createElement('div');

            // Initialize message containers
            loadingDiv.classList.add('loading');
            loadingDiv.style.display = 'none'; // Hidden by default
            loadingDiv.textContent = 'Loading';
            errorMessageDiv.classList.add('error-message');
            errorMessageDiv.style.display = 'none';
            successMessageDiv.classList.add('sent-message');
            successMessageDiv.style.display = 'none';

            contactForm.prepend(successMessageDiv);
            contactForm.prepend(errorMessageDiv);
            contactForm.prepend(loadingDiv);

            /**
             * @function validateField
             * @description Validates a single input field.
             * @param {HTMLElement} input - The input element to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            const validateField = (input) => {
                const value = input.value.trim();
                const parent = input.closest('.form-group'); // Assuming form-group wrapper

                if (input.required && value === '') {
                    input.classList.add('is-invalid');
                    if (parent) {
                        let error = parent.querySelector('.validate-error');
                        if (!error) {
                            error = document.createElement('div');
                            error.classList.add('validate-error');
                            parent.appendChild(error);
                        }
                        error.textContent = 'This field is required.';
                        error.style.display = 'block';
                    }
                    return false;
                }

                if (input.type === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) {
                    input.classList.add('is-invalid');
                    if (parent) {
                        let error = parent.querySelector('.validate-error');
                        if (!error) {
                            error = document.createElement('div');
                            error.classList.add('validate-error');
                            parent.appendChild(error);
                        }
                        error.textContent = 'Please enter a valid email address.';
                        error.style.display = 'block';
                    }
                    return false;
                }

                input.classList.remove('is-invalid');
                if (parent) {
                    const error = parent.querySelector('.validate-error');
                    if (error) error.style.display = 'none';
                }
                return true;
            };

            /**
             * @function validateForm
             * @description Validates all required fields in the form.
             * @returns {boolean} True if all fields are valid, false otherwise.
             */
            const validateForm = () => {
                let isValid = true;
                if (!validateField(nameInput)) isValid = false;
                if (!validateField(emailInput)) isValid = false;
                if (!validateField(subjectInput)) isValid = false;
                if (!validateField(messageInput)) isValid = false;
                return isValid;
            };

            // Attach validation listeners
            [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
                input.addEventListener('blur', () => validateField(input));
                input.addEventListener('input', () => {
                    if (input.classList.contains('is-invalid')) {
                        validateField(input); // Re-validate on input if already invalid
                    }
                });
            });

            contactForm.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent default form submission

                if (!validateForm()) {
                    errorMessageDiv.textContent = 'Please correct the errors in the form.';
                    errorMessageDiv.style.display = 'block';
                    successMessageDiv.style.display = 'none';
                    return;
                }

                // Simulate form submission
                loadingDiv.style.display = 'block';
                errorMessageDiv.style.display = 'none';
                successMessageDiv.style.display = 'none';
                submitButton.disabled = true; // Disable button during submission

                setTimeout(() => {
                    requestAnimationFrame(() => { // Use rAF for UI updates
                        loadingDiv.style.display = 'none';
                        const success = Math.random() > 0.2; // 80% success rate for demo

                        if (success) {
                            successMessageDiv.textContent = 'Your message has been sent. Thank you!';
                            successMessageDiv.style.display = 'block';
                            contactForm.reset(); // Clear the form
                            // Clear validation errors after successful submission
                            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                            document.querySelectorAll('.validate-error').forEach(el => el.style.display = 'none');

                        } else {
                            errorMessageDiv.textContent = 'There was an error sending your message. Please try again later.';
                            errorMessageDiv.style.display = 'block';
                        }
                        submitButton.disabled = false; // Re-enable button
                    });
                }, 2000); // Simulate network delay
            });

            // Add basic CSS for validation feedback (ensure these are in your stylesheet or added dynamically)
            const formStyle = document.createElement('style');
            formStyle.textContent = `
                .php-email-form .validate-error {
                    color: #dc3545;
                    font-size: 0.85em;
                    margin-top: 5px;
                    display: block;
                }
                .php-email-form .is-invalid {
                    border-color: #dc3545 !important;
                }
                .php-email-form .loading {
                    display: block;
                    background: #fff;
                    text-align: center;
                    padding: 15px;
                    margin-bottom: 15px;
                    color: #fff;
                    font-size: 14px;
                    animation: spin 1s linear infinite;
                    background: #007bff;
                }
                .php-email-form .error-message {
                    display: block;
                    background: #ed3c0d;
                    color: #fff;
                    text-align: center;
                    padding: 15px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                .php-email-form .sent-message {
                    display: block;
                    background: #18d26e;
                    color: #fff;
                    text-align: center;
                    padding: 15px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(formStyle);

        } else {
            console.log('%cContact form not found. Form handling not initialized.', 'color: #FFA000;');
        }
        console.log('%c✔️ Form Handling initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Form Handling:', 'color: #F44336;', error);
    }

    // --- 8. PARALLAX SCROLLING ---
    // This implementation assumes sections (or other elements) have a `data-parallax-speed`
    // or targets specific sections for background parallax.
    // For techinoid.com, the #home section has a background image. We'll apply parallax to it.
    try {
        const parallaxElements = document.querySelectorAll('[data-parallax-speed]');
        const homeSection = document.getElementById('home'); // Target home section explicitly

        /**
         * @function applyParallax
         * @description Applies a parallax effect to elements.
         */
        const applyParallax = () => {
            const scrollPos = window.scrollY;

            // Apply parallax to elements with data-parallax-speed (e.g., text, images)
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.parallaxSpeed) || 0.5;
                const yPos = -scrollPos * speed;
                element.style.transform = `translateY(${yPos}px)`;
            });

            // Apply background parallax to the home section
            if (homeSection) {
                const speed = parseFloat(homeSection.dataset.parallaxSpeed) || 0.4; // Default speed for backgrounds
                const yBgPos = scrollPos * speed * -1; // Negative to scroll slower up
                homeSection.style.backgroundPosition = `center ${yBgPos}px`;
            }
        };

        // Add a data-parallax-speed to the home section for background parallax
        if (homeSection && !homeSection.dataset.parallaxSpeed) {
            homeSection.dataset.parallaxSpeed = '0.4';
            homeSection.style.backgroundAttachment = 'fixed'; // Ensure background is fixed for parallax effect
        }

        // Use requestAnimationFrame for smooth parallax
        let parallaxRafId = null;
        const throttledParallax = throttle(() => {
            if (parallaxRafId) {
                cancelAnimationFrame(parallaxRafId);
            }
            parallaxRafId = requestAnimationFrame(applyParallax);
        }, 16); // Throttle to roughly 60fps

        // Initial call and event listener
        if (parallaxElements.length > 0 || homeSection) {
            applyParallax();
            window.addEventListener('scroll', throttledParallax);
            // Optionally, call on resize to re-calculate positions if necessary
            window.addEventListener('resize', debounce(applyParallax, 100));
            console.log('%c✔️ Parallax Scrolling initialized.', 'color: #8BC34A;');
        } else {
            console.log('%cNo parallax elements found. Parallax not initialized.', 'color: #FFA000;');
        }
    } catch (error) {
        console.error('%cError in Parallax Scrolling:', 'color: #F44336;', error);
    }

    // --- 9. SCROLL SPY ---
    try {
        const sectionsArray = Array.from(sections);
        const navLinks = document.querySelectorAll('#navbar .main-menu a'); // All main menu links

        // Observer for sections to apply active class to nav links
        const scrollSpyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const correspondingLink = document.querySelector(`#navbar .main-menu a[href*="#${id}"]`);

                if (correspondingLink) {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { // When at least 50% visible
                        navLinks.forEach(link => link.classList.remove('active'));
                        correspondingLink.classList.add('active');
                    }
                }
            });
        }, {
            root: null, // viewport
            rootMargin: `-50% 0px -50% 0px`, // Trigger when section midpoint is in view
            threshold: [0, 0.5, 1.0] // Observe at 0%, 50%, and 100% visibility
        });

        // Fallback for initial active link if no intersection has occurred yet
        const highlightCurrentSection = () => {
            let currentActive = null;
            sectionsArray.forEach(section => {
                const rect = section.getBoundingClientRect();
                // Consider a section active if its top is above header and its bottom is below header
                // or if it's the first section and entirely in view
                if (rect.top <= (header ? header.offsetHeight : 0) && rect.bottom >= (header ? header.offsetHeight : 0)) {
                    currentActive = section.id;
                }
            });

            if (currentActive) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.href.includes(`#${currentActive}`)) {
                        link.classList.add('active');
                    }
                });
            } else if (window.scrollY === 0 && sectionsArray.length > 0) {
                // If at the very top, highlight the first section's link
                navLinks.forEach(link => link.classList.remove('active'));
                const firstSectionLink = document.querySelector(`#navbar .main-menu a[href*="#${sectionsArray[0].id}"]`);
                if (firstSectionLink) {
                    firstSectionLink.classList.add('active');
                }
            }
        };

        sectionsArray.forEach(section => {
            if (section.id) { // Only observe sections with an ID
                scrollSpyObserver.observe(section);
            }
        });

        // Also run a simple scroll listener for immediate feedback and initial load
        // This is a redundant safety net in case IO doesn't behave as expected in all cases.
        // It helps to ensure the active class is set quickly on page load / refresh.
        let scrollSpyRafId = null;
        const throttledScrollSpy = throttle(() => {
            if (scrollSpyRafId) {
                cancelAnimationFrame(scrollSpyRafId);
            }
            scrollSpyRafId = requestAnimationFrame(highlightCurrentSection);
        }, 16);

        window.addEventListener('scroll', throttledScrollSpy);
        window.addEventListener('resize', debounce(throttledScrollSpy, 100)); // Update on resize
        highlightCurrentSection(); // Initial call on load

        console.log('%c✔️ Scroll Spy initialized.', 'color: #8BC34A;');
    } catch (error) {
        console.error('%cError in Scroll Spy:', 'color: #F44336;', error);
    }

}); // End DOMContentLoaded