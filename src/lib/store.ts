import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CaptureMode = 'text' | 'voice' | 'image';
export type AppMode = 'default' | 'zen' | 'war';

interface LifeOSState {
  mode: AppMode;
  captureMode: CaptureMode;
  isRecording: boolean;
  activePersona: string;
  toggleMode: () => void;
  setMode: (m: AppMode) => void;
  setCaptureMode: (m: CaptureMode) => void;
  setIsRecording: (v: boolean) => void;
  setPersona: (p: string) => void;
}

export const useLifeOSStore = create<LifeOSState>()(
  persist(
    (set) => ({
      mode: 'default',
      captureMode: 'text',
      isRecording: false,
      activePersona: 'founder',
      toggleMode: () => set((s) => ({ 
        mode: s.mode === 'zen' ? 'default' : s.mode === 'default' ? 'war' : 'zen' 
      })),
      setMode: (m) => set({ mode: m }),
      setCaptureMode: (m) => set({ captureMode: m }),
      setIsRecording: (v) => set({ isRecording: v }),
      setPersona: (p) => set({ activePersona: p }),
    }),
    { name: 'lifeos-ui-state' }
  )
);
