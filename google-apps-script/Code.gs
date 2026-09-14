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
 *    - Loại: Web app, Execute as: Tôi, Access: Bất kỳ ai
 */

const SHEET_NAME = 'SurveyLogs';
const TARGET_SHEET_ID = '1W0r0bi6EApv2kiRdyDDqwDJr4mSztKFZJI4WDg8q0C8';
const PHOTO_FOLDER_NAME = 'VKU_Survey_Photos';

/**
 * Tạo hoặc tìm folder lưu ảnh trên Google Drive
 */
function getOrCreatePhotoFolder() {
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log('Đã tạo folder ảnh: ' + folder.getUrl());
  return folder;
}

/**
 * Decode base64 data URL → file on Drive, returns { id, url }
 * Trả về null nếu không upload được (để fallback text)
 */
function uploadPhotoToDrive(dataUrl, filename, folder) {
  if (!dataUrl || dataUrl.length < 100) return null;

  // Parse data URL: "data:image/jpeg;base64,AAAA..."
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

    // Tạo folder ảnh (chỉ 1 lần, reuse nếu có sẵn)
    const photoFolder = getOrCreatePhotoFolder();

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      // Upload ảnh lên Drive, lấy link
      let photoUrl = '';
      if (rec.photoBase64 && rec.photoBase64.length > 100) {
        const photoName = 'survey_' + (rec.formattedTime || Date.now()).replace(/[\/\\: ]/g, '-') + '_' + i;
        const uploadResult = uploadPhotoToDrive(rec.photoBase64, photoName, photoFolder);
        if (uploadResult) {
          photoUrl = uploadResult.url;
        }
      }

      const row = [
        rec.formattedTime || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        rec.building || 'Chưa xác định',
        rec.room || '',
        rec.equipment || '',
        rec.condition || 'Bình thường',
        rec.notes || '',
        rec.gps || '',
        photoUrl  // Google Drive direct link → dùng =IMAGE() trong Sheet
      ];

      sheet.appendRow(row);
      insertedCount++;
    }

    // Đặt công thức IMAGE() cho cột 8 (Ảnh hiện trường)
    // Chỉ xử lý các hàng vừa thêm (không đụng hàng cũ)
    const lastRow = sheet.getLastRow();
    const totalRows = sheet.getMaxRows();
    const formulaStartRow = lastRow - insertedCount + 1;
    for (let r = formulaStartRow; r <= lastRow; r++) {
      const cell = sheet.getRange(r, 8);  // cột H = 8
      const rawValue = cell.getValue();
      if (rawValue && rawValue.startsWith('https://drive.google.com')) {
        cell.setFormula('=IMAGE("' + rawValue + '", 4, 80, 80)');
      }
    }

    // Tự động điều chỉnh chiều rộng cột ảnh (thumbnail)
    sheet.setColumnWidth(8, 120);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đã lưu thành công ' + insertedCount + ' bản ghi khảo sát VKU',
      insertedCount: insertedCount,
      photosUploaded: insertedCount,
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
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'VKU Field Survey PWA Webhook API',
    school: 'Vietnam - Korea University of Information and Communication Technology (VKU)',
    version: '2.0.0',
    features: ['Drive photo upload', 'IMAGE formula', 'GPS', 'batch insert'],
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
