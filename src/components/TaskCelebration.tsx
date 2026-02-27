import { useCallback } from 'react';
import confetti from 'canvas-confetti';

/* ══════════════════════════════════════════════════════════════════════
   TaskCelebration — 13 vivid full-screen celebrations using canvas-confetti.

   Design philosophy:
   - COLORFUL, VIVID, FULL-SCREEN — celebrations should POP
   - Variable reinforcement: 8 distinct effects, never the same twice
   - Queue system: rapid completions queue up, each plays fully (4-6s)
   - Zero new dependencies — canvas-confetti is already installed

   Usage: const celebrate = useTaskCelebration();
          celebrate(checkboxElement, completedCount);

   Standalone: import { celebrateTask } from './TaskCelebration';
               celebrateTask(el, count);
   ══════════════════════════════════════════════════════════════════════ */

// ── Vivid Color Palettes ─────────────────────────────────────────────

/** Full rainbow — maximum visual impact */
const RAINBOW = ['#ff0055', '#ff6600', '#ffcc00', '#00ff88', '#00ccff', '#6633ff', '#ff33cc'];

/** Warm celebration — amber/gold/rose with high saturation */
const WARM = ['#ff4500', '#ff8c00', '#ffd700', '#ff69b4', '#ff1493', '#ffaa00'];

/** Cool burst — blues, purples, teals */
const COOL = ['#00e5ff', '#7c4dff', '#536dfe', '#18ffff', '#e040fb', '#00e676'];

/** Golden — stars and luxury */
const GOLD = ['#ffd700', '#ffb300', '#ff8f00', '#fff176', '#ffe082', '#ffffff'];

/** Party — maximum variety */
const PARTY = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800'];


// ── Utility ──────────────────────────────────────────────────────────

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

interface Point { x: number; y: number; }

