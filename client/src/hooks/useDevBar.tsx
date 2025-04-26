import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface DevBarContextType {
  devMode: boolean;
  toggleDevMode: () => void;
}

const DevBarContext = createContext<DevBarContextType | undefined>(undefined);

export function DevBarProvider({ children }: { children: ReactNode }) {
  const [devMode, setDevMode] = useState(false);

  // Check for dev mode in URL or localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const devModeParam = searchParams.get('devmode');
    const savedDevMode = localStorage.getItem('webscanner_devmode');
    
    if (devModeParam === 'true' || savedDevMode === 'true') {
      setDevMode(true);
    }
  }, []);

  const toggleDevMode = () => {
    const newMode = !devMode;
    setDevMode(newMode);
    localStorage.setItem('webscanner_devmode', newMode.toString());
  };

  return (
    <DevBarContext.Provider value={{ devMode, toggleDevMode }}>
      {children}
    </DevBarContext.Provider>
  );
}

export function useDevBar(): DevBarContextType {
  const context = useContext(DevBarContext);
  
  if (context === undefined) {
    throw new Error('useDevBar must be used within a DevBarProvider');
  }
  
  return context;
}