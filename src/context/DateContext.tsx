import React, { createContext, useContext, useState } from 'react';
import { todayStr } from '../utils/dateHelpers';

interface DateContextType {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

const DateContext = createContext<DateContextType>({
  selectedDate: todayStr(),
  setSelectedDate: () => {},
});

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useSelectedDate() {
  return useContext(DateContext);
}
