import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Copy, Check, BookOpen, LogOut, Wifi, WifiOff, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import RulesModal from './RulesModal';
import { toggleAudioMute, getAudioMuted, startBgm } from '../../utils/audio';

export default function Header() {
  const {
    roomCode,
    connected,
    playerName,
    leaveRoom,
    gameState,
    toggleSidebar,
    unreadChatCount,
    isSidebarOpen
  } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [commentary, setCommentary] = useState(null);
  const [commentaryVisible, setCommentaryVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(getAudioMuted());

  const gameStarted = gameState && gameState.status !== 'waiting';

  useEffect(() => {
    if (gameStarted && !isMuted) {
      startBgm();
    }
  }, [gameStarted]);

  useEffect(() => {
    if (gameState?.latestCommentary?.text) {
      // Remove any emojis to keep commentary sleek and typographic
      const cleanText = gameState.latestCommentary.text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
      setCommentary(cleanText);
      setCommentaryVisible(true);
      const timer = setTimeout(() => {
        setCommentaryVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.latestCommentary?.id]);

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const muted = toggleAudioMute();
    setIsMuted(muted);
  };

  return (
    <>
      <header className="border-b border-emerald-950/80 bg-[#04140b]/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-mono">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-white tracking-widest text-sm uppercase">
              MONOPOLY<span className="text-zinc-500 font-normal">DEAL</span>
            </span>
          </div>

          {gameState && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
              EDITION: <span className="text-zinc-200 uppercase">{gameState.edition || 'BASE'}</span>
            </span>
          )}
        </div>

        {/* Center: Action Commentary (when playing) OR Room Code Quick Copy (when in lobby) */}
        {gameStarted ? (
          <div className="flex-1 max-w-xl mx-2 sm:mx-6 flex items-center justify-center">
            {commentaryVisible && commentary ? (
              <div className="w-full bg-zinc-950 border border-white/60 rounded-lg px-3 py-1 flex items-center justify-center gap-2 text-center animate-fade-in shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <span className="w-2 h-2 rounded-full bg-white animate-ping flex-shrink-0" />
                <span className="font-extrabold text-white text-xs sm:text-sm truncate tracking-wide">
                  {commentary}
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase hidden sm:block">
                MONOPOLY DEAL • MATCH IN PROGRESS
              </div>
            )}
          </div>
        ) : roomCode ? (
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md">
            <span className="text-zinc-500 font-bold tracking-wider text-[11px]">ROOM:</span>
            <span className="font-bold text-white tracking-widest text-xs sm:text-sm">{roomCode}</span>
            <button
              onClick={copyRoomCode}
              title="Copy Room Code"
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : null}

        {/* Right: User status, Rules, Sound, Chat & Leave */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {playerName && (
            <div className="hidden md:flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500">PLAYER:</span>
              <span className="font-bold text-white truncate max-w-[100px]">{playerName}</span>
            </div>
          )}

          {/* Connection status indicator */}
          <div title={connected ? 'Connected to server' : 'Disconnected'} className="flex items-center">
            {connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
            )}
          </div>

          {/* Sound / Music Mute Toggle Button */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Audio & BGM' : 'Mute Audio & BGM'}
            className={`p-1.5 rounded border transition-colors cursor-pointer flex items-center justify-center ${
              !isMuted
                ? 'bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500'
                : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {!isMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>

          {/* Chat & Event Log Toggle Button */}
          {gameState && (
            <button
              onClick={() => toggleSidebar('chat')}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                isSidebarOpen
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOG & CHAT</span>
              {unreadChatCount > 0 && !isSidebarOpen && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black animate-pulse shadow-sm" />
              )}
            </button>
          )}

          {/* Rules Button */}
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 transition-colors text-[11px] cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">RULES</span>
          </button>

          {/* Leave Room Button */}
          {gameState && (
            <button
              onClick={leaveRoom}
              title="Leave Room"
              className="flex items-center gap-1 p-1.5 rounded bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </>
  );
}
