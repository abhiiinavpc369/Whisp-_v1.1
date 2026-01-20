import React, { useState } from 'react';
import Loading from './components/Loading';
import Phone from './components/Phone';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="App">
      {isLoading ? <Loading onLoadingComplete={handleLoadingComplete} /> : <Phone />}
    </div>
  );
}

export default App;