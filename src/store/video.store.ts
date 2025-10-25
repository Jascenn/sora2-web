import { create } from 'zustand'

export interface Video {
  id: string
  prompt: string
  negativePrompt?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileUrl?: string
  thumbnailUrl?: string
  duration: number
  resolution: string
  aspectRatio: string
  costCredits: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

export interface VideoConfig {
  duration: number
  resolution: string
  aspectRatio: string
  fps: number
}

interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  filter: {
    status?: Video['status']
    resolution?: string
    sortBy: 'newest' | 'oldest' | 'credits'
  }
  isGenerating: boolean
  generationProgress: number
  generationMessage: string
}

interface VideoActions {
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  updateVideo: (id: string, updates: Partial<Video>) => void
  deleteVideo: (id: string) => void
  setCurrentVideo: (video: Video | null) => void
  setFilter: (filter: Partial<VideoState['filter']>) => void
  resetFilter: () => void
  setGenerating: (isGenerating: boolean) => void
  setGenerationProgress: (progress: number, message: string) => void
  resetGenerationState: () => void
}

type VideoStore = VideoState & VideoActions

const initialState: VideoState = {
  videos: [],
  currentVideo: null,
  filter: {
    sortBy: 'newest',
  },
  isGenerating: false,
  generationProgress: 0,
  generationMessage: '',
}

export const useVideoStore = create<VideoStore>()((set) => ({
  ...initialState,

  // Actions
  setVideos: (videos) => set({ videos }),

  addVideo: (video) =>
    set((state) => ({
      videos: [video, ...state.videos],
    })),

  updateVideo: (id, updates) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      currentVideo:
        state.currentVideo?.id === id
          ? { ...state.currentVideo, ...updates }
          : state.currentVideo,
    })),

  deleteVideo: (id) =>
    set((state) => ({
      videos: state.videos.filter((v) => v.id !== id),
      currentVideo: state.currentVideo?.id === id ? null : state.currentVideo,
    })),

  setCurrentVideo: (video) => set({ currentVideo: video }),

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),

  resetFilter: () =>
    set({
      filter: initialState.filter,
    }),

  setGenerating: (isGenerating) =>
    set({
      isGenerating,
      generationProgress: isGenerating ? 0 : 100,
    }),

  setGenerationProgress: (progress, message) =>
    set({
      generationProgress: progress,
      generationMessage: message,
    }),

  resetGenerationState: () =>
    set({
      isGenerating: false,
      generationProgress: 0,
      generationMessage: '',
    }),
}))
