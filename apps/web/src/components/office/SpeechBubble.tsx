import { memo, useCallback, useRef, useEffect } from 'react';
import type { Container as PixiContainer, Graphics as PixiGraphics } from 'pixi.js';
import gsap from 'gsap';
import type { BubbleType } from '../../stores/bubble-store.js';

interface SpeechBubbleProps {
  text: string;
  type: BubbleType;
  x: number;
  y: number;
}

const TYPE_COLORS: Record<BubbleType, number> = {
  thought: 0x2a2a3e,
  speech: 0x1a3a5c,
  status: 0x2a2a3e,
};

const TYPE_BORDER: Record<BubbleType, number> = {
  thought: 0x6366f1,
  speech: 0x38bdf8,
  status: 0x8b5cf6,
};

const MAX_CHARS = 60;

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS - 1) + '\u2026' : text;
}

export const SpeechBubble = memo(function SpeechBubble({ text, type, x, y }: SpeechBubbleProps) {
  const containerRef = useRef<PixiContainer>(null);

  const displayText = truncate(text);

  // Approximate bubble width based on text length
  const textWidth = Math.min(displayText.length * 5.5, 180);
  const paddingX = 10;
  const paddingY = 6;
  const bubbleWidth = Math.max(textWidth + paddingX * 2, 50);
  const bubbleHeight = 22;
  const pointerSize = 5;
  const borderRadius = 6;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.alpha = 0;
    container.scale.set(0.5);

    const tween = gsap.to(container, {
      alpha: 1,
      pixi: { scaleX: 1, scaleY: 1 },
      duration: 0.3,
      ease: 'back.out(1.7)',
    });

    return () => { tween.kill(); };
  }, []);

  const bgColor = TYPE_COLORS[type];
  const borderColor = TYPE_BORDER[type];

  const drawBubble = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      const left = -bubbleWidth / 2;
      const top = -bubbleHeight - pointerSize;

      // Rounded rect background
      g.roundRect(left, top, bubbleWidth, bubbleHeight, borderRadius);
      g.fill({ color: bgColor, alpha: 0.92 });
      g.stroke({ color: borderColor, width: 1, alpha: 0.6 });

      // Pointer triangle
      g.moveTo(-pointerSize, -pointerSize);
      g.lineTo(0, 2);
      g.lineTo(pointerSize, -pointerSize);
      g.fill({ color: bgColor, alpha: 0.92 });
    },
    [bubbleWidth, bubbleHeight, bgColor, borderColor],
  );

  const prefix = type === 'thought' ? '\u{1F4AD} ' : type === 'speech' ? '\u{1F4AC} ' : '';

  return (
    <pixiContainer ref={containerRef} x={x} y={y}>
      <pixiGraphics draw={drawBubble} />
      <pixiText
        text={prefix + displayText}
        anchor={{ x: 0.5, y: 1 }}
        x={0}
        y={-pointerSize - paddingY / 2}
        style={{
          fontSize: 9,
          fill: '#e0e0e0',
          fontFamily: 'Arial',
          wordWrap: true,
          wordWrapWidth: bubbleWidth - paddingX * 2,
        }}
      />
    </pixiContainer>
  );
});
