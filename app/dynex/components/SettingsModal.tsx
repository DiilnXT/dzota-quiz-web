'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { 
  getStoredApiKey, 
  setStoredApiKey, 
  getStoredModel, 
  setStoredModel,
  DEFAULT_MODEL,
  AVAILABLE_MODELS 
} from '../services/geminiService'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: (config: { apiKey: string; model: string }) => void
}

export default function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey())
      setSelectedModel(getStoredModel())
      setTestStatus(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    setStoredApiKey(apiKey)
    setStoredModel(selectedModel)
    if (onSaved) onSaved({ apiKey, model: selectedModel })
    onClose()
  }

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus({ success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra!' })
      return
    }
    setIsTesting(true)
    setTestStatus(null)

    const actualModel = (selectedModel === 'gemini-flash-3.6' || selectedModel === 'gemini-2.5-flash')
      ? 'gemini-3.6-flash'
      : (selectedModel || DEFAULT_MODEL)

    const modelsToTry = [actualModel, 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-2.0-flash']
    let lastError = null
    let successModel = null

    for (const m of [...new Set(modelsToTry)]) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Trả lời ngắn gọn chữ: OK' }] }]
            })
          }
        )
        if (res.ok) {
          successModel = m
          break
        } else {
          const data = await res.json().catch(() => ({}))
          lastError = data.error?.message || `HTTP ${res.status}`
          if (res.status === 404 || lastError.includes('no longer available') || lastError.includes('not found')) {
            continue
          } else {
            throw new Error(lastError)
          }
        }
      } catch (err: any) {
        lastError = err.message
        if (err.message.includes('API key')) throw err
      }
    }

    setIsTesting(false)
    if (successModel) {
      setSelectedModel(successModel)
      setStoredModel(successModel)
      setTestStatus({
        success: true,
        message: `Kết nối thành công với ${successModel}! Gemini AI hoạt động hoàn hảo.`
      })
    } else {
      setTestStatus({
        success: false,
        message: `Lỗi kết nối: ${lastError || 'Không thể gọi API'}`
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-600/40 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Cấu Hình Trí Tuệ Nhân Tạo DYNEX
              </h3>
              <p className="text-xs text-slate-400">
                Gemini Vision AI Engine nhận diện nhãn giải phẫu tự động
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Google Gemini API Key <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán mã khóa AIzaSy... của bạn vào đây"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                Khóa được lưu bảo mật cục bộ tại trình duyệt của bạn
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                Lấy API Key Miễn Phí <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Chọn Mô Hình Trí Tuệ Nhân Tạo (Gemini Flash)
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedModel === model.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="geminiModel"
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={() => setSelectedModel(model.id)}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white">{model.name}</div>
                      <div className="text-xs text-slate-400 font-mono">ID: {model.id}</div>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Đang kích hoạt
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                testStatus.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
