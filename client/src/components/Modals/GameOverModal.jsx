import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home } from 'lucide-react';
import { playVictorySound } from '../../utils/audio';

export default function GameOverModal({
  winner,
  selfName,
  onPlayAgain
}) {
  if (!winner) return null;

  const isMe = winner.name === selfName;

  useEffect(() => {
    playVictorySound();
    // Fire celebratory monochrome/silver/gold confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#a1a1aa', '#e4e4e7', '#f43f5e', '#eab308']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono animate-fade-in">
      <div className="bg-zinc-950 border-2 border-white/60 rounded-2xl max-w-md w-full p-8 text-center shadow-[0_0_50px_rgba(255,255,255,0.2)] relative">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-black shadow-xl">
          <Trophy className="w-8 h-8 fill-black" />
        </div>

        <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
          GAME OVER
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 uppercase tracking-wider">
          {isMe ? 'YOU WON THE GAME!' : `${winner.name} WON!`}
        </h2>

        <p className="text-xs text-zinc-400 mt-2 mb-6">
          Completed 3 full property sets and conquered the board!
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            className="py-3 px-6 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
