import type { GalleryPhoto } from '@/capabilities/media/media';

export interface Performance {
  id: string;
  date: string;
  venue: string;
  location?: string;
  time?: string;
  title: string;
  lineup?: string;
  raEventLink?: string;
  raEventId?: string;
  posterImageId?: string;
  status: 'Announced' | 'TBA' | 'Cancelled';

  raVenueId?: string;
  raCountryName?: string;
  raAreaName?: string;
  raAreaId?: string;
  raAddress?: string;
  raCost?: string;
  raPromoter?: string;
  raVenueLink?: string;
  raHasTickets?: boolean;
  raHasBarcode?: boolean;
  raPromoterId?: string;
  raLineupRaw?: string;
}

export interface EventsInfo {
  setDurations: string[];
  technicalRequirements: string[];
  contactEmail: string;
  responseTime: string;
}

export interface EventsContent {
  performances: Performance[];
  eventsInfo: EventsInfo;
}

export interface EventDetailData {
  event: Performance;
  posterPhoto?: GalleryPhoto;
}
