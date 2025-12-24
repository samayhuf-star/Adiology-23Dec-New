
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
  build: {
    target: 'es2015',
    outDir: 'build',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: (id: string) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // CRITICAL: Keep React in main bundle to ensure it loads first
            // This prevents "Cannot read properties of undefined (reading 'useLayoutEffect')" errors
            if (id.includes('react') || id.includes('react-dom')) {
              return undefined; // Keep in main bundle
            }
            // React-dependent libraries - can be split but React must load first
            if (
              id.includes('@radix-ui') ||
              id.includes('recharts') ||
              id.includes('react-hook-form') ||
              id.includes('react-day-picker') ||
              id.includes('input-otp') ||
              id.includes('lucide-react') ||
              id.includes('framer-motion') ||
              id.includes('cmdk')
            ) {
              return 'vendor-react-deps';
            }
            // GrapesJS and editor
            if (id.includes('grapesjs')) {
              return 'vendor-editor';
            }
            // Supabase
            if (id.includes('@supabase') || id.includes('@jsr/supabase')) {
              return 'vendor-supabase';
            }
            // Stripe
            if (id.includes('stripe') || id.includes('@stripe')) {
              return 'vendor-stripe';
            }
            // Other large vendors (these may have React deps, so React must load first)
            return 'vendor-other';
          }
          // CSV exporters
          if (id.includes('googleAdsEditorCSVExporter')) {
            return 'csv-exporter';
          }
          // Campaign builders
          if (id.includes('CampaignBuilder') || id.includes('OneClickCampaignBuilder')) {
            return 'campaign-builders';
          }
          // Keyword tools
          if (id.includes('Keyword') || id.includes('keyword')) {
            return 'keyword-tools';
          }
          // Forms module
          if (id.includes('modules/forms')) {
            return 'forms-module';
          }
          // Workspace components
          if (id.includes('Workspace') || id.includes('workspace')) {
            return 'workspace-module';
          }
        },
      },
    },
  },
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      hmr: {
        clientPort: 5000,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  });