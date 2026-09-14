# VKU Field Survey PWA 🏛️📱

> **Mini-Project 1**: Ứng dụng PWA khảo sát cơ sở vật chất khuôn viên Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU) hoạt động theo cơ chế **Offline-First**, sẵn sàng đóng gói sang Android APK bằng **Capacitor Bridge**.

---

## 📌 1. Giới thiệu tổng quan

Khi thực hiện kiểm kê, khảo sát cơ sở vật chất tại các giảng đường, phòng thí nghiệm kín hoặc tầng hầm khuôn viên VKU, tín hiệu Wi-Fi và mạng di động 4G/5G thường xuyên bị gián đoạn. Ứng dụng **VKU Field Survey PWA** được xây dựng để giải quyết triệt để bài toán này:
- **Offline-First:** Người dùng vẫn có thể nhập biểu mẫu khảo sát, lấy tọa độ GPS, chụp ảnh hiện trường và lưu trữ an toàn mà không cần kết nối mạng.
- **Tự động đồng bộ (Auto-Sync):** Ngay khi thiết bị có mạng trở lại (`online` event), hệ thống tự động đẩy toàn bộ bản ghi tồn đọng lên Google Sheets qua Google Apps Script Webhook.

---

## 🚀 2. Tính năng kỹ thuật nổi bật

1. **PWA App Shell Caching (Workbox):**
   - Sử dụng `vite-plugin-pwa` cấu hình Service Worker nạp trước toàn bộ mã nguồn JS/CSS, Web Manifest và icon.
   - Ứng dụng mở tức thì ngay cả khi mất mạng hoàn toàn (Zero Network), không bị "trắng trang".

2. **Lưu trữ IndexedDB (Dexie.js):**
   - Cơ sở dữ liệu cục bộ `VKUSurveyDB` với bảng `surveys`.
   - Vượt qua giới hạn 5MB của LocalStorage, hỗ trợ lưu trữ nhiều bản ghi kèm ảnh Base64 nén mượt mà trên tiến trình bất đồng bộ (Non-blocking Async).

3. **Phần cứng & Cảm biến thiết bị:**
   - **Định vị GPS:** Geolocation Web API với `enableHighAccuracy: true` tự động ghi nhận vĩ độ, kinh độ và sai số (±meters) với nút làm mới tức thì.
   - **Camera chụp ảnh hiện trường:** Sử dụng `<input type="file" accept="image/*" capture="environment" />` mở camera sau thiết bị di động.
   - **Nén ảnh tự động qua HTML5 Canvas:** Tự động điều chỉnh kích thước tối đa 1200px và nén định dạng JPEG xuống **< 150KB** trước khi chuyển thành Base64 lưu vào IndexedDB.

4. **Đồng bộ hóa Serverless (Google Apps Script):**
   - File `google-apps-script/Code.gs` nhận dữ liệu qua hàm `doPost(e)` sử dụng `LockService` chống ghi đè đồng thời.
   - Tự động thêm các cột: `[Thời gian, Khu nhà, Phòng, Thiết bị, Tình trạng, Ghi chú, Tọa độ GPS, Ảnh chụp]`.

5. **Xuất Báo cáo Kỹ thuật (.docx):**
   - Tự động sinh file tài liệu Word `VKU_Survey_Technical_Report.docx` (2–4 trang) đầy đủ 5 phần chuyên môn bằng thư viện `docx`.

---

## 🛠️ 3. Hướng dẫn cài đặt và chạy ứng dụng

### Yêu cầu môi trường
- Node.js >= 18.0.0
- npm hoặc yarn/pnpm

### Các bước khởi chạy
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển (Development)
npm run dev

# 3. Biên dịch bản phát hành sản phẩm (Production Build)
npm run build

# 4. Chạy script tạo Báo cáo Kỹ thuật Word (.docx)
npm run generate-report
```

---

## 📊 4. Hướng dẫn thiết lập Google Sheets & Apps Script Webhook

1. Mở trang tính Google Sheets mới: [sheets.new](https://sheets.new) và đặt tên: **VKU_Field_Survey_Data**.
2. Trên thanh menu, chọn: **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
3. Dán toàn bộ nội dung trong tệp [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) vào trình soạn thảo Apps Script và nhấn **Lưu** (Ctrl + S).
4. Nhấp vào nút **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**.
5. Chọn loại: **Ứng dụng web (Web app)**:
   - **Mô tả:** `VKU Survey Sync API v1`
   - **Thực thi dưới dạng (Execute as):** `Tôi (Me)`
   - **Ai có quyền truy cập (Who has access):** `Bất kỳ ai (Anyone)`
6. Nhấn **Triển khai**, tiến hành cấp quyền truy cập tài khoản Google của bạn.
7. Sao chép **URL ứng dụng web** (có định dạng `https://script.google.com/macros/s/.../exec`).
8. Mở ứng dụng VKU Survey PWA, bấm vào biểu tượng **Bánh răng (Cài đặt)** ở góc phải Header, dán URL trên vào và nhấn **Lưu cấu hình**.

---

## 📱 5. Lộ trình tuần tới: Đóng gói Android APK bằng Capacitor Bridge

Kiến trúc ứng dụng được đóng gói tĩnh hoàn toàn trong thư mục `dist/`, sẵn sàng chuyển đổi thành ứng dụng Android Native:

```bash
# 1. Cài đặt Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Khởi tạo cấu hình Capacitor
npx cap init "VKU Survey" vn.edu.vku.survey --web-dir dist

# 3. Thêm nền tảng Android
npx cap add android

# 4. Sao chép mã nguồn web sang thư mục Android Native
npm run build
npx cap copy

# 5. Mở dự án trong Android Studio để xuất file APK
npx cap open android
```

---

## 👨‍💻 Tác giả & Đơn vị đào tạo
- **Dự án:** Mini-Project 1 - VKU Field Survey PWA
- **Trường:** Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU), Đại học Đà Nẵng
- **Năm học:** 2026
