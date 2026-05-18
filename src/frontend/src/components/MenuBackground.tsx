import { useEffect, useRef } from "react";

/**
 * Cinematic animated background for the main menu.
 *
 * Composed entirely on a single 2D canvas (one rAF loop, DPR-aware) so it
 * stays at 60 FPS even on mid-range phones. It draws:
 *   - A vertical sky gradient that drifts subtly with time
 *   - Soft volumetric cloud puffs at three parallax depths
 *   - A faint aurora ribbon
 *   - Drifting light particles (firefly-style)
 *   - A handful of distant twinkling stars in the upper third
 *
 * The component is purely visual: no props, no events, no DOM children.
 */
const MenuBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    const start = performance.now();

    // Scene entities (positions in CSS pixels; recomputed on resize)
    type Cloud = {
      x: number;
      y: number;
      w: number;
      h: number;
      speed: number;
      opacity: number;
      seed: number;
    };
    let clouds: Cloud[] = [];

    type Particle = { x: number; y: number; r: number; phase: number; speed: number };
    let particles: Particle[] = [];

    type Star = { x: number; y: number; r: number; phase: number };
    let stars: Star[] = [];

    const initScene = () => {
      clouds = [];
      // 3 depth layers, smaller clouds further away
      const layerCounts = [4, 5, 4];
      const layerSpeeds = [4, 7, 11]; // CSS-px per second
      const layerOpacities = [0.35, 0.55, 0.8];
      const layerSizeBase = [0.55, 0.8, 1.1];
      for (let li = 0; li < 3; li++) {
        for (let i = 0; i < layerCounts[li]; i++) {
          const baseW = (160 + Math.random() * 220) * layerSizeBase[li];
          clouds.push({
            x: Math.random() * width,
            y: 60 + Math.random() * (height * 0.85 - 60),
            w: baseW,
            h: baseW * (0.35 + Math.random() * 0.15),
            speed: layerSpeeds[li] * (0.85 + Math.random() * 0.3),
            opacity: layerOpacities[li] * (0.8 + Math.random() * 0.3),
            seed: Math.random() * 1000,
          });
        }
      }

      particles = [];
      for (let i = 0; i < 24; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.8 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          speed: 8 + Math.random() * 18,
        });
      }

      stars = [];
      const starCount = Math.min(40, Math.floor(width * height * 0.00006));
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.45),
          r: 0.4 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    // ---- Drawing helpers ----------------------------------------------------

    const drawSky = (t: number) => {
      // Slight hue drift over a ~30 s cycle to feel "alive".
      const k = (Math.sin(t / 30000) + 1) * 0.5; // 0..1
      const topR = Math.round(70 + 30 * k);
      const topG = Math.round(140 + 30 * k);
      const topB = Math.round(220 + 20 * k);
      const top = `rgb(${topR},${topG},${topB})`;
      const mid = "#9ec9ee";
      const bot = "#dfeefa";
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, top);
      g.addColorStop(0.55, mid);
      g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    };

    const drawSun = () => {
      const cx = width * 0.82;
      const cy = height * 0.18;
      const r = Math.min(width, height) * 0.06;
      // Large halo
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
      halo.addColorStop(0, "rgba(255,235,160,0.6)");
      halo.addColorStop(0.5, "rgba(255,220,140,0.18)");
      halo.addColorStop(1, "rgba(255,220,140,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 4, 0, Math.PI * 2);
      ctx.fill();
      // Core
      const sun = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      sun.addColorStop(0, "#fff8c8");
      sun.addColorStop(1, "#ffcc4a");
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawAurora = (t: number) => {
      // A horizontal "ribbon" of soft color that drifts vertically over time.
      const cy = height * 0.55 + Math.sin(t / 8000) * 20;
      const grad = ctx.createLinearGradient(0, cy - 80, 0, cy + 120);
      grad.addColorStop(0, "rgba(180,220,255,0)");
      grad.addColorStop(0.35, "rgba(170,140,255,0.18)");
      grad.addColorStop(0.55, "rgba(120,200,255,0.22)");
      grad.addColorStop(0.85, "rgba(140,255,220,0.12)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, cy - 80, width, 200);
    };

    const drawStars = (t: number) => {
      ctx.save();
      for (const s of stars) {
        const tw = 0.45 + 0.55 * (Math.sin(t / 600 + s.phase) * 0.5 + 0.5);
        ctx.globalAlpha = tw * 0.75;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawCloud = (c: Cloud) => {
      const x = c.x;
      const y = c.y;
      const w = c.w;
      const h = c.h;
      ctx.save();
      ctx.globalAlpha = c.opacity;
      const grad = ctx.createRadialGradient(
        x + w / 2,
        y + h * 0.3,
        0,
        x + w / 2,
        y + h * 0.6,
        w * 0.6,
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.65, "#f6fbff");
      grad.addColorStop(1, "rgba(220,235,250,0)");
      ctx.fillStyle = grad;

      // Six overlapping ellipses for a soft fluffy shape
      const ell = (px: number, py: number, rx: number, ry: number) => {
        ctx.beginPath();
        ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      ell(x + w * 0.5, y + h * 0.72, w * 0.5, h * 0.42);
      ell(x + w * 0.2, y + h * 0.5, w * 0.22, h * 0.55);
      ell(x + w * 0.4, y + h * 0.32, w * 0.22, h * 0.55);
      ell(x + w * 0.6, y + h * 0.28, w * 0.24, h * 0.6);
      ell(x + w * 0.82, y + h * 0.45, w * 0.22, h * 0.55);
      ell(x + w * 0.95, y + h * 0.6, w * 0.1, h * 0.32);

      ctx.restore();
    };

    const drawClouds = () => {
      for (const c of clouds) drawCloud(c);
    };

    const drawParticles = (t: number) => {
      for (const p of particles) {
        const tw = 0.4 + 0.6 * (Math.sin(t / 500 + p.phase) * 0.5 + 0.5);
        ctx.save();
        ctx.globalAlpha = tw;
        // glow halo
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, "rgba(255,255,210,0.7)");
        g.addColorStop(1, "rgba(255,255,210,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.globalAlpha = tw;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    // ---- Animation loop ------------------------------------------------------

    let lastT = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(60, now - lastT) / 1000; // seconds, clamped
      lastT = now;
      const elapsed = now - start;

      // advance clouds (rightwards)
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x - c.w > width) {
          c.x = -c.w * 0.4;
          c.y = 60 + Math.random() * (height * 0.85 - 60);
        }
      }
      // advance particles (gentle upward drift + lateral sway)
      for (const p of particles) {
        p.y -= p.speed * dt;
        p.x += Math.sin(elapsed / 1200 + p.phase) * 0.2;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
      }

      drawSky(elapsed);
      drawSun();
      drawStars(elapsed);
      drawAurora(elapsed);
      drawClouds();
      drawParticles(elapsed);

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export default MenuBackground;
