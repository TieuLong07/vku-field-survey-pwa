/**
 * =========================================================================
 * VKU FIELD SURVEY PWA - BACKEND SERVERLESS (GOOGLE APPS SCRIPT)
 * Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)
 * =========================================================================
 *
 * HƯỚNG DẪN CẬP NHẬT:
 * 1. Mở Sheet VKU_Field_Survey_Data → Tiện ích mở rộng → Apps Script
 * 2. Xóa TOÀN BỘ code cũ, dán TOÀN BỘ nội dung file này vào editor
 * 3. Ctrl+S lưu, rồi Triển khai lại (New deployment / Update)
 *
 * LƯU Ý QUAN TRỌNG VỀ QUYỀN DRIVE:
 * - Nếu lần đầu dùng Drive photo upload → sẽ có popup xin quyền Drive
 * - Nếu chưa cấp quyền Drive → script vẫn hoạt động bình thường
 *   (ảnh giữ nguyên text, không crash)
 * - Để cấp quyền: vào Apps Script → nhấn ▶ Chạy → doGet()
 *   → popup hiện → Chấp nhận → Done
 */

const SHEET_NAME = 'SurveyLogs';
const TARGET_SHEET_ID = '1W0r0bi6EApv2kiRdyDDqwDJr4mSztKFZJI4WDg8q0C8';
const PHOTO_FOLDER_NAME = 'VKU_Survey_Photos';

/**
 * Kiểm tra xem script có quyền Drive không (fail-safe)
 */
function hasDriveAccess() {
  try {
    DriveApp.getFoldersByName('__test__');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Tạo hoặc tìm folder lưu ảnh trên Google Drive
 * Trả về null nếu không có quyền Drive
 */
function getOrCreatePhotoFolder() {
  try {
    const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }
    const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Logger.log('Đã tạo folder ảnh: ' + folder.getUrl());
    return folder;
  } catch (e) {
    Logger.log('Không thể tạo folder Drive (chưa cấp quyền?): ' + e.toString());
    return null;
  }
}

/**
 * Decode base64 data URL → file on Drive, returns { id, url }
 * Trả về null nếu không upload được (fallback giữ text)
 */
function uploadPhotoToDrive(dataUrl, filename, folder) {
  if (!dataUrl || dataUrl.length < 100) return null;

  try {
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return null;

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const b64Data = match[2];
    const mimeType = 'image/' + (match[1] === 'jpeg' ? 'jpeg' : match[1]);

    const blob = Utilities.newBlob(
      Utilities.base64Decode(b64Data),
      mimeType,
      filename + '.' + ext
    );

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      id: file.getId(),
      url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
      directLink: file.getUrl()
    };
  } catch (e) {
    Logger.log('Upload ảnh thất bại: ' + e.toString());
    return null;
  }
}

/**
 * Xử lý yêu cầu POST từ VKU Survey PWA
 */
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    const success = lock.tryLock(30000);
    if (!success) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Hệ thống đang bận ghi dữ liệu, vui lòng thử lại sau.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        'Thời gian',
        'Khu nhà',
        'Phòng',
        'Thiết bị',
        'Tình trạng',
        'Ghi chú',
        'Tọa độ GPS',
        'Ảnh hiện trường'
      ];
      sheet.appendRow(headers);

      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0054A6');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    let postData = {};
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      throw new Error('Dữ liệu gửi lên trống (No payload)');
    }

    const records = postData.records || (postData.record ? [postData.record] : []);
    let insertedCount = 0;

    // Thử tạo folder ảnh Drive - nếu fail (chưa auth) thì skip photo upload
    const photoFolder = getOrCreatePhotoFolder();
    const canUploadPhotos = photoFolder !== null;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      // Upload ảnh nếu có quyền Drive
      let photoDisplay = rec.photoBase64 || '';
      if (canUploadPhotos && rec.photoBase64 && rec.photoBase64.length > 100) {
        const photoName = 'survey_' + (rec.formattedTime || Date.now()).replace(/[\/\\: ]/g, '-') + '_' + i;
        const uploadResult = uploadPhotoToDrive(rec.photoBase64, photoName, photoFolder);
        if (uploadResult) {
          photoDisplay = uploadResult.url;  // Drive URL → dùng =IMAGE() sau
        }
        // Nếu upload fail, giữ nguyên photoDisplay (text base64)
      }

      const row = [
        rec.formattedTime || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        rec.building || 'Chưa xác định',
        rec.room || '',
        rec.equipment || '',
        rec.condition || 'Bình thường',
        rec.notes || '',
        rec.gps || '',
        photoDisplay
      ];

      sheet.appendRow(row);
      insertedCount++;
    }

    // Đặt công thức IMAGE() cho cột 8 (Ảnh hiện trường)
    // Chỉ xử lý các hàng vừa thêm
    if (canUploadPhotos) {
      const lastRow = sheet.getLastRow();
      const formulaStartRow = lastRow - insertedCount + 1;
      for (let r = formulaStartRow; r <= lastRow; r++) {
        const cell = sheet.getRange(r, 8);
        const rawValue = cell.getValue();
        if (rawValue && rawValue.startsWith('https://drive.google.com')) {
          cell.setFormula('=IMAGE("' + rawValue + '", 4, 80, 80)');
        }
      }
      sheet.setColumnWidth(8, 120);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đã lưu thành công ' + insertedCount + ' bản ghi khảo sát VKU',
      insertedCount: insertedCount,
      drivePhotos: canUploadPhotos,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Lỗi xử lý doPost: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Xử lý yêu cầu GET - Health check
 * Chạy lần đầu để grant quyền Drive
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'VKU Field Survey PWA Webhook API',
    school: 'Vietnam - Korea University of Information and Communication Technology (VKU)',
    version: '2.1.0',
    driveAccess: hasDriveAccess(),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
