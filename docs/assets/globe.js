/* globe.js · animated wireframe globe for the homepage hero.
   True axial spin: meridians sweep across the face (fading front/back like a planet),
   and bodies (particles held away from the surface in 3D) co-rotate with depth fade
   and correct occlusion behind the sphere. */
(() => {
  const svg = document.getElementById('globe');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 310, CY = 280, R = 170;
  const K = 0.3;                        // sin(camera tilt) ~17.5deg
  const KC = Math.sqrt(1 - K * K);      // cos(tilt)
  const D2R = Math.PI / 180;

  const mGroup = document.getElementById('meridians');
  const bGroup = document.getElementById('bodies');
  if (!mGroup || !bGroup) return;

  function project(x, y, z) {           // y up, z toward viewer; orthographic + tilt
    const yr = y * KC - z * K;
    const zr = y * K + z * KC;
    return [CX + x, CY - yr, zr];
  }

  // meridians: one path per longitude, every 30deg
  const meridians = [];
  for (let i = 0; i < 12; i++) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', '#263831');
    p.setAttribute('stroke-width', '1');
    mGroup.appendChild(p);
    meridians.push({ el: p, lon: i * 30 });
  }

  // bodies: [lat, lon0, rFrac, size, color]; rFrac > 1 = held off the surface
  const bodies = [
    [35,   20, 1.18, 3.0, '#263831'],
    [60,   80, 1.30, 2.5, '#263831'],
    [-15, 140, 1.15, 3.0, '#263831'],
    [10,  200, 1.26, 2.7, '#263831'],
    [-50, 250, 1.20, 3.0, '#263831'],
    [45,  300, 1.33, 2.5, '#263831'],
    [-30,  10, 1.22, 2.8, '#263831'],
    [70,  160, 1.16, 2.4, '#263831'],
    [-65, 330, 1.28, 2.6, '#263831'],
    [0,    90, 1.35, 3.0, '#263831'],
    [25,   55, 1.20, 4.5, '#d4502a'],
    [-40, 220, 1.24, 3.0, '#d4502a'],
    [-10, 310, 1.19, 4.0, '#4c7165'],
    [50,  120, 1.29, 3.0, '#4c7165'],
    [0,   180, 1.2647, 4.5, '#263831']  // satellite, rides the dashed orbit
  ];
  for (const b of bodies) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('fill', b[4]);
    bGroup.appendChild(c);
    b.el = c;
  }

  function draw(theta) {
    // meridians sweep with the spin; front ones stronger, back ones faint
    for (const m of meridians) {
      const mu = (m.lon + theta) * D2R;
      const sn = Math.sin(mu), cs = Math.cos(mu);
      let d = '';
      for (let j = 0; j <= 32; j++) {
        const phi = (-90 + (180 * j) / 32) * D2R;
        const cp = Math.cos(phi);
        const s = project(R * cp * sn, R * Math.sin(phi), R * cp * cs);
        d += (j ? 'L' : 'M') + s[0].toFixed(1) + ' ' + s[1].toFixed(1) + ' ';
      }
      m.el.setAttribute('d', d.trim());
      m.el.setAttribute('stroke-opacity', cs >= 0 ? '0.22' : '0.06');
    }
    // bodies: co-rotate in 3D; fade + hide correctly behind the sphere
    for (const b of bodies) {
      const mu = (b[1] + theta) * D2R;
      const phi = b[0] * D2R;
      const r = R * b[2];
      const s = project(r * Math.cos(phi) * Math.sin(mu), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(mu));
      const rp = Math.hypot(s[0] - CX, s[1] - CY);
      let op = 1, sc = 1;
      if (s[2] < 0) {                    // far side of the globe
        if (rp < R) { op = 0; }          // blocked by the sphere
        else { op = 0.4; sc = 0.85; }    // peeking past the rim, depth-faded
      }
      b.el.setAttribute('cx', s[0].toFixed(1));
      b.el.setAttribute('cy', s[1].toFixed(1));
      b.el.setAttribute('r', (b[3] * sc).toFixed(2));
      b.el.setAttribute('opacity', op);
    }
  }

  const PERIOD = 60000;                  // ms per revolution
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  draw(0);
  if (!calm.matches) {
    let t0 = null;
    const tick = (ts) => {
      if (t0 === null) t0 = ts;
      draw((((ts - t0) / PERIOD) * 360) % 360);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
