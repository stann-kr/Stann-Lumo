export interface GalleryPhoto {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  caption: string;
  sortOrder: number;
  createdAt: string;
  mediaType: 'image' | 'video_file' | 'video_youtube';
  focalX: number;
  focalY: number;
  videoYoutubeId?: string;
  videoThumbnailUrl?: string;
  linkedEventId?: string;
}

export interface GallerySettings {
  layoutMode: 'masonry' | 'grid';
  columnsMobile: 1 | 2;
  columnsTablet: 2 | 3;
  columnsDesktop: 2 | 3 | 4 | 5;
  gapSize: 'sm' | 'md' | 'lg';
  aspectRatio: 'auto' | '1:1' | '4:3' | '3:4' | '16:9';
  hoverEffect: 'zoom' | 'fade' | 'none';
  captionDisplay: 'overlay' | 'below' | 'hidden';
  lightboxEnabled: boolean;
}

export interface GalleryData {
  photos: GalleryPhoto[];
}
