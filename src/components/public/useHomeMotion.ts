'use client';

import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useContentMotion } from '../feature/useContentMotion';

gsap.registerPlugin(useGSAP);

export function useHomeMotion(rootRef: RefObject<HTMLDivElement | null>, selectedPath: string | null) {
  useContentMotion(rootRef);

  useGSAP(() => {
    if (!window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const root = rootRef.current;
      if (!root) return;
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      intro.fromTo(root.querySelectorAll('[data-panel-index]'), { y: -12, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, stagger: 0.08, clearProps: 'transform,opacity',
      }, 0.15);
      intro.fromTo(root.querySelectorAll('[data-signal-bar]'), { scaleY: 0.15 }, {
        scaleY: 1, duration: 1.15, stagger: { amount: 0.32, from: 'center' },
      }, 0.1);
      const signal = root.querySelector('[data-signal]');
      if (signal) gsap.to(signal, {
        xPercent: 35, skewX: -18, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef });

  useGSAP(() => {
    if (!window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const panel = rootRef.current?.querySelector('[data-expanded="true"]');
      if (!panel) return;
      const reveal = gsap.timeline({ defaults: { ease: 'power3.out' } });
      reveal.fromTo(panel.querySelectorAll('[data-panel-content] > *'), { y: 22, opacity: 0.25 }, {
        y: 0, opacity: 1, duration: 0.65, stagger: 0.055, clearProps: 'transform,opacity',
      }, 0.08);
      reveal.fromTo(panel.querySelector('[data-panel-rule]'), { scaleY: 0 }, {
        scaleY: 1, duration: 0.85, ease: 'expo.inOut',
      }, 0);
      const content = panel.querySelector('[data-panel-content]');
      const finish = () => reveal.progress(1);
      content?.addEventListener('focusin', finish);
      return () => content?.removeEventListener('focusin', finish);
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [selectedPath], revertOnUpdate: true });
}
