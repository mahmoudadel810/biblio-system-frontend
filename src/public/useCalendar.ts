import { useEffect, useState } from 'react';
import { getCalendar, setCalendar, type Calendar } from './format';

// Shared calendar choice. Every component using the hook re-renders when any of them toggles it.
export function useCalendar(): [Calendar, () => void] {
  const [cal, setCal] = useState<Calendar>(getCalendar());
  useEffect(() => {
    const sync = () => setCal(getCalendar());
    window.addEventListener('biblio-calendar', sync);
    return () => window.removeEventListener('biblio-calendar', sync);
  }, []);
  const toggle = () => { setCalendar(cal === 'hijri' ? 'gregory' : 'hijri'); window.dispatchEvent(new Event('biblio-calendar')); };
  return [cal, toggle];
}
