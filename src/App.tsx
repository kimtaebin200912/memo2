import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  Copy, 
  Download, 
  Check, 
  PenSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SyncStatus } from './types';

export default function App() {
  // Core text content
  const [content, setContent] = useState<string>('');
  
  // App state managers
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Reference for holds on debounce timers
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const STORAGE_KEY = 'autosave_notepad_content_fallback';

  // 1. Initial Load: Retrieve locally backed-up text
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setContent(saved);
    }
    setLastSaved(new Date());
    setSyncStatus('idle');
  }, []);

  // 2. Safe local store operation
  const saveToLocal = (text: string) => {
    setSyncStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, text);
      setLastSaved(new Date());
      setSyncStatus('saved');
    } catch (e) {
      setSyncStatus('error');
    }
  };

  // 3. Handle live input with debounced autosave trigger
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setContent(newVal);
    setSyncStatus('typing');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveToLocal(newVal);
    }, 1000);
  };

  // 4. Force immediate persistence (Ctrl+S or blur)
  const forceImmediateSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    saveToLocal(content);
  };

  // Use hotkey (Cmd/Ctrl + S) to force instant cache save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceImmediateSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const handleBlur = () => {
    if (syncStatus === 'typing') {
      forceImmediateSave();
    }
  };

  // Handle visual clipboard copy action
  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 중 오류 발생:', err);
    }
  };

  // Download current memory buffer as raw .txt file
  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    link.href = url;
    link.download = `노트_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safely blank the board
  const handleClear = () => {
    if (!content) return;
    if (window.confirm('정말 작성한 내용을 모두 비우시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setContent('');
      saveToLocal('');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2c2c2c] flex flex-col relative transition-colors duration-300">
      
      {/* 1. TOP UTILITY LINE */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none select-none">
        
        {/* Minimal title on top-left */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <PenSquare className="w-4 h-4 text-stone-600" />
          <span className="text-xs font-semibold tracking-wider text-stone-800 font-mono">
            노트
          </span>
        </div>

        {/* Dynamic actions on top-right */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button 
            onClick={handleCopy}
            disabled={!content}
            className="p-1.5 px-3 rounded-lg hover:bg-[#eae8e3] text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-150 flex items-center space-x-1.5 text-xs font-medium border border-transparent hover:border-[#dedcd7] outline-none cursor-pointer"
            title="텍스트 복사하기"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-scale" />
                <span className="text-emerald-700 font-semibold">복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>복사</span>
              </>
            )}
          </button>

          <button 
            onClick={handleDownload}
            disabled={!content}
            className="p-1.5 px-3 rounded-lg hover:bg-[#eae8e3] text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-150 flex items-center space-x-1.5 text-xs font-medium border border-transparent hover:border-[#dedcd7] outline-none cursor-pointer"
            title="텍스트 파일로 내보내기 (.txt)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>내보내기</span>
          </button>

          <button 
            onClick={handleClear}
            disabled={!content}
            className="p-1.5 px-3 rounded-lg hover:bg-rose-50/50 hover:text-rose-600 text-stone-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition-all duration-150 flex items-center space-x-1.5 text-xs font-medium border border-transparent hover:border-rose-100/50 outline-none cursor-pointer"
            title="전체 비우기"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>비우기</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CENTER UTILITY WRITING PAD (ZEN MODE) */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto px-6 sm:px-12 pt-24 pb-16 z-10" id="notepad-core-frame">
        
        {/* DISTRACTION-FREE TEXTAREA */}
        <div className="flex-1 flex flex-col relative" id="notepad-input-space">
          <textarea
            ref={textareaRef}
            id="notepad-core-textarea"
            value={content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            spellCheck={true}
            placeholder="이곳에 자유롭게 기록하세요. 타이핑을 멈추면 브라우저에 안전히 자동 저장되며, 오타는 브라우저 맞춤법 검사기로 즉시 표시됩니다."
            className="w-full flex-1 bg-transparent text-stone-800 placeholder-stone-300 focus:outline-none resize-none text-[19px] sm:text-[22px] font-light leading-relaxed tracking-wide min-h-[350px] border-none select-text"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>
      </div>

      {/* 3. FLOATING STATUS FOOTER */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none select-none text-[11px] font-mono text-stone-400">
        
        {/* Word / Char Counter on bottom-left */}
        <div className="font-sans font-medium">
          <span>{content.replace(/\s+/g, '').length}자 (공백 포함 {content.length}자)</span>
        </div>

        {/* Micro-Autosave indicator status list on bottom-right */}
        <div className="pointer-events-auto">
          <AnimatePresence mode="wait">
            {syncStatus === 'typing' && (
              <motion.span 
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="text-amber-600 font-medium"
              >
                입력 중...
              </motion.span>
            )}
            {syncStatus === 'saving' && (
              <motion.span 
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="text-stone-500 font-medium whitespace-nowrap"
              >
                자동 저장 중...
              </motion.span>
            )}
            {syncStatus === 'saved' && (
              <motion.span 
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="text-emerald-600 font-semibold"
              >
                ✓ 저장 완료
              </motion.span>
            )}
            {syncStatus === 'error' && (
              <motion.span 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                exit={{ opacity: 0 }}
                className="text-rose-600 font-semibold"
              >
                ⚠ 저장 실패
              </motion.span>
            )}
            {syncStatus === 'idle' && (
              <motion.span 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="text-stone-400 whitespace-nowrap"
              >
                {lastSaved 
                  ? `${lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 저장됨`
                  : '대기 중'
                }
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
