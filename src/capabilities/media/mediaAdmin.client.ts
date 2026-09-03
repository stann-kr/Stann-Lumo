import { apiGet, apiPut, apiRequest } from '@/services/apiClient';
import type { GalleryPhoto } from './media';

export function fetchGalleryPhotos() {
  return apiGet<GalleryPhoto[]>('/api/admin/archive');
}

export function updateGalleryPhotos(photos: GalleryPhoto[]) {
  return apiPut<void>('/api/admin/archive', { photos });
}

export function uploadGalleryFiles(files: FileList | File[]) {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('files', file));
  return apiRequest<GalleryPhoto[]>('/api/admin/archive/upload', {
    method: 'POST',
    body: formData,
  });
}

export function addYouTubeGalleryVideo(youtubeUrl: string, linkedEventId?: string) {
  return apiRequest<GalleryPhoto>('/api/admin/archive/youtube', {
    method: 'POST',
    body: JSON.stringify({ youtubeUrl, ...(linkedEventId && { linkedEventId }) }),
  });
}

export function deleteGalleryPhoto(id: string) {
  return apiRequest<void>(`/api/admin/archive/${id}`, { method: 'DELETE' });
}
