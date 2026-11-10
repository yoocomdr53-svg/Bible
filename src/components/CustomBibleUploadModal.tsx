import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  decodeBibleFile,
  parseBibleFullText,
  registerCustomBibleVersion,
  extractBookFromFileName
} from '../services/bibleApiService';

interface CustomBibleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (versionName: string) => void;
  defaultTargetVersion?: string;
}

export const CustomBibleUploadModal: React.FC<CustomBibleUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTargetVersion = '킹제임스흠정역'
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultTargetVersion);
  const [customName, setCustomName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState<string>('');
  const [parsedSummary, setParsedSummary] = useState<{
    chaptersCount: number;
    versesCount: number;
    booksCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const parsedDataRef = useRef<Record<string, any> | null>(null);

  if (!isOpen) return null;

  const targetVersionName = selectedPreset === '직접입력' ? customName.trim() || '사용자 성경' : selectedPreset;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setStatusMessage('파일을 읽고 인코딩을 분석하는 중입니다...');
    setParsedSummary(null);

    try {
      const mergedGrouped: Record<string, any> = {};
      const detectedBooks = new Set<string>();
      let totalVerses = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusMessage(`파일 분석 중 (${i + 1}/${files.length}): ${file.name}`);
        const text = await decodeBibleFile(file);
        const guessedBook = extractBookFromFileName ? extractBookFromFileName(file.name) || '창세기' : '창세기';
        const parsed = parseBibleFullText(text, guessedBook);

        for (const [key, val] of Object.entries(parsed)) {
          mergedGrouped[key] = val;
          detectedBooks.add(val.bookName);
          totalVerses += val.verses.length;
        }
      }

      const totalChapters = Object.keys(mergedGrouped).length;
      if (totalChapters === 0 || totalVerses === 0) {
        setStatusMessage('⚠️ 파일에서 성경 구절을 인식하지 못했습니다. 형식(예: [창세기 1:1] 말씀...)을 확인해 주세요.');
        setIsProcessing(false);
        return;
      }

      parsedDataRef.current = mergedGrouped;
      setParsedSummary({
        chaptersCount: totalChapters,
        versesCount: totalVerses,
        booksCount: detectedBooks.size
      });
      setStatusMessage(`✅ 분석 완료: 총 ${detectedBooks.size}개 권, ${totalChapters}개 장, ${totalVerses.toLocaleString()}개 절이 준비되었습니다.`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`❌ 파일 처리 중 오류: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteAnalyze = () => {
    if (!pasteContent.trim()) {
      alert('성경 텍스트를 입력해 주세요.');
      return;
    }
    setIsProcessing(true);
    try {
      const parsed = parseBibleFullText(pasteContent, '창세기');
      const totalChapters = Object.keys(parsed).length;
      let totalVerses = 0;
      const books = new Set<string>();

      for (const val of Object.values(parsed)) {
        totalVerses += val.verses.length;
        books.add(val.bookName);
      }

      if (totalChapters === 0 || totalVerses === 0) {
        setStatusMessage('⚠️ 텍스트에서 성경 구절을 인식하지 못했습니다. (예: 창세기 1:1 태초에 하나님이...)');
        setIsProcessing(false);
        return;
      }

      parsedDataRef.current = parsed;
      setParsedSummary({
        chaptersCount: totalChapters,
        versesCount: totalVerses,
        booksCount: books.size
      });
      setStatusMessage(`✅ 분석 완료: 총 ${books.size}개 권, ${totalChapters}개 장, ${totalVerses.toLocaleString()}개 절`);
    } catch (err: any) {
      setStatusMessage(`❌ 텍스트 분석 오류: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAndApply = async () => {
    if (!parsedDataRef.current || Object.keys(parsedDataRef.current).length === 0) {
      alert('먼저 성경 텍스트 파일을 분석해 주세요.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('성경 본문을 기기에 안전하게 영구 저장하는 중입니다...');

    try {
      await registerCustomBibleVersion(targetVersionName, parsedDataRef.current);
      alert(`[${targetVersionName}] 성경 역본이 등록되었습니다!\n지금 바로 본문을 열람하실 수 있습니다.`);
      onSuccess(targetVersionName);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>📖</span>
              <span>소장 성경 텍스트(.txt) 등록</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              킹제임스흠정역, 직역성경, 쉬운성경 등 소장 파일을 앱에 등록합니다
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Target Version Selection */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5">
              1. 등록할 성경 역본 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {['킹제임스흠정역', '직역성경', '쉬운성경', '직접입력'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    selectedPreset === preset
                      ? 'bg-[#1b64b9] text-white border-[#1b64b9] shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            {selectedPreset === '직접입력' && (
              <input
                type="text"
                placeholder="예: 현대어성경, 원문직역본 등"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-2 w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-[#1b64b9]"
              />
            )}
          </div>

          {/* 2. Upload Mode Tabs */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5">
              2. 파일 등록 방법
            </label>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
                  activeTab === 'file' ? 'bg-white text-[#1b64b9] shadow-xs' : 'text-slate-600'
                }`}
              >
                📁 파일 선택 (.txt)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
                  activeTab === 'paste' ? 'bg-white text-[#1b64b9] shadow-xs' : 'text-slate-600'
                }`}
              >
                📋 텍스트 직접 붙여넣기
              </button>
            </div>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'file' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-[#1b64b9] bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
              >
                <UploadCloud className="w-8 h-8 text-[#1b64b9]" />
                <p className="font-bold text-slate-800 text-xs">
                  클릭하여 텍스트 파일(.txt)을 선택하거나 드래그하세요
                </p>
                <p className="text-[10.5px] text-slate-500">
                  단일 전체 통합본 파일 또는 66권 분할 파일 다중 선택 가능 (Windows ANSI / UTF-8 자동 감지)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.csv,.json"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <textarea
                rows={6}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="예:&#10;[창세기 1:1] 태초에 하나님이 천지를 창조하시니라&#10;[창세기 1:2] 땅이 혼돈하고 공허하며..."
                className="w-full p-3 border border-slate-200 rounded-xl text-[11px] font-mono focus:outline-[#1b64b9]"
              />
              <button
                type="button"
                onClick={handlePasteAnalyze}
                disabled={isProcessing}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer text-xs"
              >
                텍스트 구절 분석하기
              </button>
            </div>
          )}

          {/* Status & Summary */}
          {statusMessage && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11.5px] text-slate-700 leading-relaxed">
              {statusMessage}
            </div>
          )}

          {parsedSummary && (
            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div>
                <span className="text-[10px] text-emerald-600 block font-bold">인식된 권</span>
                <span className="text-base font-black text-emerald-900">{parsedSummary.booksCount}권</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block font-bold">인식된 장</span>
                <span className="text-base font-black text-emerald-900">{parsedSummary.chaptersCount}장</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block font-bold">총 구절 수</span>
                <span className="text-base font-black text-emerald-900">{parsedSummary.versesCount.toLocaleString()}절</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white transition cursor-pointer text-xs"
          >
            취소
          </button>
          <button
            type="button"
            disabled={isProcessing || !parsedSummary}
            onClick={handleSaveAndApply}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs text-white transition flex items-center justify-center gap-1.5 shadow-md ${
              parsedSummary && !isProcessing
                ? 'bg-[#1b64b9] hover:bg-[#15539d] cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>[{targetVersionName}] 등록하고 바로 읽기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
