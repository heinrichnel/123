import React from 'react';
import type { Trip } from '../types';

interface AppContextType {
  trips: Trip[];
  // ...add other context properties here as needed
}

export const AppContext = React.createContext<AppContextType>({
  trips: [],
  // ...add other default values here
});

// useAppContext has been moved to its own file for Fast Refresh compatibility.

// If you want any object:
// export const AppContextProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
//   const value: AppContextType = {
//     trips: [],
//     // ...other context values
//   };

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// };

// If you want any value:
export const AppContextProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const value: AppContextType = {
    trips: [],
    // ...other context values
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// If you want to keep {} and disable the lint rule:
// export const AppContextProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   const value: AppContextType = {
//     trips: [],
//     // ...other context values
//   };

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// };