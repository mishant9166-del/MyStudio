import React, {
  useEffect,
  useRef
} from 'react';

import {
  drawLowerThird
} from './LowerThirdRenderer';


// ============================================================
// LOWER THIRD THEMES
// ============================================================

export const LOWER_THIRD_THEMES = [
  {
    id: 'theme-cyan',
    name: 'Modern Cyan'
  },
  {
    id: 'theme-dark',
    name: 'Minimal Dark'
  },
  {
    id: 'theme-orange',
    name: 'Broadcast Orange'
  },
  {
    id: 'theme-green',
    name: 'News Green'
  },
  {
    id: 'theme-red',
    name: 'Breaking Red'
  }
];


// ============================================================
// PREVIEW
// ============================================================

export const renderThemePreview = (
  theme: string
) => {

  return (
    <ThemeThumbnail
      theme={theme}
    />
  );
};


// ============================================================
// THUMBNAIL COMPONENT
// ============================================================

const ThemeThumbnail: React.FC<{
  theme: string;
}> = ({ theme }) => {

  const canvasRef =
    useRef<HTMLCanvasElement>(null);


  useEffect(() => {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }


    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return;
    }


    // ========================================================
    // USE THE SAME ASPECT RATIO AS THE REAL DESIGN
    // ========================================================

    const WIDTH = 960;
    const HEIGHT = 230;


    // ========================================================
    // DEVICE PIXEL RATIO
    // ========================================================

    const dpr =
      window.devicePixelRatio || 1;


    canvas.width =
      WIDTH * dpr;

    canvas.height =
      HEIGHT * dpr;


    canvas.style.width =
      '100%';

    canvas.style.height =
      '100%';


    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );


    // ========================================================
    // CLEAR
    // ========================================================

    ctx.clearRect(
      0,
      0,
      WIDTH,
      HEIGHT
    );


    // ========================================================
    // SOURCE
    // ========================================================

    const mockSource = {
      type: 'lower-third',
      theme,
      title: 'Title',
      subtitle: 'Subtitle'
    } as any;


    // ========================================================
    // DRAW
    // ========================================================

    drawLowerThird(
      ctx,
      mockSource,
      0,
      0,
      WIDTH,
      HEIGHT,
      true
    );

  }, [theme]);


  return (
    <div
      className="
        w-full
        h-10
        overflow-hidden
        rounded-sm
        bg-[#1e293b]
        flex
        items-center
        justify-center
      "
    >

      <canvas
        ref={canvasRef}
        className="
          block
          w-full
          h-full
          object-contain
        "
      />

    </div>
  );
};