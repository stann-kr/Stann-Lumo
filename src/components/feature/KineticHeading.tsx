'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './KineticHeading.module.css';

gsap.registerPlugin(useGSAP);

interface KineticHeadingProps {
  title: string;
  extra?: string[];
}

export default function KineticHeading({ title, extra }: KineticHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lines = [title, ...(extra ?? [])];
  const label = lines.join(' ');

  useGSAP(() => {
    if (!window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const glyphs = headingRef.current?.querySelectorAll('[data-glyph]');
      if (!glyphs?.length) return;
      gsap.fromTo(glyphs, {
        yPercent: 115,
        rotation: (index: number) => index % 2 ? 7 : -5,
        skewX: -9,
      }, {
        yPercent: 0,
        rotation: 0,
        skewX: 0,
        duration: 0.95,
        stagger: { amount: Math.min(glyphs.length * 0.022, 0.38), from: 'start' },
        ease: 'expo.out',
        clearProps: 'transform',
      });
    }, headingRef);
    return () => media.revert();
  }, { scope: headingRef, dependencies: [label], revertOnUpdate: true });

  return (
    <h1 ref={headingRef} aria-label={label}>
      {lines.map((line, lineIndex) => (
        <span className={styles.line} aria-hidden="true" key={lineIndex}>
          {line.split(/(\s+)/).map((word, wordIndex) => /^\s+$/.test(word) ? word : (
            <span className={styles.word} key={wordIndex}>
              {Array.from(word).map((glyph, glyphIndex) => (
                <span className={styles.glyph} data-glyph key={glyphIndex}>{glyph}</span>
              ))}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
