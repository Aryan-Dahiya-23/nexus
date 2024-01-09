import { createContext, ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';

export const GlobalContext = createContext<unknown>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <GlobalContext.Provider value={{/* Include other global values here */ }}>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </GlobalContext.Provider >
  );
};
