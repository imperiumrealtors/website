'use client';
import { useSyncExternalStore } from 'react';

const KEY = 'vk_saved_plots';
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let snapshot: string[] = EMPTY;
let loaded = false;

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function onStorageEvent(event: StorageEvent) {
  if (event.key === KEY) {
    snapshot = readStorage();
    emit();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorageEvent);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorageEvent);
  };
}

function getSnapshot() {
  if (!loaded) {
    snapshot = readStorage();
    loaded = true;
  }
  return snapshot;
}

const getServerSnapshot = () => EMPTY;

function commit(next: string[]) {
  snapshot = next;
  loaded = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode / quota) — keep the in-memory value
  }
  emit();
}

export function useSavedPlots() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** False during SSR and the hydration pass, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function toggleSavedPlot(id: string) {
  const current = getSnapshot();
  commit(current.includes(id) ? current.filter((saved) => saved !== id) : [...current, id]);
}

export function removeSavedPlot(id: string) {
  commit(getSnapshot().filter((saved) => saved !== id));
}

export function clearSavedPlots() {
  commit(EMPTY);
}
