import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, type User, type Video, type VideoPatch } from './api'

export const keys = { me: ['me'], lists: ['lists'], videos: ['videos'] }

/** The signed-in user, or null when signed out. */
export const useMe = () =>
  useQuery({
    queryKey: keys.me,
    queryFn: async (): Promise<User | null> => {
      try {
        return await api.me()
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null
        throw err
      }
    },
    staleTime: Infinity,
    retry: false,
  })

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.loginWithGoogle,
    onSuccess: (user) => qc.setQueryData(keys.me, user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      qc.clear()
      qc.setQueryData(keys.me, null)
    },
  })
}

export const useLists = () => useQuery({ queryKey: keys.lists, queryFn: api.getLists })

export const useVideos = () => useQuery({ queryKey: keys.videos, queryFn: api.getVideos })

export function useCreateList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createList,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists }),
  })
}

export function useRenameList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.renameList(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists }),
  })
}

export function useDeleteList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteList,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lists })
      qc.invalidateQueries({ queryKey: keys.videos })
    },
  })
}

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ url, listId }: { url: string; listId: number | null }) =>
      api.createVideo(url, listId),
    onSuccess: (video) => qc.setQueryData<Video[]>(keys.videos, (old = []) => [video, ...old]),
  })
}

export function useUpdateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: VideoPatch }) => api.updateVideo(id, patch),
    onSuccess: (video) =>
      qc.setQueryData<Video[]>(keys.videos, (old = []) =>
        old.map((v) => (v.id === video.id ? video : v)),
      ),
  })
}

export function useDeleteVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteVideo,
    onSuccess: (_, id) =>
      qc.setQueryData<Video[]>(keys.videos, (old = []) => old.filter((v) => v.id !== id)),
  })
}
