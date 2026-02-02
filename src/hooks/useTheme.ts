import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Brightness = 'dim' | 'normal' | 'bright';

interface ThemeState {
  theme: Theme;
  brightness: Brightness;
  setTheme: (theme: Theme) => void;
  setBrightness: (brightness: Brightness) => void;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      brightness: 'normal',
      setTheme: (theme) => {
        set({ theme });
        updateDocumentTheme(theme, get().brightness);
      },
      setBrightness: (brightness) => {
        set({ brightness });
        updateDocumentTheme(get().theme, brightness);
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        updateDocumentTheme(newTheme, get().brightness);
      },
    }),
    {
      name: 'hbc-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentTheme(state.theme, state.brightness);
        }
      },
    }
  )
);

function updateDocumentTheme(theme: Theme, brightness: Brightness) {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  
  // Apply brightness filter
  const brightnessValues = {
    dim: 0.85,
    normal: 1,
    bright: 1.1,
  };
  
  root.style.filter = `brightness(${brightnessValues[brightness]})`;
}
