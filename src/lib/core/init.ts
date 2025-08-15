import Bootstrap from './bootstrap';

/**
 * Initialize Nova Platform core infrastructure
 * This should be called once when the application starts
 */
export async function initializeNovaPlatform(): Promise<void> {
  const bootstrap = Bootstrap.getInstance();
  
  try {
    await bootstrap.initialize();
    
    // Validate system readiness
    const validation = await bootstrap.validateSystemReadiness();
    if (!validation.ready) {
      console.warn('System readiness issues detected:', validation.issues);
    }
    
  } catch (error) {
    console.error('Failed to initialize Nova Platform:', error);
    throw error;
  }
}

// Only initialize once
let initPromise: Promise<void> | null = null;

export function getInitializationPromise(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeNovaPlatform();
  }
  return initPromise;
}

// Auto-initialize in server environment
if (typeof window === 'undefined') {
  // Initialize immediately
  getInitializationPromise().catch(error => {
    console.error('Auto-initialization failed:', error);
  });
}