import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

const securityHeaders = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'X-Permitted-Cross-Domain-Policies': 'none',
	'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
};

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: "Astrid's Number Garden",
        short_name: "Number Garden",
        description: "A fun and modular math learning game featuring Astrid.",
        theme_color: "#241b3a",
        background_color: "#241b3a",
        display: "standalone",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      }
    })
  ],
  server: {
    headers: securityHeaders
  },
  preview: {
    headers: securityHeaders
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  }
});
