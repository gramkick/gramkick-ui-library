import { useCallback, useState } from "react";

export interface UseControllableStateParams<T> {
  /** Controlled value. When `undefined` the hook manages state internally. */
  value?: T;
  /** Initial value for the uncontrolled case. */
  defaultValue: T;
  /** Called on every change, in both controlled and uncontrolled modes. */
  onChange?: (value: T) => void;
}

/**
 * A value that is controlled when `value` is provided and self-managed otherwise —
 * the standard pattern for form-ish components (`Switch`, `Tabs`, `Dialog`, …).
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : uncontrolled;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
