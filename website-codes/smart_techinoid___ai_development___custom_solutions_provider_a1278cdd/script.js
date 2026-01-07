
/* --- Theme Switcher --- */
// Advanced Corporate Theme Switcher
            document.addEventListener('DOMContentLoaded', () => {
                // 1. CSS Patch: Force elements to use variables for consistency
                const patchStyle = document.createElement('style');
                patchStyle.textContent = `
                    /* Forced Variable Usage for Theming */
                    header { background: var(--bg-dark) !important; border-bottom: 1px solid var(--border); }
                    .logo-strip { background: var(--bg-card) !important; }
                    .mobile-toggle { color: var(--text-main) !important; }
                    .nav-links { background: var(--bg-dark) !important; }
                    .feature-card, .service-card, .price-card, .review-card, .solution-card { background: var(--bg-card) !important; border-color: var(--border) !important; }
                    .feature-card:hover, .service-card:hover { border-color: var(--primary) !important; }
                    h1, h2, h3, h4, h5 { color: var(--text-main) !important; }
                    p, li { color: var(--text-muted) !important; }
                `;
                document.head.appendChild(patchStyle);

                const themes = {
                    'executive': {
                        name: 'Executive Blue',
                        colors: {
                            '--bg-dark': '#0a0a0a',
                            '--bg-card': '#1a1a1a',
                            '--primary': '#0070e9',
                            '--primary-glow': 'rgba(0, 112, 233, 0.4)',
                            '--accent': '#635bff',
                            '--text-main': '#ffffff',
                            '--text-muted': '#a0a0a0',
                            '--border': '#333333'
                        }
                    },
                    'white': {
                        name: 'Modern Light',
                        colors: {
                            '--bg-dark': '#ffffff',
                            '--bg-card': '#f8f9fa',
                            '--primary': '#2563eb', /* Brighter Blue for white bg */
                            '--primary-glow': 'rgba(37, 99, 235, 0.1)',
                            '--accent': '#0f172a',
                            '--text-main': '#111827',
                            '--text-muted': '#4b5563',
                            '--border': '#e5e7eb'
                        }
                    },
                    'forest': {
                        name: 'Eco Corporate',
                        colors: {
                            '--bg-dark': '#022c22', 
                            '--bg-card': '#064e3b',
                            '--primary': '#10b981',
                            '--primary-glow': 'rgba(16, 185, 129, 0.4)',
                            '--accent': '#34d399',
                            '--text-main': '#ecfdf5',
                            '--text-muted': '#a7f3d0',
                            '--border': '#065f46'
                        }
                    },
                    'midnight': {
                        name: 'Midnight Pro',
                        colors: {
                            '--bg-dark': '#0f172a',
                            '--bg-card': '#1e293b',
                            '--primary': '#818cf8',
                            '--primary-glow': 'rgba(129, 140, 248, 0.4)',
                            '--accent': '#6366f1',
                            '--text-main': '#f8fafc',
                            '--text-muted': '#94a3b8',
                            '--border': '#334155'
                        }
                    },
                    'sunset': {
                        name: 'Sunset Biz',
                        colors: {
                            '--bg-dark': '#2a1b1b',
                            '--bg-card': '#452b2b',
                            '--primary': '#f97316', /* Orange */
                            '--primary-glow': 'rgba(249, 115, 22, 0.4)',
                            '--accent': '#fb923c',
                            '--text-main': '#fff7ed',
                            '--text-muted': '#fdba74',
                            '--border': '#7c2d12'
                        }
                    },
                    'royal': {
                        name: 'Royal Purple',
                        colors: {
                            '--bg-dark': '#1a0b2e',
                            '--bg-card': '#2d1b4e',
                            '--primary': '#d8b4fe', /* Lavender */
                            '--primary-glow': 'rgba(216, 180, 254, 0.4)',
                            '--accent': '#a855f7',
                            '--text-main': '#faf5ff',
                            '--text-muted': '#e9d5ff',
                            '--border': '#4c1d95'
                        }
                    }
                };

                const switcher = document.createElement('div');
                switcher.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 9999; display: flex; flex-direction: column; gap: 10px; min-width: 140px;';
                
                const title = document.createElement('div');
                title.textContent = 'Theme Mode';
                title.style.cssText = 'color: var(--text-main); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; text-align: center; opacity: 0.8;';
                switcher.appendChild(title);

                const btnContainer = document.createElement('div');
                btnContainer.style.cssText = 'display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;';
                switcher.appendChild(btnContainer);

                Object.entries(themes).forEach(([key, theme]) => {
                    const btn = document.createElement('button');
                    // Mini preview of the theme colors
                    btn.style.cssText = `width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${theme.colors['--bg-dark']} 50%, ${theme.colors['--primary']} 50%); border: 2px solid rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;
                    btn.title = theme.name;
                    
                    btn.onmouseover = () => {
                        btn.style.transform = 'scale(1.15) rotate(10deg)';
                        btn.style.borderColor = 'var(--text-main)';
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'scale(1) rotate(0deg)';
                        btn.style.borderColor = 'rgba(255,255,255,0.2)';
                    };
                    
                    btn.onclick = () => {
                        // Apply all variables
                        Object.entries(theme.colors).forEach(([varName, value]) => {
                            document.documentElement.style.setProperty(varName, value);
                        });
                        
                        // Add active state visual
                        Array.from(btnContainer.children).forEach(b => b.style.outline = 'none');
                        btn.style.outline = '2px solid var(--text-main)';
                        btn.style.outlineOffset = '2px';
                    };
                    
                    btnContainer.appendChild(btn);
                });
                
                document.body.appendChild(switcher);
            });

/* --- Extracted Script --- */
document.addEventListener('DOMContentLoaded', function () {
            const mobileToggle = document.querySelector('.mobile-toggle');
            const navLinks = document.querySelector('.nav-links');

            mobileToggle.addEventListener('click', function () {
                navLinks.classList.toggle('active');
            });

            // Close mobile menu when a link is clicked
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                });
            });
        });
