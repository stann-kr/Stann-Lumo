import { apiGet, apiPut, apiRequest } from '@/services/apiClient';
import type { ContentLocale } from '@/capabilities/content/content';
import type { EventsInfo, Performance } from './events';
import type { RAApiConfigUpdate, RAApiConfigView } from './raConfig';

export function fetchPerformances() {
  return apiGet<Performance[]>('/api/admin/performances');
}

export function updatePerformances(items: Performance[]) {
  return apiPut<void>('/api/admin/performances', { items });
}

export async function uploadEventPoster(eventId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<{ photoId: string; eventId: string }>(`/api/admin/events/${eventId}/poster`, {
    method: 'POST',
    body: formData,
  });
}

export function deleteEventPoster(eventId: string) {
  return apiRequest<void>(`/api/admin/events/${eventId}/poster`, { method: 'DELETE' });
}

export function fetchRaApiConfig() {
  return apiGet<RAApiConfigView>('/api/admin/ra-api-config');
}

export function updateRaApiConfig(raApiConfig: RAApiConfigUpdate) {
  return apiPut<RAApiConfigView>('/api/admin/ra-api-config', { raApiConfig });
}

export function fetchEventsInfo(lang: ContentLocale) {
  return apiGet<EventsInfo>(`/api/admin/events-info?lang=${lang}`);
}

export function updateEventsInfo(lang: ContentLocale, eventsInfo: EventsInfo) {
  return apiPut<void>('/api/admin/events-info', { lang, eventsInfo });
}
