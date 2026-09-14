export type BuildingType = 'Khu V' | 'Khu K' | 'Tòa Hành chính' | 'KTX';

export type EquipmentType = 'Máy chiếu' | 'Điều hòa' | 'Bàn ghế' | 'Hệ thống điện';

export type ConditionType = 'Bình thường' | 'Cần bảo trì' | 'Hư hỏng nặng';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface SurveyRecord {
  id?: number; // Auto-incremented by Dexie IndexedDB
  uuid: string; // Unique survey record ID
  createdAt: string; // ISO string
  formattedTime: string; // Formatted VN time (e.g. 14:30:00 14/09/2026)
  building: BuildingType;
  room: string;
  equipment: EquipmentType;
  condition: ConditionType;
  notes: string;
  gps: GPSLocation;
  photoBase64: string; // Compressed JPEG (<150KB) base64 string
  photoSizeKB?: number;
  status: SyncStatus;
  syncedAt?: string;
  syncAttempts?: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  message: string;
}
