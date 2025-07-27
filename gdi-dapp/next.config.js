/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Enable React 18 concurrent features
  experimental: {
    concurrentFeatures: true,
    serverComponents: true,
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: [
      'ipfs.io',
      'ipfs.infura.io',
      'gateway.pinata.cloud',
      'nft-cdn.alchemy.com',
      process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    ].filter(Boolean),
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Enable tree shaking
    config.optimization.usedExports = true;
    
    // Enable module concatenation
    config.optimization.concatenateModules = true;
    
    // Minify JavaScript and CSS in production
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        // Minify JavaScript
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            parse: {
              ecma: 2020,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: !dev,
              drop_debugger: !dev,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
        // Minify CSS
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
      ];
    }
    
    // Optimize moment.js locales
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );
    
    // Optimize lodash imports
    config.plugins.push(
      new LodashModuleReplacementPlugin({
        collections: true,
        paths: true,
        flattening: true,
      })
    );
    
    // Add compression for production
    if (!dev && !isServer) {
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg|json|ico|eot|otf|ttf)$/,
          threshold: 10240,
          minRatio: 0.8,
        }),
        new BrotliPlugin({
          asset: '[path].br[query]',
          test: /\.(js|css|html|svg|json|ico|eot|otf|ttf)$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      );
    }
    
    // Optimize SVG icons
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack', 'url-loader'],
    });
    
    // Add webpack-bundle-analyzer
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      );
    }
    
    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_INFURA_ID: process.env.NEXT_PUBLIC_INFURA_ID,
    NEXT_PUBLIC_ALCHEMY_ID: process.env.NEXT_PUBLIC_ALCHEMY_ID,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },
  
  // Internationalization
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko'],
    defaultLocale: 'en',
    localeDetection: true,
  },
  
  // PWA support (optional)
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  },
  
  // Sitemap and robots.txt
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
