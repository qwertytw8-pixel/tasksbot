import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  drag: number;
  opacity: number;
  fade: number;
}

const COLORS = [
  "#F59E0B", "#EF4444", "#10B981", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F97316", "#06B6D4",
  "#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D",
];

function createParticle(w: number, h: number): Particle {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // upward burst
  const speed = Math.random() * 12 + 6;
  const shape = Math.random();
  return {
    x: w / 2,
    y: h / 2 - 20,
    w: shape > 0.6 ? Math.random() * 6 + 4 : Math.random() * 8 + 6,
    h: shape > 0.6 ? Math.random() * 6 + 4 : Math.random() * 4 + 3,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    gravity: Math.random() * 0.4 + 0.25,
    drag: 0.96,
    opacity: 1,
    fade: Math.random() * 0.015 + 0.008,
  };
}

export function Confetti({
  active,
  duration = 3000,
  originX,
  originY,
  onDone,
}: {
  active: boolean;
  duration?: number;
  originX?: number;
  originY?: number;
  onDone?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const ox = originX ?? w / 2;
    const oy = originY ?? h / 2 - 20;

    // Create burst
    const count = 120;
    particlesRef.current = Array.from({ length: count }, () => {
      const p = createParticle(w, h);
      p.x = ox;
      p.y = oy;
      return p;
    });

    let elapsed = 0;
    const start = performance.now();

    const loop = (now: number) => {
      elapsed = now - start;
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += p.gravity;
        p.dx *= p.drag;
        p.dy *= p.drag;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, p.opacity - p.fade);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, w, h);
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, duration, originX, originY, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9998,
      }}
    />
  );
}
