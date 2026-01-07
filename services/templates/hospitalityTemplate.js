/**
 * Hospitality Template (Luxury/Fine Dining/Hotel/Coffee)
 * Based on the "Velvet" design.
 * Features: High-end typography, ken burns hero, menu/room switcher, reservation form.
 */

function generateHTML(content, presentation) {
    const topic = content.topic || "Velvet";
    const primary = content.colors?.[0] || '#d4af37'; // Gold

    // Images
    const heroImg = content.allImages?.[0]?.src || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
    const storyImg = content.allImages?.[1]?.src || 'https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    const spotlightImg = content.images?.find(img => img.keyword?.includes('food') || img.keyword?.includes('room'))?.src || content.allImages?.[2]?.src || 'https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    // Dynamic Text based on industry via simple keyword check
    console.log(`[Hospitality] Topic: ${topic}, Desc: ${content.description}`);
    const isHotel = /hotel|resort|stay|booking/i.test(topic + " " + content.description);
    const isCoffee = /coffee|cafe|brew/i.test(topic + " " + content.description);
    console.log(`[Hospitality] isHotel: ${isHotel}, isCoffee: ${isCoffee}`);

    const terms = {
        book: isHotel ? "Book a Stay" : "Book a Table",
        menu: isHotel ? "Rooms & Suites" : (isCoffee ? "Our Brews" : "Menu"),
        spotlightSubtitle: isHotel ? "Featured Suite" : "Chef's Selection",
        spotlightTitle: isHotel ? "The Presidential <br> <i>Suite</i>" : "The White Truffle <br> <i>Carbonara</i>",
        spotlightDesc: isHotel ? "Panoramic city views, private terrace, and 24/7 butler service." : "House-made tagliolini, 36-month aged parmesan reggiano, cured guanciale, and finished tableside.",
        listTitle1: isHotel ? "Suites" : (isCoffee ? "Espresso" : "Dinner"),
        listTitle2: isHotel ? "Villas" : (isCoffee ? "Latte Art" : "Tasting Menu"),
        listTitle3: isHotel ? "Amenities" : (isCoffee ? "Pastries" : "Wine List"),
        reserveTitle: isHotel ? "Check Availability" : "Reservations",
        storyTitle: isHotel ? "A Sanctuary <br> <i>In The City</i>" : "Tradition Meets <br> <i>Innovation</i>"
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic} | ${content.valueProposition || "Experience Excellence"}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600&family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <div class="cursor-dot"></div>
    <div class="cursor-outline"></div>

    <nav id="navbar">
        <div class="logo">${topic}.</div>
        <div class="nav-links">
            <a href="#story">Story</a>
            <a href="#spotlight">Signature</a>
            <a href="#menu">${terms.menu}</a>
            <a href="#private">Private</a>
            <a href="#reserve">Reserve</a>
        </div>
        <div style="font-size:0.8rem; letter-spacing:1px;">${content.contact?.phone || "+1 (212) 555-0199"}</div>
    </nav>

    <section class="hero">
        <img src="${heroImg}" class="hero-bg-img" alt="Hero Background">

        <div class="hero-content">
            <span class="subtitle fade-up">${content.topic} • ${isHotel ? "Luxury Stay" : "Fine Dining"}</span>
            <h1 class="fade-up">${content.valueProposition ? content.valueProposition.replace(/\./g, '').split(' ').slice(0, 2).join(' ') + "<br><i>" + content.valueProposition.split(' ').slice(2).join(' ') + "</i>" : "Artistry on <br> <i>Every Plate</i>"}</h1>
            <br>
            <a href="#reserve" class="btn fade-up">${terms.book}</a>
        </div>

        <div class="scroll-down">Scroll</div>
    </section>

    <div class="awards">
        <div class="marquee">
            <span>Michelin Star 2024</span> • <span>Zagat Rated 4.9</span> • <span>James Beard Award</span> • <span>Forbes Travel Guide</span> • 
            <span>Michelin Star 2024</span> • <span>Zagat Rated 4.9</span> • <span>James Beard Award</span> • <span>Forbes Travel Guide</span> • 
        </div>
    </div>

    <section id="story" class="section">
        <div class="container">
            <div class="story-grid">
                <div class="story-img-frame fade-up">
                    <img src="${storyImg}" class="story-img" alt="Story">
                </div>
                <div class="fade-up">
                    <span class="subtitle">The Philosophy</span>
                    <h2>${terms.storyTitle}</h2>
                    <p style="margin-bottom:20px;">${content.description || "Founded by Chef Elena Vance, Velvet is an homage to timeless elegance, reimagined for the modern world."}</p>
                    <p>${content.heroDescription || "We source the finest materials and ingredients to ensure every detail tells a story of perfection."}</p>
                    <div class="sig">${topic}</div>
                </div>
            </div>
        </div>
    </section>

    <section id="spotlight" class="section spotlight">
        <div class="container">
            <div class="dish-showcase">
                <div class="fade-up">
                    <span class="subtitle">${terms.spotlightSubtitle}</span>
                    <h2>${terms.spotlightTitle}</h2>
                    <p>${terms.spotlightDesc}</p>

                    <div class="ingredients">
                        <div class="ing-item">${isHotel ? "City View" : "Seasonal"}</div>
                        <div class="ing-item">${isHotel ? "King Bed" : "Organic"}</div>
                        <div class="ing-item">${isHotel ? "Spa Access" : "Artisan"}</div>
                    </div>
                    <br>
                    <a href="#menu" class="btn">View Full ${isHotel ? "List" : "Menu"}</a>
                </div>
                <img src="${spotlightImg}" class="dish-img fade-up" alt="Spotlight">
            </div>
        </div>
    </section>

    <section id="menu" class="section menu-bg">
        <div class="container">
            <div class="menu-wrapper fade-up">
                <div class="menu-cat">
                    <button class="active" onclick="switchMenu('list1', this)">${terms.listTitle1}</button>
                    <button onclick="switchMenu('list2', this)">${terms.listTitle2}</button>
                    <button onclick="switchMenu('list3', this)">${terms.listTitle3}</button>
                </div>

                <div id="list1" class="menu-list active">
                    ${content.sections ? content.sections.slice(0, 4).map(s => `
                    <div class="dish">
                        <div>
                            <h4>${s.title}</h4>
                            <p>${s.description.slice(0, 50)}...</p>
                        </div>
                        <div class="dish-price">$${Math.floor(Math.random() * 50) + 20}</div>
                    </div>
                    `).join('') : `
                    <div class="dish"><div><h4>Example Item 1</h4><p>Description of the item goes here.</p></div><div class="dish-price">$24</div></div>
                    <div class="dish"><div><h4>Example Item 2</h4><p>Description of the item goes here.</p></div><div class="dish-price">$32</div></div>
                    `}
                </div>
                
                <div id="list2" class="menu-list">
                    <div class="dish"><div><h4>Special Experience</h4><p>Curated selection</p></div><div class="dish-price">$185</div></div>
                    <div class="dish"><div><h4>Premium Upgrade</h4><p>Exclusive access</p></div><div class="dish-price">+$95</div></div>
                </div>
                
                <div id="list3" class="menu-list">
                    <div class="dish"><div><h4>Premium Selection 1</h4><p>Imported</p></div><div class="dish-price">$850</div></div>
                    <div class="dish"><div><h4>Premium Selection 2</h4><p>Local Rare</p></div><div class="dish-price">$420</div></div>
                </div>

            </div>
        </div>
    </section>

    <section id="reserve" class="section reserve-section">
        <div class="container" style="width: 100%;">
            <div class="text-center" style="margin-bottom: 50px;">
                <h2>${terms.reserveTitle}</h2>
            </div>

            <div class="ticket fade-up">
                <div class="ticket-form">
                    <form>
                        <div class="form-row">
                            <div class="input-group">
                                <label>Date</label>
                                <input type="date">
                            </div>
                            <div class="input-group">
                                <label>Guests</label>
                                <select style="background:#1a1a1a;">
                                    <option>2 Guests</option>
                                    <option>4 Guests</option>
                                    <option>6 Guests</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-group" style="margin-bottom: 30px;">
                            <label>Name</label>
                            <input type="text" placeholder="Your Name">
                        </div>
                        <button class="btn" style="width: 100%;">Request</button>
                    </form>
                </div>
                <div class="ticket-info">
                    <h3>${topic}.</h3>
                    <p style="margin-bottom: 30px;">${content.contact?.address || "123 Oxford Street, London"}</p>
                    <p class="gold">Contact</p>
                    <p>${content.contact?.email || "concierge@" + topic.toLowerCase().replace(/\s/g, '') + ".com"}</p>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="f-col">
                    <div style="font-family: var(--font-head); font-size: 2rem; margin-bottom: 20px;">${topic}.</div>
                    <p>Experiential luxury in the heart of the city.</p>
                </div>
                <div class="f-col">
                    <h4>Explore</h4>
                    <ul>
                        <li>Story</li>
                        <li>${isHotel ? "Rooms" : "Menu"}</li>
                        <li>Careers</li>
                        <li>Press</li>
                    </ul>
                </div>
                <div class="f-col">
                    <h4>Follow</h4>
                    <ul>
                        <li>Instagram</li>
                        <li>Facebook</li>
                        <li>Twitter</li>
                    </ul>
                </div>
            </div>
            <div style="text-align: center; margin-top: 80px; font-size: 0.8rem; color: #444;">
                &copy; ${new Date().getFullYear()} ${topic}. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

function generateCSS(content, presentation) {
    const primary = content.colors?.[0] || '#d4af37';

    return `
    /* --- LUXURY TOKENS --- */
    :root {
        --bg: #0b0b0b;
        --bg-panel: #141414;
        --text-main: #e0e0e0;
        --text-muted: #888888;
        --gold: ${primary}; /* Dynamic Gold/Primary */
        --gold-dim: ${primary}4d; /* 30% opacity */

        --font-head: 'Playfair Display', serif;
        --font-body: 'Lato', sans-serif;
        --font-accent: 'Cormorant Garamond', serif;

        --ease: cubic-bezier(0.19, 1, 0.22, 1);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; cursor: none; }
    html { scroll-behavior: smooth; }
    body { background-color: var(--bg); color: var(--text-main); font-family: var(--font-body); overflow-x: hidden; }

    /* Custom Cursor */
    .cursor-dot, .cursor-outline { position: fixed; top: 0; left: 0; transform: translate(-50%, -50%); border-radius: 50%; z-index: 9999; pointer-events: none; }
    .cursor-dot { width: 8px; height: 8px; background: var(--gold); }
    .cursor-outline { width: 40px; height: 40px; border: 1px solid var(--gold); transition: 0.1s; }

    /* Utilities */
    .container { max-width: 1300px; margin: 0 auto; padding: 0 40px; }
    .section { padding: 140px 0; position: relative; }
    .text-center { text-align: center; }
    .gold { color: var(--gold); }

    /* Typography */
    h1 { font-family: var(--font-head); font-size: clamp(3.5rem, 8vw, 7rem); line-height: 1; font-weight: 400; letter-spacing: -0.03em; }
    h2 { font-family: var(--font-head); font-size: 3.5rem; margin-bottom: 20px; font-weight: 400; }
    h3 { font-family: var(--font-head); font-size: 2rem; margin-bottom: 10px; color: var(--gold); }
    .subtitle { font-family: var(--font-body); text-transform: uppercase; letter-spacing: 4px; font-size: 0.8rem; color: var(--gold); margin-bottom: 20px; display: block; }
    p { font-size: 1.1rem; color: var(--text-muted); line-height: 1.8; font-weight: 300; }

    /* Buttons */
    .btn { display: inline-block; padding: 18px 45px; border: 1px solid var(--gold); color: var(--gold); text-transform: uppercase; letter-spacing: 2px; font-size: 0.75rem; font-weight: 700; transition: 0.5s var(--ease); cursor: pointer; background: transparent; position: relative; overflow: hidden; text-decoration: none; }
    .btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: var(--gold); transition: 0.5s var(--ease); z-index: -1; }
    .btn:hover { color: var(--bg); }
    .btn:hover::before { left: 0; }

    /* Animations */
    .fade-up { opacity: 0; transform: translateY(50px); transition: 1s var(--ease); }
    .fade-up.visible { opacity: 1; transform: translateY(0); }

    /* --- NAV --- */
    nav { position: fixed; top: 0; width: 100%; padding: 30px 60px; z-index: 100; display: flex; justify-content: space-between; align-items: center; transition: 0.4s; mix-blend-mode: difference; color: white; }
    nav.scrolled { padding: 20px 60px; background: rgba(11, 11, 11, 0.8); backdrop-filter: blur(10px); mix-blend-mode: normal; }
    .logo { font-family: var(--font-head); font-size: 2rem; font-weight: 700; letter-spacing: 2px; }
    .nav-links a { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 2px; margin-left: 40px; text-decoration: none; color: white; transition: 0.3s; }
    .nav-links a:hover { color: var(--gold); }

    /* --- HERO --- */
    .hero { height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; }
    .hero-bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.5; z-index: -1; animation: kenBurns 20s infinite alternate; }
    @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.1); } }
    .hero-content h1 i { font-family: var(--font-accent); font-weight: 400; color: var(--gold); }
    .scroll-down { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 3px; animation: bounce 2s infinite; }
    @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); } 40% { transform: translateX(-50%) translateY(-10px); } 60% { transform: translateX(-50%) translateY(-5px); } }

    /* --- MARQUEE --- */
    .awards { border-bottom: 1px solid var(--gold-dim); padding: 30px 0; background: #0e0e0e; overflow: hidden; }
    .marquee { display: flex; gap: 80px; width: max-content; animation: scroll 30s linear infinite; }
    .marquee span { font-family: var(--font-head); font-size: 1.5rem; color: #555; text-transform: uppercase; letter-spacing: 1px; }
    @keyframes scroll { to { transform: translateX(-50%); } }

    /* --- STORY --- */
    .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 100px; align-items: center; }
    .story-img-frame { position: relative; height: 700px; overflow: hidden; }
    .story-img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.5s var(--ease); }
    .story-img-frame:hover .story-img { transform: scale(1.1); }
    .sig { font-family: var(--font-accent); font-size: 3rem; color: var(--gold); margin-top: 30px; transform: rotate(-5deg); display: inline-block; }

    /* --- SPOTLIGHT --- */
    .spotlight { background: #0f0f0f; border-top: 1px solid #222; }
    .dish-showcase { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
    .dish-img { width: 100%; border-radius: 500px 500px 0 0; height: 600px; object-fit: cover; filter: brightness(0.9); }
    .ingredients { display: flex; gap: 20px; margin: 30px 0; }
    .ing-item { border: 1px solid var(--gold-dim); padding: 10px 20px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--gold); }

    /* --- MENU --- */
    .menu-bg { background: linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url('https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80'); background-attachment: fixed; background-size: cover; }
    .menu-wrapper { max-width: 900px; margin: 0 auto; background: #141414; padding: 80px; border: 1px solid var(--gold-dim); }
    .menu-cat { text-align: center; margin-bottom: 60px; }
    .menu-cat button { background: none; border: none; color: var(--text-muted); font-family: var(--font-head); font-size: 1.5rem; margin: 0 20px; cursor: pointer; transition: 0.3s; }
    .menu-cat button.active { color: var(--gold); text-decoration: underline; text-underline-offset: 10px; }
    .menu-list { display: none; animation: fadeUp 0.5s forwards; }
    .menu-list.active { display: block; }
    .dish { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px solid #222; padding-bottom: 15px; }
    .dish h4 { font-family: var(--font-head); font-size: 1.3rem; margin-bottom: 5px; }
    .dish-price { font-family: var(--font-head); font-size: 1.3rem; color: var(--gold); }

    /* --- RESERVE --- */
    .reserve-section { background: var(--bg); display: flex; justify-content: center; }
    .ticket { background: #1a1a1a; width: 100%; max-width: 1000px; display: grid; grid-template-columns: 2fr 1fr; border: 1px solid var(--gold-dim); }
    .ticket-form { padding: 60px; border-right: 1px dashed #333; }
    .ticket-info { padding: 60px; display: flex; flex-direction: column; justify-content: center; background: #111; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .input-group label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: var(--gold); margin-bottom: 10px; }
    .input-group input, .input-group select { width: 100%; background: transparent; border: none; border-bottom: 1px solid #444; color: white; padding: 10px 0; font-family: var(--font-head); font-size: 1.2rem; outline: none; }

    /* --- FOOTER --- */
    footer { padding: 100px 0 40px; border-top: 1px solid #222; }
    .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 60px; }
    .f-col h4 { font-family: var(--font-head); color: white; margin-bottom: 25px; font-size: 1.2rem; }
    .f-col ul li { margin-bottom: 15px; font-size: 0.9rem; color: #888; cursor: pointer; }
    .f-col ul li:hover { color: var(--gold); }

    @media (max-width: 900px) {
        .story-grid, .dish-showcase, .ticket { grid-template-columns: 1fr; }
        .hero h1 { font-size: 3.5rem; }
        .nav-links { display: none; }
        .menu-wrapper { padding: 30px; }
        .footer-grid { grid-template-columns: 1fr; }
    }
    `;
}

function generateJS(content, presentation) {
    return `
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Custom Cursor
        const dot = document.querySelector('.cursor-dot');
        const outline = document.querySelector('.cursor-outline');

        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            dot.style.left = \`\${posX}px\`;
            dot.style.top = \`\${posY}px\`;

            outline.animate({
                left: \`\${posX}px\`,
                top: \`\${posY}px\`
            }, { duration: 500, fill: "forwards" });
        });

        // 2. Navbar Scroll
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });

        // 3. Scroll Animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

        // 4. Menu Switcher
        window.switchMenu = function(id, btn) {
            document.querySelectorAll('.menu-list').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.menu-cat button').forEach(el => el.classList.remove('active'));

            document.getElementById(id).classList.add('active');
            btn.classList.add('active');
        };
    });
    `;
}

module.exports = { generateHTML, generateCSS, generateJS };
