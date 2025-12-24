import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    // Configure the plugin to copy Shoelace assets
    viteStaticCopy({
      targets: [
        {
          src: 'config/**/*.json',
          dest: 'config'
        },
        {
          src: 'favicon.ico',
          dest: ''
        },
        {
          src: 'node_modules/@shoelace-style/shoelace/dist/assets',
          // Assets will be copied to dist/shoelace-assets/assets
          dest: 'shoelace-assets' 
        }
      ]
    })
  ],
  build: {
    // Output directory for the production build
    outDir: 'dist',
  },
  server: {
    // Optional: open the browser automatically
    open: true,
  }
});