function getCenter(el: HTMLElement): Point {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Convert pixel origin to 0-1 range for canvas-confetti */
function toNormalized(p: Point): { x: number; y: number } {
  return { x: p.x / window.innerWidth, y: p.y / window.innerHeight };
}

/** Find the parent task row element for row glow */
function findRow(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;
  while (node) {
    if (node.classList) {
      for (let i = 0; i < node.classList.length; i++) {
        if (node.classList[i].indexOf('group/entry') !== -1) return node;
      }
    }
    node = node.parentElement;
  }
  return null;
}

/** Sleep helper for sequencing bursts */
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * DOM-based glow pulse on the task row — instant micro-feedback.
 * Fires immediately on click, before the queued celebration.
 */
function rowGlowPulse(el: HTMLElement) {
  const row = findRow(el);
  if (!row) return;

  const highlight = document.createElement('div');
  highlight.style.cssText = `
    position: absolute; inset: 0; border-radius: inherit;
    background: linear-gradient(90deg, transparent, rgba(236, 127, 19, 0.15), transparent);
    pointer-events: none; z-index: 1;
    animation: celebrationGlow 600ms ease-out forwards;
  `;

  const prevPosition = row.style.position;
  const prevOverflow = row.style.overflow;
  row.style.position = 'relative';
  row.style.overflow = 'visible';
  row.appendChild(highlight);

  if (!document.getElementById('celebration-glow-style')) {
    const style = document.createElement('style');
    style.id = 'celebration-glow-style';
    style.textContent = `
      @keyframes celebrationGlow {
        0% { opacity: 0; transform: scaleX(0.3); }
        30% { opacity: 1; transform: scaleX(1); }
        100% { opacity: 0; transform: scaleX(1.1); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    highlight.remove();
    row.style.position = prevPosition;
    row.style.overflow = prevOverflow;
  }, 700);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 1: CONFETTI CANNON (4s)
//  Massive burst from the task position — 300+ particles, wide spread,
//  full rainbow colors. The classic celebration, done big.
// ══════════════════════════════════════════════════════════════════════

async function confettiCannon(origin: Point): Promise<void> {
  const norm = toNormalized(origin);

  // First big burst
  confetti({
    particleCount: 150,
    spread: 100,
    origin: norm,
    colors: RAINBOW,
    startVelocity: 55,
    gravity: 0.8,
    ticks: 300,
    scalar: 1.2,
    zIndex: 9999,
  });

  await sleep(150);

  // Second burst — wider, more particles
  confetti({
    particleCount: 100,
    spread: 140,
    origin: norm,
    colors: PARTY,
    startVelocity: 45,
    gravity: 0.9,
    ticks: 250,
    scalar: 1,
    zIndex: 9999,
  });

  await sleep(200);

  // Third burst — stars mixed in
  confetti({
    particleCount: 60,
    spread: 80,
    origin: norm,
    colors: GOLD,
    shapes: ['star'],
    startVelocity: 40,
    gravity: 0.7,
    ticks: 350,
    scalar: 1.5,
    zIndex: 9999,
  });

  await sleep(3500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 2: FIREWORKS (5s)
//  4-6 firework bursts at random positions across the screen.
//  Full 360° spread. Staggered timing. Like real fireworks.
// ══════════════════════════════════════════════════════════════════════

async function fireworks(_origin: Point): Promise<void> {
  const duration = 4500;
  const end = Date.now() + duration;

  const interval = setInterval(() => {
    confetti({
      particleCount: rand(80, 120),
      spread: 360,
      origin: {
        x: rand(0.1, 0.9),
        y: rand(0.1, 0.6),
      },
      colors: RAINBOW,
      startVelocity: rand(25, 45),
      gravity: rand(0.6, 1.2),
      ticks: 250,
      scalar: rand(0.8, 1.4),
      zIndex: 9999,
      shapes: Math.random() > 0.5 ? ['star', 'circle'] : ['circle', 'square'],
    });
  }, 350);

  // Wait until the duration is done
  while (Date.now() < end) {
    await sleep(100);
  }
  clearInterval(interval);
  await sleep(500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 3: STAR BURST (4s)
//  Gold and amber stars explode outward in 3 staggered waves.
//  Sparkly, celebratory, luxurious.
// ══════════════════════════════════════════════════════════════════════

async function starBurst(_origin: Point): Promise<void> {
  // Wave 1: center burst
  confetti({
    particleCount: 80,
    spread: 360,
    origin: { x: 0.5, y: 0.4 },
    colors: GOLD,
    shapes: ['star'],
    startVelocity: 50,
    gravity: 0.5,
    ticks: 350,
    scalar: 2,
    zIndex: 9999,
  });

  await sleep(600);

  // Wave 2: dual side bursts
  confetti({
    particleCount: 50,
    spread: 120,
    angle: 45,
    origin: { x: 0, y: 0.7 },
    colors: WARM,
    shapes: ['star', 'circle'],
    startVelocity: 55,
    gravity: 0.6,
    ticks: 300,
    scalar: 1.5,
    zIndex: 9999,
  });
  confetti({
    particleCount: 50,
    spread: 120,
    angle: 135,
    origin: { x: 1, y: 0.7 },
    colors: WARM,
    shapes: ['star', 'circle'],
    startVelocity: 55,
    gravity: 0.6,
    ticks: 300,
    scalar: 1.5,
    zIndex: 9999,
  });

  await sleep(700);

  // Wave 3: big finale
  confetti({
    particleCount: 120,
    spread: 360,
    origin: { x: 0.5, y: 0.35 },
    colors: [...GOLD, '#ffffff', '#ff6600'],
    shapes: ['star'],
    startVelocity: 60,
    gravity: 0.4,
    ticks: 400,
    scalar: 1.8,
    zIndex: 9999,
  });

  await sleep(2500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 4: SIDE CANNONS (4s)
//  Dual cannons firing from both screen edges, confetti meets in the
//  middle. Alternating colors like a party.
// ══════════════════════════════════════════════════════════════════════

async function sideCannons(_origin: Point): Promise<void> {
  const colorSets = [RAINBOW, WARM, COOL, PARTY];
  const chosenColors = colorSets[Math.floor(Math.random() * colorSets.length)];

  for (let i = 0; i < 5; i++) {
    // Left cannon
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: chosenColors,
      startVelocity: 55,
      gravity: 1,
      ticks: 300,
      scalar: 1.2,
      zIndex: 9999,
    });

    // Right cannon
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: chosenColors,
      startVelocity: 55,
      gravity: 1,
      ticks: 300,
      scalar: 1.2,
      zIndex: 9999,
    });

    await sleep(500);
  }

  await sleep(1500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 5: EMOJI RAIN (4s)
//  Fun emoji confetti — ✓, ✨, 🌱, 🔥, ⭐ — falling like rewards.
//  Using canvas-confetti's shapeFromText feature.
// ══════════════════════════════════════════════════════════════════════

async function emojiRain(_origin: Point): Promise<void> {
  const emojis = ['✨', '🌱', '🔥', '⭐', '✅', '🎉', '💪', '🌟'];
  const scalar = 2;

  const emojiShapes = emojis.map(e => confetti.shapeFromText({ text: e, scalar }));

  // Continuous emoji rain from top
  for (let burst = 0; burst < 6; burst++) {
    const selectedShapes = [
      emojiShapes[Math.floor(Math.random() * emojiShapes.length)],
      emojiShapes[Math.floor(Math.random() * emojiShapes.length)],
    ];

    confetti({
      particleCount: 15,
      spread: 160,
      origin: { x: rand(0.1, 0.9), y: -0.1 },
      shapes: selectedShapes,
      scalar,
      gravity: 1.2,
      startVelocity: 15,
      ticks: 350,
      flat: true,
      zIndex: 9999,
    });

    await sleep(500);
  }

  await sleep(1000);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 6: REALISTIC CASCADE (4s)
//  Multi-layered realistic confetti — 3 overlapping bursts with
//  different velocities, decay, and sizes for depth and dimension.
// ══════════════════════════════════════════════════════════════════════

async function realisticCascade(_origin: Point): Promise<void> {
  // Layer 1: fast, small, wide
  confetti({
    particleCount: 100,
    spread: 160,
    startVelocity: 25,
    decay: 0.92,
    scalar: 0.8,
    origin: { x: rand(0.3, 0.7), y: 0.3 },
    colors: PARTY,
    ticks: 300,
    zIndex: 9999,
  });

  // Layer 2: medium, normal
  confetti({
    particleCount: 70,
    spread: 100,
    startVelocity: 40,
    decay: 0.91,
    scalar: 1.2,
    origin: { x: rand(0.3, 0.7), y: 0.35 },
    colors: RAINBOW,
    ticks: 350,
    zIndex: 9999,
  });

  await sleep(200);

  // Layer 3: slow, big, floaty
  confetti({
    particleCount: 40,
    spread: 70,
    startVelocity: 50,
    decay: 0.94,
    scalar: 1.6,
    gravity: 0.7,
    origin: { x: 0.5, y: 0.4 },
    colors: WARM,
    ticks: 400,
    zIndex: 9999,
  });

  await sleep(800);

  // Layer 4: star accent
  confetti({
    particleCount: 30,
    spread: 360,
    startVelocity: 35,
    decay: 0.92,
    scalar: 2,
    gravity: 0.5,
    shapes: ['star'],
    origin: { x: 0.5, y: 0.35 },
    colors: GOLD,
    ticks: 350,
    zIndex: 9999,
  });

  await sleep(2800);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 7: GOLDEN SHOWER (5s)
//  All-gold particles drifting down from the top of the screen.
//  Stars and circles floating with long ticks. Luxurious, warm.
// ══════════════════════════════════════════════════════════════════════

async function goldenShower(_origin: Point): Promise<void> {
  for (let wave = 0; wave < 8; wave++) {
    confetti({
      particleCount: 25,
      spread: 180,
      origin: { x: rand(0.1, 0.9), y: -0.1 },
      colors: GOLD,
      shapes: wave % 2 === 0 ? ['star', 'circle'] : ['star'],
      startVelocity: rand(5, 15),
      gravity: 0.6,
      drift: rand(-0.5, 0.5),
      ticks: 500,
      scalar: rand(1.2, 2.2),
      zIndex: 9999,
    });

    await sleep(450);
  }

  await sleep(1200);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 8: PRIDE BURST (4s)
//  Rapid-fire alternating cannons from bottom corners — full rainbow,
//  maximum energy, feels like a party.
// ══════════════════════════════════════════════════════════════════════

async function prideBurst(_origin: Point): Promise<void> {
  const colors = [
    ['#ff0000', '#ff4444'],
    ['#ff8800', '#ffaa00'],
    ['#ffdd00', '#ffee44'],
    ['#00cc00', '#44ff44'],
    ['#0066ff', '#4488ff'],
    ['#8800ff', '#aa44ff'],
  ];

  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0;

    confetti({
      particleCount: 60,
      angle: side ? 55 : 125,
      spread: 60,
      origin: { x: side ? 0.05 : 0.95, y: 0.95 },
      colors: colors[i],
      startVelocity: 65,
      gravity: 1.1,
      ticks: 250,
      scalar: 1.3,
      zIndex: 9999,
    });

    // Opposite side stars
    confetti({
      particleCount: 20,
      angle: side ? 125 : 55,
      spread: 40,
      origin: { x: side ? 0.95 : 0.05, y: 0.85 },
      colors: colors[(i + 3) % 6],
      shapes: ['star'],
      startVelocity: 50,
      gravity: 0.8,
      ticks: 300,
      scalar: 1.8,
      zIndex: 9999,
    });

    await sleep(350);
  }

  await sleep(1800);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 9: HEART EXPLOSION (4s)
//  Pink and red hearts burst from center in waves. Romantic, warm,
//  self-love energy. You love yourself for getting things done.
// ══════════════════════════════════════════════════════════════════════

const HEARTS = ['#ff1744', '#f50057', '#ff4081', '#ff80ab', '#e91e63', '#c2185b', '#ff6090', '#ff0044'];

/** SVG heart path — real 3D confetti particle, not flat emoji */
const heartShape = confetti.shapeFromPath({
  path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
});

async function heartExplosion(origin: Point): Promise<void> {
  const norm = toNormalized(origin);

  // Wave 1: big heart-shaped burst from the task
  confetti({
    particleCount: 60,
    spread: 360,
    origin: norm,
    shapes: [heartShape],
    colors: HEARTS,
    startVelocity: 50,
    gravity: 0.7,
    ticks: 350,
    scalar: 3,
    zIndex: 9999,
  });

  // Pink/red confetti underneath for density
  confetti({
    particleCount: 80,
    spread: 120,
    origin: norm,
    colors: HEARTS,
    startVelocity: 50,
    gravity: 0.8,
    ticks: 300,
    scalar: 1.2,
    zIndex: 9999,
  });

  await sleep(400);

  // Wave 2: heart cannons from both sides
  confetti({
    particleCount: 35,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    shapes: [heartShape],
    colors: HEARTS,
    startVelocity: 55,
    gravity: 0.6,
    ticks: 300,
    scalar: 2.5,
    zIndex: 9999,
  });
  confetti({
    particleCount: 35,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    shapes: [heartShape],
    colors: HEARTS,
    startVelocity: 55,
    gravity: 0.6,
    ticks: 300,
    scalar: 2.5,
    zIndex: 9999,
  });

  await sleep(500);

  // Wave 3: heart rain from top — large hearts floating down
  for (let i = 0; i < 3; i++) {
    confetti({
      particleCount: 20,
      spread: 180,
      origin: { x: rand(0.1, 0.9), y: -0.1 },
      shapes: [heartShape],
      colors: HEARTS,
      gravity: 0.8,
      startVelocity: 12,
      ticks: 400,
      scalar: 3.5,
      zIndex: 9999,
    });
    await sleep(300);
  }

  // Final accent — star sparkles mixed with hearts
  confetti({
    particleCount: 40,
    spread: 360,
    origin: { x: 0.5, y: 0.4 },
    shapes: ['star'],
    colors: ['#ff80ab', '#ff4081', '#ffffff', '#ffd700'],
    startVelocity: 35,
    gravity: 0.5,
    ticks: 350,
    scalar: 1.8,
    zIndex: 9999,
  });

  await sleep(1600);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 10: SUPERNOVA (3.5s)
//  Fast, intense, overwhelming. A single massive explosion from
//  center-screen — 500+ particles in every direction. Pure impact.
// ══════════════════════════════════════════════════════════════════════

async function supernova(_origin: Point): Promise<void> {
  // Everything at once — maximum density
  confetti({
    particleCount: 200,
    spread: 360,
    origin: { x: 0.5, y: 0.4 },
    colors: RAINBOW,
    startVelocity: 70,
    gravity: 0.5,
    ticks: 300,
    scalar: 1.5,
    zIndex: 9999,
  });

  confetti({
    particleCount: 150,
    spread: 360,
    origin: { x: 0.5, y: 0.4 },
    colors: PARTY,
    shapes: ['star'],
    startVelocity: 55,
    gravity: 0.6,
    ticks: 350,
    scalar: 2,
    zIndex: 9999,
  });

  confetti({
    particleCount: 100,
    spread: 360,
    origin: { x: 0.5, y: 0.4 },
    colors: GOLD,
    startVelocity: 40,
    gravity: 0.4,
    ticks: 400,
    scalar: 1,
    zIndex: 9999,
  });

  await sleep(3500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 11: FOUR CORNERS (4s)
//  Simultaneous explosions from all four corners of the screen.
//  Diagonal crossfire. The whole viewport is under attack by confetti.
// ══════════════════════════════════════════════════════════════════════

async function fourCorners(_origin: Point): Promise<void> {
  const corners = [
    { origin: { x: 0, y: 0 }, angle: 45 },     // top-left → down-right
    { origin: { x: 1, y: 0 }, angle: 135 },    // top-right → down-left
    { origin: { x: 0, y: 1 }, angle: 315 },    // bottom-left → up-right
    { origin: { x: 1, y: 1 }, angle: 225 },    // bottom-right → up-left
  ];

  // Round 1: all corners fire
  for (const corner of corners) {
    confetti({
      particleCount: 60,
      angle: corner.angle,
      spread: 70,
      origin: corner.origin,
      colors: RAINBOW,
      startVelocity: 60,
      gravity: 1,
      ticks: 300,
      scalar: 1.3,
      zIndex: 9999,
    });
  }

  await sleep(600);

  // Round 2: corners fire again with stars
  for (const corner of corners) {
    confetti({
      particleCount: 40,
      angle: corner.angle,
      spread: 90,
      origin: corner.origin,
      colors: WARM,
      shapes: ['star', 'circle'],
      startVelocity: 50,
      gravity: 0.8,
      ticks: 350,
      scalar: 1.8,
      zIndex: 9999,
    });
  }

  await sleep(600);

  // Round 3: center explosion from all the colliding confetti
  confetti({
    particleCount: 150,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: PARTY,
    startVelocity: 45,
    gravity: 0.6,
    ticks: 350,
    scalar: 1.2,
    zIndex: 9999,
  });

  await sleep(2500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 12: CONFETTI SPIRAL (4.5s)
//  Rapid-fire bursts that rotate around the center of the screen
//  like a spinning sprinkler. Hypnotic and intense.
// ══════════════════════════════════════════════════════════════════════

async function confettiSpiral(_origin: Point): Promise<void> {
  const steps = 16;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 360;
    const radians = (angle * Math.PI) / 180;
    const r = 0.25;

    confetti({
      particleCount: 30,
      angle: angle + 90,
      spread: 40,
      origin: {
        x: 0.5 + Math.cos(radians) * r,
        y: 0.45 + Math.sin(radians) * r,
      },
      colors: RAINBOW,
      startVelocity: 45,
      gravity: 0.9,
      ticks: 250,
      scalar: 1.2,
      zIndex: 9999,
    });

    await sleep(180);
  }

  // Final center burst
  confetti({
    particleCount: 100,
    spread: 360,
    origin: { x: 0.5, y: 0.45 },
    colors: GOLD,
    shapes: ['star'],
    startVelocity: 50,
    gravity: 0.5,
    ticks: 350,
    scalar: 2,
    zIndex: 9999,
  });

  await sleep(1500);
}


// ══════════════════════════════════════════════════════════════════════
//  EFFECT 13: THUNDER BURST (3.5s)
//  Quick, aggressive — two massive simultaneous bursts from top and
//  bottom, colliding in the middle. Then a final shockwave.
// ══════════════════════════════════════════════════════════════════════

async function thunderBurst(_origin: Point): Promise<void> {
  // Top cannon aimed down
  confetti({
    particleCount: 120,
    angle: 270,
    spread: 100,
    origin: { x: 0.5, y: -0.1 },
    colors: COOL,
    startVelocity: 65,
    gravity: 2,
    ticks: 200,
    scalar: 1.3,
    zIndex: 9999,
  });

  // Bottom cannon aimed up
  confetti({
    particleCount: 120,
    angle: 90,
    spread: 100,
    origin: { x: 0.5, y: 1.1 },
    colors: WARM,
    startVelocity: 65,
    gravity: -0.5,
    ticks: 200,
    scalar: 1.3,
    zIndex: 9999,
  });

  await sleep(400);

  // Collision shockwave — massive 360° from center
  confetti({
    particleCount: 200,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: [...RAINBOW, '#ffffff', '#ffffff'],
    startVelocity: 55,
    gravity: 0.7,
    ticks: 350,
    scalar: 1.4,
    zIndex: 9999,
  });

  confetti({
    particleCount: 60,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: GOLD,
    shapes: ['star'],
    startVelocity: 40,
    gravity: 0.4,
    ticks: 400,
    scalar: 2.2,
    zIndex: 9999,
  });

  await sleep(3000);
}


// ══════════════════════════════════════════════════════════════════════
//  QUEUE SYSTEM & PUBLIC API
// ══════════════════════════════════════════════════════════════════════

type EffectFn = (origin: Point) => Promise<void>;

const effects: EffectFn[] = [
  confettiCannon,
  fireworks,
  starBurst,
  sideCannons,
  emojiRain,
  realisticCascade,
  goldenShower,
  prideBurst,
  heartExplosion,
  supernova,
  fourCorners,
  confettiSpiral,
  thunderBurst,
];

let lastEffectIndex = -1;
const queue: { origin: Point; el: HTMLElement }[] = [];
let isPlaying = false;

async function playNext() {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const { origin } = queue.shift()!;

  // Pick a random effect, avoiding the last one used
  let index: number;
  do {
    index = Math.floor(Math.random() * effects.length);
  } while (index === lastEffectIndex && effects.length > 1);
  lastEffectIndex = index;

  try {
    await effects[index](origin);
  } catch (err) {
    console.error('[TaskCelebration] Effect error:', err);
  }

  // Play next in queue
  playNext();
}

/** Standalone celebrate function — can be called from any component. */
export function celebrateTask(el: HTMLElement, _completedCount: number = 1): void {
  try {
    const origin = getCenter(el);

    // Instant micro-feedback (always fires immediately)
    rowGlowPulse(el);

    // Queue the full-screen celebration — stacking is intentional!
    // Each completion deserves its own moment of dopamine.
    queue.push({ origin, el });
    if (!isPlaying) {
      playNext();
    }
  } catch (err) {
    console.error('[TaskCelebration] Celebrate error:', err);
  }
}

/** React hook wrapper — returns the same celebrateTask function via useCallback. */
export function useTaskCelebration() {
  return useCallback((el: HTMLElement, completedCount: number) => {
    celebrateTask(el, completedCount);
  }, []);
}

export default useTaskCelebration;
