import React, { useState, useEffect } from 'react';
import { X, Save, Link2, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { getWebhookUrl, setWebhookUrl, DEFAULT_WEBHOOK_URL } from '../services/syncService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getWebhookUrl() || DEFAULT_WEBHOOK_URL);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setWebhookUrl(url);
    setSavedSuccess(true);
    onSave();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#0054A6]">
            <Link2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-800">Cài đặt Webhook Google Sheets</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Apps Script Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0054A6]/20 focus:border-[#0054A6]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nhập Webhook URL đã triển khai dưới dạng Web App từ Google Sheets.
            </p>
          </div>

          {/* Quick guide box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#0054A6]">
              <HelpCircle className="w-4 h-4" />
              <span>Cách lấy Webhook URL:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
              <li>Mở Google Sheet mới -&gt; Tiện ích mở rộng -&gt; Apps Script.</li>
              <li>Dán mã nguồn từ file <code className="bg-blue-100 px-1 rounded">google-apps-script/Code.gs</code>.</li>
              <li>Nhấn Triển khai (Deploy) -&gt; Tùy chọn triển khai mới (Web app).</li>
              <li>Chọn quyền truy cập: <strong className="text-slate-800">Bất kỳ ai (Anyone)</strong>.</li>
              <li>Copy Web app URL và dán vào ô trên.</li>
            </ol>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
              <Check className="w-4 h-4" />
              <span>Đã lưu URL Webhook thành công!</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0054A6] hover:bg-[#003366] rounded-xl shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
