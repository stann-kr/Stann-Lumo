'use client';

import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function useShellMotion(rootRef: RefObject<HTMLDivElement | null>, pathname: string, language: string, isMenuOpen: boolean) {
  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups: Array<() => void> = [];
      root.querySelectorAll<HTMLElement>('[data-nav-roll]').forEach((link) => {
        const label = link.querySelector('[data-nav-label]');
        const copy = link.querySelector('[data-nav-copy]');
        const roll = gsap.timeline({ paused: true, defaults: { duration: 0.32, ease: 'power3.inOut' } });
        roll.to(label, { yPercent: -115 }, 0).fromTo(copy, { yPercent: 115 }, { yPercent: 0 }, 0);
        const enter = () => roll.play();
        const leave = () => { if (document.activeElement !== link) roll.reverse(); };
        const blur = () => roll.reverse();
        link.addEventListener('pointerenter', enter);
        link.addEventListener('pointerleave', leave);
        link.addEventListener('focus', enter);
        link.addEventListener('blur', blur);
        cleanups.push(() => {
          link.removeEventListener('pointerenter', enter);
          link.removeEventListener('pointerleave', leave);
          link.removeEventListener('focus', enter);
          link.removeEventListener('blur', blur);
        });
      });

      const dialog = root.querySelector('[role="dialog"]');
      if (dialog && isMenuOpen) {
        const entry = gsap.timeline();
        entry.fromTo(dialog, { y: -24 }, { y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform' });
        entry.fromTo(dialog.querySelectorAll('li'), { x: -24, opacity: 0.3 }, {
          x: 0, opacity: 1, duration: 0.45, stagger: 0.035, ease: 'power3.out', clearProps: 'transform,opacity',
        }, 0.04);
      }
      return () => cleanups.forEach((cleanup) => cleanup());
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [pathname, language, isMenuOpen], revertOnUpdate: true });

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const progress = root.querySelector('[data-scroll-progress]');
      if (progress) gsap.fromTo(progress, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.25 },
      });
      const footer = root.querySelector('[data-footer-rule]');
      if (footer) gsap.fromTo(footer, { scaleX: 0 }, {
        scaleX: 1, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: footer.parentElement, start: 'top 98%', once: true },
      });
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [pathname], revertOnUpdate: true });
}
