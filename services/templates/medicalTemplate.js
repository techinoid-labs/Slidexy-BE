/**
 * Medical Template - "CarePulse" Style
 * A clean, trust-focused design with teal/white palette, booking forms, and doctor cards.
 */

function generateHTML(content, presentation) {
    // 1. Content is already curated by websiteGenerator.js

    // 2. Map sections to features (Bento Grid)
    const extractedFeatures = content.validSections?.slice(0, 5) || [];

    // Fallback if extraction failed (to avoid empty bento grid)
    const features = extractedFeatures.length > 0 ? extractedFeatures : [
        { title: "Primary Care", description: "Comprehensive annual checkups and preventive care for the whole family." },
        { title: "Advanced Diagnostics", description: "State-of-the-art imaging, MRI, and laboratory services." },
        { title: "Specialized Surgery", description: "Minimally invasive procedures by world-class surgeons." },
        { title: "Emergency Care", description: "24/7 urgent care for critical medical needs." },
        { title: "Telemedicine", description: "Virtual consultations from the comfort of your home." }
    ];

    // 3. Fallback Images
    const docImages = [
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ];

    const icons = ["fa-heartbeat", "fa-brain", "fa-tooth", "fa-baby", "fa-eye"];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.topic} | Next-Gen Healthcare</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <nav>
        <div class="container nav-inner">
            <a href="#" class="logo">
                <i class="fas fa-heartbeat"></i> ${content.topic}
            </a>
            <div class="nav-links">
                ${content.navigation.map(nav => `<a href="${nav.link}">${nav.label}</a>`).join('')}
            </div>
            <div class="nav-right">
                <div class="wait-time-box">
                    <div class="pulse-dot"></div> Live Wait: 12m
                </div>
                <a href="#book" class="btn btn-emergency">ER: 911</a>
                <a href="#book" class="btn btn-primary">${content.primaryCTA}</a>
            </div>
        </div>
    </nav>

    <section class="hero">
        <div class="container">
            <div class="hero-grid">
                <div>
                    <div class="badge"><i class="fas fa-award"></i> Voted #1 Clinic in Region</div>
                    <h1>${content.valueProposition}</h1>
                    <p>${features[0]?.description || 'Experience the next generation of primary care. Same-day appointments, empathy-driven doctors, and technology that respects your time.'}</p>
                    <div style="display:flex; gap:15px; flex-wrap:wrap;">
                        <button class="btn btn-primary">${content.primaryCTA}</button>
                        <button class="btn btn-outline"><i class="fas fa-phone-alt"></i> ${content.secondaryCTA}</button>
                    </div>

                    <div style="margin-top: 30px; display: flex; align-items: center; gap: 10px;">
                        <div class="avatar-group">
                            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Patient">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Patient">
                            <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Patient">
                        </div>
                        <div style="font-size: 0.9rem; font-weight: 600; color: #64748b;">
                            <span style="color: var(--secondary)">12,000+</span> happy patients
                        </div>
                    </div>
                </div>

                <div class="hero-image-wrapper">
                    <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="Doctor" class="main-img">

                    <div class="floating-card fc-1">
                        <div style="width:40px; height:40px; background:#ecfdf5; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#10b981;">
                            <i class="fas fa-check"></i>
                        </div>
                        <div>
                            <div style="font-size:0.8rem; color:#64748b;">Recovered</div>
                            <div style="font-weight:700;">98.5% Rate</div>
                        </div>
                    </div>

                    <div class="floating-card fc-2">
                        <div style="width:40px; height:40px; background:#eff6ff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#3b82f6;">
                            <i class="fas fa-user-md"></i>
                        </div>
                        <div>
                            <div style="font-size:0.8rem; color:#64748b;">Top Specialists</div>
                            <div style="font-weight:700;">50+ Doctors</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="container">
        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-icon"><i class="fas fa-hospital-user"></i></div>
                <div>
                    <div style="font-weight: 700; font-size: 1.5rem;">24/7</div>
                    <div style="font-size: 0.9rem; color: #64748b;">Online Support</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon"><i class="fas fa-user-md"></i></div>
                <div>
                    <div style="font-weight: 700; font-size: 1.5rem;">100+</div>
                    <div style="font-size: 0.9rem; color: #64748b;">Specialists</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon"><i class="fas fa-smile"></i></div>
                <div>
                    <div style="font-weight: 700; font-size: 1.5rem;">4.9/5</div>
                    <div style="font-size: 0.9rem; color: #64748b;">Patient Rating</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon"><i class="fas fa-flask"></i></div>
                <div>
                    <div style="font-weight: 700; font-size: 1.5rem;">15+</div>
                    <div style="font-size: 0.9rem; color: #64748b;">Years Experience</div>
                </div>
            </div>
        </div>
    </div>

    <section id="services" class="section bg-surface">
        <div class="container">
            <div style="text-align: center; margin-bottom: 60px;">
                <div class="badge">Our Expertise</div>
                <h2 style="font-size: 2.5rem; margin-bottom: 10px;">Comprehensive Care</h2>
                <p style="color: #64748b;">World-class diagnostics and treatment under one roof.</p>
            </div>

            <div class="bento-grid">
                ${features.map((section, i) => `
                <div class="bento-card ${i === 0 ? 'wide' : ''}">
                    <div style="flex:1">
                        <div class="service-icon"><i class="fas ${icons[i % icons.length]}"></i></div>
                        <h3>${section.title}</h3>
                        <p style="color:#64748b; margin-top:10px;">${section.description}</p>
                        <a href="#" class="learn-more">Learn More <i class="fas fa-arrow-right"></i></a>
                    </div>
                    ${i === 0 ? `<img src="https://img.freepik.com/free-vector/heart-rate-monitor-concept-illustration_114360-1492.jpg?w=740" style="width:200px; opacity:0.8; mix-blend-mode:multiply;" alt="Feature Art">` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="doctors" class="section">
        <div class="container">
            <div style="display:flex; justify-content:space-between; align-items:end; margin-bottom: 50px; flex-wrap:wrap; gap:20px;">
                <div>
                    <div class="badge">Our Team</div>
                    <h2 style="font-size: 2.5rem;">Meet Our Specialists</h2>
                </div>
                <button class="btn btn-outline">View All Doctors</button>
            </div>

            <div class="doctor-grid">
                ${[1, 2, 3, 4].map((i) => `
                <div class="doc-card">
                    <img src="${docImages[i - 1]}" class="doc-img" alt="Doctor">
                    <div class="doc-info">
                        <div class="doc-dept">Specialist</div>
                        <h3 style="margin: 5px 0;">Dr. ${['Albert Flores', 'Bessie Cooper', 'Devon Lane', 'Dianne Russell'][i - 1]}</h3>
                        <p style="font-size:0.9rem; color:#64748b;">${10 + i * 2} years exp</p>
                        <div style="margin-top:15px; display:flex; justify-content:center; gap:10px;">
                            <i class="fab fa-linkedin" style="color:#0077b5; cursor:pointer"></i>
                            <i class="fab fa-twitter" style="color:#1da1f2; cursor:pointer"></i>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="book" class="container" style="margin-bottom: 80px;">
        <div class="booking-section">
            <div>
                <h2 style="font-size: 2.5rem; margin-bottom: 20px;">Book an appointment <br> in 60 seconds.</h2>
                <p style="margin-bottom: 30px; opacity: 0.9;">Skip the phone queues. Schedule your visit online and get instant confirmation.</p>
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:40px; height:40px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-check"></i></div>
                        <div>Instant Confirmation</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:40px; height:40px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-check"></i></div>
                        <div>No Hidden Fees</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:40px; height:40px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-check"></i></div>
                        <div>Telehealth Available</div>
                    </div>
                </div>
            </div>

            <div class="booking-form">
                <form>
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" placeholder="John Doe">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input type="tel" class="form-input" placeholder="(555) 000-0000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-input">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <select class="form-input">
                            <option>General Checkup</option>
                            <option>Cardiology</option>
                            <option>Dental</option>
                            <option>Pediatrics</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" style="width: 100%;">Confirm Booking</button>
                </form>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <a href="#" class="logo" style="margin-bottom: 20px;">
                        <i class="fas fa-heartbeat"></i> ${content.topic}
                    </a>
                    <p>Providing world-class healthcare with empathy and excellence. Your health is our priority.</p>
                </div>
                <div class="footer-col">
                    <h4>Departments</h4>
                    <ul>
                        ${features.slice(0, 4).map(f => `<li>${f.title}</li>`).join('')}
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Patients</h4>
                    <ul>
                        <li>Book Appointment</li>
                        <li>Patient Portal</li>
                        <li>Insurance Info</li>
                        <li>Telehealth</li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact</h4>
                    <ul>
                        <li><i class="fas fa-map-marker-alt"></i> 123 Health Dr, NY</li>
                        <li><i class="fas fa-phone"></i> (800) 123-4567</li>
                        <li><i class="fas fa-envelope"></i> help@${content.topic.toLowerCase().replace(/\s/g, '')}.com</li>
                    </ul>
                </div>
                <!-- Theme Switcher -->
                <div class="footer-col">
                    <h4>Themes</h4>
                    <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="theme-btn" data-theme="light" style="background: linear-gradient(135deg, #ffffff 50%, #0d9488 50%); width:24px; height:24px; border-radius:50%; border:1px solid #ccc; cursor:pointer;" title="Medical Light"></button>
                        <button class="theme-btn" data-theme="dark" style="background: linear-gradient(135deg, #020617 50%, #0d9488 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Medical Dark"></button>
                        <button class="theme-btn" data-theme="midnight" style="background: linear-gradient(135deg, #000000 50%, #7c3aed 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Midnight Purple"></button>
                        <button class="theme-btn" data-theme="forest" style="background: linear-gradient(135deg, #022c22 50%, #10b981 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Deep Forest"></button>
                        <button class="theme-btn" data-theme="ocean" style="background: linear-gradient(135deg, #082f49 50%, #06b6d4 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Ocean Blue"></button>
                        <button class="theme-btn" data-theme="crimson" style="background: linear-gradient(135deg, #450a0a 50%, #db2777 50%); width:24px; height:24px; border-radius:50%; border:1px solid #333; cursor:pointer;" title="Neon Crimson"></button>
                    </div>
                </div>
            </div>
            <div style="border-top: 1px solid #1e293b; margin-top: 50px; padding-top: 20px; text-align: center; font-size: 0.9rem; color: #64748b;">
                &copy; 2025 ${content.topic}. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

function generateCSS(websiteData, presentation) {
    // Default Medical Teal/Rose
    const primary = websiteData.colors[0] || '#0d9488';
    const accent = websiteData.colors[1] || '#f43f5e';

    return `
    :root {
        --primary: ${primary};
        --primary-dark: #0f766e;
        --primary-light: #ccfbf1;
        --secondary: #0f172a;
        --accent: ${accent};
        --bg-body: #ffffff;
        --bg-surface: #f8fafc;
        --bg-card: #ffffff;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        --radius: 16px;
        --font-main: 'Plus Jakarta Sans', sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; font-family: var(--font-main); scroll-behavior: smooth; }
    body { color: var(--secondary); background: var(--bg-body); line-height: 1.6; overflow-x: hidden; }

    /* --- 2. UTILITIES --- */
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; }
    .section { padding: 100px 0; }
    .bg-surface { background: var(--bg-surface); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--primary-light); color: var(--primary-dark); border-radius: 50px; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; border-radius: 50px; font-weight: 600; transition: 0.3s; cursor: pointer; border: none; font-size: 1rem; }
    .btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4); }
    .btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(13, 148, 136, 0.6); }
    .btn-outline { background: white; border: 2px solid var(--border); color: var(--secondary); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
    .btn-emergency { background: #ffe4e6; color: var(--accent); font-weight: 700; font-size: 0.9rem; padding: 8px 16px; }
    .btn-emergency:hover { background: var(--accent); color: white; }

    /* --- 3. NAVIGATION --- */
    nav { position: fixed; top: 0; width: 100%; height: 80px; z-index: 1000; background: var(--bg-body); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); display: flex; align-items: center; transition: 0.3s; opacity: 0.95; }
    .nav-inner { width: 100%; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .nav-links { display: flex; gap: 32px; }
    .nav-links a { color: var(--secondary); font-weight: 500; font-size: 0.95rem; transition: 0.2s; text-decoration: none; }
    .nav-links a:hover { color: var(--primary); }
    .nav-right { display: flex; align-items: center; gap: 15px; }

    /* --- 4. HERO SECTION --- */
    .hero { padding-top: 150px; padding-bottom: 100px; background: radial-gradient(circle at top right, var(--primary-light) 0%, var(--bg-body) 50%); }
    .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
    .hero h1 { font-size: 3.5rem; line-height: 1.2; margin-bottom: 24px; color: var(--secondary); letter-spacing: -1px; }
    .hero p { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 32px; max-width: 500px; }
    .hero-image-wrapper { position: relative; }
    .main-img { width: 100%; border-radius: 24px 24px 100px 24px; box-shadow: 0 20px 40px rgba(13, 148, 136, 0.15); object-fit: cover; height: 500px; }
    
    .floating-card { position: absolute; background: var(--bg-card); padding: 16px; border-radius: 16px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 12px; animation: float 4s ease-in-out infinite; }
    .fc-1 { bottom: 40px; left: -40px; }
    .fc-2 { top: 40px; right: -20px; animation-delay: 2s; }
    .avatar-group { display: flex; }
    .avatar-group img { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--bg-card); margin-left: -10px; }
    .avatar-group img:first-child { margin-left: 0; }
    @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }

    /* --- 5. STATS --- */
    .stats-bar { background: var(--bg-card); border-radius: 20px; padding: 40px; box-shadow: var(--shadow-lg); margin-top: -50px; position: relative; z-index: 10; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-item { display: flex; align-items: center; gap: 15px; border-right: 1px solid var(--border); }
    .stat-item:last-child { border: none; }
    .stat-icon { width: 50px; height: 50px; background: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.5rem; }
    
    .wait-time-box { background: var(--primary-light); border: 1px solid var(--primary); padding: 5px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--primary-dark); font-weight: 600; }
    .pulse-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    /* --- 6. SERVICES --- */
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .bento-card { background: var(--bg-card); border-radius: 20px; padding: 32px; border: 1px solid var(--border); transition: 0.3s; position: relative; overflow: hidden; height: 300px; display: flex; flex-direction: column; }
    .bento-card:hover { border-color: var(--primary); box-shadow: var(--shadow-lg); transform: translateY(-5px); }
    .bento-card.wide { grid-column: span 2; display: flex; flex-direction: row; align-items: center; }
    .service-icon { width: 60px; height: 60px; background: var(--bg-surface); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: var(--primary); margin-bottom: 20px; transition: 0.3s; }
    .bento-card:hover .service-icon { background: var(--primary); color: white; }
    .learn-more { color: var(--primary); font-weight: 600; margin-top: auto; display: flex; align-items: center; gap: 5px; opacity: 0; transform: translateY(10px); transition: 0.3s; text-decoration:none; }
    .bento-card:hover .learn-more { opacity: 1; transform: translateY(0); }

    /* --- 7. DOCTORS --- */
    .doctor-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; }
    .doc-card { background: var(--bg-card); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-md); transition: 0.3s; text-align: center; border: 1px solid var(--border); }
    .doc-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-lg); }
    .doc-img { width: 100%; height: 250px; object-fit: cover; background: var(--bg-surface); }
    .doc-info { padding: 20px;  }
    .doc-dept { font-size: 0.8rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    /* --- 8. BOOKING --- */
    .booking-section { background: var(--primary); color: white; border-radius: 30px; padding: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
    .booking-form { background: var(--bg-card); padding: 40px; border-radius: 24px; color: var(--secondary); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
    .form-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; font-size: 1rem; outline: none; transition: 0.3s; background: var(--bg-card); color: var(--secondary); }
    .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }

    /* --- 9. FOOTER --- */
    footer { background: var(--secondary); color: var(--text-muted); padding: 80px 0 30px; margin-top: 100px; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 40px; }
    .footer-col h4 { color: var(--bg-body); margin-bottom: 24px; font-weight: 700; opacity: 0.9; }
    .footer-col ul li { margin-bottom: 12px; cursor: pointer; transition: 0.2s; list-style:none; }
    .footer-col ul li:hover { color: var(--primary); padding-left: 5px; }

    @media (max-width: 900px) {
        .hero-grid, .stats-bar, .bento-grid, .doctor-grid, .booking-section, .footer-grid { grid-template-columns: 1fr; }
        .bento-card.wide { flex-direction: column; height: auto; }
        .hero-image-wrapper { order: -1; }
        .nav-links { display: none; }
    }
    `;
}

function generateJS(websiteData) {
    return `
    document.addEventListener('DOMContentLoaded', () => {
        // Animation Fallbacks
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });

        document.querySelectorAll('.bento-card, .doc-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease-out';
            observer.observe(el);
        });

        // Theme Switcher Logic
        const themes = {
            'light': { 
                '--bg-body': '#ffffff', '--bg-surface': '#f8fafc', '--bg-card': '#ffffff', 
                '--primary': '#0d9488', '--primary-dark': '#0f766e', '--primary-light': '#ccfbf1', 
                '--secondary': '#0f172a', '--text-muted': '#64748b', '--border': '#e2e8f0' 
            },
            'dark': { 
                '--bg-body': '#020617', '--bg-surface': '#111827', '--bg-card': '#1e293b', 
                '--primary': '#0d9488', '--primary-dark': '#14b8a6', '--primary-light': '#0f766e', 
                '--secondary': '#f8fafc', '--text-muted': '#94a3b8', '--border': '#334155' 
            },
            'midnight': { 
                '--bg-body': '#000000', '--bg-surface': '#171717', '--bg-card': '#262626', 
                '--primary': '#7c3aed', '--primary-dark': '#8b5cf6', '--primary-light': '#4c1d95', 
                '--secondary': '#ffffff', '--text-muted': '#a3a3a3', '--border': '#404040' 
            },
            'forest': { 
                '--bg-body': '#022c22', '--bg-surface': '#064e3b', '--bg-card': '#065f46', 
                '--primary': '#10b981', '--primary-dark': '#34d399', '--primary-light': '#064e3b', 
                '--secondary': '#ecfdf5', '--text-muted': '#6ee7b7', '--border': '#065f46' 
            },
            'ocean': { 
                '--bg-body': '#082f49', '--bg-surface': '#0c4a6e', '--bg-card': '#075985', 
                '--primary': '#06b6d4', '--primary-dark': '#22d3ee', '--primary-light': '#164e63', 
                '--secondary': '#f0f9ff', '--text-muted': '#7dd3fc', '--border': '#0369a1' 
            },
            'crimson': { 
                '--bg-body': '#450a0a', '--bg-surface': '#7f1d1d', '--bg-card': '#9f1239', 
                '--primary': '#db2777', '--primary-dark': '#f472b6', '--primary-light': '#831843', 
                '--secondary': '#fff1f2', '--text-muted': '#fda4af', '--border': '#881337' 
            }
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
    });
    `;
}

module.exports = { generateHTML, generateCSS, generateJS };
