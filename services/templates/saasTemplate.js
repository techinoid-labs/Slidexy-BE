/**
 * SaaS Template - "Vertex" Architecture
 * Features: Deep dark mode, CSS-only Dashboard, Interactive Pipeline, Advanced Bento
 */

function generateHTML(content) {
    // Content is already curated
    const primaryColor = content.colors[0] || '#6366f1';
    const accentColor = content.colors[1] || '#22d3ee';

    // 2. Map sections to features
    const features = content.validSections.slice(0, 6); // Max 6 cards for bento

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.valueProposition} | ${content.topic}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="scroll-progress" id="progressBar"></div>

    <div class="bg-wrap">
        <div class="grid-floor"></div>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
    </div>

    <!-- Command Palette Overlay -->
    <div class="cmd-overlay" id="cmdOverlay">
        <div class="cmd-box">
            <input type="text" class="cmd-input" placeholder="Search features, commands, or docs...">
            <div class="cmd-list">
                <div class="cmd-item"><i class="fas fa-rocket"></i> New Project</div>
                <div class="cmd-item"><i class="fas fa-book"></i> Documentation</div>
                <div class="cmd-item"><i class="fas fa-cog"></i> Settings</div>
            </div>
        </div>
    </div>

    <nav>
        <div class="container nav-inner">
            <div class="logo">
                <div class="logo-icon"></div> ${content.topic}
            </div>
            <div class="nav-links">
                ${content.navigation.map(nav => `<a href="${nav.link}">${nav.label}</a>`).join('')}
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <button class="btn-ghost" onclick="toggleCmd()" style="padding:6px 12px; font-size:0.8rem;">
                    <i class="fas fa-search" style="margin-right:6px"></i> <span class="kbd">Ctrl K</span>
                </button>
                <button class="btn btn-primary" style="padding:8px 20px; font-size:0.9rem;">${content.primaryCTA}</button>
            </div>
        </div>
    </nav>

    <section class="hero">
        <div class="container">
            <div class="badge">
                <span style="width:6px; height:6px; background:var(--accent); border-radius:50%; margin-right:5px;"></span>
                v2.0 is live: See what's new <i class="fas fa-arrow-right" style="margin-left:5px;"></i>
            </div>
            <h1 class="h-gradient">${content.valueProposition}</h1>
            <p>${content.validSections[0]?.description || 'The all-in-one platform for modern engineering teams. Ship faster, scale further, and automate everything.'}</p>

            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn btn-primary">${content.primaryCTA}</button>
                <button class="btn btn-ghost">${content.secondaryCTA}</button>
            </div>

            <!-- CSS Dashboard Mockup -->
            <div class="dashboard-container">
                <div class="dashboard-frame">
                    <div class="dash-header">
                        <div class="dot d-red"></div>
                        <div class="dot d-yel"></div>
                        <div class="dot d-grn"></div>
                        <div style="margin-left:auto; font-family:var(--font-code); font-size:0.8rem; color:var(--text-muted);">
                            ${content.topic.toLowerCase().replace(/\s/g, '-')}/dashboard
                        </div>
                    </div>
                    <div class="dash-body">
                        <div class="dash-sidebar">
                            <div class="dash-line" style="width: 60%"></div>
                            <div class="dash-line" style="width: 80%"></div>
                            <div class="dash-line" style="width: 50%"></div>
                            <div style="margin-top:30px;">
                                <div class="dash-line" style="width: 90%; opacity:0.5"></div>
                                <div class="dash-line" style="width: 70%; opacity:0.5"></div>
                            </div>
                        </div>
                        <div class="dash-content">
                            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                                <div><h4 style="font-weight:600">Analytics Overview</h4></div>
                                <div class="badge" style="margin:0; font-size:0.7rem;">Live</div>
                            </div>
                            <!-- Animated CSS Graph -->
                            <div class="dash-graph">
                                <div class="graph-bar" style="left:10%; height:40%; animation-delay:0s"></div>
                                <div class="graph-bar" style="left:25%; height:70%; animation-delay:0.2s"></div>
                                <div class="graph-bar" style="left:40%; height:50%; animation-delay:0.4s"></div>
                                <div class="graph-bar" style="left:55%; height:90%; animation-delay:0.1s"></div>
                                <div class="graph-bar" style="left:70%; height:60%; animation-delay:0.5s"></div>
                                <div class="graph-bar" style="left:85%; height:80%; animation-delay:0.3s"></div>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-top:20px;">
                                <div style="height:60px; background:rgba(255,255,255,0.05); border-radius:6px;"></div>
                                <div style="height:60px; background:rgba(255,255,255,0.05); border-radius:6px;"></div>
                                <div style="height:60px; background:rgba(255,255,255,0.05); border-radius:6px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Logo Ticker -->
    <div class="ticker-wrap">
        <div class="ticker">
            <i class="fab fa-aws"></i> <i class="fab fa-react"></i> <i class="fab fa-google"></i>
            <i class="fab fa-stripe"></i> <i class="fab fa-docker"></i> <i class="fab fa-github"></i>
            <i class="fab fa-aws"></i> <i class="fab fa-react"></i> <i class="fab fa-google"></i>
            <i class="fab fa-stripe"></i> <i class="fab fa-docker"></i> <i class="fab fa-github"></i>
        </div>
    </div>

    <!-- Pipeline Section -->
    <section id="pipeline" class="section">
        <div class="container">
            <h2 style="text-align:center; font-size:2.5rem; margin-bottom:10px;">Deployment Pipeline</h2>
            <p style="text-align:center; color:var(--text-muted); margin-bottom:50px;">From localhost to global scale in one command.</p>

            <div class="pipeline-wrapper">
                <div class="pipeline-line">
                    <div class="moving-dot"></div>
                </div>
                <div class="pipeline-step">
                    <div class="pipeline-icon"><i class="fas fa-code"></i></div>
                    <h3>Push Code</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-top:10px;">Connect your Git repository. We detect changes automatically.</p>
                </div>
                <div class="pipeline-step">
                    <div class="pipeline-icon"><i class="fas fa-cogs"></i></div>
                    <h3>Auto Build</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-top:10px;">We install dependencies and build your app in isolated containers.</p>
                </div>
                <div class="pipeline-step">
                    <div class="pipeline-icon"><i class="fas fa-rocket"></i></div>
                    <h3>Global Edge</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-top:10px;">Instant deployment to 35+ regions with automatic rollback.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Advanced Bento Grid -->
    <section id="features" class="section">
        <div class="container">
            <div style="text-align: center; margin-bottom: 60px;">
                <div class="badge">Architecture</div>
                <h2 style="font-size: 2.5rem; margin-bottom: 15px;">Powerful Primitives</h2>
                <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto;">We abstracted the complexity of cloud infrastructure into simple, composable building blocks.</p>
            </div>

            <div class="prim-grid">
                <!-- Large Card 1 -->
                <div class="prim-card span-2">
                    <div class="prim-content">
                        <div>
                            <div class="prim-title"><i class="fas fa-bolt" style="color: #f59e0b;"></i> ${features[0]?.title || 'Edge Functions'}</div>
                            <p class="prim-desc">${features[0]?.description || 'Run compute at the edge. 0ms cold starts with V8 isolate technology.'}</p>
                        </div>
                        <div class="code-mock">
                            <span style="color:#c678dd">export</span> <span style="color:#61afef">default</span> <span style="color:#c678dd">async</span> (<span style="color:#d19a66">req</span>) => {<br>
                            &nbsp;&nbsp;<span style="color:#c678dd">return</span> <span style="color:#56b6c2">new</span> Response(<span style="color:#98c379">"Hello Edge!"</span>);<br>
                            }
                        </div>
                    </div>
                     <div style="position:absolute; top:0; right:0; width:200px; height:200px; background:radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%); pointer-events:none;"></div>
                </div>

                <!-- Toggle Card -->
                <div class="prim-card">
                    <div class="prim-content" style="align-items: center; text-align: center; justify-content: center;">
                        <div class="toggle-ui"></div>
                        <div style="margin-top: 30px;">
                            <div class="prim-title" style="justify-content: center;">${features[1]?.title || 'Zero Trust'}</div>
                            <p class="prim-desc">Enterprise-grade security toggled on by default.</p>
                        </div>
                    </div>
                </div>

                <!-- Globe Card -->
                <div class="prim-card span-row-2">
                    <div class="map-dots"></div>
                    <div class="pulse-dot"></div>
                    <div class="prim-content" style="justify-content: flex-end; position: relative;">
                        <div>
                            <div class="prim-title"><i class="fas fa-globe" style="color: var(--accent);"></i> Global Mesh</div>
                            <p class="prim-desc">Your data replicates across 35 regions instantly. 99.999% availability SLA.</p>
                        </div>
                    </div>
                </div>

                <!-- Analytics Card -->
                <div class="prim-card">
                    <div class="prim-content">
                        <div class="prim-title"><i class="fas fa-chart-bar" style="color: var(--primary);"></i> Analytics</div>
                        <p class="prim-desc">Real-time traffic insight.</p>
                        <div class="mini-graph" style="margin-top: 20px;">
                            <div class="bar" style="height: 40%"></div>
                            <div class="bar" style="height: 70%"></div>
                            <div class="bar" style="height: 50%"></div>
                            <div class="bar" style="height: 85%"></div>
                            <div class="bar" style="height: 60%"></div>
                            <div class="bar" style="height: 90%"></div>
                        </div>
                    </div>
                </div>

                 <!-- Database Card -->
                <div class="prim-card span-2">
                    <div class="prim-content" style="flex-direction: row; align-items: center; gap: 20px;">
                        <div style="flex: 1;">
                            <div class="prim-title"><i class="fas fa-database" style="color: #ef4444;"></i> ${features[2]?.title || 'Serverless SQL'}</div>
                            <p class="prim-desc">Fully managed Postgres that scales to zero. Branch your database like git.</p>
                        </div>
                        <div style="width: 120px; height: 120px; border: 1px solid #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative;">
                            <div style="width: 80px; height: 80px; border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-database fa-2x" style="color: #ef4444;"></i>
                            </div>
                            <div style="position:absolute; top:0; left:50%; width:8px; height:8px; background:#ef4444; border-radius:50%; box-shadow:0 0 10px #ef4444; animation: orbit 3s linear infinite;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Developers Section -->
    <section id="developers" class="section">
        <div class="container">
            <div class="code-split">
                <div>
                    <div class="badge">Developers</div>
                    <h2 style="font-size:2.5rem; margin-bottom:20px;">Built for code</h2>
                    <p style="color:var(--text-muted); margin-bottom:30px;">Integrate ${content.topic} into your existing workflow with our robust API and CLI.</p>
                    <div class="int-grid">
                        <div class="int-card"><i class="fab fa-github"></i></div>
                        <div class="int-card"><i class="fab fa-gitlab"></i></div>
                        <div class="int-card"><i class="fab fa-slack"></i></div>
                        <div class="int-card"><i class="fab fa-jira"></i></div>
                    </div>
                </div>
                <div class="code-window">
                    <div class="window-header">
                        <span>install.sh</span>
                        <button class="copy-btn" onclick="copyCode()">Copy</button>
                    </div>
                    <div class="code-body" id="typewriter"></div>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section">
        <div class="container">
            <div class="pricing-header" style="text-align:center; margin-bottom:50px;">
                <h2 style="font-size:2.5rem;">Transparent Pricing</h2>
                <div style="margin-top:20px;">
                    <button class="btn btn-primary" id="monthlyBtn">Monthly</button>
                    <button class="btn btn-ghost" id="yearlyBtn">Yearly (-20%)</button>
                </div>
            </div>

            <div class="pricing-cards">
                <div class="price-card">
                    <h3>Hobby</h3>
                    <div class="price-val">$0</div>
                    <p style="color:var(--text-muted); margin-bottom:20px;">For side projects.</p>
                    <button class="btn btn-ghost" style="width:100%; margin-bottom:20px;">Start Free</button>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> 5GB Bandwidth</li>
                        <li><i class="fas fa-check"></i> 1 Seat</li>
                    </ul>
                </div>
                <div class="price-card featured">
                    <div style="position:absolute; top:20px; right:20px; color:var(--primary); font-size:0.8rem; font-weight:700;">POPULAR</div>
                    <h3>Pro</h3>
                    <div class="price-val" id="pricePro">$29</div>
                    <p style="color:var(--text-muted); margin-bottom:20px;">For scaling startups.</p>
                    <button class="btn btn-primary" style="width:100%; margin-bottom:20px;">Get Started</button>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> 500GB Bandwidth</li>
                        <li><i class="fas fa-check"></i> 5 Seats</li>
                    </ul>
                </div>
                <div class="price-card">
                    <h3>Business</h3>
                    <div class="price-val" id="priceBiz">$99</div>
                    <p style="color:var(--text-muted); margin-bottom:20px;">For large teams.</p>
                    <button class="btn btn-ghost" style="width:100%; margin-bottom:20px;">Contact Sales</button>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> Unlimited Bandwidth</li>
                        <li><i class="fas fa-check"></i> SSO & SAML</li>
                    </ul>
                </div>
            </div>

            <div class="usage-box">
                <h3 style="margin-bottom:10px;">Estimate Usage Costs</h3>
                <p style="color:var(--text-muted);">Pay as you grow with our usage-based model.</p>
                <input type="range" min="0" max="1000" value="100" id="usageSlider" style="width:100%; max-width:400px;">
                <div style="font-family:var(--font-code); font-size:1.5rem; margin-top:20px;">
                    Approx: $<span id="usageVal">10</span> / mo
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <div class="logo" style="margin-bottom:20px;">${content.topic}</div>
                    <p style="color:var(--text-muted);">The developer cloud for the next generation.</p>
                </div>
                <div class="footer-col">
                     <h4>Company</h4>
                     <ul>
                        ${content.navigation.map(nav => `<li><a href="${nav.link}">${nav.label}</a></li>`).join('')}
                        <li><a href="#">Careers</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                     <h4>Resources</h4>
                     <ul>
                        <li><a href="#">Documentation</a></li>
                        <li><a href="#">API Reference</a></li>
                        <li><a href="#">Community</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                     <h4>Legal</h4>
                     <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="theme-btn" data-theme="dark" style="background: linear-gradient(135deg, #020617 50%, #6366f1 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Modern Dark"></button>
                        <button class="theme-btn" data-theme="light" style="background: linear-gradient(135deg, #ffffff 50%, #0284c7 50%); width:24px; height:24px; border-radius:50%; border:1px solid #ccc; cursor:pointer;" title="Professional Light"></button>
                        <button class="theme-btn" data-theme="midnight" style="background: linear-gradient(135deg, #000000 50%, #7c3aed 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Midnight Purple"></button>
                        <button class="theme-btn" data-theme="forest" style="background: linear-gradient(135deg, #022c22 50%, #10b981 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Deep Forest"></button>
                        <button class="theme-btn" data-theme="sunset" style="background: linear-gradient(135deg, #1c1917 50%, #ea580c 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Sunset Glow"></button>
                        <button class="theme-btn" data-theme="ocean" style="background: linear-gradient(135deg, #082f49 50%, #06b6d4 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Ocean Blue"></button>
                        <button class="theme-btn" data-theme="lavender" style="background: linear-gradient(135deg, #faf5ff 50%, #8b5cf6 50%); width:24px; height:24px; border-radius:50%; border:1px solid #ccc; cursor:pointer;" title="Soft Lavender"></button>
                        <button class="theme-btn" data-theme="crimson" style="background: linear-gradient(135deg, #450a0a 50%, #db2777 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Neon Crimson"></button>
                    </div>
                </div>
            </div>
            <div style="border-top:1px solid #222; margin-top:50px; padding-top:20px; text-align:center; color:#444;">
                &copy; ${new Date().getFullYear()} ${content.topic}. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

