const path = require('path');

// Custom plugin to log problematic imports
class LogProblematicImportsPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('LogProblematicImports', (nmf) => {
      nmf.hooks.beforeResolve.tap('LogProblematicImports', (resolveData) => {
        if (!resolveData) return;
        // Log any imports that might be using the experimental 'use' import
        if (resolveData.request === 'react' && resolveData.context) {
          console.log('Importing react from:', resolveData.context);
        }
        // Don't return anything, just modify the resolveData if needed
      });
    });
  }
}

module.exports = function override(config, env) {
  // Add our custom plugin
  config.plugins.push(new LogProblematicImportsPlugin());
  
  // Add a custom resolver to log problematic imports
  config.resolve.alias = {
    ...config.resolve.alias,
    // Add any problematic module overrides here if needed
  };

  // Add a rule to log all module resolutions
  config.module.rules.unshift({
    test: /\.(js|jsx|ts|tsx)$/,
    enforce: 'pre',
    use: [
      {
        loader: 'string-replace-loader',
        options: {
          search: 'import\s*\{\s*use\s*\}\s*from\s*[\'\"]react[\'\"]',
          replace: (match) => {
            console.error('Found problematic import:', match);
            return match; // Don't modify, just log
          },
          flags: 'g'
        }
      }
    ]
  });

  return config;
};
