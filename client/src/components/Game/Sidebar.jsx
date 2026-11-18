import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Send, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';

function getLogColorClass(message) {
  const lower = message.toLowerCase();
  if (lower.includes('stole') || lower.includes('deal breaker') || lower.includes('sly deal') || lower.includes('forced deal')) {
    return 'text-zinc-200 font-bold';
  }
  if (lower.includes('just say no')) {
    return 'text-amber-400 font-bold';
  }
  if (lower.includes('paid') || lower.includes('rent') || lower.includes('debt collector') || lower.includes('birthday')) {
    return 'text-emerald-400';
  }
  if (lower.includes('banked')) {
    return 'text-sky-300';
  }
  if (lower.includes('game over') || lower.includes('won')) {
    return 'text-white font-extrabold bg-white/10 px-1 rounded';
  }
  if (lower.includes('started their turn') || lower.includes('pass go')) {
    return 'text-zinc-200';
  }
  return 'text-zinc-400';
}

export default function Sidebar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    chatMessages,
    sendChatMessage,
    gameState,
    playerName,
    unreadChatCount
  } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const bottomRef = useRef(null);

  // Combine player messages and gameState.log into one unified timeline
  const combinedFeed = React.useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Initial/Game logs from gameState
    if (gameState?.log) {
      for (const logItem of gameState.log) {
        if (!seenIds.has(logItem.id)) {
          seenIds.add(logItem.id);
          list.push({
            id: logItem.id,
            isSystem: true,
            message: logItem.message,
            timestamp: logItem.time,
            timeMs: parseInt(logItem.id, 10) || 0
          });
        }
      }
    }

    // 2. Chat messages (both player chats & streamed system events)
    for (const chat of chatMessages) {
      if (!seenIds.has(chat.id)) {
        seenIds.add(chat.id);
        list.push({
          id: chat.id,
          isSystem: chat.isSystem,
          senderName: chat.senderName,
          senderId: chat.senderId,
          message: chat.message,
          timestamp: chat.timestamp,
          timeMs: parseInt(chat.id, 10) || 0
        });
      }
    }

    // Sort chronologically ascending (older at top, newest at bottom)
    list.sort((a, b) => a.timeMs - b.timeMs);
    return list.slice(-150);
  }, [gameState?.log, chatMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isSidebarOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combinedFeed.length, isSidebarOpen]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage.trim());
    setInputMessage('');
  };

  return (
    <>
      {/* SIDE ARROW TOGGLE BUTTON ATTACHED TO RIGHT EDGE OF PAGE */}
      <button
        onClick={toggleSidebar}
        title={isSidebarOpen ? 'Close Log & Chat' : 'Open Log & Chat'}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#06190f] hover:bg-[#0a2818] text-white border-l-2 border-y-2 border-emerald-800/80 hover:border-emerald-400 rounded-l-xl px-2 py-3.5 shadow-2xl flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
          isSidebarOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <ChevronLeft className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] font-extrabold uppercase [writing-mode:vertical-lr] tracking-widest text-emerald-300">
          LOG &amp; CHAT
        </span>
        {unreadChatCount > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-1 ring-black shadow-sm" />
        )}
      </button>

      {/* UNIFIED LOG & CHAT SIDEBAR DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-[#06190f]/95 border-l-2 border-emerald-800/80 backdrop-blur-md shadow-2xl flex flex-col font-mono animate-slide-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-900/60 bg-[#04130b]/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-xs font-extrabold tracking-widest text-white uppercase">
                LOG &amp; CHAT STREAM
              </span>
            </div>

            <button
              onClick={closeSidebar}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px]"
              title="Close Log & Chat"
            >
              <span>HIDE</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unified Feed Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-zinc-950">
            {combinedFeed.length === 0 ? (
              <div className="text-center text-zinc-600 text-xs italic py-16">
                No activity yet. Game events and chat will stream here!
              </div>
            ) : (
              combinedFeed.map((item) => {
                if (item.isSystem) {
                  // System Log Message with Color-Coded Styling
                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-900 text-xs leading-snug"
                    >
                      <div className="text-[9px] text-zinc-600 mb-0.5 font-bold">
                        SYSTEM [{item.timestamp}]
                      </div>
                      <div className={getLogColorClass(item.message)}>
                        {item.message}
                      </div>
                    </div>
                  );
                }

                // Player Chat Message
                const isMe = item.senderName === playerName;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mb-0.5 font-mono">
                      <span className={`font-bold ${isMe ? 'text-zinc-200' : 'text-zinc-400'}`}>
                        {isMe ? 'YOU' : item.senderName}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words leading-relaxed ${
                        isMe
                          ? 'bg-white text-black font-semibold shadow-xs'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {item.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat Input at bottom */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-zinc-800 bg-black flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send message to room..."
              maxLength={200}
              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-white focus:outline-none px-3 py-2 rounded-lg text-xs text-white font-mono placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 text-black rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
