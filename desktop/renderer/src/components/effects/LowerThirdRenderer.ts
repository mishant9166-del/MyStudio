import type { LowerThirdSource } from '../../../../../shared/types';

export const drawLowerThird = (
  ctx: CanvasRenderingContext2D,
  source: LowerThirdSource,
  x: number,
  y: number,
  w: number,
  h: number,
  hideText: boolean = false
) => {
  ctx.save();

  // ============================================================
  // THEME 1 — MODERN CYAN
  // ============================================================

  if (source.theme === 'theme-cyan') {

    /*
     * ==========================================================
     * REFERENCE DESIGN
     * ==========================================================
     *
     * Reference coordinate system:
     *
     * Width  = 960
     * Height = 230
     *
     * Main cyan panel:
     *
     *       78,59 ─────────────────────────────── 904,59
     *          ╲                                  ╱
     *           ╲                                ╱
     *            40,116 ───────────────────── 869,116
     *
     *
     * Silver panel:
     *
     *       50,116 ─────────────────── 755,116
     *          ╲                         ╲
     *           ╲                         700,160
     *            ╲───────────────────────╱
     *
     * Flare:
     *                         ✦
     *                       ~700,116
     *
     * ==========================================================
     */


    // ----------------------------------------------------------
    // REFERENCE SIZE
    // ----------------------------------------------------------

    const REF_W = 960;
    const REF_H = 230;

    const sx = w / REF_W;
    const sy = h / REF_H;

    // Keep geometry proportional.
    const s = Math.min(sx, sy);

    const X = (v: number) => x + v * sx;
    const Y = (v: number) => y + v * sy;


    // ==========================================================
    // HELPER: DRAW PATH
    // ==========================================================

    const path = (
      points: Array<[number, number]>,
      c: CanvasRenderingContext2D = ctx
    ) => {
      c.beginPath();
      points.forEach(
        ([px, py], index) => {
          if (index === 0) {
            c.moveTo(X(px), Y(py));
          } else {
            c.lineTo(X(px), Y(py));
          }
        }
      );
      c.closePath();
    };

    // ==========================================================
    // HELPER: CLIPPED GRADIENT
    // ==========================================================

    const fillPathWithGradient = (
      points: Array<[number, number]>,
      gradient: CanvasGradient,
      c: CanvasRenderingContext2D = ctx
    ) => {
      path(points, c);
      c.fillStyle = gradient;
      c.fill();
    };

    const drawBackground = (c: CanvasRenderingContext2D) => {
      // 2. MAIN CYAN / TURQUOISE PANEL
      c.save();
      c.globalAlpha = 0.8;
      const cyanPoints: Array<[number, number]> = [[78, 59], [904, 59], [869, 116], [40, 116]];
      const cyanGradient = c.createLinearGradient(X(35), Y(0), X(905), Y(0));
      cyanGradient.addColorStop(0, '#38BDF8');
      cyanGradient.addColorStop(0.5, '#34D399');
      cyanGradient.addColorStop(1, 'rgba(15, 118, 110, 0.8)');
      fillPathWithGradient(cyanPoints, cyanGradient, c);

      // 3. BLUE LEFT WEDGE
      c.save();
      const blueWedge: Array<[number, number]> = [[78, 59], [190, 59], [148, 116], [40, 116]];
      const blueGradient = c.createLinearGradient(X(35), Y(60), X(195), Y(115));
      blueGradient.addColorStop(0, '#2563EB');
      blueGradient.addColorStop(0.5, '#3B82F6');
      blueGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      fillPathWithGradient(blueWedge, blueGradient, c);
      c.restore();

      // 4. TOP GLASS HIGHLIGHT
      c.save();
      const topHighlight: Array<[number, number]> = [[78, 59], [904, 59], [888, 66], [73, 66]];
      const topGlass = c.createLinearGradient(X(0), Y(59), X(0), Y(70));
      topGlass.addColorStop(0, 'rgba(255,255,255,0.52)');
      topGlass.addColorStop(0.5, 'rgba(255,255,255,0.22)');
      topGlass.addColorStop(1, 'rgba(255,255,255,0)');
      fillPathWithGradient(topHighlight, topGlass, c);
      c.restore();

      // 5. LARGE TRANSPARENT GLASS REFLECTION
      c.save();
      const reflection: Array<[number, number]> = [[190, 60], [625, 60], [570, 116], [142, 116]];
      const reflectionGradient = c.createLinearGradient(X(100), Y(60), X(650), Y(116));
      reflectionGradient.addColorStop(0, 'rgba(255,255,255,0.22)');
      reflectionGradient.addColorStop(0.35, 'rgba(255,255,255,0.10)');
      reflectionGradient.addColorStop(0.65, 'rgba(255,255,255,0.025)');
      reflectionGradient.addColorStop(1, 'rgba(255,255,255,0)');
      fillPathWithGradient(reflection, reflectionGradient, c);
      c.restore();

      // 6. VERY SUBTLE DIAGONAL GLASS LINE
      c.save();
      c.beginPath();
      c.moveTo(X(550), Y(61));
      c.lineTo(X(870), Y(61));
      c.lineTo(X(840), Y(112));
      c.lineTo(X(520), Y(112));
      c.closePath();
      const glassFade = c.createLinearGradient(X(520), Y(60), X(870), Y(115));
      glassFade.addColorStop(0, 'rgba(255,255,255,0)');
      glassFade.addColorStop(0.55, 'rgba(255,255,255,0.025)');
      glassFade.addColorStop(1, 'rgba(255,255,255,0.14)');
      c.fillStyle = glassFade;
      c.fill();
      c.restore();

      // 8. SILVER / WHITE LOWER PANEL
      const silverPoints: Array<[number, number]> = [[50, 116], [755, 116], [700, 160], [38, 160]];
      c.save();
      const silverGradient = c.createLinearGradient(X(0), Y(114), X(0), Y(165));
      silverGradient.addColorStop(0, '#FFFFFF');
      silverGradient.addColorStop(0.16, '#F9FBFC');
      silverGradient.addColorStop(0.38, '#E9EFF2');
      silverGradient.addColorStop(0.60, '#D4DDE1');
      silverGradient.addColorStop(0.82, '#B9C5CA');
      silverGradient.addColorStop(1, '#9BA9AF');
      fillPathWithGradient(silverPoints, silverGradient, c);
      c.restore();
      
      c.restore(); // Restore globalAlpha from section 2
    };

    // --- PROGRESSIVE BLUR RENDERING ---
    if (typeof document !== 'undefined') {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.ceil(w) || 1920;
      offCanvas.height = Math.ceil(h) || 1080;
      const offCtx = offCanvas.getContext('2d');
      
      if (offCtx) {
        offCtx.translate(-x, -y);
        drawBackground(offCtx);
        
        ctx.save();
        ctx.filter = `blur(${16 * s}px)`;
        ctx.drawImage(offCanvas, x, y);
        ctx.restore();
        
        offCtx.save();
        offCtx.setTransform(1, 0, 0, 1, 0, 0);
        offCtx.globalCompositeOperation = 'destination-out';
        
        const maskXStart = w * 0.45;
        const maskXEnd = w * 0.85;
        const mask = offCtx.createLinearGradient(maskXStart, 0, maskXEnd, 0);
        mask.addColorStop(0, 'rgba(0,0,0,0)');
        mask.addColorStop(1, 'rgba(0,0,0,1)');
        
        offCtx.fillStyle = mask;
        offCtx.fillRect(0, 0, w, h);
        offCtx.restore();
        
        ctx.drawImage(offCanvas, x, y);
      } else {
        drawBackground(ctx);
      }
    } else {
      drawBackground(ctx);
    }

    // ==========================================================
    // 12. LIGHT FLARE
    // ==========================================================

    ctx.restore(); // Restore globalAlpha

    const flareX =
      X(700);

    const flareY =
      Y(116);

    ctx.save();

    ctx.globalCompositeOperation =
      'screen';

    const flareRadius =
      42 * s;

    const flare =
      ctx.createRadialGradient(
        flareX,
        flareY,
        0,
        flareX,
        flareY,
        flareRadius
      );

    flare.addColorStop(
      0,
      'rgba(255,255,255,1)'
    );

    flare.addColorStop(
      0.06,
      'rgba(255,255,255,0.98)'
    );

    flare.addColorStop(
      0.15,
      'rgba(255,255,255,0.65)'
    );

    flare.addColorStop(
      0.35,
      'rgba(210,245,255,0.20)'
    );

    flare.addColorStop(
      0.70,
      'rgba(170,235,255,0.06)'
    );

    flare.addColorStop(
      1,
      'rgba(255,255,255,0)'
    );

    ctx.fillStyle =
      flare;

    ctx.beginPath();

    ctx.arc(
      flareX,
      flareY,
      flareRadius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    // ==========================================================
    // 13. HORIZONTAL FLARE STREAK
    // ==========================================================

    ctx.save();

    ctx.globalCompositeOperation =
      'screen';

    const horizontal =
      ctx.createLinearGradient(
        X(200),
        flareY,
        X(930),
        flareY
      );

    horizontal.addColorStop(
      0,
      'rgba(255,255,255,0)'
    );

    horizontal.addColorStop(
      0.55,
      'rgba(255,255,255,0.05)'
    );

    horizontal.addColorStop(
      0.67,
      'rgba(255,255,255,0.88)'
    );

    horizontal.addColorStop(
      0.69,
      'rgba(255,255,255,0.90)'
    );

    horizontal.addColorStop(
      0.75,
      'rgba(255,255,255,0.12)'
    );

    horizontal.addColorStop(
      1,
      'rgba(255,255,255,0)'
    );

    ctx.fillStyle =
      horizontal;

    ctx.fillRect(
      X(180),
      flareY - 1 * s,
      750 * sx,
      2 * sy
    );

    ctx.restore();


    // ==========================================================
    // 14. VERTICAL FLARE STREAK
    // ==========================================================

    ctx.save();

    ctx.globalCompositeOperation =
      'screen';

    const vertical =
      ctx.createLinearGradient(
        flareX,
        Y(75),
        flareX,
        Y(155)
      );

    vertical.addColorStop(
      0,
      'rgba(255,255,255,0)'
    );

    vertical.addColorStop(
      0.40,
      'rgba(255,255,255,0)'
    );

    vertical.addColorStop(
      0.50,
      'rgba(255,255,255,0.90)'
    );

    vertical.addColorStop(
      0.60,
      'rgba(255,255,255,0)'
    );

    vertical.addColorStop(
      1,
      'rgba(255,255,255,0)'
    );

    ctx.fillStyle =
      vertical;

    ctx.fillRect(
      flareX - 0.7 * s,
      Y(70),
      1.4 * s,
      Y(165) - Y(70)
    );

    ctx.restore();


    // ==========================================================
    // 15. DIAGONAL FLARE
    // ==========================================================

    ctx.save();

    ctx.globalCompositeOperation =
      'screen';

    ctx.translate(
      flareX,
      flareY
    );

    ctx.rotate(
      -8 * Math.PI / 180
    );

    const diagonal =
      ctx.createLinearGradient(
        -280 * s,
        0,
        170 * s,
        0
      );

    diagonal.addColorStop(
      0,
      'rgba(255,255,255,0)'
    );

    diagonal.addColorStop(
      0.43,
      'rgba(255,255,255,0)'
    );

    diagonal.addColorStop(
      0.50,
      'rgba(255,255,255,0.80)'
    );

    diagonal.addColorStop(
      0.56,
      'rgba(255,255,255,0)'
    );

    diagonal.addColorStop(
      1,
      'rgba(255,255,255,0)'
    );

    ctx.fillStyle =
      diagonal;

    ctx.fillRect(
      -280 * s,
      -1 * s,
      450 * s,
      2 * s
    );

    ctx.restore();


    // ==========================================================
    // 16. FLARE CENTER
    // ==========================================================

    ctx.save();

    ctx.globalCompositeOperation =
      'screen';

    ctx.fillStyle =
      '#FFFFFF';

    ctx.beginPath();

    ctx.arc(
      flareX,
      flareY,
      Math.max(
        2,
        3 * s
      ),
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    // ==========================================================
    // 17. TITLE
    // ==========================================================

    if (!hideText) {

      ctx.save();

      ctx.textBaseline =
        'middle';

      ctx.fillStyle =
        '#FFFFFF';

      ctx.font =
        `700 ${Math.max(
          24,
          52 * s
        )}px "Segoe UI", Arial, sans-serif`;

      ctx.fillText(
        source.title || 'Title',
        X(79),
        Y(91)
      );

      ctx.restore();


      // ========================================================
      // 18. SUBTITLE
      // ========================================================

      ctx.save();

      ctx.textBaseline =
        'middle';

      ctx.fillStyle =
        '#334155';

      ctx.font =
        `400 ${Math.max(
          16,
          32 * s
        )}px "Segoe UI", Arial, sans-serif`;

      ctx.fillText(
        source.subtitle || 'Subtitle',
        X(64),
        Y(137)
      );

      ctx.restore();
    }
  }


  // ============================================================
  // THEME 2 — MINIMAL DARK
  // ============================================================

  else if (source.theme === 'theme-dark') {

    ctx.fillStyle = '#2a2e33';

    ctx.fillRect(
      x,
      y,
      w,
      h * 0.6
    );

    ctx.fillStyle = '#3a3f44';

    ctx.fillRect(
      x,
      y + h * 0.6,
      w,
      h * 0.4
    );

    if (!hideText) {

      ctx.fillStyle = '#ffffff';

      ctx.font =
        `bold ${h * 0.3}px Arial`;

      ctx.textBaseline =
        'middle';

      ctx.fillText(
        source.title,
        x + 20,
        y + h * 0.3
      );

      ctx.fillStyle =
        '#e2e8f0';

      ctx.font =
        `${h * 0.2}px Arial`;

      ctx.fillText(
        source.subtitle,
        x + 20,
        y + h * 0.8
      );
    }
  }


  // ============================================================
  // THEME 3 — BROADCAST ORANGE
  // ============================================================

  else if (source.theme === 'theme-orange') {

    ctx.fillStyle =
      '#2a2e33';

    ctx.beginPath();

    ctx.moveTo(
      x + 20,
      y
    );

    ctx.lineTo(
      x + w,
      y
    );

    ctx.lineTo(
      x + w - 20,
      y + h * 0.6
    );

    ctx.lineTo(
      x,
      y + h * 0.6
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
      '#ffb74d';

    ctx.beginPath();

    ctx.moveTo(
      x + 10,
      y + h * 0.6
    );

    ctx.lineTo(
      x + w * 0.85,
      y + h * 0.6
    );

    ctx.lineTo(
      x + w * 0.85 - 15,
      y + h
    );

    ctx.lineTo(
      x - 5,
      y + h
    );

    ctx.closePath();

    ctx.fill();


    if (!hideText) {

      ctx.fillStyle =
        '#ffffff';

      ctx.font =
        `bold ${h * 0.3}px Arial`;

      ctx.textBaseline =
        'middle';

      ctx.fillText(
        source.title,
        x + 40,
        y + h * 0.3
      );

      ctx.fillStyle =
        '#1e293b';

      ctx.font =
        `${h * 0.2}px Arial`;

      ctx.fillText(
        source.subtitle,
        x + 30,
        y + h * 0.8
      );
    }
  }


  // ============================================================
  // THEME 4 — NEWS GREEN
  // ============================================================

  else if (source.theme === 'theme-green') {

    ctx.fillStyle =
      '#2a2e33';

    ctx.fillRect(
      x,
      y,
      w,
      h
    );

    ctx.fillStyle =
      '#4caf50';

    ctx.fillRect(
      x,
      y,
      10,
      h
    );


    if (!hideText) {

      ctx.fillStyle =
        '#ffffff';

      ctx.font =
        `bold ${h * 0.3}px Arial`;

      ctx.textBaseline =
        'middle';

      ctx.fillText(
        source.title,
        x + 30,
        y + h * 0.3
      );

      ctx.fillStyle =
        '#cbd5e1';

      ctx.font =
        `${h * 0.2}px Arial`;

      ctx.fillText(
        source.subtitle,
        x + 30,
        y + h * 0.7
      );
    }
  }


  // ============================================================
  // THEME 5 — BREAKING RED
  // ============================================================

  else if (source.theme === 'theme-red') {

    ctx.fillStyle =
      '#2a2e33';

    ctx.fillRect(
      x,
      y,
      w,
      h
    );

    ctx.fillStyle =
      '#ef4444';

    ctx.fillRect(
      x,
      y,
      10,
      h
    );


    if (!hideText) {

      ctx.fillStyle =
        '#ffffff';

      ctx.font =
        `bold ${h * 0.3}px Arial`;

      ctx.textBaseline =
        'middle';

      ctx.fillText(
        source.title,
        x + 30,
        y + h * 0.3
      );

      ctx.fillStyle =
        '#cbd5e1';

      ctx.font =
        `${h * 0.2}px Arial`;

      ctx.fillText(
        source.subtitle,
        x + 30,
        y + h * 0.7
      );
    }
  }

  ctx.restore();
};