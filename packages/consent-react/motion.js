/**
 * Timing helpers. Every duration comes from the token CSS generated from docs/design/tokens.json,
 * so JS timers and CSS animations read the same values. No raw ms here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** readDuration('motion-duration-deliberate') → 600. Reads the generated custom property. */
export function readDuration(name) {
  if (typeof document === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const value = parseFloat(raw);
  if (Number.isNaN(value)) throw new Error(`Missing duration token --${name}`);
  return raw.endsWith('ms') ? value : value * 1000;
}

export const motionDuration = name => readDuration(`motion-duration-${name}`);

const REDUCED = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(REDUCED).matches);
  useEffect(() => {
    const query = window.matchMedia(REDUCED);
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Double-commit guard. Wrap a handler; once it commits (returns anything but false),
 * further calls through the same guard are ignored for motion.duration.double-commit-guard.
 * A handler that only nudges returns false, so the human can fix it and click again at once.
 */
export function useCommitGuard() {
  const lastCommit = useRef(-Infinity);
  return useCallback(handler => (...args) => {
    const now = performance.now();
    const guardMs = motionDuration('double-commit-guard');
    if (now - lastCommit.current < guardMs) return;
    if (handler(...args) === false) return;
    lastCommit.current = now;
    // The card usually closes on commit, so the repeat click lands on whatever replaces it.
    // Swallow that multi-click so it can't select the next card's text
    const swallow = event => { if (event.detail > 1) event.preventDefault(); };
    document.addEventListener('mousedown', swallow, true);
    setTimeout(() => document.removeEventListener('mousedown', swallow, true), guardMs);
  }, []);
}

/** True once motion.duration.deliberate has passed since mount. Behavior, so reduced motion keeps it. */
export function useDeliberateBeat() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLive(true), motionDuration('deliberate'));
    return () => clearTimeout(timer);
  }, []);
  return live;
}

/**
 * Types text on at motion.duration.char-delay. Returns [shown, typing].
 * Off (whole text at once) when disabled or under reduced motion.
 */
export function useTypedText(text, enabled = true) {
  const reduced = usePrefersReducedMotion();
  const animate = enabled && !reduced;
  const [count, setCount] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) {
      setCount(text.length);
      return undefined;
    }
    setCount(0);
    const step = motionDuration('char-delay');
    let shown = 0;
    const timer = setInterval(() => {
      shown += 1;
      setCount(shown);
      if (shown >= text.length) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [text, animate]);

  const shown = animate ? text.slice(0, count) : text;
  return [shown, animate && count < text.length];
}
