import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns false during SSR and hydration, then true once the client owns the
 * rendered tree without requiring a second effect-driven state update.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
