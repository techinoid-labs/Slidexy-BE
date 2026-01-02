
/* --- Theme Switcher --- */
// SaaS Theme Switcher (Vertex Architecture)
            document.addEventListener('DOMContentLoaded', () => {
                // No CSS Patch for SaaS - it ruins the Bento Grid and Deep Mode

                const themes = {
                    'vercel': {
                        name: 'Vercel Black',
                        colors: {
                            '--bg-deep': '#000000',
                            '--bg-card': '#0a0a0a',
                            '--bg-surface': '#111',
                            '--primary': '#0070f3',
                            '--primary-glow': 'rgba(0, 112, 243, 0.4)',
                            '--accent': '#00e0b7',
                            '--text-main': '#f8fafc',
                            '--text-muted': '#94a3b8',
                            '--border': 'rgba(255, 255, 255, 0.08)'
                        }
                    },
                    'cyberpunk': {
                        name: 'Cyberpunk Neon',
                        colors: {
                            '--bg-deep': '#050510',
                            '--bg-card': '#0f0f20',
                            '--bg-surface': '#1a1a2e',
                            '--primary': '#d946ef', 
                            '--primary-glow': 'rgba(217, 70, 239, 0.4)',
                            '--accent': '#22d3ee',
                            '--text-main': '#fff',
                            '--text-muted': '#a5f3fc',
                            '--border': '#2a2a5a'
                        }
                    },
                    'matrix': {
                        name: 'Matrix Code',
                        colors: {
                            '--bg-deep': '#000000',
                            '--bg-card': '#051005',
                            '--bg-surface': '#0a200a',
                            '--primary': '#00ff41',
                            '--primary-glow': 'rgba(0, 255, 65, 0.4)',
                            '--accent': '#008f11',
                            '--text-main': '#e0ffe0',
                            '--text-muted': '#003b00',
                            '--border': '#003b00'
                        }
                    },
                    'github': {
                        name: 'GitHub Dim',
                        colors: {
                            '--bg-deep': '#0d1117',
                            '--bg-card': '#161b22', 
                            '--bg-surface': '#21262d',
                            '--primary': '#1f6feb',
                            '--primary-glow': 'rgba(31, 111, 235, 0.4)',
                            '--accent': '#238636',
                            '--text-main': '#c9d1d9',
                            '--text-muted': '#8b949e',
                            '--border': '#30363d'
                        }
                    },
                    'dracula': {
                        name: 'Dracula Pro',
                        colors: {
                            '--bg-deep': '#282a36',
                            '--bg-card': '#44475a',
                            '--bg-surface': '#6272a4',
                            '--primary': '#ff79c6',
                            '--primary-glow': 'rgba(255, 121, 198, 0.4)',
                            '--accent': '#8be9fd',
                            '--text-main': '#f8f8f2',
                            '--text-muted': '#bd93f9',
                            '--border': '#6272a4'
                        }
                    },
                    'coffee': {
                        name: 'Coffee Grind',
                        colors: {
                            '--bg-deep': '#12100e',
                            '--bg-card': '#1b1816',
                            '--bg-surface': '#262220',
                            '--primary': '#d4b483', /* Latte */
                            '--primary-glow': 'rgba(212, 180, 131, 0.3)',
                            '--accent': '#c1666b', /* Berry/Roast */
                            '--text-main': '#e4d5b7',
                            '--text-muted': '#8a7f75',
                            '--border': '#423a34'
                        }
                    }
                };
                
                const switcher = document.createElement('div');
                switcher.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 9999; display: flex; flex-direction: column; gap: 10px; min-width: 140px;';
                
                const title = document.createElement('div');
                title.textContent = 'Command Mode';
                title.style.cssText = 'color: var(--text-main); font-size: 10px; font-family: var(--font-code); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; text-align: center; opacity: 0.6;';
                switcher.appendChild(title);

                const btnContainer = document.createElement('div');
                btnContainer.style.cssText = 'display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;';
                switcher.appendChild(btnContainer);

                Object.entries(themes).forEach(([key, theme]) => {
                    const btn = document.createElement('button');
                    // Mini preview of the theme colors
                    btn.style.cssText = `width: 24px; height: 24px; border-radius: 4px; background: linear-gradient(135deg, ${theme.colors['--bg-deep']} 50%, ${theme.colors['--primary']} 50%); border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s ease;`;
                    btn.title = theme.name;
                    
                    btn.onmouseover = () => {
                        btn.style.transform = 'scale(1.2)';
                        btn.style.borderColor = 'var(--text-main)';
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'scale(1)';
                        btn.style.borderColor = 'rgba(255,255,255,0.2)';
                    };
                    
                    btn.onclick = () => {
                        // Apply all variables
                        Object.entries(theme.colors).forEach(([varName, value]) => {
                            document.documentElement.style.setProperty(varName, value);
                        });
                        
                        // Add active state
                        Array.from(btnContainer.children).forEach(b => b.style.boxShadow = 'none');
                        btn.style.boxShadow = '0 0 10px var(--primary)';
                    };
                    
                    btnContainer.appendChild(btn);
                });
                
                document.body.appendChild(switcher);
            });

/* --- Extracted Script --- */
// Scroll Progress Bar
        const scrollProgress = document.querySelector('.scroll-progress');
        document.addEventListener('scroll', () => {
            const totalHeight = document.body.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / totalHeight) * 100;
            scrollProgress.style.width = `${progress}%`;
        });

        // Tab functionality
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });
