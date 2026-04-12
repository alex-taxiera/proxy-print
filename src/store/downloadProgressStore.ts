import { create } from "zustand";

type State = {
  pending: number;
  done: number;
};

type Actions = {
  /** Record that a download has been queued. Resets `done` when starting fresh (pending was 0). */
  start: () => void;
  /** Record that a queued download has completed (success or error). */
  finish: () => void;
  /** Reset counters — called after the completion toast is dismissed. */
  reset: () => void;
};

export const useDownloadProgressStore = create<State & Actions>((set) => ({
  pending: 0,
  done: 0,
  // When pending was 0 (fresh batch), also reset done so the progress bar
  // starts from 0 for the new batch rather than inheriting the old total.
  start: () =>
    set((s) => ({
      pending: s.pending + 1,
      done: s.pending === 0 ? 0 : s.done,
    })),
  finish: () =>
    set((s) => ({
      pending: Math.max(0, s.pending - 1),
      done: s.done + 1,
    })),
  reset: () => set({ pending: 0, done: 0 }),
}));
