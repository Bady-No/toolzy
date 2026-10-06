export type ToolId = 
  | 'home'
  | 'compress'
  | 'convert'
  | 'pdf'
  | 'remove-bg'
  | 'resize'
  | 'qr-generate'
  | 'qr-read';

export type Language = 'ar' | 'en' | 'fr';
export type Theme = 'light' | 'dark';

export interface UserQuota {
  filesProcessedToday: number;
  lastActiveDate: string; // YYYY-MM-DD
  bgRemovalsThisMonth: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
  resultUrl?: string;
  resultBlob?: Blob;
  previewUrl?: string;
  dimensions?: { width: number; height: number };
  newDimensions?: { width: number; height: number };
}

export interface ToolMeta {
  id: ToolId;
  titleKey: string;
  descriptionKey: string;
  iconName: string;
  badge?: string;
  color: string;
  popular?: boolean;
}
