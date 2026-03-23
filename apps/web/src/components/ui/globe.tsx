'use client';

import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';

interface EarthProps {
  className?: string;
  theta?: number;
  dark?: number;
  scale?: number;
  diffuse?: number;
  mapSamples?: number;
  mapBrightness?: number;
  baseColor?: [number, number, number];
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
}

const Earth: React.FC<EarthProps> = ({
  className,
  theta = 0.25,
  dark = 1,
  scale = 1.1,
  diffuse = 1.2,
  mapSamples = 40000,
  mapBrightness = 6,
  baseColor = [0.4, 0.6509, 1],
  markerColor = [1, 0, 0],
  glowColor = [0.2745, 0.5765, 0.898],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let animationId: number;
    let globe: ReturnType<typeof createGlobe> | null = null;

    const initGlobe = () => {
      const width = canvas.offsetWidth;
      if (width === 0) {
        // Canvas not laid out yet, retry next frame
        animationId = requestAnimationFrame(initGlobe);
        return;
      }

      // Set canvas pixel dimensions explicitly
      canvas.width = width * 2;
      canvas.height = width * 2;

      globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta,
        dark,
        scale,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        opacity: 1,
        offset: [0, 0],
        markers: [],
      });

      // Animate rotation using cobe v2 update() API
      const animate = () => {
        phi += 0.003;
        globe?.update({ phi });
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    };

    initGlobe();

    return () => {
      cancelAnimationFrame(animationId);
      globe?.destroy();
    };
  }, [theta, dark, scale, diffuse, mapSamples, mapBrightness, baseColor, markerColor, glowColor]);

  return (
    <div
      className={cn(
        'z-[10] mx-auto flex w-full max-w-[350px] items-center justify-center',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          aspectRatio: '1',
        }}
      />
    </div>
  );
};

export default Earth;
