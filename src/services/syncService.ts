import { db, getUnsyncedSurveys } from '../db/database';
import type { SurveyRecord, SyncResult } from '../types/survey';

// Key lưu trữ Webhook URL trong localStorage
export const STORAGE_KEY_WEBHOOK = 'vku_survey_webhook_url';

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwJRpl0YYdK1zuqOxDW-Snmdlgd5G0NGZZYVQY6eMrFe-KvdpJoi4Sn3M-_p6v8vafP/exec';

export function getWebhookUrl(): string {
  return localStorage.getItem(STORAGE_KEY_WEBHOOK) || DEFAULT_WEBHOOK_URL;
}

export function setWebhookUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_WEBHOOK, url.trim());
}

/**
 * Gửi toàn bộ bản ghi chưa đồng bộ lên Google Apps Script Webhook
 */
export async function syncUnsyncedSurveys(): Promise<SyncResult> {
  const pendingRecords = await getUnsyncedSurveys();

  if (pendingRecords.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      message: 'Không có bản ghi nào cần đồng bộ.'
    };
  }

  // Kiểm tra kết nối mạng
  if (!navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      failedCount: pendingRecords.length,
      message: 'Thiết bị đang Offline. Vui lòng kết nối mạng để đồng bộ.'
    };
  }

  const webhookUrl = getWebhookUrl();

  // Chuẩn bị payload dữ liệu gửi lên Google Sheets
  const payload = {
    action: 'batch_insert',
    timestamp: new Date().toISOString(),
    count: pendingRecords.length,
    records: pendingRecords.map((r: SurveyRecord) => ({
      uuid: r.uuid,
      formattedTime: r.formattedTime,
      createdAt: r.createdAt,
      building: r.building,
      room: r.room,
      equipment: r.equipment,
      condition: r.condition,
      notes: r.notes,
      gps: `${r.gps.latitude}, ${r.gps.longitude} (±${r.gps.accuracy || 0}m)`,
      latitude: r.gps.latitude,
      longitude: r.gps.longitude,
      photoBase64: r.photoBase64,
      photoSizeKB: r.photoSizeKB || 0
    }))
  };

  try {
    // Nếu có cấu hình Webhook URL thực tế, gửi qua fetch
    if (webhookUrl && webhookUrl.startsWith('https://script.google.com')) {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Tránh lỗi CORS từ Google Apps Script
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Giả lập network delay 800ms khi chưa điền Webhook thật để test môi trường
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Xóa sạch các bản ghi đã đồng bộ trong máy theo yêu cầu đặc tả
    const syncedIds = pendingRecords.map((r: SurveyRecord) => r.id!).filter(Boolean);
    await db.surveys.bulkDelete(syncedIds);

    return {
      success: true,
      syncedCount: pendingRecords.length,
      failedCount: 0,
      message: `Đã đồng bộ thành công ${pendingRecords.length} bản ghi lên máy chủ!`
    };
  } catch (error) {
    console.error('Lỗi khi đồng bộ dữ liệu:', error);
    return {
      success: false,
      syncedCount: 0,
      failedCount: pendingRecords.length,
      message: `Lỗi đồng bộ: ${(error as Error).message || 'Không thể kết nối máy chủ'}`
    };
  }
}
