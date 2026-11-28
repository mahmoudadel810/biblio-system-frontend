import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Adds security headers for every page to dist/_headers (Cloudflare Pages).
 * The Content-Security-Policy allows scripts only from this site plus the exact inline script in index.html (by
 * hash), and network calls only to this site and the API, so an injected script cannot run or send tokens away.
 */
function securityHeaders(apiUrl: string): Plugin {
  let outDir = 'dist';
  return {
    name: 'biblio-security-headers',
    apply: 'build',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
        (m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`,
      );
      const api = new URL(apiUrl).origin;
      const csp = [
        "default-src 'self'",
        `script-src 'self' ${hashes.join(' ')}`.trim(),
        // React sets style attributes, which CSP treats as inline styles.
        "style-src 'self' 'unsafe-inline'",
        // Covers and author photos come from Open Library and Wikimedia; QR codes are data: images.
        "img-src 'self' https: data: blob:",
        "font-src 'self' data:",
        `connect-src 'self' ${api}`,
        "worker-src 'self'",
        "manifest-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; ');
      appendFileSync(
        resolve(outDir, '_headers'),
        [
          '',
          '/*',
          `  Content-Security-Policy: ${csp}`,
          '  X-Content-Type-Options: nosniff',
          '  X-Frame-Options: DENY',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          '  Permissions-Policy: camera=(self), microphone=(), geolocation=(self)',
          '',
        ].join('\n'),
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL;
  // A production bundle without an API address would call localhost in users' browsers. Fail the build instead.
  if (mode === 'production' && !apiUrl) {
    throw new Error('VITE_API_URL is not set. Set it to the API origin before building for production.');
  }
  return {
    plugins: [react(), ...(apiUrl ? [securityHeaders(apiUrl)] : [])],
    server: { port: 5173 },
  };
});
