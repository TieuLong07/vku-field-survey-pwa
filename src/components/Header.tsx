import React from 'react';
import { Wifi, WifiOff, RefreshCw, Settings, Database, CloudUpload } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  pendingCount,
  isSyncing,
  onSyncNow,
  onOpenSettings
}) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#003366] via-[#0054A6] to-[#004080] text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Top row: Brand & Status Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1.5 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
              <span className="font-black text-amber-400 text-lg tracking-wider">VKU</span>
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                VKU Field Survey
                <span className="text-[10px] uppercase font-semibold bg-amber-400/90 text-blue-950 px-1.5 py-0.5 rounded shadow-sm">
                  PWA
                </span>
              </h1>
              <p className="text-xs text-blue-100 font-medium">Khảo sát cơ sở vật chất khuôn viên</p>
            </div>
          </div>

          {/* Connection Status & Settings */}
          <div className="flex items-center space-x-2">
            {/* Online/Offline Badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm transition-all duration-300 ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-blue-100 hover:text-white"
              title="Cài đặt Webhook"
              aria-label="Cài đặt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Pending Queue & Sync Action */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-blue-100">Chờ đồng bộ:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                pendingCount > 0
                  ? 'bg-amber-400 text-blue-950 shadow-sm animate-bounce'
                  : 'bg-white/15 text-blue-100'
              }`}
            >
              {pendingCount} bản ghi
            </span>
          </div>

          <button
            onClick={onSyncNow}
            disabled={!isOnline || isSyncing || pendingCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all shadow-sm ${
              !isOnline || pendingCount === 0
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : isSyncing
                ? 'bg-amber-500 text-white cursor-wait'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 font-bold hover:brightness-105 active:scale-95'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đồng bộ...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Đồng bộ ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
