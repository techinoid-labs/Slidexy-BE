/**
 * Portfolio Template (Dark Mode / Creative Developer)
 * Based on p.html - "Creative Engineer" design
 */

function generateHTML(websiteData, options) {
    const topic = websiteData.topic || "Portfolio";
    const description = websiteData.description || "Building digital products with precision.";
    const content = websiteData.content || {};

    // Extract colors or default to the "flare" defaults
    const brandColor = (content.colors && content.colors[0]) ? content.colors[0] : '#6366f1'; // Default Indigo
    const accentColor = (content.colors && content.colors[1]) ? content.colors[1] : '#10b981'; // Default Emerald

    // Mock data if explicit sections aren't provided (fallback for generic generation)
    const projects = content.images?.length > 0 ? content.images.map((img, i) => ({
        title: websiteData.sections?.[i]?.title || `Project ${i + 1}`,
        tag: websiteData.sections?.[i]?.description?.split(' ')[0] || "Web",
        year: "2024",
        img: img.src
    })).slice(0, 4) : [
        { title: "Lumina Dashboard", tag: "Fintech", year: "2024", img: "https://images.unsplash.com/photo-1481487484168-9b995ecc1679?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" },
        { title: "Apex Architecture", tag: "Portfolio", year: "2023", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" },
        { title: "Mono Mobile", tag: "App Design", year: "2023", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" },
        { title: "Chronos SaaS", tag: "Productivity", year: "2022", img: "https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" }
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/feather-icons"></script>
    <link rel="stylesheet" href="styles.css">
    <style>
        /* Dynamic Brand Accents */
        .flare-1 { background: ${brandColor}; }
        .flare-2 { background: ${accentColor}; }
    </style>
</head>
<body>

    <div class="bg-noise"></div>
    <div class="bg-flare">
        <div class="flare flare-1"></div>
        <div class="flare flare-2"></div>
        <div class="flare flare-3"></div>
    </div>
    <div class="bg-grid"></div>

    <nav>
        <a href="#home" class="nav-item active">Home</a>
        <a href="#work" class="nav-item">Work</a>
        <a href="#about" class="nav-item">Profile</a>
        <a href="#contact" class="nav-item">Contact</a>
    </nav>

    <section id="home" class="hero container">
        <div class="profile-row fade-up">
            <img src="${content.logo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'}" class="avatar" alt="Profile">
            <div class="profile-info">
                <h3 class="profile-name">${topic}</h3>
                <div class="profile-meta">
                    <span class="profile-role">${content.valueProposition || "Creative Developer"}</span>
                    <div class="status-pill">
                        <div class="status-dot"></div> Open to work
                    </div>
                </div>
            </div>
        </div>

        <h1 class="fade-up">
            ${description}
        </h1>
        <p class="fade-up">
            I build accessible, pixel-perfect, and performant web experiences using modern technologies.
        </p>
    </section>

    <section id="work" class="section container">
        <span class="label fade-up">Selected Projects</span>
        <div class="project-grid">
            ${projects.map((p, i) => `
            <div class="project-card fade-up" style="transition-delay: ${i * 0.1}s;">
                <div class="project-preview">
                    <img src="${p.img}" class="project-img">
                </div>
                <div class="project-info">
                    <h3>${p.title}</h3>
                    <div class="project-tags"><span>${p.tag}</span> • <span>${p.year}</span></div>
                </div>
            </div>
            `).join('')}
        </div>
    </section>

    <section id="about" class="section container">
        <span class="label fade-up">About Me</span>
        <div class="bio-section fade-up">
            <div>
                <h3 style="font-size: 1.5rem; margin-bottom: 20px; color: white;">Bridging the gap between design and engineering.</h3>
                <p>
                    Specializing in building scalable frontend architectures. I believe that performance and accessibility are the baseline of a good product.
                </p>
            </div>
            <div>
                <h4 style="font-size: 0.9rem; margin-bottom: 15px; color: white;">Technical Stack</h4>
                <div class="stack-grid">
                    <div class="stack-item">JavaScript (ES6+)</div>
                    <div class="stack-item">TypeScript</div>
                    <div class="stack-item">React</div>
                    <div class="stack-item">Next.js</div>
                    <div class="stack-item">Node.js</div>
                    <div class="stack-item">Tailwind CSS</div>
                </div>
            </div>
        </div>
    </section>

    <section class="section container">
        <span class="label fade-up">Experience</span>
        <div class="timeline">
            <div class="timeline-item fade-up">
                <div class="t-marker"></div>
                <span class="t-date">2023 — Present</span>
                <div class="t-role">Senior Frontend Engineer</div>
                <div class="t-company">TechFlow Inc.</div>
                <p style="font-size: 0.95rem;">Spearheaded the migration to Next.js App Router, improving site performance by 40%.</p>
            </div>
            <div class="timeline-item fade-up">
                <div class="t-marker"></div>
                <span class="t-date">2021 — 2023</span>
                <div class="t-role">Creative Developer</div>
                <div class="t-company">Studio Alpha</div>
                <p style="font-size: 0.95rem;">Collaborated with designers to build award-winning marketing sites.</p>
            </div>
        </div>
    </section>

    <section class="section container">
        <span class="label fade-up">Certifications</span>
        <div class="cert-grid">
            <div class="cert-card fade-up">
                <div class="cert-icon"><i data-feather="award"></i></div>
                <div class="cert-info"><h4>AWS Certified Solutions Architect</h4><span>2024</span></div>
            </div>
            <div class="cert-card fade-up" style="transition-delay: 0.1s;">
                <div class="cert-icon"><i data-feather="layout"></i></div>
                <div class="cert-info"><h4>Google UX Design Professional</h4><span>2023</span></div>
            </div>
            <div class="cert-card fade-up" style="transition-delay: 0.2s;">
                <div class="cert-icon"><i data-feather="code"></i></div>
                <div class="cert-info"><h4>Meta Frontend Developer</h4><span>2022</span></div>
            </div>
        </div>
    </section>

    <footer id="contact">
        <div class="container">
            <h2 style="justify-content: center; border: none; margin-bottom: 20px;">Ready to collaborate?</h2>
            <a href="mailto:${content.contact?.email || 'hello@example.com'}" style="color: white; font-size: 1.2rem; text-decoration: underline; text-underline-offset: 6px;">
                ${content.contact?.email || 'hello@example.com'}
            </a>
            <div class="socials">
                <a href="#">Twitter / X</a>
                <a href="#">LinkedIn</a>
                <a href="#">GitHub</a>
            </div>

            <div class="theme-switcher">
                <span style="font-size: 0.8rem; color: #666; margin-right: 10px;">Themes</span>
                <button class="theme-btn" style="background: linear-gradient(135deg, #6366f1, #10b981);" onclick="setTheme('#6366f1', '#10b981')" title="Default"></button>
                <button class="theme-btn" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);" onclick="setTheme('#3b82f6', '#8b5cf6')" title="Ocean"></button>
                <button class="theme-btn" style="background: linear-gradient(135deg, #f43f5e, #f59e0b);" onclick="setTheme('#f43f5e', '#f59e0b')" title="Sunset"></button>
                <button class="theme-btn" style="background: linear-gradient(135deg, #10b981, #06b6d4);" onclick="setTheme('#10b981', '#06b6d4')" title="Forest"></button>
                <button class="theme-btn" style="background: linear-gradient(135deg, #ffffff, #94a3b8);" onclick="setTheme('#ffffff', '#94a3b8')" title="Mono"></button>
            </div>

            <div style="margin-top: 60px; font-size: 0.8rem; color: #444;">
                &copy; 2025 ${topic}. Built with Code.
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

function generateCSS(websiteData, options) {
    return `/* --- 1. DESIGN TOKENS --- */
    :root {
        --bg: #050505;
        --surface: #0f0f0f;
        --surface-hover: #161616;
        --border: rgba(255, 255, 255, 0.08);
        --text: #ededed;
        --text-muted: #888888;
        --accent: #ffffff;
        --radius: 12px;
        --ease: cubic-bezier(0.25, 1, 0.5, 1);
        --font-head: 'Space Grotesk', sans-serif;
        --font-body: 'Inter', sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; cursor: default; }
    body { background: var(--bg); color: var(--text); font-family: var(--font-body); overflow-x: hidden; line-height: 1.6; -webkit-font-smoothing: antialiased; }

    /* --- 2. BACKGROUND LAYERS --- */
    .bg-noise { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.04; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E"); }
    .bg-grid { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; background-size: 50px 50px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px); mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 100%); -webkit-mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 100%); }
    .bg-flare { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -3; overflow: hidden; }
    .flare { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; transition: background 1s var(--ease); animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
    .flare-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #6366f1; }
    .flare-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: #10b981; animation-delay: -5s; }
    .flare-3 { top: 40%; left: 40%; width: 30vw; height: 30vw; background: #3b82f6; animation-duration: 30s; }
    @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(30px, 30px) scale(1.1); } }

    /* --- 3. UTILITIES --- */
    .container { max-width: 1100px; margin: 0 auto; padding: 0 40px; }
    .section { padding: 100px 0; }
    h1, h2, h3, h4 { font-family: var(--font-head); color: white; font-weight: 600; letter-spacing: -0.02em; }
    h1 { font-size: clamp(3rem, 5vw, 4.5rem); line-height: 1.1; margin-bottom: 20px; }
    h2 { font-size: 2rem; margin-bottom: 40px; display: flex; align-items: center; gap: 15px; }
    h2::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    p { color: var(--text-muted); font-size: 1rem; max-width: 600px; }
    .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 15px; display: block; font-weight: 600; }

    /* --- 4. HERO --- */
    .hero { min-height: 85vh; display: flex; flex-direction: column; justify-content: center; }
    .profile-row { display: flex; align-items: center; gap: 25px; margin-bottom: 50px; }
    .avatar { width: 85px; height: 85px; border-radius: 50%; background: #333; object-fit: cover; border: 2px solid var(--border); box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); }
    .profile-info { display: flex; flex-direction: column; gap: 5px; }
    .profile-name { font-size: 1.5rem; margin: 0; line-height: 1; color: white; }
    .profile-meta { display: flex; align-items: center; gap: 15px; }
    .profile-role { color: var(--text-muted); font-size: 0.95rem; }
    .status-pill { padding: 4px 10px; background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 100px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
    .status-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 8px #4ade80; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

    /* --- 5. PROJECTS --- */
    .project-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; }
    .project-card { cursor: pointer; transition: 0.4s var(--ease); }
    .project-card:hover { transform: translateY(-5px); }
    .project-preview { width: 100%; aspect-ratio: 16/9; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; position: relative; margin-bottom: 20px; }
    .project-img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s var(--ease); filter: grayscale(100%); opacity: 0.8; }
    .project-card:hover .project-img { filter: grayscale(0%); opacity: 1; transform: scale(1.05); }
    .project-info h3 { font-size: 1.25rem; margin-bottom: 5px; }
    .project-tags { display: flex; gap: 10px; font-size: 0.85rem; color: var(--text-muted); }

    /* --- 6. TIMELINE --- */
    .timeline { border-left: 1px solid var(--border); padding-left: 40px; position: relative; }
    .timeline-item { position: relative; margin-bottom: 50px; }
    .timeline-item:last-child { margin-bottom: 0; }
    .t-marker { position: absolute; left: -45px; top: 5px; width: 9px; height: 9px; background: var(--bg); border: 2px solid var(--text-muted); border-radius: 50%; transition: 0.3s; }
    .timeline-item:hover .t-marker { background: white; border-color: white; box-shadow: 0 0 10px white; }
    .t-date { font-family: var(--font-head); font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; display: block; }
    .t-role { font-size: 1.1rem; color: white; font-weight: 500; }
    .t-company { color: var(--text-muted); margin-bottom: 10px; font-size: 0.95rem; }

    /* --- 7. CERTIFICATIONS & BIO --- */
    .cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .cert-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; align-items: center; gap: 15px; transition: 0.3s; backdrop-filter: blur(5px); }
    .cert-card:hover { border-color: rgba(255, 255, 255, 0.3); background: var(--surface-hover); }
    .cert-icon { color: white; opacity: 0.7; }
    .cert-info h4 { font-size: 0.95rem; margin-bottom: 2px; }
    .cert-info span { font-size: 0.8rem; color: var(--text-muted); }

    .bio-section { display: grid; grid-template-columns: 2fr 1fr; gap: 60px; }
    .stack-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .stack-item { font-size: 0.8rem; color: var(--text-muted); padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px; background: rgba(255, 255, 255, 0.02); }

    /* --- 8. UI --- */
    nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(12px); border: 1px solid var(--border); padding: 6px; border-radius: 100px; display: flex; gap: 5px; z-index: 100; }
    .nav-item { padding: 10px 20px; color: var(--text-muted); font-size: 0.85rem; font-weight: 500; border-radius: 100px; transition: 0.3s; text-decoration: none; }
    .nav-item:hover, .nav-item.active { background: #333; color: white; }
    
    footer { padding: 80px 0 150px; text-align: center; border-top: 1px solid var(--border); margin-top: 100px; }
    .socials { display: flex; justify-content: center; gap: 30px; margin-top: 30px; }
    .socials a { color: var(--text-muted); font-size: 0.9rem; transition: 0.3s; }
    .socials a:hover { color: white; }

    /* --- 9. THEME SWITCHER --- */
    .theme-switcher { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
    .theme-btn { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; transition: 0.3s; }
    .theme-btn:hover { transform: scale(1.2); border-color: white; }

    .fade-up { opacity: 0; transform: translateY(20px); transition: 0.8s var(--ease); }
    .fade-up.visible { opacity: 1; transform: translateY(0); }

    @media (max-width: 768px) {
        .project-grid, .bio-section { grid-template-columns: 1fr; }
        .profile-row { flex-direction: row; text-align: left; }
        h1 { font-size: 2.5rem; }
    }
    `;
}

function generateJS(websiteData, options) {
    return `
    // Theme Switcher Logic
    window.setTheme = (color1, color2) => {
        const r = document.querySelector(':root');
        const flare1 = document.querySelector('.flare-1');
        const flare2 = document.querySelector('.flare-2');
        
        // We update the styles directly or via variable if set
        if(flare1) flare1.style.background = color1;
        if(flare2) flare2.style.background = color2;

        // Optional: Save preference
        // localStorage.setItem('theme', JSON.stringify({c1: color1, c2: color2}));
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
        
        // Active Nav Link Logic
        const sections = document.querySelectorAll('section');
        const navItems = document.querySelectorAll('.nav-item');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href').includes(current)) {
                    item.classList.add('active');
                }
            });
        });
    });
    `;
}

module.exports = {
    generateHTML,
    generateCSS,
    generateJS
};
