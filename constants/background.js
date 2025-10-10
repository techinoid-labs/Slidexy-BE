export const infographicPatterns = {
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