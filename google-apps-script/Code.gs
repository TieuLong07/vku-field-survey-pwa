/**
 * =========================================================================
 * VKU FIELD SURVEY PWA - BACKEND SERVERLESS (GOOGLE APPS SCRIPT)
 * Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)
 * =========================================================================
 * 
 * HƯỚNG DẪN THIẾT LẬP:
 * 1. Mở Google Sheets mới: https://sheets.new
 * 2. Đặt tên trang tính: "VKU_Field_Survey_Data"
 * 3. Vào menu: Tiện ích mở rộng (Extensions) -> Apps Script
 * 4. Dán toàn bộ nội dung file này vào editor và nhấn Lưu (Ctrl + S)
 * 5. Nhấn "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment)
 * 6. Chọn loại: "Ứng dụng web" (Web app)
 *    - Mô tả: "VKU Survey Sync API v1"
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me - địa chỉ email của bạn)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 * 7. Nhấn "Triển khai" -> Cấp quyền cho Script -> Copy URL dạng:
 *    https://script.google.com/macros/s/.../exec
 * 8. Dán URL trên vào mục "Cài đặt Webhook" trên ứng dụng VKU Survey PWA.
 */

const SHEET_NAME = 'SurveyLogs';

/**
 * Xử lý yêu cầu POST gửi từ VKU Survey PWA
 */
function doPost(e) {
  // Sử dụng LockService để tránh xung đột dữ liệu khi nhiều sinh viên/cán bộ gửi đồng thời
  const lock = LockService.getScriptLock();
  
  try {
    // Chờ tối đa 30 giây để lấy quyền ghi lock
    const success = lock.tryLock(30000);
    if (!success) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Hệ thống đang bận ghi dữ liệu, vui lòng thử lại sau.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Nếu trang tính chưa tồn tại, tự động tạo mới và định dạng Header
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
        'Ảnh hiện trường (Base64 / Image Link)'
      ];
      sheet.appendRow(headers);
      
      // Định dạng Header phong cách thương hiệu VKU
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0054A6');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    // Phân tích dữ liệu JSON nhận được
    let postData = {};
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      throw new Error('Dữ liệu gửi lên trống (No payload)');
    }

    const records = postData.records || (postData.record ? [postData.record] : []);
    let insertedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      
      // Xử lý ảnh: Cắt ngắn hiển thị hoặc lưu Drive nếu chuỗi Base64 quá dài
      let photoDisplay = rec.photoBase64 || '';
      if (photoDisplay.length > 50000) {
        // Tránh vượt quá giới hạn 50,000 ký tự trong 1 ô Google Sheets
        photoDisplay = photoDisplay.substring(0, 49990) + '...[TRUNCATED]';
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

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đã lưu thành công dữ liệu khảo sát VKU',
      insertedCount: insertedCount,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Lỗi xử lý doPost: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    // Luôn giải phóng lock để các request tiếp theo tiếp tục xử lý
    lock.releaseLock();
  }
}

/**
 * Xử lý yêu cầu GET để kiểm tra trạng thái hoạt động (Health check)
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'VKU Field Survey PWA Webhook API',
    school: 'Vietnam - Korea University of Information and Communication Technology (VKU)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
