document.addEventListener('DOMContentLoaded', () => {
    console.log("NeuroCaffeine Client Loaded");

    const btn = document.querySelector('.cta-button');
    if (btn) {
        btn.addEventListener('click', () => {
            alert("Initiating neural extraction sequence...");
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.style.opacity = "0.95";
        } else {
            nav.style.opacity = "1";
        }
    });
});
