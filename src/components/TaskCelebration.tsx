import { useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════════════
   TaskCelebration — 8 full-screen celebrations for task completion.

   Design philosophy:
   - Every effect fills the viewport and lasts 4-6 seconds
   - "Make me feel something" — narrative, not abstract particles
   - Variable reinforcement: 8 distinct effects, never the same twice
   - Queue system: rapid completions queue up, each plays fully
   - The journal responding to you, or nature metaphors of growth

   Usage: const celebrate = useTaskCelebration();
          celebrate(checkboxElement, completedCount);

   Standalone: import { celebrateTask } from './TaskCelebration';
               celebrateTask(el, count);
   ══════════════════════════════════════════════════════════════════════ */

// ── Palette ──────────────────────────────────────────────────────────

const P = {
  amber: '#ec7f13',
  gold: '#D4A843',
  sage: '#8fa88f',
  bronze: '#C9A96E',
  rose: '#C47C7C',
  cream: '#FAF6F0',
  ink: '#3D3229',
  warmWhite: '#FFF8ED',
  deepAmber: '#8B4513',
};

const COLORS = [P.amber, P.gold, P.sage, P.bronze, P.rose];

// ── Utility ──────────────────────────────────────────────────────────

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// Easing functions
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutElastic(t: number) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}
function easeOutQuad(t: number) { return 1 - (1 - t) * (1 - t); }

interface Point { x: number; y: number; }

