import React, { useEffect, useState } from 'react';

export default function CommentaryToast({ commentary }) {
  const [visible, setVisible] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    if (!commentary || !commentary.text) return;
    if (commentary.id === currentId) return;

    setCurrentId(commentary.id);
    setCurrentText(commentary.text);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 3200);

    return () => clearTimeout(timer);
  }, [commentary, currentId]);

  if (!visible || !currentText) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-slide-down">
      <div className="bg-zinc-950/95 border-2 border-white/60 text-white font-mono px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2.5 backdrop-blur-md max-w-xl text-center">
        <span className="w-2 h-2 rounded-full bg-white animate-ping flex-shrink-0" />
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          {currentText}
        </span>
      </div>
    </div>
  );
}
