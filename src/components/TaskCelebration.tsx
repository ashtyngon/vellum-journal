import { useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════════════
   TaskCelebration — 5 dramatic micro-celebrations for task completion.

   Usage: const celebrate = useTaskCelebration();
          celebrate(checkboxElement, completedCount);

   Effects rotate randomly. Each anchors to the clicked element position.
   Uses the vellum palette: amber, sage, bronze, warm-rose, gold.
   ══════════════════════════════════════════════════════════════════════ */

// ── Palette ──────────────────────────────────────────────────────────

const PALETTE = {
  amber: '#ec7f13',
  gold: '#D4A843',
  sage: '#8fa88f',
  bronze: '#C9A96E',
  rose: '#C47C7C',
  cream: '#FAF6F0',
  ink: '#3D3229',
  warmWhite: '#FFF8ED',
};

const PARTICLE_COLORS = [PALETTE.amber, PALETTE.gold, PALETTE.sage, PALETTE.bronze, PALETTE.rose];

// ── Types ────────────────────────────────────────────────────────────

interface Point { x: number; y: number; }

// ── Utility ──────────────────────────────────────────────────────────

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function getCenter(el: HTMLElement): Point {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  return canvas;
}


// ══════════════════════════════════════════════════════════════════════
// EFFECT 1: SUPERNOVA
// Dozens of particles explode from the checkbox with a bright flash.
// Particles have physics: velocity, gravity, drag, fade.
// ══════════════════════════════════════════════════════════════════════

function supernova(origin: Point) {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d')!;
  // scale already applied in createCanvas()

  interface Spark {
    x: number; y: number;
    vx: number; vy: number;
    r: number; color: string;
    life: number; maxLife: number;
    type: 'circle' | 'line';
    angle: number; len: number;
  }

  const sparks: Spark[] = [];
  const count = 40 + Math.floor(Math.random() * 20);

  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(2, 12);
    const maxLife = rand(30, 60);
    sparks.push({
      x: origin.x, y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(0, 2),
      r: rand(1.5, 4),
      color: pick(PARTICLE_COLORS),
      life: 0, maxLife,
      type: Math.random() > 0.6 ? 'line' : 'circle',
      angle: rand(0, Math.PI * 2),
      len: rand(4, 10),
    });
  }

  // Central flash
  let flashAlpha = 1;

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Flash
    if (flashAlpha > 0) {
      const gradient = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, 50);
      gradient.addColorStop(0, `rgba(236, 127, 19, ${flashAlpha * 0.8})`);
      gradient.addColorStop(0.4, `rgba(212, 168, 67, ${flashAlpha * 0.4})`);
      gradient.addColorStop(1, `rgba(212, 168, 67, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(origin.x - 60, origin.y - 60, 120, 120);
      flashAlpha -= 0.06;
    }

    let alive = false;
    for (const s of sparks) {
      s.life++;
      if (s.life >= s.maxLife) continue;
      alive = true;

      const progress = s.life / s.maxLife;
      const alpha = 1 - progress * progress; // Ease out
      const drag = 0.97;

      s.vx *= drag;
      s.vy *= drag;
      s.vy += 0.08; // Gravity
      s.x += s.vx;
      s.y += s.vy;
      s.angle += 0.1;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;

      if (s.type === 'circle') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = 2 * (1 - progress);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
          s.x + Math.cos(s.angle) * s.len * (1 - progress),
          s.y + Math.sin(s.angle) * s.len * (1 - progress),
        );
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    frame++;

    if (alive || flashAlpha > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ══════════════════════════════════════════════════════════════════════
// EFFECT 2: VICTORY RIBBON
// A golden ribbon unfurls across the task row, leaving sparkle trails.
// Uses the parent row element for positioning.
// ══════════════════════════════════════════════════════════════════════

function victoryRibbon(origin: Point, el: HTMLElement) {
  const row = el.closest('[class*="group/entry"]') as HTMLElement | null;
  if (!row) { supernova(origin); return; } // Fallback

  const rect = row.getBoundingClientRect();
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d')!;
  // scale already applied in createCanvas()

  const startX = rect.left - 20;
  const endX = rect.right + 20;
  const midY = rect.top + rect.height / 2;
  const width = endX - startX;

  let progress = 0;
  const sparkles: { x: number; y: number; life: number; maxLife: number; r: number; color: string }[] = [];

  function animate() {
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    progress += 0.035;
    const headX = startX + width * Math.min(progress, 1);

    // Ribbon body
    if (progress <= 1.5) {
      const tailX = startX + width * Math.max(progress - 0.4, 0);
      const ribbonGrad = ctx.createLinearGradient(tailX, 0, headX, 0);
      ribbonGrad.addColorStop(0, 'rgba(212, 168, 67, 0)');
      ribbonGrad.addColorStop(0.3, 'rgba(212, 168, 67, 0.7)');
      ribbonGrad.addColorStop(0.7, 'rgba(236, 127, 19, 0.8)');
      ribbonGrad.addColorStop(1, 'rgba(212, 168, 67, 0.3)');

      ctx.fillStyle = ribbonGrad;
      ctx.beginPath();
      for (let px = tailX; px < headX; px += 2) {
        const t = (px - tailX) / (headX - tailX);
        const wave = Math.sin(t * Math.PI * 3 + progress * 8) * 6;
        if (px === tailX) ctx.moveTo(px, midY - 3 + wave);
        else ctx.lineTo(px, midY - 3 + wave);
      }
      for (let px = headX; px > tailX; px -= 2) {
        const t = (px - tailX) / (headX - tailX);
        const wave = Math.sin(t * Math.PI * 3 + progress * 8) * 6;
        ctx.lineTo(px, midY + 3 + wave);
      }
      ctx.closePath();
      ctx.fill();

      // Shimmer along ribbon
      if (progress < 1) {
        const shimmerX = headX - 10;
        const shimmerGrad = ctx.createRadialGradient(shimmerX, midY, 0, shimmerX, midY, 20);
        shimmerGrad.addColorStop(0, 'rgba(255, 248, 237, 0.9)');
        shimmerGrad.addColorStop(1, 'rgba(255, 248, 237, 0)');
        ctx.fillStyle = shimmerGrad;
        ctx.fillRect(shimmerX - 20, midY - 20, 40, 40);
      }
    }

    // Spawn sparkles at ribbon head
    if (progress < 1 && Math.random() > 0.3) {
      sparkles.push({
        x: headX + rand(-5, 5),
        y: midY + rand(-12, 12),
        life: 0, maxLife: rand(15, 30),
        r: rand(1, 3),
        color: pick([PALETTE.gold, PALETTE.amber, PALETTE.warmWhite]),
      });
    }

    // Draw sparkles
    for (const s of sparkles) {
      s.life++;
      if (s.life >= s.maxLife) continue;
      const alpha = 1 - (s.life / s.maxLife);
      s.y -= 0.3;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;

      // Star shape
      ctx.beginPath();
      const r = s.r * (1 - s.life / s.maxLife * 0.5);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + s.life * 0.15;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(a) * r * 2.5, s.y + Math.sin(a) * r * 2.5);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = s.color;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (progress < 2) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ══════════════════════════════════════════════════════════════════════
// EFFECT 3: LEVEL UP
// "+1" rises with a bounce, shockwave ring expands. Streak mode at 3+.
// ══════════════════════════════════════════════════════════════════════

function levelUp(origin: Point, streak: number) {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d')!;
  // scale already applied in createCanvas()

  let frame = 0;
  const maxFrame = 70;
  const isStreak = streak >= 3;
  const text = isStreak ? `🔥 ${streak}` : '+1';

  // Ring particles for streak
  const streakParticles: { angle: number; dist: number; speed: number; color: string; r: number }[] = [];
  if (isStreak) {
    for (let i = 0; i < 20; i++) {
      streakParticles.push({
        angle: rand(0, Math.PI * 2),
        dist: rand(20, 50),
        speed: rand(1, 3),
        color: pick(PARTICLE_COLORS),
        r: rand(1.5, 3),
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    frame++;
    const t = frame / maxFrame;

    // Shockwave ring
    if (t < 0.5) {
      const ringT = t / 0.5;
      const radius = ringT * 80;
      const alpha = (1 - ringT) * 0.6;
      ctx.strokeStyle = isStreak ? PALETTE.amber : PALETTE.gold;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3 * (1 - ringT);
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Second ring, delayed
      if (ringT > 0.3) {
        const r2t = (ringT - 0.3) / 0.7;
        const r2 = r2t * 60;
        ctx.globalAlpha = (1 - r2t) * 0.3;
        ctx.lineWidth = 2 * (1 - r2t);
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, r2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Text rising
    const riseT = Math.min(t * 2, 1);
    // Elastic bounce easing
    const bounce = riseT < 0.6
      ? (riseT / 0.6) * (riseT / 0.6)
      : 1 + Math.sin((riseT - 0.6) / 0.4 * Math.PI) * 0.15 * (1 - (riseT - 0.6) / 0.4);

    const textY = origin.y - bounce * 50;
    const textAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const scale = 0.5 + bounce * 0.5;

    ctx.globalAlpha = textAlpha;
    ctx.save();
    ctx.translate(origin.x, textY);
    ctx.scale(scale, scale);

    ctx.font = `bold ${isStreak ? 28 : 24}px "Georgia", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow/glow
    ctx.shadowColor = isStreak ? PALETTE.amber : PALETTE.gold;
    ctx.shadowBlur = 15;
    ctx.fillStyle = isStreak ? PALETTE.amber : PALETTE.gold;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;

    // White outline for readability
    ctx.strokeStyle = PALETTE.warmWhite;
    ctx.lineWidth = 1;
    ctx.strokeText(text, 0, 0);

    ctx.restore();

    // Streak particles
    if (isStreak) {
      for (const p of streakParticles) {
        p.dist += p.speed;
        p.angle += 0.02;
        const px = origin.x + Math.cos(p.angle) * p.dist;
        const py = origin.y - bounce * 30 + Math.sin(p.angle) * p.dist * 0.5;
        const pAlpha = textAlpha * (1 - p.dist / 120);
        if (pAlpha <= 0) continue;
        ctx.globalAlpha = pAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    if (frame < maxFrame) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ══════════════════════════════════════════════════════════════════════
// EFFECT 4: AURORA WAVE
// A horizontal wave of color sweeps across the task row like northern
// lights. Shifts through the full vellum palette with sine distortion.
// ══════════════════════════════════════════════════════════════════════

function auroraWave(origin: Point, el: HTMLElement) {
  const row = el.closest('[class*="group/entry"]') as HTMLElement | null;
  if (!row) { supernova(origin); return; }

  const rect = row.getBoundingClientRect();
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d')!;
  // scale already applied in createCanvas()

  let frame = 0;
  const maxFrame = 55;
  const colors = [PALETTE.amber, PALETTE.sage, PALETTE.bronze, PALETTE.rose, PALETTE.gold];

  function animate() {
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    frame++;
    const t = frame / maxFrame;

    // Wave position sweeps left to right
    const waveCenter = rect.left - 40 + (rect.width + 80) * t * 1.3;
    const waveWidth = 120;
    const fadeOut = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    const fadeIn = Math.min(t * 4, 1);
    const masterAlpha = fadeIn * fadeOut;

    // Draw aurora bands
    for (let band = 0; band < 5; band++) {
      const bandOffset = (band - 2) * 8;
      const phaseOffset = band * 1.2;
      const color = colors[band % colors.length];

      ctx.globalAlpha = masterAlpha * 0.35;

      ctx.beginPath();
      for (let x = rect.left - 10; x <= rect.right + 10; x += 3) {
        const distFromWave = Math.abs(x - waveCenter);
        if (distFromWave > waveWidth) continue;

        const wave1 = Math.sin((x - waveCenter) * 0.05 + phaseOffset + frame * 0.15) * 12;
        const wave2 = Math.sin((x - waveCenter) * 0.08 + phaseOffset * 2 + frame * 0.1) * 6;
        const y = rect.top + rect.height / 2 + bandOffset + wave1 + wave2;

        if (x === rect.left - 10 || distFromWave > waveWidth - 3) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 4 * masterAlpha;
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 20 * masterAlpha;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Bright core
    const coreGrad = ctx.createRadialGradient(waveCenter, rect.top + rect.height / 2, 0, waveCenter, rect.top + rect.height / 2, 40);
    coreGrad.addColorStop(0, `rgba(255, 248, 237, ${0.4 * masterAlpha})`);
    coreGrad.addColorStop(1, 'rgba(255, 248, 237, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = coreGrad;
    ctx.fillRect(waveCenter - 40, rect.top - 10, 80, rect.height + 20);

    if (frame < maxFrame) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ══════════════════════════════════════════════════════════════════════
// EFFECT 5: GRAVITY DEFIER
// The task row lifts off the page, floats with orbiting sparkles,
// then lands with a bounce. CSS animation on the actual DOM element.
// ══════════════════════════════════════════════════════════════════════

function gravityDefier(origin: Point, el: HTMLElement) {
  const maybeRow = el.closest('[class*="group/entry"]') as HTMLElement | null;
  if (!maybeRow) { supernova(origin); return; }
  const row = maybeRow;

  const rect = row.getBoundingClientRect();

  // Animate the actual row element
  row.style.transition = 'none';
  row.style.position = 'relative';
  row.style.zIndex = '50';

  // Glow element under the row
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: absolute; left: -10px; right: -10px; bottom: -4px; height: 12px;
    background: radial-gradient(ellipse at center, rgba(212,168,67,0.5) 0%, transparent 70%);
    border-radius: 50%; filter: blur(6px); pointer-events: none; z-index: -1;
    opacity: 0; transition: opacity 0.2s;
  `;
  row.style.overflow = 'visible';
  row.appendChild(glow);

  // Canvas for orbiting sparkles
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d')!;
  // scale already applied in createCanvas()

  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    dist: rand(25, 45),
    speed: rand(0.04, 0.08) * (Math.random() > 0.5 ? 1 : -1),
    r: rand(1.5, 3),
    color: pick(PARTICLE_COLORS),
  }));

  let frame = 0;
  const liftFrames = 15;
  const floatFrames = 30;
  const landFrames = 20;
  const totalFrames = liftFrames + floatFrames + landFrames;

  function animate() {
    frame++;

    let liftY = 0;
    let scale = 1;

    if (frame <= liftFrames) {
      // Lift phase
      const lt = frame / liftFrames;
      liftY = -18 * (1 - (1 - lt) * (1 - lt)); // Ease out
      scale = 1 + lt * 0.02;
      glow.style.opacity = String(lt);
    } else if (frame <= liftFrames + floatFrames) {
      // Float phase — gentle bob
      const ft = (frame - liftFrames) / floatFrames;
      liftY = -18 + Math.sin(ft * Math.PI * 2) * 3;
      scale = 1.02;
      glow.style.opacity = '1';
    } else {
      // Land phase
      const lt = (frame - liftFrames - floatFrames) / landFrames;
      // Bounce easing
      const bounce = lt < 0.5
        ? 1 - lt / 0.5
        : lt < 0.75 ? (lt - 0.5) / 0.25 * 0.3 : 0.3 * (1 - (lt - 0.75) / 0.25);
      liftY = -18 * bounce * (1 - lt);
      scale = 1 + (1 - lt) * 0.02;
      glow.style.opacity = String(1 - lt);
    }

    row.style.transform = `translateY(${liftY}px) scale(${scale})`;

    // Draw orbiting sparkles during float phase
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2 + liftY;
    const sparkAlpha = frame <= liftFrames
      ? frame / liftFrames
      : frame > liftFrames + floatFrames
        ? 1 - (frame - liftFrames - floatFrames) / landFrames
        : 1;

    for (const s of sparkles) {
      s.angle += s.speed;
      const sx = centerX + Math.cos(s.angle) * s.dist;
      const sy = centerY + Math.sin(s.angle) * s.dist * 0.4; // Elliptical orbit

      ctx.globalAlpha = sparkAlpha * 0.8;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();

      // Tiny trail
      ctx.globalAlpha = sparkAlpha * 0.3;
      ctx.beginPath();
      ctx.arc(
        sx - Math.cos(s.angle) * 4,
        sy - Math.sin(s.angle) * 4 * 0.4,
        s.r * 0.5, 0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (frame < totalFrames) {
      requestAnimationFrame(animate);
    } else {
      row.style.transform = '';
      row.style.position = '';
      row.style.zIndex = '';
      row.style.overflow = '';
      row.style.transition = '';
      glow.remove();
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ══════════════════════════════════════════════════════════════════════
// HOOK: useTaskCelebration
// Returns a function: (element, completedCount) => void
// ══════════════════════════════════════════════════════════════════════

type CelebrateFn = (el: HTMLElement, completedCount: number) => void;

const effects = [supernova, victoryRibbon, levelUp, auroraWave, gravityDefier];
let lastEffectIndex = -1;

export function useTaskCelebration(): CelebrateFn {
  const celebrate = useCallback<CelebrateFn>((el, completedCount) => {
    const origin = getCenter(el);

    // Pick a random effect, avoiding the last one used
    let index: number;
    do {
      index = Math.floor(Math.random() * effects.length);
    } while (index === lastEffectIndex && effects.length > 1);
    lastEffectIndex = index;

    const effect = effects[index];

    // Route to the correct signature
    if (effect === supernova) {
      supernova(origin);
    } else if (effect === victoryRibbon) {
      victoryRibbon(origin, el);
    } else if (effect === levelUp) {
      levelUp(origin, completedCount);
    } else if (effect === auroraWave) {
      auroraWave(origin, el);
    } else if (effect === gravityDefier) {
      gravityDefier(origin, el);
    }
  }, []);

  return celebrate;
}

export default useTaskCelebration;
