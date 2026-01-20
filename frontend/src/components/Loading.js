import React, { useEffect, useState } from 'react';

const Loading = ({ onLoadingComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            onLoadingComplete();
          }, 200);
          return 100;
        }
        return prev + 2; // Increase by 2% every 50ms for ~2.5s
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      {/* Central content */}
      <div className="relative z-10 text-center text-white">
        {/* Revolving circles */}
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-blue-500 rounded-full animate-spin opacity-75"></div>
          <div className="absolute top-2 left-2 w-20 h-20 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute top-4 left-4 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl animate-bounce">🧠</div>
          </div>
        </div>

        <p className="text-xl font-bold mb-4 animate-pulse">Loading Whisp...</p>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-sm text-slate-400">{progress}%</p>

        <p className="text-lg font-semibold mt-4 animate-fade-in">
          Made with ❤️ by Abhinav & Abhinav Shukla
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Loading;