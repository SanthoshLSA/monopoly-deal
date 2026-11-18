import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Header from './components/Common/Header';
import Lobby from './components/Lobby/Lobby';
import GameView from './components/Game/GameView';

function MainContent() {
  const { gameState } = useSocket();
  const isInGame = gameState && gameState.status !== 'waiting';

  return (
    <div className={`h-screen max-h-screen overflow-hidden bg-felt text-zinc-100 flex flex-col font-mono selection:bg-emerald-400 selection:text-black`}>
      <Header />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!isInGame ? (
          <Lobby />
        ) : (
          <GameView />
        )}
      </main>
      {!isInGame && (
        <footer className="py-2 px-4 border-t border-zinc-900 bg-black text-center text-[10px] text-zinc-600 font-mono flex-shrink-0">
          MONOPOLY DEAL // ONLINE • MINIMALIST BLACK & WHITE EDITION • BUILT WITH NODE.JS & REACT
        </footer>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-mono">
          <div className="border border-red-800 bg-red-950/40 p-6 rounded-xl max-w-lg text-center shadow-2xl">
            <h2 className="text-red-400 font-extrabold text-base mb-2 uppercase tracking-wider">
              GAME RENDER ERROR
            </h2>
            <p className="text-zinc-300 text-xs mb-4 font-mono break-words">
              {this.state.error?.message || "An unexpected error occurred while rendering the game."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black text-xs font-extrabold rounded uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              RELOAD GAME
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <MainContent />
      </SocketProvider>
    </ErrorBoundary>
  );
}
