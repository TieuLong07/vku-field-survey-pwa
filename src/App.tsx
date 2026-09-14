import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, ListFilter, ClipboardCheck } from 'lucide-react';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { SurveyList } from './components/SurveyList';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import {
  addSurvey,
  getAllSurveys,
  getPendingCount,
  deleteSurvey,
  clearSyncedSurveys
} from './db/database';
import { syncUnsyncedSurveys } from './services/syncService';
import type { SurveyRecord, BuildingType, EquipmentType, ConditionType, GPSLocation } from './types/survey';

export function App() {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reload survey records and pending count from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [allList, pending] = await Promise.all([getAllSurveys(), getPendingCount()]);
      setSurveys(allList);
      setPendingCount(pending);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu từ IndexedDB:', err);
    }
  }, []);

  // Trigger sync process
  const triggerSync = useCallback(async (isAuto = false) => {
    if (!navigator.onLine) {
      if (!isAuto) {
        addToast('warning', 'Đang ngoại tuyến', 'Không thể đồng bộ khi không có kết nối internet.');
      }
      return;
    }

    try {
      setIsSyncing(true);
      const result = await syncUnsyncedSurveys();
      await refreshData();

      if (result.syncedCount > 0) {
        addToast(
          'success',
          'Đồng bộ thành công!',
          `Đã đồng bộ ${result.syncedCount} bản ghi lên Google Sheets và dọn bộ nhớ cục bộ.`
        );
      } else if (!isAuto) {
        addToast('info', 'Thông báo đồng bộ', result.message);
      }
    } catch (err) {
      console.error('Lỗi khi thực hiện đồng bộ:', err);
      addToast('error', 'Đồng bộ thất bại', (err as Error).message || 'Vui lòng kiểm tra lại cấu hình.');
    } finally {
      setIsSyncing(false);
    }
  }, [refreshData]);

  // Listen to network status & auto-sync when back online
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('info', 'Đã kết nối Internet', 'Thiết bị đã trực tuyến trở lại. Bắt đầu tự động đồng bộ...');
      // Kích hoạt đồng bộ tự động theo yêu cầu đề bài
      triggerSync(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('warning', 'Mất kết nối Internet', 'Ứng dụng đã chuyển sang chế độ Offline-First.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    refreshData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, refreshData]);

  // Handle new survey submission
  const handleSurveySubmit = async (formData: {
    building: BuildingType;
    room: string;
    equipment: EquipmentType;
    condition: ConditionType;
    notes: string;
    gps: GPSLocation;
    photoBase64: string;
    photoSizeKB: number;
  }) => {
    const now = new Date();
    const formattedVNTime = now.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newRecord: Omit<SurveyRecord, 'id'> = {
      uuid: 'vku-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now(),
      createdAt: now.toISOString(),
      formattedTime: formattedVNTime,
      building: formData.building,
      room: formData.room,
      equipment: formData.equipment,
      condition: formData.condition,
      notes: formData.notes,
      gps: formData.gps,
      photoBase64: formData.photoBase64,
      photoSizeKB: formData.photoSizeKB,
      status: 'pending'
    };

    // 1. Lưu thẳng vào IndexedDB (luôn đảm bảo Offline-First)
    await addSurvey(newRecord);
    await refreshData();

    if (!isOnline) {
      addToast(
        'warning',
        'Đã lưu ngoại tuyến (Offline)',
        'Dữ liệu và ảnh đã lưu an toàn vào IndexedDB thiết bị. Sẽ tự động đồng bộ khi có mạng.'
      );
      setActiveTab('list');
    } else {
      addToast('info', 'Đã lưu cục bộ', 'Đang gửi đồng bộ lên Google Sheets...');
      // 2. Nếu online, thực hiện đồng bộ ngay
      await triggerSync(false);
      setActiveTab('list');
    }
  };

  const handleDeleteSurvey = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi khảo sát này?')) {
      await deleteSurvey(id);
      await refreshData();
      addToast('info', 'Đã xóa bản ghi', 'Bản ghi đã được xóa khỏi bộ nhớ máy.');
    }
  };

  const handleClearSynced = async () => {
    const count = await clearSyncedSurveys();
    await refreshData();
    addToast('info', 'Dọn dẹp thành công', `Đã xóa ${count} bản ghi đã đồng bộ.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 pb-16">
      {/* Top Header */}
      <Header
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={() => triggerSync(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              activeTab === 'new'
                ? 'bg-white text-[#0054A6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Khảo sát mới</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all relative ${
              activeTab === 'list'
                ? 'bg-white text-[#0054A6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Hàng đợi & Lịch sử</span>
            {pendingCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* View Switch */}
        {activeTab === 'new' ? (
          <SurveyForm isOnline={isOnline} onSubmit={handleSurveySubmit} />
        ) : (
          <SurveyList
            surveys={surveys}
            onDelete={handleDeleteSurvey}
            onClearSynced={handleClearSynced}
          />
        )}
      </main>

      {/* Bottom Sticky Tab Bar for mobile */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 py-1.5 px-6 flex items-center justify-around sm:hidden">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            activeTab === 'new' ? 'text-[#0054A6]' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          <span>Tạo mới</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center text-[10px] font-bold relative ${
            activeTab === 'list' ? 'text-[#0054A6]' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <ClipboardCheck className="w-5 h-5 mb-0.5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <span>Danh sách</span>
        </button>
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => addToast('success', 'Đã cập nhật', 'URL Webhook Google Sheets đã được lưu.')}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
