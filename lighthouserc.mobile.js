module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/booking',
        'http://localhost:3000/rdv',
        'http://localhost:3000/chat',
        'http://localhost:3000/demo-nova'
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready started server on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.6 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'categories:pwa': 'off',
        
        // Mobile performance metrics (more lenient)
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 800 }],
        
        // Mobile accessibility
        'tap-targets': 'error',
        'viewport': 'error',
        'font-size': 'warn',
        
        // Accessibility specific
        'color-contrast': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'image-alt': 'error',
        
        // Healthcare/Medical specific
        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage',
      outputDir: '.lighthouseci',
      reportFilenamePattern: 'mobile-%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    }
  }
};