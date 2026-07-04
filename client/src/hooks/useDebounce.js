import { useEffect, useState } from 'react';
import { DEBOUNCE_DELAY } from '../constants';

/**
 * useDebounce — delays updating the returned value until after `delay` ms
 * Default delay matches DEBOUNCE_DELAY constant (400ms)
 */
const useDebounce = (value, delay = DEBOUNCE_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
