// Vite plugin: lets @media preludes name token variables, e.g. @media (width < var(--size-breakpoint-m)).
// CSS can't read custom properties inside a media query, so each var() in a prelude is replaced
// with its value from the generated src/tokens.css at build time. Components never hold the raw value.
import { readFileSync } from 'node:fs';

const tokensCss = new URL('../src/tokens.css', import.meta.url);

function tokenValues() {
  const values = {};
  for (const [, name, value] of readFileSync(tokensCss, 'utf8').matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    values[name] = value.trim();
  }
  return values;
}

function resolve(values, name) {
  let value = values[name];
  for (let alias; (alias = value?.match(/^var\((--[\w-]+)\)$/)); ) value = values[alias[1]];
  if (value === undefined) throw new Error(`Unresolved token in @media: ${name}`);
  return value;
}

export function mediaTokens() {
  return {
    name: 'media-tokens',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.css($|\?)/.test(id) || !code.includes('@media')) return null;
      const values = tokenValues();
      return code.replace(/@media[^{]+\{/g, prelude => prelude.replace(/var\((--[\w-]+)\)/g, (_, name) => resolve(values, name)));
    },
  };
}
