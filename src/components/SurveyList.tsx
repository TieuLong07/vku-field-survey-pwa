import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Wrench,
  Eye,
  X,
  Inbox
} from 'lucide-react';
import type { SurveyRecord } from '../types/survey';

interface SurveyListProps {
  surveys: SurveyRecord[];
  onDelete: (id: number) => Promise<void>;
  onClearSynced: () => Promise<void>;
}

export const SurveyList: React.FC<SurveyListProps> = ({
  surveys,
  onDelete,
  onClearSynced
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const pendingList = surveys.filter((s) => s.status === 'pending');
  const syncedList = surveys.filter((s) => s.status === 'synced');

  return (
    <div className="space-y-4 pb-20">
      {/* Summary stats bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">Dữ liệu khảo sát trên thiết bị</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: <strong className="text-slate-800">{surveys.length}</strong> bản ghi (
            <span className="text-amber-600 font-bold">{pendingList.length} chờ</span>,{' '}
            <span className="text-emerald-600 font-bold">{syncedList.length} đã gửi</span>)
          </p>
        </div>

        {syncedList.length > 0 && (
          <button
            onClick={onClearSynced}
            className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 active:scale-95 transition"
          >
            Dọn dẹp đã gửi
          </button>
        )}
      </div>

      {/* Empty State */}
      {surveys.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Chưa có bản ghi khảo sát nào</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Hãy chuyển sang tab &quot;Khảo sát mới&quot; để thực hiện kiểm tra và lưu ngoại tuyến.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((item) => (
            <div
              key={item.id || item.uuid}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition hover:shadow-md"
            >
              {/* Top row: Status Badge & Time */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                <div className="flex items-center gap-1.5">
                  {item.status === 'synced' ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã đồng bộ
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Chờ đồng bộ
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{item.formattedTime}</span>
                </div>
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Building className="w-3.5 h-3.5 text-[#0054A6]" />
                  <span>
                    <strong>{item.building}</strong> - {item.room}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  <Wrench className="w-3.5 h-3.5 text-[#0054A6]" />
                  <span>{item.equipment}</span>
                </div>

                <div className="col-span-2 flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                  <span className="text-slate-500">Tình trạng:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                      item.condition === 'Bình thường'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.condition === 'Cần bảo trì'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.condition}
                  </span>
                </div>

                {item.notes && (
                  <div className="col-span-2 text-slate-600 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                    <span className="font-semibold text-slate-700">Ghi chú:</span> {item.notes}
                  </div>
                )}

                <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <MapPin className="w-3 h-3 text-[#F37021]" />
                  <span>
                    {item.gps.latitude}, {item.gps.longitude} (±{item.gps.accuracy || 0}m)
                  </span>
                </div>
              </div>

              {/* Bottom Actions: Photo preview & Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {item.photoBase64 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(item.photoBase64)}
                    className="flex items-center gap-1 text-xs text-[#0054A6] hover:text-[#003366] font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem ảnh ({item.photoSizeKB || 0} KB)</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Không kèm ảnh</span>
                )}

                <button
                  type="button"
                  onClick={() => item.id && onDelete(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition active:scale-95"
                  title="Xóa bản ghi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 bg-black/60 text-white hover:bg-black/90 p-2 rounded-full backdrop-blur-md transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Ảnh hiện trường khảo sát phóng to"
              className="w-full max-h-[75vh] object-contain"
            />
            <div className="p-3 bg-slate-950 text-center text-xs text-slate-400">
              Ảnh nén tối ưu định dạng JPEG lưu trữ trên IndexedDB
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
