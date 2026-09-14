import type { GPSLocation } from '../types/survey';

// Tọa độ trung tâm khuôn viên Trường Đại học CNTT & TT Việt - Hàn (VKU)
export const VKU_DEFAULT_COORDS: GPSLocation = {
  latitude: 15.97526,
  longitude: 108.25317,
  accuracy: 10,
  timestamp: Date.now()
};

export interface GeolocationResult {
  location: GPSLocation;
  isMock: boolean;
  error?: string;
}

/**
 * Gets high-accuracy GPS coordinates via Geolocation API
 */
export async function getCurrentGPSPosition(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({
        location: VKU_DEFAULT_COORDS,
        isMock: true,
        error: 'Trình duyệt không hỗ trợ Geolocation API'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          location: {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Math.round(position.coords.accuracy),
            timestamp: position.timestamp
          },
          isMock: false
        });
      },
      (error) => {
        let errorMsg = 'Không thể lấy tọa độ GPS';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Quyền truy cập vị trí bị từ chối';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Không có tín hiệu vị trí GPS';
            break;
          case error.TIMEOUT:
            errorMsg = 'Hết thời gian chờ định vị GPS';
            break;
        }

        // Return fallback VKU coordinate with small jitter for testing
        const jitterLat = (Math.random() - 0.5) * 0.0008;
        const jitterLng = (Math.random() - 0.5) * 0.0008;
        resolve({
          location: {
            latitude: Number((VKU_DEFAULT_COORDS.latitude + jitterLat).toFixed(6)),
            longitude: Number((VKU_DEFAULT_COORDS.longitude + jitterLng).toFixed(6)),
            accuracy: 15,
            timestamp: Date.now()
          },
          isMock: true,
          error: errorMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  });
}
