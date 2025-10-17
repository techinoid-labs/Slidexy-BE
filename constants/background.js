const infographicPatterns = {
  "dotted": `
    <div style="
      width: 100%;
      height: 200px;
      background-color: #ffeaa7;
      background-image: radial-gradient(#fd79a8 10%, transparent 11%);
      background-size: 20px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
    ">Dotted Pattern</div>
  `,

  "checkerboard": `
    <div style="
      width: 100%;
      height: 200px;
      background-color: #00b894;
      background-image:
        linear-gradient(45deg, #00b894 25%, transparent 25%),
        linear-gradient(-45deg, #00b894 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #00b894 75%),
        linear-gradient(-45deg, transparent 75%, #00b894 75%);
      background-size: 40px 40px;
      background-position: 0 0, 0 20px, 20px -20px, -20px 0px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
    ">Checkerboard</div>
  `,

  "gradient": `
    <div style="
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
    ">Gradient Background</div>
  `,

  "mesh-gradient": `
    <div style="
      width: 100%;
      height: 200px;
      background: radial-gradient(circle at 30% 30%, #fbc2eb, transparent 30%),
                  radial-gradient(circle at 70% 70%, #a6c1ee, transparent 30%);
      background-blend-mode: screen;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #333;
      font-weight: bold;
    ">Mesh Gradient</div>
  `,

  "radial-gradient": `
    <div style="
      width: 100%;
      height: 200px;
      background: radial-gradient(circle at center, #89f7fe, #66a6ff);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
    ">Radial Gradient</div>
  `,

  "subtle-pattern1": `
    <div style="
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #a18cd1 100%);
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-weight: bold;
      font-size: 24px;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
      border-radius: 16px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    ">
      Subtle Pattern Overlay
      <div style="
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: radial-gradient(rgba(255,255,255,0.08) 15%, transparent 15%);
        background-size: 25px 25px;
        pointer-events: none;
        border-radius: 16px;
      "></div>
    </div>
  `,

  "soft-gradient": `
    <div style="
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      color: #333;
      border-radius: 12px;
      padding: 20px;
    ">Gradient Background</div>
  `,

  "subtle-pattern2": `
    <div style="
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #333;
      font-weight: bold;
      border-radius: 12px;
      padding: 20px;
    ">
      Pattern Overlay
      <div style="
        content: '';
        position: absolute;
        top:0; left:0; right:0; bottom:0;
        background-image: radial-gradient(rgba(255,255,255,0.05) 20%, transparent 20%);
        background-size: 25px 25px;
        pointer-events: none;
        border-radius: 12px;
      "></div>
    </div>
  `
};

const styleType = (style) => {
  if (style == "glassmorphism") {
    return `<div class="glassmorphism">Glassmorphism</div>
<style>
.glassmorphism {
  width: 300px; height: 150px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.3);
  color: white; font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center;
}
body { background: linear-gradient(135deg, #2b1055, #7597de); }</style>`
  }
  else if (style == "neumorphism") {
    return `<div class="neumorphism">Neumorphism</div>

<style>
body {
  background: #e0e0e0;
  font-family: "Inter", sans-serif;
}

.neumorphism {
  width: 320px; height: 160px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0),
    #e0e0e0;
  background-size: 20px 20px; /* spacing between dots */
  box-shadow:
    8px 8px 16px #bebebe,
    -8px -8px 16px #ffffff;
  display: flex; align-items: center; justify-content: center;
  color: #333; font-weight: 600;
  letter-spacing: 0.5px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

/* 🌬️ Slight lift on hover */
.neumorphism:hover {
  transform: translateY(-3px);
  box-shadow:
    6px 6px 12px #bebebe,
    -6px -6px 12px #ffffff;
}
</style>
`
  }
  else if (style == "gradient-layering") {
    return `<div class="gradient-layering">Gradient Layering</div>
<style>
.gradient-layering {
  width: 300px; height: 150px;
  background: linear-gradient(135deg, #ff7eb3, #ff758c),
              linear-gradient(225deg, #42e695, #3bb2b8);
  background-blend-mode: overlay;
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 600;
}</style>`
  }
  else if (style == "aurora-gradient") {
    return `<div class="aurora-gradient">Aurora</div>

<style>
.aurora-gradient {
  width: 340px; height: 180px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 25% 30%, rgba(255, 142, 251, 0.5), transparent 50%),
    radial-gradient(circle at 80% 60%, rgba(130, 255, 248, 0.4), transparent 60%),
    radial-gradient(circle at 60% 90%, rgba(255, 214, 165, 0.35), transparent 60%),
    linear-gradient(135deg, #1a1b2e 0%, #0e0f1a 100%);
  background-blend-mode: screen;
  box-shadow: 0 8px 28px rgba(0,0,0,0.25),
              inset 0 0 40px rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
}

/* ✨ optional: soft overlay glow */
.aurora-gradient::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at 60% 40%, rgba(255,255,255,0.07), transparent 60%);
  pointer-events: none;
}
</style>`
  }
  else if (style == "mesh-gradient") {
    return `<div class="mesh-gradient">Mesh Gradient</div>
<style>
.mesh-gradient {
  width: 300px; height: 150px; border-radius: 20px;
  background: radial-gradient(circle at 10% 10%, #ff9a9e, transparent 30%),
              radial-gradient(circle at 80% 20%, #fad0c4, transparent 30%),
              radial-gradient(circle at 20% 80%, #a1c4fd, transparent 30%),
              #fbc2eb;
  background-blend-mode: screen;
  display: flex; align-items: center; justify-content: center;
  color: #333; font-weight: 600;
}</style>
`
  }
  else if (style == "glassy-layers-shadows") {
    return `<div class="glassy-layer">
  <div class="glass-card">Glassy Layer</div>
</div>

<style>
.glassy-layer {
  width: 340px; height: 180px;
  background: linear-gradient(135deg, #dfe9f3 0%, #ffffff 100%);
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

/* 🩵 Minimal glass effect */
.glass-card {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.4);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  padding: 20px 40px;
  color: #222;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.15);
}

/* 📱 Responsive */
@media (max-width: 500px) {
  .glassy-layer {
    width: 90vw; height: 45vw;
  }
  .glass-card {
    padding: 16px 28px;
    font-size: 1rem;
  }
}
</style>`
  }
  else if (style == "subtle-pattern-overlay") {
    return `<div class="pattern-overlay">Grid Pattern</div>

<style>
.pattern-overlay {
  width: 320px; height: 160px;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px);
  background-color: white;
  border-radius: 20px;
  color: #222;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}
</style>`
  }
  else
  {
    return `<div class="pattern-overlay">Grid Pattern</div>

<style>
.pattern-overlay {
  width: 320px; height: 160px;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 20px);
  background-color: white;
  border-radius: 20px;
  color: #222;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}
</style>`
  }
}

module.exports = infographicPatterns;