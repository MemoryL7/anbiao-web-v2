import { create } from 'zustand'

interface DetectionState {
  file: File | null
  region: string
  customWords: string
  checkImages: boolean
  result: any | null
  loading: boolean
  error: string | null
  setFile: (file: File | null) => void
  setRegion: (region: string) => void
  setCustomWords: (words: string) => void
  setCheckImages: (check: boolean) => void
  setResult: (result: any) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useDetectionStore = create<DetectionState>((set) => ({
  file: null,
  region: 'luoyang',
  customWords: '',
  checkImages: true,
  result: null,
  loading: false,
  error: null,
  setFile: (file) => set({ file }),
  setRegion: (region) => set({ region }),
  setCustomWords: (words) => set({ customWords: words }),
  setCheckImages: (check) => set({ checkImages: check }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ file: null, result: null, loading: false, error: null }),
}))
