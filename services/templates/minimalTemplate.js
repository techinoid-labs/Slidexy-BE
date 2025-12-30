/**
 * Minimal / Universal Template
 * A clean, robust fallback template suitable for any niche data.
 * Structure: Header -> Hero -> Logos -> Services -> About -> Gallery -> CTA -> Footer
 */

function generateHTML(content, presentation) {
    const primary = content.colors?.[0] || '#2563eb';
    const secondary = content.colors?.[1] || '#1e40af';

    // Helper: Initial Hero Image
    const heroImg = content.allImages?.[0]?.src || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

    // Helper: About Image
    const aboutImg = content.allImages?.[1]?.src || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    // Helper: Gallery Images (take up to 3)
    const galleryImages = content.allImages?.slice(2, 5) || [];
    // If no images, use placeholders
    if (galleryImages.length === 0) {
        galleryImages.push({ src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', alt: 'Project 1' });
        galleryImages.push({ src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', alt: 'Project 2' });
        galleryImages.push({ src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', alt: 'Project 3' });
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.topic} | ${content.valueProposition}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <header>
        <div class="container">
            <nav>
                <div class="logo">${content.topic}.</div>
                <div class="nav-menu">
                    <a href="#about">About</a>
                    <a href="#services">Services</a>
                    <a href="#work">Work</a>
                    <a href="#contact">Contact</a>
                </div>
                <div style="display:flex; align-items:center; gap:20px;">
                    <a href="#contact" class="btn btn-primary" style="padding: 8px 20px; font-size: 0.9rem;">${content.cta || "Get Started"}</a>
                    <div class="mobile-toggle"><i class="fas fa-bars"></i></div>
                </div>
            </nav>
        </div>
    </header>

    <section class="hero fade-up">
        <div class="container">
            <h1>${content.valueProposition || `We Build Digital <br> <span style="color: var(--primary);">Experiences.</span>`}</h1>
            <p>${content.heroDescription || "A multi-purpose foundation designed to adapt to your brand's unique needs. Scalable, clean, and built for performance."}</p>
            <div class="hero-btns">
                <a href="#contact" class="btn btn-primary">${content.cta || "Get Started"}</a>
                <a href="#about" class="btn btn-outline">Learn More</a>
            </div>
            <div class="hero-media">
                <img src="${heroImg}" alt="Hero Image">
            </div>
        </div>
    </section>

    <div class="logos">
        <div class="container">
            <div class="logo-grid">
                <i class="fab fa-google"></i>
                <i class="fab fa-amazon"></i>
                <i class="fab fa-apple"></i>
                <i class="fab fa-spotify"></i>
                <i class="fab fa-microsoft"></i>
            </div>
        </div>
    </div>

    <section id="services" class="section fade-up">
        <div class="container">
            <div class="text-center mb-6">
                <div style="color:var(--primary); font-weight:600; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px; font-size:0.8rem;">Our Expertise</div>
                <h2>What We Do</h2>
            </div>
            <div class="grid-3">
                ${content.sections ? content.sections.slice(0, 3).map(s => `
                <div class="card">
                    <div class="icon-box"><i class="fas fa-layer-group"></i></div>
                    <h3>${s.title}</h3>
                    <p class="mb-2">${s.description || "Delivering excellence in every aspect of our service to ensure your success."}</p>
                    <a href="#" style="color:var(--primary); font-weight:600;">Read More &rarr;</a>
                </div>
                `).join('') : `
                <div class="card">
                    <div class="icon-box"><i class="fas fa-layer-group"></i></div>
                    <h3>Design System</h3>
                    <p class="mb-2">Scalable architecture for your digital presence. Consistent, clean, and maintainable.</p>
                </div>
                `}
            </div>
        </div>
    </section>

    <section id="about" class="section bg-light fade-up">
        <div class="container">
            <div class="split">
                <div class="split-img">
                    <img src="${aboutImg}" alt="About Team">
                </div>
                <div class="split-content">
                    <h2>Driven by Results, <br>Defined by Quality.</h2>
                    <p class="mb-4">We are a team of passionate individuals dedicated to creating meaningful work. Whether you are a startup or an enterprise, we adapt to your goals.</p>
                    <ul class="check-list">
                        <li><i class="fas fa-check-circle"></i> Certified Experts in the Field</li>
                        <li><i class="fas fa-check-circle"></i> 24/7 Dedicated Support</li>
                        <li><i class="fas fa-check-circle"></i> Transparent Pricing Models</li>
                    </ul>
                    <br>
                    <a href="#" class="btn btn-primary">About Our Team</a>
                </div>
            </div>
        </div>
    </section>

    <section id="work" class="section fade-up">
        <div class="container">
            <div style="display:flex; justify-content:space-between; align-items:end; margin-bottom:50px;">
                <h2>Recent Projects</h2>
                <a href="#" style="font-weight:600; border-bottom:2px solid var(--text-main);">View All</a>
            </div>
            <div class="gallery-grid">
                ${galleryImages.map(img => `
                <div class="gallery-item">
                    <img src="${img.src}" class="gallery-img" alt="${img.alt || 'Project'}">
                    <div class="gallery-overlay">
                        <h3>${content.topic}</h3>
                        <p>Project Showcase</p>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="contact" class="container fade-up">
        <div class="cta-box">
            <h2>Ready to transform your vision?</h2>
            <p>Let's collaborate and build something extraordinary together.</p>
            <a href="#contact" class="btn" style="background:white; color:var(--text-main);">Start a Project</a>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <div class="logo mb-2">${content.topic}.</div>
                    <p>Creating digital experiences that matter.</p>
                </div>
                <div class="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#">About</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Press</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Newsletter</a></li>
                        <li><a href="#">Privacy</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Connect</h4>
                    <ul>
                        <li><a href="#">Twitter</a></li>
                        <li><a href="#">LinkedIn</a></li>
                        <li><a href="#">Instagram</a></li>
                    </ul>
                </div>
            </div>
            <div style="border-top:1px solid #ddd; margin-top:50px; padding-top:20px; text-align:center; font-size:0.9rem;">
                &copy; ${new Date().getFullYear()} ${content.topic}. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

function generateCSS(content, presentation) {
    const primary = content.colors?.[0] || '#2563eb';
    const primaryDark = content.colors?.[1] || '#1e40af'; // Fallback if no 2nd color

    return `
        /* =========================================
           1. THE CONTROL CENTER
           ========================================= */
        :root {
            /* BRAND COLORS */
            --primary: ${primary};
            --primary-dark: ${primaryDark}; 
            --text-main: #111827;
            --text-body: #6b7280;
            --bg-body: #ffffff;
            --bg-light: #f3f4f6;

            /* SHAPE & FEEL */
            --radius: 8px;
            --container: 1200px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* --- RESET & BASE --- */
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg-body); color: var(--text-body); line-height: 1.6; overflow-x: hidden; }
        h1, h2, h3, h4, h5, h6 { color: var(--text-main); line-height: 1.2; font-weight: 700; margin-bottom: 1rem; }
        img { width: 100%; height: auto; display: block; border-radius: var(--radius); }
        a { text-decoration: none; color: inherit; transition: var(--transition); }
        ul { list-style: none; }

        /* --- UTILITIES --- */
        .container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
        .section { padding: 100px 0; }
        .bg-light { background-color: var(--bg-light); }
        .text-center { text-align: center; }
        .mb-2 { margin-bottom: 1rem; }
        .mb-4 { margin-bottom: 2rem; }
        .mb-6 { margin-bottom: 4rem; }

        /* --- BUTTONS --- */
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: var(--transition); border: 2px solid transparent; font-size: 1rem; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); }
        .btn-outline { background: transparent; border-color: var(--text-main); color: var(--text-main); }
        .btn-outline:hover { background: var(--text-main); color: white; }

        /* --- ANIMATION --- */
        .fade-up { opacity: 0; transform: translateY(30px); transition: 0.8s ease-out; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }

        /* --- HEADER --- */
        header { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(0, 0, 0, 0.05); height: 80px; display: flex; align-items: center; }
        nav { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .logo { font-size: 1.5rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; }
        .nav-menu { display: flex; gap: 30px; }
        .nav-menu a { font-weight: 500; font-size: 0.95rem; color: var(--text-body); }
        .nav-menu a:hover { color: var(--primary); }
        .mobile-toggle { display: none; font-size: 1.5rem; color: var(--text-main); cursor: pointer; }

        /* --- HERO --- */
        .hero { padding: 180px 0 100px; text-align: center; }
        .hero h1 { font-size: clamp(2.5rem, 5vw, 4.5rem); max-width: 900px; margin: 0 auto 24px; }
        .hero p { font-size: 1.25rem; max-width: 600px; margin: 0 auto 40px; }
        .hero-btns { display: flex; gap: 15px; justify-content: center; margin-bottom: 60px; }
        .hero-media { width: 100%; max-width: 1000px; margin: 0 auto; border-radius: var(--radius); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1); overflow: hidden; position: relative; }

        /* --- LOGOS --- */
        .logos { padding: 40px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
        .logo-grid { display: flex; justify-content: center; gap: 60px; flex-wrap: wrap; opacity: 0.6; grayscale: 100%; }
        .logo-grid i { font-size: 2rem; }

        /* --- SERVICES --- */
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .card { padding: 40px; background: white; border: 1px solid #eee; border-radius: var(--radius); transition: var(--transition); }
        .card:hover { border-color: var(--primary); transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }
        .icon-box { width: 60px; height: 60px; background: var(--bg-light); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--primary); margin-bottom: 20px; }

        /* --- SPLIT --- */
        .split { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .split-content h2 { font-size: 2.5rem; margin-bottom: 20px; }
        .check-list li { margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .check-list i { color: var(--primary); }

        /* --- GALLERY --- */
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
        .gallery-item { position: relative; overflow: hidden; border-radius: var(--radius); aspect-ratio: 4/3; }
        .gallery-img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .gallery-overlay { position: absolute; bottom: 0; left: 0; width: 100%; padding: 30px; background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent); color: white; opacity: 0; transform: translateY(20px); transition: 0.3s; }
        .gallery-item:hover .gallery-img { transform: scale(1.1); }
        .gallery-item:hover .gallery-overlay { opacity: 1; transform: translateY(0); }

        /* --- CTA --- */
        .cta-box { background: var(--text-main); color: white; border-radius: var(--radius); padding: 80px 20px; text-align: center; }
        .cta-box h2 { color: white; margin-bottom: 20px; }
        .cta-box p { color: #aaa; margin-bottom: 40px; }

        /* --- FOOTER --- */
        footer { padding: 80px 0 30px; background: var(--bg-light); }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 60px; }
        .footer-col h4 { margin-bottom: 20px; }
        .footer-col a { display: block; margin-bottom: 10px; color: var(--text-body); }
        .footer-col a:hover { color: var(--primary); }

        /* RESPONSE */
        @media (max-width: 768px) {
            .nav-menu { display: none; }
            .mobile-toggle { display: block; }
            .split { grid-template-columns: 1fr; }
            .hero-btns { flex-direction: column; }
        }
    `;
}

function generateJS(content, presentation) {
    return `
    document.addEventListener('DOMContentLoaded', () => {
        // Scroll Animation Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        });

        document.querySelectorAll('.fade-up').forEach(el => {
            observer.observe(el);
        });

        // Mobile Menu Toggle (Basic)
        const mobileToggle = document.querySelector('.mobile-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if(mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
                if(navMenu.style.display === 'flex') {
                    navMenu.style.flexDirection = 'column';
                    navMenu.style.position = 'absolute';
                    navMenu.style.top = '80px';
                    navMenu.style.left = '0';
                    navMenu.style.width = '100%';
                    navMenu.style.background = 'white';
                    navMenu.style.padding = '20px';
                    navMenu.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                }
            });
        }
    });
    `;
}

module.exports = { generateHTML, generateCSS, generateJS };
