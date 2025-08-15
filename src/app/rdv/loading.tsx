export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center space-y-4 max-w-sm">
        {/* Loading icon with animation */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 animate-pulse">
          <span className="text-2xl" role="img" aria-label="Dent">🦷</span>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-gray-900">
            Chargement en cours...
          </h2>
          <p className="text-sm text-gray-500">
            Veuillez patienter pendant que nous préparons votre rendez-vous
          </p>
        </div>
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-2" aria-hidden="true">
          <div 
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          ></div>
          <div 
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          ></div>
          <div 
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
        
        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="polite">
          Chargement de la page de prise de rendez-vous en cours
        </div>
      </div>
    </div>
  );
}