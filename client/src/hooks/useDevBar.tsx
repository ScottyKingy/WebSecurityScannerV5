import { createContext, useState, useContext, ReactNode } from 'react';

interface DevBarContextType {
  devMode: boolean;
  toggleDevMode: () => void;
}

// Create the context with default values
const DevBarContext = createContext<DevBarContextType>({
  devMode: false,
  toggleDevMode: () => {},
});

// Define the provider component
export function DevBarProvider({ children }: { children: ReactNode }) {
  const [devMode, setDevMode] = useState<boolean>(
    process.env.NODE_ENV === 'development'
  );

  const toggleDevMode = () => {
    setDevMode((prev) => !prev);
  };

  return (
    <DevBarContext.Provider value={{ devMode, toggleDevMode }}>
      {children}
    </DevBarContext.Provider>
  );
}

// Custom hook to use the context
export function useDevBar() {
  const context = useContext(DevBarContext);
  if (context === undefined) {
    throw new Error('useDevBar must be used within a DevBarProvider');
  }
  return context;
}