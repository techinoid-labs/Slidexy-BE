/**
 * Corporate Template - "NexCorp" Style (User Provided)
 * A dark, modern corporate look with glowing orbs, detailed service cards, and rich sections.
 */

function generateHTML(content, presentation) {
    // Content is already curated
    const curatedData = content;
    const primaryColor = content.colors?.[0] || "#3b82f6";
    const accentColor = content.colors?.[1] || "#10b981";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${websiteData.topic} | Enterprise Solutions</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <header>
        <div class="container">
            <nav>
                <a href="#" class="logo">${websiteData.topic}<span>.</span></a>
                <ul class="nav-links">
                    <li><a href="#services">Services</a></li>
                    <li><a href="#models">Engagement</a></li>
                    <li><a href="#process">Process</a></li>
                    <li><a href="#work">Projects</a></li>
                    <li><a href="#contact" class="btn btn-primary">Book a Meeting</a></li>
                </ul>
                <div class="mobile-toggle"><i class="fas fa-bars"></i></div>
            </nav>
        </div>
    </header>

    <section class="hero pattern-grid">
        <div class="glow-orb orb-top-right"></div>
        <div class="container">
            <h1>${curatedData.valueProposition || `Drive Business Growth with <br> Scalable Digital Solutions`}</h1>
            <p>${curatedData.validSections[0]?.description || 'Boost your enterprise with customized software that adapts, grows, and integrates seamlessly with your long-term success strategy.'}</p>
            <div style="display: flex; justify-content: center; gap: 15px;">
                <a href="#contact" class="btn btn-primary">${curatedData.primaryCTA || 'Schedule a Call'}</a>
                <a href="#work" class="btn btn-outline">${curatedData.secondaryCTA || 'View Our Work'}</a>
            </div>
        </div>
    </section>

    <div class="logo-strip">
        <div class="logo-track">
            <!-- Simulated Infinite Scroll with Font Awesome Icons -->
            <i class="fab fa-aws"></i>
            <i class="fab fa-google"></i>
            <i class="fab fa-microsoft"></i>
            <i class="fab fa-meta"></i>
            <i class="fab fa-spotify"></i>
            <i class="fab fa-slack"></i>
            <i class="fab fa-uber"></i>
            <i class="fab fa-airbnb"></i>
            <i class="fab fa-aws"></i>
            <i class="fab fa-google"></i>
            <i class="fab fa-microsoft"></i>
            <i class="fab fa-meta"></i>
        </div>
    </div>

    <section id="services" class="section-padding pattern-dots">
        <div class="glow-orb orb-bottom-left"></div>
        <div class="container">
            <div class="section-header">
                <span class="badge">Our Expertise</span>
                <h2>What would you like to get done?</h2>
                <p>End-to-end technology services tailored for modern enterprises.</p>
            </div>

            <div class="services-grid">
                ${curatedData.validSections.map(section => `
                <div class="service-card">
                    <i class="fas fa-code"></i>
                    <h3>${section.title}</h3>
                    <p>${section.description}</p>
                    <a href="#" class="service-link">View Details &rarr;</a>
                </div>
                `).join('')}
                
                <!-- Smart Fill if sections are sparse -->
                ${curatedData.validSections.length < 4 ? `
                <div class="service-card">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Cybersecurity</h3>
                    <p>Protecting your digital assets with advanced threat detection, compliance auditing, and encryption.</p>
                    <a href="#" class="service-link">View Details &rarr;</a>
                </div>
                <div class="service-card">
                    <i class="fas fa-cloud"></i>
                    <h3>Cloud Solutions</h3>
                    <p>Scalable cloud infrastructure design, migration, and management for AWS, Azure, and Google Cloud.</p>
                    <a href="#" class="service-link">View Details &rarr;</a>
                </div>
                ` : ''}
            </div>
        </div>
    </section>

    <section class="section-padding stats-section">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-box">
                    <h3>50+</h3>
                    <span>Team Members</span>
                </div>
                <div class="stat-box">
                    <h3>12+</h3>
                    <span>Years Experience</span>
                </div>
                <div class="stat-box">
                    <h3>200+</h3>
                    <span>Projects Delivered</span>
                </div>
                <div class="stat-box">
                    <h3>15</h3>
                    <span>Industries Served</span>
                </div>
            </div>
        </div>
    </section>

    <section id="models" class="section-padding pattern-grid">
        <div class="container">
            <div class="section-header">
                <span class="badge">Engagement Models</span>
                <h2>Flexibility that fits your needs</h2>
            </div>
            <div class="engagement-wrapper">
                <div class="model-card">
                    <h3>Staff Augmentation</h3>
                    <p class="mb-2">Quickly extend your existing team with specialized talent tailored to your project needs.</p>
                    <br>
                    <ul class="model-list">
                        <li><i class="fas fa-check-circle"></i> Access diverse, skilled talent immediately</li>
                        <li><i class="fas fa-check-circle"></i> Scale team size flexibly</li>
                        <li><i class="fas fa-check-circle"></i> Reduce labor costs & overhead</li>
                        <li><i class="fas fa-check-circle"></i> Full control over management</li>
                    </ul>
                    <br>
                    <a href="#" class="btn btn-outline" style="width: 100%;">Get Talent</a>
                </div>
                <div class="model-card">
                    <h3>Fixed Price Projects</h3>
                    <p class="mb-2">Enhance your business with expert-led project management and transparent pricing.</p>
                    <br>
                    <ul class="model-list">
                        <li><i class="fas fa-check-circle"></i> Transparent pricing & financial certainty</li>
                        <li><i class="fas fa-check-circle"></i> Guaranteed timelines & deliverables</li>
                        <li><i class="fas fa-check-circle"></i> Minimal management effort required</li>
                        <li><i class="fas fa-check-circle"></i> End-to-end accountability</li>
                    </ul>
                    <br>
                    <a href="#" class="btn btn-primary" style="width: 100%;">Start Project</a>
                </div>
            </div>
        </div>
    </section>

    <section id="process" class="section-padding">
        <div class="container">
            <div class="section-header">
                <span class="badge">How We Work</span>
                <h2>Our Development Process</h2>
            </div>
            <div class="process-steps">
                <div class="step-item">
                    <div class="step-content">
                        <h4>Discovery</h4>
                        <p>Understanding client needs and project goals through deep analysis.</p>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-content">
                        <h4>Planning</h4>
                        <p>Outlining the project roadmap, architecture, and timelines.</p>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-content">
                        <h4>Design</h4>
                        <p>Creating wireframes, interactive prototypes, and UI/UX designs.</p>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-content">
                        <h4>Development</h4>
                        <p>Coding and building the scalable software solution.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="reviews" class="section-padding pattern-dots" style="background: rgba(255,255,255,0.02);">
        <div class="container">
            <div class="section-header">
                <span class="badge">Testimonials</span>
                <h2>What our clients say</h2>
            </div>
            <div class="testimonial-grid">
                <div class="review-card">
                    <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p>"The ${websiteData.topic} team led by this platform delivered a superb prototype for our platform on time."</p>
                    <div class="client-info">
                        <div class="client-avatar">SJ</div>
                        <div>
                            <h5>Sarah Johnson</h5>
                            <small style="color:var(--text-muted)">Program Manager, TechGlobal</small>
                        </div>
                    </div>
                </div>
                <div class="review-card">
                    <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p>"They transformed our vision into reality with exceptional technical abilities and open communication."</p>
                    <div class="client-info">
                        <div class="client-avatar">JD</div>
                        <div>
                            <h5>James Doe</h5>
                            <small style="color:var(--text-muted)">Co-Founder, StartupFlow</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="section-padding">
        <div class="container">
            <div class="cta-box">
                <div class="cta-content">
                    <h2>Ready to build the future?</h2>
                    <p>Experience our expertise risk-free with a complete consultation — let's bring your vision to life!</p>
                    <a href="#" class="btn" style="background: white; color: var(--primary);">Start Your Transformation</a>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a href="#" class="logo">${websiteData.topic}<span>.</span></a>
                    <p>Empowering businesses through innovation, robust engineering, and scalable digital strategies.</p>
                </div>
                <div class="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Services</a></li>
                        <li><a href="#">Process</a></li>
                        <li><a href="#">Careers</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact</h4>
                    <ul>
                        <li><a href="#">hello@${websiteData.topic.toLowerCase().replace(/ /g, '')}.com</a></li>
                        <li><a href="#">+1 (555) 123-4567</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                <h4>Site Theme</h4>
                <div class="theme-switcher">
                    <button class="theme-btn" data-theme="dark" style="background: linear-gradient(135deg, #020617 50%, #0854e6 50%);" title="Modern Dark"></button>
                    <button class="theme-btn" data-theme="light" style="background: linear-gradient(135deg, #ffffff 50%, #0284c7 50%); border: 1px solid #ccc;" title="Professional Light"></button>
                    <button class="theme-btn" data-theme="midnight" style="background: linear-gradient(135deg, #000000 50%, #7c3aed 50%);" title="Midnight Purple"></button>
                    <button class="theme-btn" data-theme="forest" style="background: linear-gradient(135deg, #022c22 50%, #10b981 50%);" title="Deep Forest"></button>
                    <!-- New Themes -->
                    <button class="theme-btn" data-theme="sunset" style="background: linear-gradient(135deg, #1c1917 50%, #ea580c 50%);" title="Sunset Glow"></button>
                    <button class="theme-btn" data-theme="ocean" style="background: linear-gradient(135deg, #082f49 50%, #06b6d4 50%);" title="Ocean Blue"></button>
                    <button class="theme-btn" data-theme="lavender" style="background: linear-gradient(135deg, #faf5ff 50%, #8b5cf6 50%); border: 1px solid #ccc;" title="Soft Lavender"></button>
                    <button class="theme-btn" data-theme="crimson" style="background: linear-gradient(135deg, #450a0a 50%, #db2777 50%);" title="Neon Crimson"></button>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
                <p>&copy; 2025 ${websiteData.topic}. All rights reserved.</p>
                <div style="display: flex; gap: 20px;">
                    <a href="#"><i class="fab fa-linkedin"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

function generateJS(websiteData) {
    return `
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if(mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Intersection Observer for Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .model-card, .step-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
    
    // Add visible class styling dynamically or rely on CSS
    const style = document.createElement('style');
    style.textContent = \`
        .visible { opacity: 1 !important; transform: translateY(0) !important; }
    \`;
    document.head.appendChild(style);
    document.head.appendChild(style);

    // Full Theme Definitions
    const themes = {
        'dark': {
            '--bg-dark': '#020617',
            '--bg-card': '#0f172a',
            '--text-main': '#f8fafc',
            '--text-muted': '#94a3b8',
            '--border': '#1e293b',
            '--primary': '#0854e6',
            '--primary-glow': 'rgba(8, 84, 230, 0.4)',
            '--accent': '#10b981'
        },
        'light': {
            '--bg-dark': '#ffffff',
            '--bg-card': '#f1f5f9', // slate-100
            '--text-main': '#0f172a', // slate-900
            '--text-muted': '#475569', // slate-600
            '--border': '#cbd5e1', // slate-300
            '--primary': '#0284c7', // sky-600
            '--primary-glow': 'rgba(2, 132, 199, 0.2)',
            '--accent': '#059669' // emerald-600
        },
        'midnight': {
            '--bg-dark': '#000000',
            '--bg-card': '#171717', // neutral-900
            '--text-main': '#ffffff',
            '--text-muted': '#a3a3a3', // neutral-400
            '--border': '#262626', // neutral-800
            '--primary': '#7c3aed', // violet-600
            '--primary-glow': 'rgba(124, 58, 237, 0.4)',
            '--accent': '#f43f5e' // rose-500
        },
        'forest': {
            '--bg-dark': '#022c22', // emerald-950
            '--bg-card': '#064e3b', // emerald-900
            '--text-main': '#ecfdf5', // emerald-50
            '--text-muted': '#6ee7b7', // emerald-300
            '--border': '#065f46', // emerald-800
            '--primary': '#10b981', // emerald-500
            '--primary-glow': 'rgba(16, 185, 129, 0.4)',
            '--accent': '#fbbf24' // amber-400
        },
        'sunset': {
            '--bg-dark': '#1c1917', // stone-950
            '--bg-card': '#292524', // stone-800
            '--text-main': '#fafaf9', // stone-50
            '--text-muted': '#a8a29e', // stone-400
            '--border': '#44403c', // stone-700
            '--primary': '#ea580c', // orange-600
            '--primary-glow': 'rgba(234, 88, 12, 0.4)',
            '--accent': '#f59e0b' // amber-500
        },
        'ocean': {
            '--bg-dark': '#082f49', // sky-950
            '--bg-card': '#0c4a6e', // sky-900
            '--text-main': '#f0f9ff', // sky-50
            '--text-muted': '#7dd3fc', // sky-300
            '--border': '#0369a1', // sky-700
            '--primary': '#06b6d4', // cyan-500
            '--primary-glow': 'rgba(6, 182, 212, 0.4)',
            '--accent': '#38bdf8' // sky-400
        },
        'lavender': {
            '--bg-dark': '#faf5ff', // purple-50
            '--bg-card': '#f3e8ff', // purple-100
            '--text-main': '#3b0764', // purple-950
            '--text-muted': '#6b21a8', // purple-800
            '--border': '#d8b4fe', // purple-300
            '--primary': '#8b5cf6', // violet-500
            '--primary-glow': 'rgba(139, 92, 246, 0.2)',
            '--accent': '#d946ef' // fuchsia-500
        },
        'crimson': {
            '--bg-dark': '#450a0a', // red-950
            '--bg-card': '#7f1d1d', // red-900
            '--text-main': '#fff1f2', // rose-50
            '--text-muted': '#fda4af', // rose-300
            '--border': '#9f1239', // rose-800
            '--primary': '#db2777', // pink-600
            '--primary-glow': 'rgba(219, 39, 119, 0.5)',
            '--accent': '#fb7185' // rose-400
        }
    };

    // Theme Switcher Logic
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const themeKey = btn.getAttribute('data-theme');
            const theme = themes[themeKey];
            
            if (theme) {
                // Apply all variables from the theme preset
                Object.keys(theme).forEach(key => {
                    document.documentElement.style.setProperty(key, theme[key]);
                });
            }
        });
    });
});
    `;
}

function generateCSS(websiteData, presentation) {
    // Helper to check if color is light/bright enough for dark mode
    const isBright = (hex) => {
        if (!hex || hex === '#000000' || hex === '#000') return false;
        // Simple hex to rgb
        let c = hex.substring(1);
        let rgb = parseInt(c, 16);
        let r = (rgb >> 16) & 0xff;
        let g = (rgb >> 8) & 0xff;
        let b = (rgb >> 0) & 0xff;
        // Luma
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luma > 40; // Avoid very dark colors
    };

    // Filter colors to find suitable candidates
    const validColors = (websiteData.colors || []).filter(c => isBright(c));

    // Fallback to default blue/emerald if no distinct bright colors found
    const primary = validColors[0] || "#3b82f6";
    const accent = validColors[1] || "#10b981";

    // User Provided CSS from a.html, adapted for dynamic colors
    return `
        /* --- 1. CSS VARIABLES & RESET --- */
        :root {
            --bg-dark: #020617;
            --bg-card: #0f172a;
            --primary: ${primary};
            --primary-glow: rgba(59, 130, 246, 0.4);
            --accent: ${accent};
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: #1e293b;
            --transition: all 0.3s ease;
            --radius: 12px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', 'Segoe UI', sans-serif; }
        html { scroll-behavior: smooth; }
        body { background-color: var(--bg-dark); color: var(--text-main); line-height: 1.6; overflow-x: hidden; }
        a { text-decoration: none; color: inherit; transition: var(--transition); }
        ul { list-style: none; }
        h1, h2, h3, h4, h5 { font-weight: 700; color: var(--text-main); line-height: 1.2; }
        p { color: var(--text-muted); }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 2; }
        .section-padding { padding: 100px 0; position: relative; }

        /* --- BACKGROUND PATTERNS (PURE CSS) --- */
        .pattern-grid {
            background-image: linear-gradient(var(--border) 1px, transparent 1px),
                linear-gradient(90deg, var(--border) 1px, transparent 1px);
            background-size: 50px 50px;
            background-position: center top;
        }
        .pattern-dots {
            background-image: radial-gradient(var(--border) 1px, transparent 0);
            background-size: 20px 20px;
        }

        /* Glowing Orbs */
        .glow-orb {
            position: absolute; width: 400px; height: 400px; background: var(--primary);
            filter: blur(150px); opacity: 0.15; border-radius: 50%; z-index: 0; pointer-events: none;
        }
        .orb-top-right { top: -100px; right: -100px; }
        .orb-bottom-left { bottom: -100px; left: -100px; background: var(--accent); }

        /* --- BUTTONS --- */
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 32px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: var(--transition); border: 1px solid transparent; }
        .btn-primary { background: var(--primary); color: white; box-shadow: 0 0 20px var(--primary-glow); }
        .btn-primary:hover { background: #2563eb; box-shadow: 0 0 30px var(--primary-glow); transform: translateY(-2px); }
        .btn-outline { background: transparent; border-color: var(--text-muted); color: var(--text-main); }
        .btn-outline:hover { border-color: var(--text-main); background: rgba(255, 255, 255, 0.05); }

        /* --- HEADER --- */
        header { position: fixed; top: 0; width: 100%; z-index: 1000; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
        nav { display: flex; justify-content: space-between; align-items: center; height: 80px; }
        .logo { font-size: 1.5rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; }
        .logo span { color: var(--primary); }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-links a { font-size: 0.95rem; font-weight: 500; color: var(--text-muted); }
        .nav-links a:hover { color: var(--primary); }
        .mobile-toggle { display: none; color: var(--text-main); font-size: 1.5rem; cursor: pointer; }

        /* --- HERO SECTION --- */
        .hero { padding: 180px 0 100px; text-align: center; position: relative; overflow: hidden; }
        .hero h1 { font-size: 4rem; margin-bottom: 24px; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1px; }
        .hero p { font-size: 1.25rem; max-width: 700px; margin: 0 auto 40px; }

        /* Scrolling Logos */
        .logo-strip { margin-top: 80px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 30px 0; background: rgba(15, 23, 42, 0.5); overflow: hidden; white-space: nowrap; }
        .logo-track { display: inline-block; animation: slide 20s linear infinite; }
        .logo-track i { font-size: 2.5rem; color: var(--text-muted); margin: 0 40px; opacity: 0.5; transition: var(--transition); }
        .logo-track i:hover { opacity: 1; color: var(--text-main); }
        @keyframes slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* --- SERVICES GRID --- */
        .section-header { margin-bottom: 60px; max-width: 600px; }
        .section-header h2 { font-size: 2.5rem; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 6px 16px; background: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
        .service-card { background: var(--bg-card); border: 1px solid var(--border); padding: 40px; border-radius: var(--radius); transition: var(--transition); position: relative; overflow: hidden; }
        .service-card:hover { border-color: var(--primary); transform: translateY(-5px); box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5); }
        .service-card i { font-size: 2rem; color: var(--primary); margin-bottom: 24px; background: rgba(59, 130, 246, 0.1); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        .service-link { margin-top: 20px; display: inline-block; color: var(--primary); font-weight: 600; font-size: 0.9rem; }
        .service-link:hover { text-decoration: underline; }

        /* --- ENGAGEMENT MODELS --- */
        .engagement-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .model-card { background: linear-gradient(145deg, var(--bg-card), #0f172a); border: 1px solid var(--border); padding: 50px; border-radius: var(--radius); position: relative; }
        .model-card h3 { font-size: 1.8rem; margin-bottom: 15px; }
        .model-list li { margin-bottom: 12px; display: flex; align-items: center; gap: 10px; color: var(--text-muted); }
        .model-list li i { color: var(--accent); }

        /* --- WORK PROCESS --- */
        .process-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; counter-reset: step-counter; }
        .step-item { position: relative; padding-top: 20px; }
        .step-item::before { counter-increment: step-counter; content: "0" counter(step-counter); font-size: 3rem; font-weight: 800; color: var(--border); position: absolute; top: -20px; left: 0; z-index: 0; }
        .step-content { position: relative; z-index: 1; }
        .step-content h4 { margin-bottom: 10px; font-size: 1.2rem; }
        .step-content p { font-size: 0.9rem; }

        /* --- STATS --- */
        .stats-section { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, 0.02); }
        .stats-grid { display: flex; justify-content: space-between; text-align: center; flex-wrap: wrap; gap: 30px; }
        .stat-box h3 { font-size: 3rem; color: var(--primary); margin-bottom: 5px; }
        .stat-box span { text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem; color: var(--text-muted); }

        /* --- TESTIMONIALS --- */
        .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .review-card { background: var(--bg-card); padding: 30px; border-radius: var(--radius); border: 1px solid var(--border); }
        .stars { color: #fbbf24; margin-bottom: 15px; font-size: 0.9rem; }
        .client-info { display: flex; align-items: center; gap: 15px; margin-top: 20px; }
        .client-avatar { width: 50px; height: 50px; background: var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-main); }

        /* --- CTA --- */
        .cta-box { background: linear-gradient(135deg, var(--primary), #2563eb); border-radius: 20px; padding: 80px 40px; text-align: center; position: relative; overflow: hidden; }
        .cta-box::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
        .cta-content { position: relative; z-index: 2; }
        .cta-content h2 { font-size: 2.5rem; margin-bottom: 20px; color: white; }
        .cta-content p { color: rgba(255, 255, 255, 0.9); margin-bottom: 30px; font-size: 1.1rem; }

        /* --- FOOTER --- */
        footer { background: #000000; padding: 80px 0 30px; border-top: 1px solid var(--border); font-size: 0.9rem; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; margin-bottom: 50px; }
        .footer-brand p { margin-top: 20px; max-width: 300px; color: var(--text-muted); }
        .footer-col h4 { color: white; margin-bottom: 20px; }
        .footer-col ul li { margin-bottom: 10px; }
        .footer-col ul li a:hover { color: var(--primary); }
        .footer-bottom { border-top: 1px solid var(--border); padding-top: 30px; display: flex; justify-content: space-between; color: var(--text-muted); }

        /* --- MOBILE --- */
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .engagement-wrapper { grid-template-columns: 1fr; }
            .stats-grid { justify-content: center; }
            .footer-grid { grid-template-columns: 1fr; }
            .footer-bottom { flex-direction: column; gap: 20px; text-align: center; }
            .mobile-toggle { display: block; }
            .nav-links { position: absolute; top: 80px; left: 0; width: 100%; background: var(--bg-dark); flex-direction: column; padding: 30px; border-bottom: 1px solid var(--border); display: none; }
            .nav-links.active { display: flex; }
        }

        /* --- THEME SWITCHER --- */
        .theme-switcher { display: flex; gap: 10px; margin-top: 15px; }
        .theme-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; transition: transform 0.2s; }
        .theme-btn:hover { transform: scale(1.1); border-color: white; }
    `;
}

module.exports = { generateHTML, generateCSS, generateJS };
