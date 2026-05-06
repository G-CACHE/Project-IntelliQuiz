import React, { useEffect, useRef } from 'react';

// ======== CONFETTI CANVAS (for correct answers) ========
export const ConfettiCanvas: React.FC<{ duration?: number }> = ({ duration = 3000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const COLORS = [
      '#d4af37', '#fbbf24', '#10b981', '#ef4444', '#3b82f6',
      '#f472b6', '#a78bfa', '#fde68a', '#7a1733', '#22d3ee',
    ];

    type Particle = {
      x: number; y: number; w: number; h: number;
      vx: number; vy: number; gravity: number;
      rotation: number; rotSpeed: number;
      color: string; alpha: number;
      shape: 'rect' | 'circle' | 'star';
    };

    const particles: Particle[] = [];
    const shapes: Particle['shape'][] = ['rect', 'circle', 'star'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * W,
        y: -Math.random() * H * 0.5,
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 4,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        gravity: 0.08 + Math.random() * 0.05,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const drawStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.4;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        ctx.lineTo(cx + rad * Math.cos(angle), cy + rad * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    };

    let animId = 0;
    const startTime = Date.now();

    const loop = () => {
      const elapsed = Date.now() - startTime;
      const fadeRatio = elapsed > duration * 0.6 ? 1 - (elapsed - duration * 0.6) / (duration * 0.4) : 1;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, W, H);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha * fadeRatio);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(0, 0, p.w / 2);
        }

        ctx.restore();

        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vx *= 0.99;
      });

      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(animId);
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

// ======== ERROR PARTICLES (for wrong answers) ========
export const ErrorParticles: React.FC<{ duration?: number }> = ({ duration = 2000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    type Shard = {
      x: number; y: number; size: number;
      vx: number; vy: number;
      rotation: number; rotSpeed: number;
      color: string; alpha: number;
    };

    const shards: Shard[] = [];
    const colors = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#fca5a5', '#f87171'];

    const cx = W / 2;
    const cy = H / 2;

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      shards.push({
        x: cx,
        y: cy,
        size: Math.random() * 8 + 3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }

    let animId = 0;
    const startTime = Date.now();

    const loop = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, W, H);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      // Shockwave ring
      const ringProgress = Math.min(elapsed / 600, 1);
      if (ringProgress < 1) {
        const ringRadius = ringProgress * Math.min(W, H) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 * (1 - ringProgress)})`;
        ctx.lineWidth = 4 * (1 - ringProgress);
        ctx.stroke();
      }

      // Shards
      shards.forEach((s) => {
        const fadeRatio = 1 - elapsed / duration;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = Math.max(0, s.alpha * fadeRatio);
        ctx.fillStyle = s.color;

        // Draw angular shards
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.5, 0);
        ctx.lineTo(0, s.size * 0.6);
        ctx.lineTo(-s.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12;
        s.vx *= 0.98;
        s.rotation += s.rotSpeed;
      });

      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(animId);
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
