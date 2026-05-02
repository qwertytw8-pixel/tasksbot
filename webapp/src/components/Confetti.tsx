import { useEffect, useState } from "react";

const PARTICLE_COUNT = 24;
const COLORS = ["#6D5DFC", "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF78F0"];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  spin: number;
  shape: "circle" | "rect";
}

function createParticles(originX: number, originY: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: originX,
    y: originY,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5,
    velocity: 3 + Math.random() * 5,
    spin: (Math.random() - 0.5) * 720,
    shape: Math.random() > 0.5 ? "circle" : "rect",
  }));
}

interface ConfettiProps {
  originX?: number;
  originY?: number;
  onDone?: () => void;
}

export function Confetti({ originX = window.innerWidth / 2, originY = window.innerHeight / 2, onDone }: ConfettiProps) {
  const [particles] = useState(() => createParticles(originX, originY));

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="confetti-container" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`confetti-particle confetti-particle--${p.shape}`}
          style={{
            "--cx": `${p.x}px`,
            "--cy": `${p.y}px`,
            "--dx": `${Math.cos(p.angle) * p.velocity * 30}px`,
            "--dy": `${Math.sin(p.angle) * p.velocity * 30 - 80}px`,
            "--size": `${p.size}px`,
            "--spin": `${p.spin}deg`,
            "--color": p.color,
            "--delay": `${Math.random() * 0.1}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