function generateCSS(content) {
    const primary = content.colors[0] || '#6366f1';
    const accent = content.colors[1] || '#22d3ee';

    return `
        /* --- CORE TOKENS --- */
        :root {
            --bg-deep: #020617;
            --bg-card: #0a0a0a;
            --bg-surface: #111827;
            --primary: ${primary};
            --primary-glow: ${primary}66;
            --accent: ${accent};
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
            --font-ui: 'Inter', sans-serif;
            --font-code: 'JetBrains Mono', monospace;
            --ease: cubic-bezier(0.23, 1, 0.32, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: var(--font-ui); scroll-behavior: smooth; }
        body {
            background-color: var(--bg-deep);
            color: var(--text-main);
            line-height: 1.6;
            overflow-x: hidden;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
        }

        /* --- UTILITIES --- */
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 10; }
        .section { padding: 120px 0; position: relative; }
        
        .h-gradient {
            background: linear-gradient(135deg, #fff 30%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .badge {
            display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px;
            border-radius: 99px; border: 1px solid rgba(255,255,255,0.1);
            font-size: 0.8rem; color: #a5b4fc; background: rgba(99, 102, 241, 0.1);
            margin-bottom: 24px; font-family: var(--font-code);
        }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-weight: 600; transition: var(--ease); cursor: pointer; border: 1px solid transparent; font-size: 0.95rem; }
        .btn-primary { background: var(--primary); color: white; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 0 20px var(--primary-glow); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 40px var(--primary-glow); }
        .btn-ghost { background: rgba(255,255,255,0.03); border-color: var(--border); color: var(--text-main); backdrop-filter: blur(10px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: #fff; }

        /* Animation */
        .bg-wrap { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
        .grid-floor { position: absolute; bottom: -25%; left: -50%; width: 200%; height: 100%; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; transform: perspective(500px) rotateX(60deg); mask-image: linear-gradient(to bottom, transparent 0%, black 100%); animation: moveGrid 20s linear infinite; }
        @keyframes moveGrid { 0% { transform: perspective(500px) rotateX(60deg) translateY(0); } 100% { transform: perspective(500px) rotateX(60deg) translateY(60px); } }
        .orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.3; animation: float 10s ease-in-out infinite alternate; }
        .orb-1 { top: -10%; left: -10%; width: 600px; height: 600px; background: var(--primary); }
        .orb-2 { bottom: 0%; right: -10%; width: 500px; height: 500px; background: var(--accent); animation-delay: -5s; }
        @keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, 50px); } }

        /* Nav */
        nav { position: fixed; top: 0; width: 100%; height: 70px; z-index: 1000; background: rgba(2,6,23,0.7); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); display: flex; align-items: center; }
        .nav-inner { width: 100%; display: flex; justify-content: space-between; align-items: center; }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; transition: 0.2s; text-decoration: none; }
        .nav-links a:hover { color: #fff; }
        .logo { font-weight: 800; font-size: 1.3rem; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px; }
        .logo-icon { width: 24px; height: 24px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 6px; }

        /* Hero */
        .hero { padding-top: 180px; text-align: center; }
        .hero h1 { font-size: 4.5rem; line-height: 1.1; margin-bottom: 24px; font-weight: 800; letter-spacing: -2px; }
        .hero p { font-size: 1.25rem; color: var(--text-muted); max-width: 650px; margin: 0 auto 40px; }

        /* Dashboard */
        .dashboard-container { margin-top: 80px; perspective: 1200px; padding: 0 20px; }
        .dashboard-frame { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(20px); transform: rotateX(20deg) scale(0.95); transition: 0.8s var(--ease); overflow: hidden; max-width: 1000px; margin: 0 auto; }
        .dashboard-container:hover .dashboard-frame { transform: rotateX(0deg) scale(1); }
        .dash-header { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: center; background: rgba(255,255,255,0.02); }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .d-red { background: #ef4444; } .d-yel { background: #eab308; } .d-grn { background: #22c55e; }
        .dash-body { display: flex; height: 500px; text-align: left; }
        .dash-sidebar { width: 220px; border-right: 1px solid var(--border); padding: 20px; }
        .dash-line { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 15px; }
        .dash-content { flex: 1; padding: 30px; position: relative; }
        .dash-graph { width: 100%; height: 200px; border-bottom: 2px solid #333; position: relative; background: linear-gradient(to top, rgba(99,102,241,0.1), transparent); }
        .graph-bar { position: absolute; bottom: 0; width: 40px; background: rgba(99,102,241,0.3); border-radius: 4px 4px 0 0; transition: height 1s ease; animation: growBar 2s infinite alternate ease-in-out; }
        @keyframes growBar { 0% { opacity: 0.5; transform: scaleY(0.9); } 100% { opacity: 1; transform: scaleY(1.1); } }

        /* --- LOGO TICKER --- */
        .ticker-wrap { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.3); padding: 30px 0; overflow: hidden; white-space: nowrap; margin-top: 50px; }
        .ticker { display: inline-flex; gap: 80px; animation: scroll 40s linear infinite; }
        .ticker i { font-size: 2rem; color: #334155; transition: 0.3s; }
        .ticker i:hover { color: var(--text-main); filter: drop-shadow(0 0 10px rgba(255,255,255,0.3)); }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* Pipeline */
        .pipeline-wrapper { display: flex; justify-content: space-between; align-items: center; margin-top: 60px; position: relative; }
        .pipeline-line { position: absolute; top: 50%; left: 10%; width: 80%; height: 2px; background: #333; z-index: 1; }
        .moving-dot { position: absolute; top: -4px; left: 0; width: 10px; height: 10px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); animation: moveDot 3s linear infinite; }
        @keyframes moveDot { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
        .pipeline-step { background: var(--bg-surface); border: 1px solid var(--border); padding: 30px; border-radius: 12px; text-align: center; width: 30%; position: relative; z-index: 2; transition: 0.3s; }
        .pipeline-step:hover { border-color: var(--primary); transform: translateY(-5px); }
        .pipeline-icon { width: 50px; height: 50px; margin: 0 auto 20px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--accent); }

        /* Bento Grid */
        .prim-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 300px); gap: 20px; }
        .prim-card { background: #0a0a0a; border-radius: 20px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); transition: 0.4s var(--ease); display: flex; flex-direction: column; }
        .prim-card:hover { border-color: rgba(255,255,255,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.5); transform: translateY(-2px); }
        .prim-content { padding: 24px; z-index: 2; display: flex; flex-direction: column; height: 100%; justify-content: space-between; }
        .span-2 { grid-column: span 2; } .span-row-2 { grid-row: span 2; }
        .prim-title { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .prim-desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
        .code-mock { background: #020408; border: 1px solid #1e293b; border-radius: 8px; padding: 15px; font-family: var(--font-code); font-size: 0.8rem; color: #94a3b8; position: relative; margin-top: auto; }

        /* Advanced Bento Visuals */
        .map-dots { position: absolute; top:0; left:0; width:100%; height:100%; background-image: radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); }
        .pulse-dot { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:12px; height:12px; background:var(--accent); border-radius:50%; box-shadow:0 0 15px var(--accent); animation: pulse 2s infinite; }
        .mini-graph { display:flex; align-items:flex-end; gap:4px; height:60px; width:100%; opacity:0.7; }
        .bar { background:var(--primary); width:100%; border-radius:2px 2px 0 0; transition:height 0.5s; }
        .prim-card:hover .bar { filter: brightness(1.2); }
        .toggle-ui { background: #1e293b; width: 60px; height: 34px; border-radius: 34px; position: relative; transition: 0.3s; cursor: pointer; }
        .toggle-ui::after { content: ''; position: absolute; top: 4px; left: 4px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .prim-card:hover .toggle-ui { background: var(--primary); }
        .prim-card:hover .toggle-ui::after { left: 30px; }

        /* Code Section */
        .code-split { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .code-window { background: #0d1117; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; font-family: var(--font-code); box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative; }
        .window-header { background: #161b22; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; }
        .copy-btn { background: transparent; border: 1px solid #30363d; color: #8b949e; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; }
        .copy-btn:hover { color: #fff; border-color: #8b949e; }
        .code-body { padding: 24px; color: #e6edf3; font-size: 0.9rem; line-height: 1.6; min-height: 200px; }
        .int-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 30px; }
        .int-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--text-muted); transition: 0.3s; }
        .int-card:hover { border-color: var(--primary); color: #fff; background: rgba(255,255,255,0.06); }

        /* Pricing & Details */
        .pricing-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 60px; }
        .price-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 40px; position: relative; transition: 0.3s; }
        .price-card.featured { background: linear-gradient(180deg, rgba(99,102,241,0.1), var(--bg-card)); border-color: var(--primary); }
        .price-val { font-size: 3rem; font-weight: 800; margin: 20px 0; font-family: var(--font-code); }
        .features li { margin-bottom: 12px; color: var(--text-muted); display: flex; gap: 10px; }
        .usage-box { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 40px; text-align: center; max-width: 800px; margin: 0 auto; }
        
        /* Footer */
        footer { border-top: 1px solid var(--border); padding: 80px 0 40px; margin-top: 80px; background: #000; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
        .footer-col h4 { color: #fff; margin-bottom: 20px; }
        .footer-col ul li { margin-bottom: 10px; color: var(--text-muted); cursor: pointer; transition: 0.2s; list-style: none;} 
        .footer-col ul li:hover { color: var(--primary); }

        /* Responsive */
        @media (max-width: 900px) {
            .hero h1 { font-size: 2.5rem; }
            .prim-grid, .pricing-cards, .footer-grid, .code-split, .pipeline-wrapper { grid-template-columns: 1fr; grid-template-rows: auto; flex-direction: column; }
            .span-2, .span-row-2 { grid-column: span 1; grid-row: span 1; }
            .prim-card { height: 280px; }
            .nav-links { display: none; }
            .pipeline-line { display: none; }
            .pipeline-step { width: 100%; margin-bottom: 20px; }
        }
        
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(34, 211, 238, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); } }
        @keyframes orbit { from { transform: rotate(0deg) translateX(60px) rotate(0deg); } to { transform: rotate(360deg) translateX(60px) rotate(-360deg); } }
        
        /* Command Palette */
        .cmd-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 2000; display: none; justify-content: center; padding-top: 100px; }
        .cmd-overlay.active { display: flex; }
        .cmd-box { width: 600px; background: #111; border: 1px solid #333; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
        .cmd-input { width: 100%; padding: 20px; background: transparent; border: none; padding: 20px; color: #fff; font-size: 1.1rem; border-bottom: 1px solid #222; outline: none; }
        .cmd-item { padding: 12px 20px; color: #888; display: flex; gap: 15px; cursor: pointer; transition: 0.2s; }
        .cmd-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
    `;
}

