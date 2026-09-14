import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  RefreshCw,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  DoorOpen,
  Wrench,
  Image as ImageIcon,
  X
} from 'lucide-react';
import type { BuildingType, EquipmentType, ConditionType, GPSLocation } from '../types/survey';
import { getCurrentGPSPosition, VKU_DEFAULT_COORDS } from '../utils/geolocation';
import { compressImage } from '../utils/imageCompressor';

interface SurveyFormProps {
  isOnline: boolean;
  onSubmit: (formData: {
    building: BuildingType;
    room: string;
    equipment: EquipmentType;
    condition: ConditionType;
    notes: string;
    gps: GPSLocation;
    photoBase64: string;
    photoSizeKB: number;
  }) => Promise<void>;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ isOnline, onSubmit }) => {
  // Form fields
  const [building, setBuilding] = useState<BuildingType>('Khu V');
  const [room, setRoom] = useState<string>('V.A101');
  const [equipment, setEquipment] = useState<EquipmentType>('Máy chiếu');
  const [condition, setCondition] = useState<ConditionType>('Bình thường');
  const [notes, setNotes] = useState<string>('');

  // GPS state
  const [gps, setGps] = useState<GPSLocation>(VKU_DEFAULT_COORDS);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string>('Đang định vị...');

  // Photo state
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoSizeKB, setPhotoSizeKB] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch GPS on mount
  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = async () => {
    setIsGpsLoading(true);
    setGpsMessage('Đang lấy vị trí vệ tinh GPS...');
    try {
      const result = await getCurrentGPSPosition();
      setGps(result.location);
      if (result.isMock) {
        setGpsMessage('Tọa độ mặc định khuôn viên VKU');
      } else {
        setGpsMessage(`Chính xác: ±${result.location.accuracy || 0}m`);
      }
    } catch {
      setGpsMessage('Không thể lấy vị trí');
    } finally {
      setIsGpsLoading(false);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 1200, 150);
      setPhotoBase64(compressed.base64);
      setPhotoSizeKB(compressed.sizeKB);
    } catch (err) {
      console.error('Lỗi khi nén ảnh:', err);
      alert('Không thể xử lý ảnh: ' + (err as Error).message);
    } finally {
      setIsCompressing(false);
      // Reset input value so same photo can be reselected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = () => {
    setPhotoBase64('');
    setPhotoSizeKB(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!room.trim()) {
      alert('Vui lòng nhập tên phòng / địa điểm khảo sát');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        building,
        room: room.trim(),
        equipment,
        condition,
        notes: notes.trim(),
        gps,
        photoBase64,
        photoSizeKB
      });

      // Reset form sau khi gửi thành công
      setNotes('');
      setPhotoBase64('');
      setPhotoSizeKB(0);
    } catch (err) {
      console.error('Lỗi khi lưu khảo sát:', err);
      alert('Lỗi: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      {/* 1. Vị trí & Khu nhà */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-3 text-[#0054A6] font-semibold text-sm">
          <Building className="w-4 h-4" />
          <span>Địa điểm kiểm tra</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Khu nhà */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Khu nhà <span className="text-rose-500">*</span>
            </label>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value as BuildingType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0054A6]/20 focus:border-[#0054A6] transition"
            >
              <option value="Khu V">Khu V (Việt - Hàn)</option>
              <option value="Khu K">Khu K (Kỹ thuật)</option>
              <option value="Tòa Hành chính">Tòa Hành chính</option>
              <option value="KTX">Ký túc xá (KTX)</option>
            </select>
          </div>

          {/* Phòng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phòng / Vị trí <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="VD: V.A101, K.B204"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0054A6]/20 focus:border-[#0054A6] transition pl-8"
              />
              <DoorOpen className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Thiết bị & Tình trạng */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-3 text-[#0054A6] font-semibold text-sm">
          <Wrench className="w-4 h-4" />
          <span>Hạng mục & Hiện trạng</span>
        </div>

        <div className="space-y-3">
          {/* Thiết bị */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thiết bị cơ sở vật chất <span className="text-rose-500">*</span>
            </label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as EquipmentType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0054A6]/20 focus:border-[#0054A6] transition"
            >
              <option value="Máy chiếu">Máy chiếu (Projector)</option>
              <option value="Điều hòa">Điều hòa (Air Conditioner)</option>
              <option value="Bàn ghế">Bàn ghế học đường</option>
              <option value="Hệ thống điện">Hệ thống điện / Chiếu sáng / Ổ cắm</option>
            </select>
          </div>

          {/* Tình trạng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đánh giá tình trạng <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCondition('Bình thường')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                  condition === 'Bình thường'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Bình thường</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('Cần bảo trì')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                  condition === 'Cần bảo trì'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Wrench className="w-4 h-4 mb-1 text-amber-600" />
                <span>Cần bảo trì</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('Hư hỏng nặng')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                  condition === 'Hư hỏng nặng'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 mb-1 text-rose-600" />
                <span>Hư hỏng nặng</span>
              </button>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú chi tiết sự cố
            </label>
            <textarea
              rows={2}
              placeholder="VD: Bóng đèn chập chờn, máy chiếu nhòe màu, điều hòa chảy nước..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0054A6]/20 focus:border-[#0054A6] transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Phần cứng: Định vị GPS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#0054A6] font-semibold text-sm">
            <MapPin className="w-4 h-4 text-[#F37021]" />
            <span>Tọa độ GPS hiện trường</span>
          </div>

          <button
            type="button"
            onClick={fetchGPS}
            disabled={isGpsLoading}
            className="flex items-center gap-1 text-xs text-[#0054A6] hover:text-[#003366] font-medium bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 active:scale-95 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
          <div>
            <div className="font-mono font-medium text-slate-700">
              Vĩ độ: <span className="font-bold text-slate-900">{gps.latitude}</span> | Kinh độ:{' '}
              <span className="font-bold text-slate-900">{gps.longitude}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{gpsMessage}</div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping ml-2"></div>
        </div>
      </div>

      {/* 4. Phần cứng: Chụp ảnh hiện trường & Nén Canvas */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-[#0054A6] font-semibold text-sm">
            <Camera className="w-4 h-4 text-[#0054A6]" />
            <span>Ảnh chụp hiện trường</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Tự nén JPEG &lt; 150KB
          </span>
        </div>

        {photoBase64 ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
            <img
              src={photoBase64}
              alt="Hiện trường khảo sát"
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 flex items-center justify-between text-white text-xs">
              <span className="flex items-center gap-1 font-mono">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                Dung lượng: <strong className="text-emerald-400">{photoSizeKB} KB</strong>
              </span>
              <button
                type="button"
                onClick={removePhoto}
                className="bg-rose-600/80 hover:bg-rose-600 text-white p-1 rounded-lg backdrop-blur-sm active:scale-95 transition"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#0054A6] rounded-xl p-6 cursor-pointer bg-slate-50/60 hover:bg-blue-50/40 transition group">
            {isCompressing ? (
              <div className="flex flex-col items-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-[#0054A6] mb-2" />
                <span className="text-xs font-semibold text-[#0054A6]">Đang nén ảnh Canvas (&lt;150KB)...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100/80 text-[#0054A6] flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-[#0054A6]">
                  Chụp ảnh hoặc chọn từ thư viện
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Tự động tối ưu dung lượng cho mạng yếu
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isCompressing}
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* 5. Nút Gửi / Lưu Khảo Sát */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isCompressing}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isSubmitting || isCompressing
              ? 'bg-slate-400 cursor-wait'
              : isOnline
              ? 'bg-gradient-to-r from-[#0054A6] via-[#004080] to-[#003366] hover:brightness-110 shadow-blue-900/20'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 shadow-amber-900/20'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang lưu trữ...</span>
            </>
          ) : isOnline ? (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi khảo sát ngay (Online)</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu ngoại tuyến vào máy (Offline)</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-1.5 font-medium">
          {isOnline
            ? 'Dữ liệu được bảo toàn trong IndexedDB và tự động đồng bộ lên Google Sheets'
            : 'Mất mạng: Dữ liệu được lưu an toàn trong IndexedDB, sẽ tự đồng bộ khi có mạng'}
        </p>
      </div>
    </form>
  );
};
