import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages'te adres https://<kullanıcı>.github.io/mesai/ olur (repo adı: mesai).
  base: '/mesai/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mesai',
        short_name: 'Mesai',
        description: 'Kişisel mesai (fazla çalışma) takip uygulaması',
        lang: 'tr',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#f4f5fb',
        background_color: '#f4f5fb',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Uygulama kabuğu ve tüm varlıklar önbelleğe alınır; internet olmadan açılır.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