function generateJS(websiteData) {
    return `
        // 1. Scroll Progress
        window.onscroll = function () {
            let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            let scrolled = (winScroll / height) * 100;
            document.getElementById("progressBar").style.width = scrolled + "%";
        };

        // 2. Command Palette
        const cmdOverlay = document.getElementById('cmdOverlay');
        function toggleCmd() {
            cmdOverlay.classList.toggle('active');
            if (cmdOverlay.classList.contains('active')) document.querySelector('.cmd-input').focus();
        }
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggleCmd(); }
            if (e.key === 'Escape') cmdOverlay.classList.remove('active');
        });
        cmdOverlay.addEventListener('click', (e) => { if (e.target === cmdOverlay) toggleCmd(); });

        // 3. Typewriter Effect
        const codeText = \`<span style="color:#8b949e"># Install the CLI</span><br>
<span style="color:#ff7b72">npm</span> install -g <span style="color:#a5d6ff">@${websiteData.topic.toLowerCase().replace(/\s/g, '')}/cli</span><br><br>
<span style="color:#8b949e"># Initialize project</span><br>
<span style="color:#ff7b72">vertex</span> init <span style="color:#a5d6ff">--template=nextjs</span><br><br>
<span style="color:#8b949e"># Deploy to production</span><br>
<span style="color:#ff7b72">vertex</span> deploy <span style="color:#a5d6ff">--prod</span><br><br>
<span style="color:#22c55e">> Success! Deployed to https://${websiteData.topic.toLowerCase().replace(/\s/g, '')}.app/d9s8</span>\`;

        const typeContainer = document.getElementById('typewriter');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typeContainer.innerHTML = codeText;
                    observer.disconnect();
                }
            });
        });
        if(typeContainer) observer.observe(typeContainer);

        function copyCode() {
            navigator.clipboard.writeText("npm install -g @${websiteData.topic.toLowerCase().replace(/\s/g, '')}/cli");
            alert("Copied to clipboard!");
        }

        // 4. Pricing Logic
        const monthlyBtn = document.getElementById('monthlyBtn');
        const yearlyBtn = document.getElementById('yearlyBtn');
        const pricePro = document.getElementById('pricePro');
        const priceBiz = document.getElementById('priceBiz');

        if(yearlyBtn) {
            yearlyBtn.addEventListener('click', () => {
                yearlyBtn.className = 'btn btn-primary'; monthlyBtn.className = 'btn btn-ghost';
                pricePro.innerText = "$24"; priceBiz.innerText = "$79";
            });
            monthlyBtn.addEventListener('click', () => {
                monthlyBtn.className = 'btn btn-primary'; yearlyBtn.className = 'btn btn-ghost';
                pricePro.innerText = "$29"; priceBiz.innerText = "$99";
            });
        }

        // 5. Usage Slider
        const slider = document.getElementById('usageSlider');
        const usageValue = document.getElementById('usageVal');
        if(slider) {
            slider.addEventListener('input', (e) => {
                const val = e.target.value;
                usageValue.innerText = val + "M requests / mo";
            });
        }

        // 6. Theme Switcher
        const themes = {
            'dark': { '--bg-deep': '#020617', '--bg-card': '#0a0a0a', '--bg-surface': '#111827', '--primary': '#6366f1', '--primary-glow': '#6366f166', '--accent': '#22d3ee', '--text-main': '#f8fafc', '--text-muted': '#94a3b8', '--border': 'rgba(255, 255, 255, 0.08)' },
            'light': { '--bg-deep': '#ffffff', '--bg-card': '#f1f5f9', '--bg-surface': '#e2e8f0', '--primary': '#0284c7', '--primary-glow': '#0284c733', '--accent': '#059669', '--text-main': '#0f172a', '--text-muted': '#475569', '--border': '#cbd5e1' },
            'midnight': { '--bg-deep': '#000000', '--bg-card': '#171717', '--bg-surface': '#262626', '--primary': '#7c3aed', '--primary-glow': '#7c3aed66', '--accent': '#f43f5e', '--text-main': '#ffffff', '--text-muted': '#a3a3a3', '--border': '#404040' },
            'forest': { '--bg-deep': '#022c22', '--bg-card': '#064e3b', '--bg-surface': '#065f46', '--primary': '#10b981', '--primary-glow': '#10b98166', '--accent': '#fbbf24', '--text-main': '#ecfdf5', '--text-muted': '#6ee7b7', '--border': '#065f46' },
            'sunset': { '--bg-deep': '#1c1917', '--bg-card': '#292524', '--bg-surface': '#44403c', '--primary': '#ea580c', '--primary-glow': '#ea580c66', '--accent': '#f59e0b', '--text-main': '#fafaf9', '--text-muted': '#a8a29e', '--border': '#57534e' },
            'ocean': { '--bg-deep': '#082f49', '--bg-card': '#0c4a6e', '--bg-surface': '#075985', '--primary': '#06b6d4', '--primary-glow': '#06b6d466', '--accent': '#38bdf8', '--text-main': '#f0f9ff', '--text-muted': '#7dd3fc', '--border': '#0369a1' },
            'lavender': { '--bg-deep': '#faf5ff', '--bg-card': '#f3e8ff', '--bg-surface': '#e9d5ff', '--primary': '#8b5cf6', '--primary-glow': '#8b5cf633', '--accent': '#d946ef', '--text-main': '#3b0764', '--text-muted': '#6b21a8', '--border': '#d8b4fe' },
            'crimson': { '--bg-deep': '#450a0a', '--bg-card': '#7f1d1d', '--bg-surface': '#9f1239', '--primary': '#db2777', '--primary-glow': '#db277766', '--accent': '#fb7185', '--text-main': '#fff1f2', '--text-muted': '#fda4af', '--border': '#881337' }
        };

        const themeBtns = document.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const themeKey = btn.getAttribute('data-theme');
                const theme = themes[themeKey];
                if (theme) {
                    Object.keys(theme).forEach(key => {
                        document.documentElement.style.setProperty(key, theme[key]);
                    });
                }
            });
        });
    `;
}

module.exports = { generateHTML, generateCSS, generateJS };

