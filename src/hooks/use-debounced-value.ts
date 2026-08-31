import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs`. A delay of `0` (or less) updates
 * synchronously. The pending update is cancelled if `value` changes again first.
 *
 * @example
 * const debounced = useDebouncedValue(query, 250);
 * useEffect(() => { search(debounced); }, [debounced]);
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
