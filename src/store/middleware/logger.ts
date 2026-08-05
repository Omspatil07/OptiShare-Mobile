/**
 * OptiShare Zustand Logger Middleware
 *
 * Logs state mutations in development mode.
 */

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(f: StateCreator<T, [], []>, name?: string) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set(a as any, b as any);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[Zustand Store: ${name || 'anonymous'}]`, get());
    }
  };
  store.setState = loggedSet;
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;
