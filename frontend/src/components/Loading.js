import React, { useEffect, useState } from 'react';

const Loading = ({ onLoadingComplete }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onLoadingComplete();
    }, 2400); // 2.4 seconds

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🧠</div>
        <p className="text-2xl font-bold">Made with 🧠 by Abhinav & Abhinav Shukla Exclusively</p>
      </div>
    </div>
  );
};

export default Loading;