function getCenter(el: HTMLElement): Point {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Find the parent task row element for row-based effects */
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

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.cssText = `position:fixed;top:0;left:0;width:${w}px;height:${h}px;pointer-events:none;z-index:9999`;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return canvas;
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
//  EFFECT 1: INK BLOOM
//  Watercolor blots bloom outward from center, filling ~70% of viewport.
//  Colors shift through amber → sage → bronze → gold.
//  5 seconds. Organic, meditative, like wet paint on paper.
// ══════════════════════════════════════════════════════════════════════

function inkBloom(_origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.max(w, h) * 0.45;

    interface Blot {
      x: number; y: number;
      targetR: number; currentR: number;
      color: string;
      startFrame: number;
      wobblePhase: number;
      wobbleAmp: number;
      opacity: number;
    }

    const blots: Blot[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(0, maxR * 0.3);
      blots.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        targetR: rand(maxR * 0.3, maxR * 0.7),
        currentR: 0,
        color: COLORS[i % COLORS.length],
        startFrame: Math.floor(rand(0, 40)),
        wobblePhase: rand(0, Math.PI * 2),
        wobbleAmp: rand(0.03, 0.08),
        opacity: rand(0.06, 0.14),
      });
    }

    const totalFrames = 300; // ~5s at 60fps
    let frame = 0;

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Global fade: build up, hold, fade out
      let masterAlpha: number;
      if (t < 0.15) masterAlpha = easeOutCubic(t / 0.15);
      else if (t < 0.7) masterAlpha = 1;
      else masterAlpha = 1 - easeOutCubic((t - 0.7) / 0.3);

      ctx.globalCompositeOperation = 'multiply';

      for (const blot of blots) {
        if (frame < blot.startFrame) continue;

        const localT = clamp((frame - blot.startFrame) / 120, 0, 1);
        const growEase = easeOutCubic(localT);

        // Organic wobble on radius
        const wobble = 1 + Math.sin(frame * 0.02 + blot.wobblePhase) * blot.wobbleAmp;
        blot.currentR = blot.targetR * growEase * wobble;

        const gradient = ctx.createRadialGradient(
          blot.x, blot.y, 0,
          blot.x, blot.y, blot.currentR,
        );
        gradient.addColorStop(0, blot.color + Math.round(blot.opacity * masterAlpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.6, blot.color + Math.round(blot.opacity * masterAlpha * 0.5 * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, blot.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blot.x, blot.y, blot.currentR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 2: WAX SEAL
//  Golden seal stamps down center-screen with weight.
//  Screen shake on impact. Embossed checkmark. Wax rays radiate out.
//  4 seconds. Satisfying, tactile, earned.
// ══════════════════════════════════════════════════════════════════════

function waxSeal(_origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const sealR = Math.min(w, h) * 0.12;

    const totalFrames = 240; // ~4s at 60fps
    let frame = 0;

    // Wax ray data
    const rays: { angle: number; len: number; width: number; speed: number }[] = [];
    for (let i = 0; i < 16; i++) {
      rays.push({
        angle: (i / 16) * Math.PI * 2 + rand(-0.1, 0.1),
        len: rand(sealR * 2, sealR * 4),
        width: rand(2, 5),
        speed: rand(0.8, 1.2),
      });
    }

    const pageContainer = document.querySelector('main')?.parentElement;

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Phase 1: Descent (0-12.5%) — seal falls from top
      if (t < 0.125) {
        const dropT = easeInOutCubic(t / 0.125);
        const sealY = lerp(-sealR * 2, cy, dropT);
        const scale = lerp(1.3, 1, dropT);

        // Shadow grows as seal descends
        ctx.globalAlpha = dropT * 0.3;
        ctx.fillStyle = P.ink;
        ctx.beginPath();
        ctx.ellipse(cx, cy + sealR * 0.8, sealR * 0.8 * dropT, sealR * 0.15 * dropT, 0, 0, Math.PI * 2);
        ctx.fill();

        // Seal
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(cx, sealY);
        ctx.scale(scale, scale);
        drawSeal(ctx, 0, 0, sealR, 0);
        ctx.restore();
      }
      // Phase 2: Impact (12.5-15%)
      else if (t < 0.15) {
        const impactT = (t - 0.125) / 0.025;

        // Screen shake
        if (pageContainer && impactT < 0.5) {
          const shake = Math.sin(impactT * Math.PI * 6) * 3 * (1 - impactT);
          pageContainer.style.transform = `translateY(${shake}px)`;
        } else if (pageContainer) {
          pageContainer.style.transform = '';
        }

        // White flash
        ctx.globalAlpha = (1 - impactT) * 0.25;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);

        // Seal at rest with slight squash
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(cx, cy);
        const squash = 1 + Math.sin(impactT * Math.PI) * 0.08;
        ctx.scale(1 / squash, squash);
        drawSeal(ctx, 0, 0, sealR, 1);
        ctx.restore();
      }
      // Phase 3: Glow + rays (15-65%)
      else if (t < 0.65) {
        if (pageContainer) pageContainer.style.transform = '';
        const glowT = (t - 0.15) / 0.5;

        // Wax rays extending outward
        const rayProgress = easeOutCubic(Math.min(glowT * 1.5, 1));
        for (const ray of rays) {
          const len = ray.len * rayProgress * ray.speed;
          const endX = cx + Math.cos(ray.angle) * (sealR + len);
          const endY = cy + Math.sin(ray.angle) * (sealR + len);

          ctx.globalAlpha = 0.3 * (1 - glowT * 0.3);
          ctx.strokeStyle = P.gold;
          ctx.lineWidth = ray.width * (1 - glowT * 0.5);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(
            cx + Math.cos(ray.angle) * sealR * 0.9,
            cy + Math.sin(ray.angle) * sealR * 0.9,
          );
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        // Warm glow behind seal
        ctx.globalAlpha = 0.2 * (1 - glowT * 0.5);
        const glow = ctx.createRadialGradient(cx, cy, sealR * 0.5, cx, cy, sealR * 3);
        glow.addColorStop(0, P.gold);
        glow.addColorStop(0.5, P.amber + '40');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // Seal
        ctx.globalAlpha = 1;
        drawSeal(ctx, cx, cy, sealR, 1);
      }
      // Phase 4: Fade (65-100%)
      else {
        if (pageContainer) pageContainer.style.transform = '';
        const fadeT = (t - 0.65) / 0.35;
        const alpha = 1 - easeOutCubic(fadeT);

        ctx.globalAlpha = alpha;
        drawSeal(ctx, cx, cy, sealR, 1);

        // Fading glow
        ctx.globalAlpha = alpha * 0.15;
        const glow = ctx.createRadialGradient(cx, cy, sealR * 0.5, cx, cy, sealR * 2);
        glow.addColorStop(0, P.gold);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        if (pageContainer) pageContainer.style.transform = '';
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, checkProgress: number) {
  // Wax body
  const grad = ctx.createRadialGradient(x - r * 0.15, y - r * 0.15, 0, x, y, r);
  grad.addColorStop(0, '#D4A050');
  grad.addColorStop(0.5, P.bronze);
  grad.addColorStop(0.85, '#A07830');
  grad.addColorStop(1, '#8B6914');

  ctx.fillStyle = grad;
  ctx.beginPath();

  // Wavy seal edge
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const wobble = r + Math.sin(a * 12) * r * 0.04 + Math.sin(a * 7) * r * 0.02;
    const px = x + Math.cos(a) * wobble;
    const py = y + Math.sin(a) * wobble;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Inner ring
  ctx.strokeStyle = '#C9A040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
  ctx.stroke();

  // Checkmark (embossed look)
  if (checkProgress > 0) {
    const checkSize = r * 0.35;
    const startX = x - checkSize * 0.6;
    const midX = x - checkSize * 0.1;
    const endX = x + checkSize * 0.6;
    const startY = y + checkSize * 0.05;
    const midY = y + checkSize * 0.4;
    const endY = y - checkSize * 0.35;

    // Shadow (emboss dark)
    ctx.strokeStyle = '#7A5810';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX + 1, startY + 1);
    if (checkProgress > 0.5) {
      ctx.lineTo(midX + 1, midY + 1);
      ctx.lineTo(midX + 1 + (endX - midX) * Math.min((checkProgress - 0.5) * 2, 1), midY + 1 + (endY - midY) * Math.min((checkProgress - 0.5) * 2, 1));
    } else {
      ctx.lineTo(startX + 1 + (midX - startX) * checkProgress * 2, startY + 1 + (midY - startY) * checkProgress * 2);
    }
    ctx.stroke();

    // Highlight (emboss light)
    ctx.strokeStyle = '#E8C870';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (checkProgress > 0.5) {
      ctx.lineTo(midX, midY);
      ctx.lineTo(midX + (endX - midX) * Math.min((checkProgress - 0.5) * 2, 1), midY + (endY - midY) * Math.min((checkProgress - 0.5) * 2, 1));
    } else {
      ctx.lineTo(startX + (midX - startX) * checkProgress * 2, startY + (midY - startY) * checkProgress * 2);
    }
    ctx.stroke();
  }
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 3: HANDWRITTEN
//  Text scrawls across viewport center: "done." / "nice." / "got it."
//  Pen-stroke reveal, ink splatter. Dry, warm tone.
//  4 seconds. The journal is talking back.
// ══════════════════════════════════════════════════════════════════════

const PHRASES = ['done.', 'nice.', 'got it.', 'yes.', "that's one.", 'look at you.'];

function handwritten(_origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const phrase = pick(PHRASES);
    const fontSize = Math.min(w * 0.12, 120);
    const totalFrames = 240; // ~4s
    let frame = 0;

    // Pre-measure text
    ctx.font = `italic ${fontSize}px Georgia, serif`;
    const metrics = ctx.measureText(phrase);
    const textW = metrics.width;
    const textX = (w - textW) / 2;
    const textY = h / 2 + fontSize * 0.15;

    // Ink splatters
    interface Splatter { x: number; y: number; r: number; delay: number; }
    const splatters: Splatter[] = [];
    for (let i = 0; i < 8; i++) {
      splatters.push({
        x: textX + rand(-20, textW + 20),
        y: textY + rand(-fontSize * 0.6, fontSize * 0.3),
        r: rand(1.5, 4),
        delay: rand(0.2, 0.6),
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Phase 1: Text reveal (0-50%) — stroke by stroke
      // Phase 2: Hold (50-62%)
      // Phase 3: Fade (62-100%)

      let textAlpha: number;
      let revealProgress: number;

      if (t < 0.5) {
        revealProgress = easeOutQuad(t / 0.5);
        textAlpha = 1;
      } else if (t < 0.625) {
        revealProgress = 1;
        textAlpha = 1;
      } else {
        revealProgress = 1;
        textAlpha = 1 - easeOutCubic((t - 0.625) / 0.375);
      }

      // Draw text with stroke reveal
      ctx.save();
      ctx.font = `italic ${fontSize}px Georgia, serif`;
      ctx.textBaseline = 'alphabetic';

      // Clip to reveal progress
      ctx.beginPath();
      ctx.rect(textX - 10, textY - fontSize, (textW + 20) * revealProgress, fontSize * 1.5);
      ctx.clip();

      // Text shadow (soft)
      ctx.globalAlpha = textAlpha * 0.15;
      ctx.fillStyle = P.ink;
      ctx.fillText(phrase, textX + 2, textY + 2);

      // Main text
      ctx.globalAlpha = textAlpha * 0.7;
      ctx.fillStyle = P.ink;
      ctx.fillText(phrase, textX, textY);

      ctx.restore();

      // Ink splatters
      for (const sp of splatters) {
        if (t < sp.delay) continue;
        const spT = clamp((t - sp.delay) / 0.15, 0, 1);
        const spAlpha = spT * textAlpha * 0.4;
        ctx.globalAlpha = spAlpha;
        ctx.fillStyle = P.ink;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r * easeOutElastic(spT), 0, Math.PI * 2);
        ctx.fill();
      }

      // Pen cursor (visible during writing phase)
      if (t < 0.5) {
        const cursorX = textX + textW * revealProgress;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = P.ink;
        ctx.beginPath();
        ctx.arc(cursorX, textY - fontSize * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 4: PAGE RIPPLE
//  Concentric wave rings expand from checkbox position.
//  Water-drop-in-still-pond feeling. The page itself responds.
//  4 seconds.
// ══════════════════════════════════════════════════════════════════════

function pageRipple(origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxRadius = Math.max(w, h) * 0.8;

    interface Ring {
      startFrame: number;
      color: string;
      maxR: number;
      thickness: number;
    }

    const rings: Ring[] = [];
    for (let i = 0; i < 5; i++) {
      rings.push({
        startFrame: i * 20,
        color: COLORS[i % COLORS.length],
        maxR: maxRadius * rand(0.8, 1),
        thickness: rand(2, 5),
      });
    }

    const totalFrames = 240; // ~4s
    let frame = 0;

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Central bright spot (fades as rings expand)
      if (t < 0.3) {
        const spotT = t / 0.3;
        const spotR = 30 + spotT * 40;
        ctx.globalAlpha = (1 - spotT) * 0.35;
        const spotGrad = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, spotR);
        spotGrad.addColorStop(0, P.warmWhite);
        spotGrad.addColorStop(0.5, P.gold + '60');
        spotGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(origin.x - spotR, origin.y - spotR, spotR * 2, spotR * 2);
      }

      for (const ring of rings) {
        if (frame < ring.startFrame) continue;
        const localFrames = frame - ring.startFrame;
        const localT = localFrames / 160;
        if (localT > 1) continue;

        const r = ring.maxR * easeOutCubic(localT);
        const alpha = (1 - localT) * 0.4;

        // Wave-like opacity modulation
        const wave = Math.sin(localT * Math.PI * 3) * 0.5 + 0.5;

        ctx.globalAlpha = alpha * wave;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.thickness * (1 - localT * 0.7);
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Thin inner echo ring
        ctx.globalAlpha = alpha * 0.3 * wave;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, r * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 5: BRANCH & BLOOM
//  A tree branch grows across the viewport. Leaves unfurl. Flowers
//  bloom at the tips. Organic, slow, alive.
//  6 seconds. Nature responding to your accomplishment.
// ══════════════════════════════════════════════════════════════════════

function branchAndBloom(_origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const startX = -20;
    const startY = h * rand(0.35, 0.65);
    const endX = w * rand(0.7, 0.9);
    const endY = startY + rand(-h * 0.15, h * 0.15);

    // Control points for main branch bezier
    const cp1x = w * 0.25;
    const cp1y = startY + rand(-100, 100);
    const cp2x = w * 0.55;
    const cp2y = endY + rand(-80, 80);

    // Side branches
    interface Branch { t: number; angle: number; len: number; side: number; }
    const sideBranches: Branch[] = [];
    for (let i = 0; i < 6; i++) {
      const bt = rand(0.2, 0.85);
      sideBranches.push({
        t: bt,
        angle: rand(0.3, 1.2) * (Math.random() > 0.5 ? 1 : -1),
        len: rand(40, 100),
        side: Math.random() > 0.5 ? 1 : -1,
      });
    }

    // Leaves
    interface Leaf { t: number; offsetAngle: number; size: number; delay: number; }
    const leaves: Leaf[] = [];
    for (let i = 0; i < 14; i++) {
      leaves.push({
        t: rand(0.15, 0.95),
        offsetAngle: rand(-1.5, 1.5),
        size: rand(6, 14),
        delay: rand(0.45, 0.65),
      });
    }

    // Flowers at branch tips
    interface Flower { t: number; color: string; size: number; petals: number; delay: number; }
    const flowers: Flower[] = [];
    for (let i = 0; i < 4; i++) {
      flowers.push({
        t: rand(0.7, 1),
        color: pick([P.amber, P.rose, P.gold]),
        size: rand(10, 18),
        petals: Math.floor(rand(5, 8)),
        delay: rand(0.6, 0.75),
      });
    }

    const totalFrames = 360; // ~6s
    let frame = 0;

    // Evaluate cubic bezier at parameter t
    function bezierPoint(t: number): Point {
      const mt = 1 - t;
      return {
        x: mt * mt * mt * startX + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * endX,
        y: mt * mt * mt * startY + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * endY,
      };
    }

    // Tangent at parameter t
    function bezierTangent(t: number): Point {
      const mt = 1 - t;
      return {
        x: 3 * mt * mt * (cp1x - startX) + 6 * mt * t * (cp2x - cp1x) + 3 * t * t * (endX - cp2x),
        y: 3 * mt * mt * (cp1y - startY) + 6 * mt * t * (cp2y - cp1y) + 3 * t * t * (endY - cp2y),
      };
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Fade out in last 8%
      const fadeAlpha = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1;
      ctx.globalAlpha = fadeAlpha;

      // Phase 1: Branch growth (0-50%)
      const growProgress = clamp(t / 0.5, 0, 1);
      const branchT = easeInOutCubic(growProgress);

      // Draw main branch
      ctx.strokeStyle = '#6B4226';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const steps = Math.floor(branchT * 60);
      for (let i = 1; i <= steps; i++) {
        const pt = bezierPoint(i / 60);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Thinner highlight on branch
      ctx.strokeStyle = '#8B6340';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY - 1);
      for (let i = 1; i <= steps; i++) {
        const pt = bezierPoint(i / 60);
        ctx.lineTo(pt.x, pt.y - 1);
      }
      ctx.stroke();

      // Side branches
      for (const sb of sideBranches) {
        if (branchT < sb.t) continue;
        const sbProgress = clamp((branchT - sb.t) / 0.15, 0, 1);
        const base = bezierPoint(sb.t);
        const tangent = bezierTangent(sb.t);
        const tangentAngle = Math.atan2(tangent.y, tangent.x);
        const branchAngle = tangentAngle + sb.angle;
        const len = sb.len * easeOutCubic(sbProgress);

        ctx.strokeStyle = '#6B4226';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(base.x + Math.cos(branchAngle) * len, base.y + Math.sin(branchAngle) * len);
        ctx.stroke();
      }

      // Phase 2: Leaves (45-75%)
      for (const leaf of leaves) {
        if (t < leaf.delay) continue;
        if (branchT < leaf.t) continue;
        const leafT = clamp((t - leaf.delay) / 0.15, 0, 1);
        const scale = easeOutElastic(leafT);
        const pt = bezierPoint(leaf.t);
        const tangent = bezierTangent(leaf.t);
        const angle = Math.atan2(tangent.y, tangent.x) + leaf.offsetAngle;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);

        ctx.fillStyle = P.sage;
        ctx.globalAlpha = fadeAlpha * 0.8;
        ctx.beginPath();
        ctx.ellipse(leaf.size * 0.8, 0, leaf.size, leaf.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leaf vein
        ctx.strokeStyle = '#6B8B6B';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(leaf.size * 1.4, 0);
        ctx.stroke();

        ctx.restore();
      }

      // Phase 3: Flowers (60-85%)
      for (const flower of flowers) {
        if (t < flower.delay) continue;
        if (branchT < flower.t) continue;
        const flowerT = clamp((t - flower.delay) / 0.15, 0, 1);
        const scale = easeOutElastic(flowerT);
        const pt = bezierPoint(flower.t);

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = fadeAlpha;

        // Petals
        for (let p = 0; p < flower.petals; p++) {
          const petalAngle = (p / flower.petals) * Math.PI * 2;
          ctx.fillStyle = flower.color;
          ctx.globalAlpha = fadeAlpha * 0.7;
          ctx.beginPath();
          ctx.ellipse(
            Math.cos(petalAngle) * flower.size * 0.5,
            Math.sin(petalAngle) * flower.size * 0.5,
            flower.size * 0.4,
            flower.size * 0.2,
            petalAngle,
            0, Math.PI * 2,
          );
          ctx.fill();
        }

        // Center
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = P.gold;
        ctx.beginPath();
        ctx.arc(0, 0, flower.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 6: SUNRISE WASH
//  Golden light rises from bottom, washing over everything.
//  Lens flare blooms at the horizon. Warm, expansive.
//  5 seconds.
// ══════════════════════════════════════════════════════════════════════

function sunriseWash(_origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const totalFrames = 300; // ~5s
    let frame = 0;

    // Lens flare elements
    const flares: { x: number; y: number; r: number; color: string; delay: number }[] = [];
    for (let i = 0; i < 6; i++) {
      flares.push({
        x: w * rand(0.3, 0.7),
        y: h * rand(0.4, 0.55),
        r: rand(20, 80),
        color: pick([P.gold, P.amber, P.warmWhite]),
        delay: rand(0.3, 0.45),
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Phase 1: Rising gradient (0-40%)
      // Phase 2: Lens flare at horizon (30-60%)
      // Phase 3: Hold at peak (60-80%)
      // Phase 4: Fade (80-100%)

      let masterAlpha: number;
      if (t < 0.4) masterAlpha = easeOutCubic(t / 0.4);
      else if (t < 0.8) masterAlpha = 1;
      else masterAlpha = 1 - easeOutCubic((t - 0.8) / 0.2);

      // Rising gradient
      const riseProgress = clamp(t / 0.4, 0, 1);
      const gradientTop = h - (h * 1.2 * easeOutCubic(riseProgress));

      const grad = ctx.createLinearGradient(0, gradientTop + h * 0.6, 0, gradientTop);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.3, P.deepAmber + Math.round(masterAlpha * 0.12 * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(0.6, P.gold + Math.round(masterAlpha * 0.15 * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(0.85, P.warmWhite + Math.round(masterAlpha * 0.1 * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Horizon glow line
      if (t > 0.15 && t < 0.85) {
        const horizonY = h * 0.5;
        const horizonAlpha = masterAlpha * 0.2;
        const horizonGrad = ctx.createRadialGradient(w / 2, horizonY, 0, w / 2, horizonY, w * 0.5);
        horizonGrad.addColorStop(0, P.gold + Math.round(horizonAlpha * 255).toString(16).padStart(2, '0'));
        horizonGrad.addColorStop(0.5, P.amber + Math.round(horizonAlpha * 0.5 * 255).toString(16).padStart(2, '0'));
        horizonGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, horizonY - 60, w, 120);
      }

      // Lens flare
      ctx.globalCompositeOperation = 'lighter';
      for (const flare of flares) {
        if (t < flare.delay) continue;
        const flareT = clamp((t - flare.delay) / 0.2, 0, 1);
        const flareAlpha = masterAlpha * easeOutCubic(flareT) * 0.15;

        ctx.globalAlpha = flareAlpha;
        const flareGrad = ctx.createRadialGradient(flare.x, flare.y, 0, flare.x, flare.y, flare.r);
        flareGrad.addColorStop(0, flare.color);
        flareGrad.addColorStop(0.3, flare.color + '80');
        flareGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = flareGrad;
        ctx.fillRect(flare.x - flare.r, flare.y - flare.r, flare.r * 2, flare.r * 2);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 7: SEED SCATTER
//  Seeds burst up, arc across screen, sprouts grow where they land.
//  5 seconds. Growth from your accomplishment.
// ══════════════════════════════════════════════════════════════════════

function seedScatter(origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;

    interface Seed {
      x: number; y: number;
      vx: number; vy: number;
      landed: boolean;
      landX: number;
      rotation: number;
    }

    const seeds: Seed[] = [];
    const seedCount = 7;
    for (let i = 0; i < seedCount; i++) {
      seeds.push({
        x: origin.x,
        y: origin.y,
        vx: rand(-4, 4) + (i - seedCount / 2) * 1.5,
        vy: rand(-12, -8),
        landed: false,
        landX: 0,
        rotation: rand(0, Math.PI * 2),
      });
    }

    interface Sprout {
      x: number;
      startFrame: number;
      height: number;
      leanAngle: number;
      leafSize: number;
    }
    const sprouts: Sprout[] = [];

    const totalFrames = 300; // ~5s
    let frame = 0;
    const gravity = 0.15;
    const groundY = h - 40;

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Fade out in last 30%
      const fadeAlpha = t > 0.7 ? 1 - easeOutCubic((t - 0.7) / 0.3) : 1;

      // Update seeds
      for (const seed of seeds) {
        if (seed.landed) continue;
        seed.vy += gravity;
        seed.x += seed.vx;
        seed.y += seed.vy;
        seed.rotation += 0.08;

        if (seed.y >= groundY) {
          seed.landed = true;
          seed.landX = seed.x;
          sprouts.push({
            x: seed.x,
            startFrame: frame,
            height: rand(30, 70),
            leanAngle: rand(-0.15, 0.15),
            leafSize: rand(6, 12),
          });
        }
      }

      // Draw flying seeds
      for (const seed of seeds) {
        if (seed.landed) continue;
        ctx.save();
        ctx.translate(seed.x, seed.y);
        ctx.rotate(seed.rotation);
        ctx.globalAlpha = fadeAlpha;

        // Seed shape (teardrop)
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Draw sprouts
      for (const sprout of sprouts) {
        const sproutAge = frame - sprout.startFrame;
        const sproutT = clamp(sproutAge / 80, 0, 1);
        const growEase = easeOutElastic(sproutT);
        const currentHeight = sprout.height * growEase;

        ctx.save();
        ctx.translate(sprout.x, groundY);
        ctx.rotate(sprout.leanAngle);
        ctx.globalAlpha = fadeAlpha;

        // Stem
        ctx.strokeStyle = '#5A8A5A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);

        // Slight curve in stem
        const stemCurve = Math.sin(sproutT * Math.PI) * 5;
        ctx.quadraticCurveTo(stemCurve, -currentHeight * 0.5, 0, -currentHeight);
        ctx.stroke();

        // Two leaves
        if (sproutT > 0.3) {
          const leafProgress = clamp((sproutT - 0.3) / 0.4, 0, 1);
          const leafScale = easeOutElastic(leafProgress);
          const leafY = -currentHeight * 0.6;

          // Left leaf
          ctx.save();
          ctx.translate(-2, leafY);
          ctx.rotate(-0.4);
          ctx.scale(leafScale, leafScale);
          ctx.fillStyle = P.sage;
          ctx.beginPath();
          ctx.ellipse(0, 0, sprout.leafSize, sprout.leafSize * 0.4, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Right leaf
          ctx.save();
          ctx.translate(2, leafY - 5);
          ctx.rotate(0.4);
          ctx.scale(leafScale, leafScale);
          ctx.fillStyle = P.sage;
          ctx.beginPath();
          ctx.ellipse(0, 0, sprout.leafSize * 0.8, sprout.leafSize * 0.35, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Gentle sway
        if (sproutT > 0.8) {
          const sway = Math.sin(frame * 0.03 + sprout.x) * 2;
          ctx.translate(sway, 0);
        }

        ctx.restore();
      }

      // Ground line
      ctx.globalAlpha = fadeAlpha * 0.1;
      ctx.strokeStyle = P.bronze;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 2);
      ctx.lineTo(w, groundY + 2);
      ctx.stroke();

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  EFFECT 8: GOLDEN RAIN
//  Soft golden droplets fall across the entire viewport.
//  Each drop leaves a ripple-glow where it lands.
//  6 seconds. Meditative, calming, ambient.
// ══════════════════════════════════════════════════════════════════════

function goldenRain(_origin: Point): Promise<void> {
  return new Promise(resolve => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    const w = window.innerWidth;
    const h = window.innerHeight;

    interface Drop {
      x: number; y: number;
      speed: number;
      size: number;
      color: string;
      windDrift: number;
    }

    interface Ripple {
      x: number; y: number;
      frame: number;
      maxR: number;
      color: string;
    }

    const drops: Drop[] = [];
    const ripples: Ripple[] = [];

    const totalFrames = 360; // ~6s
    let frame = 0;

    function spawnDrop() {
      drops.push({
        x: rand(-20, w + 20),
        y: rand(-30, -10),
        speed: rand(2, 4.5),
        size: rand(1.5, 3),
        color: pick([P.gold, P.amber, P.bronze, P.warmWhite]),
        windDrift: rand(-0.3, 0.3),
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      frame++;
      const t = frame / totalFrames;

      // Spawn rate: sparse → dense → sparse
      let spawnRate: number;
      if (t < 0.17) spawnRate = t / 0.17;
      else if (t < 0.58) spawnRate = 1;
      else if (t < 0.83) spawnRate = 1 - (t - 0.58) / 0.25;
      else spawnRate = 0;

      if (Math.random() < spawnRate * 0.35) spawnDrop();

      // Fade everything in last 17%
      const masterFade = t > 0.83 ? 1 - (t - 0.83) / 0.17 : 1;

      // Update & draw drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        drop.y += drop.speed;
        drop.x += drop.windDrift;

        if (drop.y > h - 10) {
          // Create ripple at landing point
          ripples.push({
            x: drop.x,
            y: h - 10,
            frame: 0,
            maxR: rand(15, 30),
            color: drop.color,
          });
          drops.splice(i, 1);
          continue;
        }

        // Draw drop (elongated teardrop)
        ctx.globalAlpha = masterFade * 0.6;
        ctx.fillStyle = drop.color;
        ctx.beginPath();
        ctx.ellipse(drop.x, drop.y, drop.size * 0.6, drop.size * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle trail
        ctx.globalAlpha = masterFade * 0.15;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y - drop.size * 2);
        ctx.lineTo(drop.x, drop.y - drop.size * 6);
        ctx.strokeStyle = drop.color;
        ctx.lineWidth = drop.size * 0.4;
        ctx.stroke();
      }

      // Update & draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.frame++;
        const ripT = rip.frame / 50;
        if (ripT > 1) { ripples.splice(i, 1); continue; }

        const r = rip.maxR * easeOutCubic(ripT);
        const alpha = (1 - ripT) * 0.3 * masterFade;

        // Ripple ring
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = rip.color;
        ctx.lineWidth = 1.5 * (1 - ripT);
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Center glow
        ctx.globalAlpha = alpha * 0.5;
        const ripGlow = ctx.createRadialGradient(rip.x, rip.y, 0, rip.x, rip.y, r * 0.5);
        ripGlow.addColorStop(0, rip.color);
        ripGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = ripGlow;
        ctx.fillRect(rip.x - r, rip.y - r, r * 2, r * 2);
      }

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}


// ══════════════════════════════════════════════════════════════════════
//  QUEUE SYSTEM & PUBLIC API
// ══════════════════════════════════════════════════════════════════════

type EffectFn = (origin: Point) => Promise<void>;

const effects: EffectFn[] = [
  inkBloom,
  waxSeal,
  handwritten,
  pageRipple,
  branchAndBloom,
  sunriseWash,
  seedScatter,
  goldenRain,
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

    // Queue the full-screen celebration
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
