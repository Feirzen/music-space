/* =========================================================
   ambient.js — embers that drift along the edges of the screen.
   They enter from any side, stay near the edges and corners,
   and slide off again. Never crowd the middle. Very low cost.
   ========================================================= */
const Ambient = {
  cv: null, g: null, parts: [], raf: 0, on: true, w: 0, h: 0, last: 0,
  init() {
    this.cv = document.getElementById("ambient");
    if (!this.cv) return;
    this.g = this.cv.getContext("2d");
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = window.innerWidth; this.h = window.innerHeight;
      this.cv.width = this.w * dpr; this.cv.height = this.h * dpr;
      this.cv.style.width = this.w + "px"; this.cv.style.height = this.h + "px";
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);
    document.addEventListener("visibilitychange", () => document.hidden ? this.stop() : this.start());
    this.start();
  },
  set(on) { this.on = on; on ? this.start() : (this.stop(), this.g && this.g.clearRect(0, 0, this.w, this.h)); },
  spawn() {
    const band = Math.min(this.w, this.h) * 0.14 + 18;     // how far in from an edge they may wander
    const side = Math.floor(Math.random() * 4);             // 0 top, 1 right, 2 bottom, 3 left
    const along = Math.random();
    const speed = 6 + Math.random() * 10;                   // px per second: slow
    const dir = Math.random() < 0.5 ? -1 : 1;
    let x, y, vx, vy;
    if (side === 0 || side === 2) {
      x = along * this.w; y = side === 0 ? -6 : this.h + 6;
      vx = dir * speed; vy = (side === 0 ? 1 : -1) * speed * 0.55;
    } else {
      y = along * this.h; x = side === 3 ? -6 : this.w + 6;
      vy = dir * speed; vx = (side === 3 ? 1 : -1) * speed * 0.55;
    }
    const css = getComputedStyle(document.documentElement);
    const warm = css.getPropertyValue("--ember").trim() || "#ffb06a";
    const cool = css.getPropertyValue("--accent").trim() || "#5fd3b5";
    return { x, y, vx, vy, side, band, r: 1 + Math.random() * 1.8, life: 0, max: 14 + Math.random() * 14,
             col: Math.random() < 0.3 ? cool : warm, tw: Math.random() * 6.28 };
  },
  start() {
    if (!this.on || !this.g || this.raf || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.last = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      const target = this.w < 600 ? 7 : 11;
      if (this.parts.length < target && Math.random() < dt * 0.9) this.parts.push(this.spawn());
      this.g.clearRect(0, 0, this.w, this.h);
      this.parts = this.parts.filter(p => {
        p.life += dt;
        // after a while, turn back outward so they leave the screen
        if (p.life > p.max * 0.55) {
          const ox = p.side === 1 ? 1 : p.side === 3 ? -1 : 0, oy = p.side === 2 ? 1 : p.side === 0 ? -1 : 0;
          p.vx += ox * 6 * dt; p.vy += oy * 6 * dt;
        }
        // keep them in the edge band
        const dEdge = Math.min(p.x, this.w - p.x, p.y, this.h - p.y);
        if (dEdge > p.band) {
          if (p.side === 0) p.vy -= 12 * dt; if (p.side === 2) p.vy += 12 * dt;
          if (p.side === 3) p.vx -= 12 * dt; if (p.side === 1) p.vx += 12 * dt;
        }
        p.x += p.vx * dt; p.y += p.vy * dt; p.tw += dt * 2;
        const fadeIn = Math.min(1, p.life / 2), alive = p.x > -20 && p.x < this.w + 20 && p.y > -20 && p.y < this.h + 20;
        const a = fadeIn * (0.55 + 0.35 * Math.sin(p.tw));
        const grd = this.g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        grd.addColorStop(0, p.col); grd.addColorStop(1, "transparent");
        this.g.globalAlpha = a * 0.45; this.g.fillStyle = grd;
        this.g.beginPath(); this.g.arc(p.x, p.y, p.r * 5, 0, 6.28); this.g.fill();
        this.g.globalAlpha = a; this.g.fillStyle = p.col;
        this.g.beginPath(); this.g.arc(p.x, p.y, p.r, 0, 6.28); this.g.fill();
        return alive || p.life < 3;
      });
      this.g.globalAlpha = 1;
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; },
};
window.Ambient = Ambient;
