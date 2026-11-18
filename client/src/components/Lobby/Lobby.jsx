import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Play, Copy, Check, ArrowRight, Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function Lobby() {
  const {
    createRoom,
    joinRoom,
    startGame,
    gameState,
    roomCode,
    errorMessage,
    clearError,
    connected
  } = useSocket();

  const [name, setName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('base');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isHost = gameState?.players?.find(p => p.id === gameState?.players[0]?.id)?.isHost;
  const selfPlayer = gameState?.players?.find(p => p.name === name);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    clearError();
    setLoading(true);
    try {
      await createRoom(name.trim(), selectedEdition);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !inputCode.trim()) return;
    clearError();
    setLoading(true);
    try {
      await joinRoom(inputCode.trim().toUpperCase(), name.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    clearError();
    setLoading(true);
    try {
      await startGame();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If already in a room waiting for game to start:
  if (gameState && gameState.status === 'waiting') {
    const playerCount = gameState.players.length;
    const canStart = playerCount >= 2 && playerCount <= 5;
    const currentPlayerIsHost = gameState.players[0]?.id === selfPlayer?.id || gameState.players.some(p => p.isHost && p.name === name);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-2xl relative">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
              PRIVATE GAME ROOM
            </span>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white bg-zinc-900 px-5 py-2 rounded-lg border border-zinc-700">
                {roomCode}
              </span>
              <button
                onClick={copyCode}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Share this code with your friends to join (2 to 5 players).
            </p>
          </div>

          {/* Players List */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-bold uppercase">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-400" />
                PLAYERS IN ROOM ({playerCount}/5)
              </span>
              <span className="text-zinc-500 font-normal">Min: 2 | Max: 5</span>
            </div>

            <div className="space-y-2">
              {gameState.players.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold text-xs">{idx + 1}.</span>
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    {p.name === name && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                        YOU
                      </span>
                    )}
                  </div>
                  {p.isHost && (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                      <Shield className="w-3 h-3" /> HOST
                    </span>
                  )}
                </div>
              ))}

              {Array.from({ length: 5 - playerCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="px-4 py-2.5 border border-dashed border-zinc-800/80 rounded-lg text-zinc-600 text-xs flex items-center justify-center italic"
                >
                  Waiting for player {playerCount + idx + 1}...
                </div>
              ))}
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Start Action */}
          {currentPlayerIsHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart || loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                canStart && !loading
                  ? 'bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-lg'
                  : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {playerCount < 2 ? 'NEED AT LEAST 2 PLAYERS TO START' : 'START GAME'}
            </button>
          ) : (
            <div className="text-center py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-xs flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Waiting for the host to start the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Initial Join / Create Room Screen
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-widest text-white uppercase mb-2">
          MONOPOLY<span className="text-zinc-500 font-normal">DEAL</span>
        </h1>
        <p className="text-xs text-zinc-400 tracking-wider uppercase">
          FAST-PACED PROPERTY TRADING CARD GAME
        </p>
      </div>

      <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-6">
        {/* Nickname Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            YOUR NICKNAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Satoshi"
            maxLength={18}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-white focus:outline-none px-3.5 py-2.5 rounded-lg text-white text-sm font-mono transition-colors"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode 1: Create Room */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="mb-3">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              SELECT EDITION
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedEdition('base')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded border uppercase tracking-wider transition-colors ${
                  selectedEdition === 'base'
                    ? 'border-white bg-zinc-900 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                CLASSIC BASE
              </button>
              <button
                type="button"
                disabled
                title="Coming in future update"
                className="py-1.5 px-2 text-[10px] font-bold rounded border border-zinc-900 bg-black text-zinc-700 uppercase tracking-wider cursor-not-allowed opacity-60"
              >
                HARRY POTTER
              </button>
              <button
                type="button"
                disabled
                title="Coming in future update"
                className="py-1.5 px-2 text-[10px] font-bold rounded border border-zinc-900 bg-black text-zinc-700 uppercase tracking-wider cursor-not-allowed opacity-60"
              >
                NO MERCY
              </button>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading || !connected}
            className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            CREATE PRIVATE ROOM
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            OR JOIN EXISTING
          </span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Mode 2: Join Room with Code */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              ROOM CODE
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. M8K2P"
                maxLength={6}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-white focus:outline-none px-3.5 py-2.5 rounded-lg text-white text-sm font-mono uppercase tracking-widest transition-colors"
              />
              <button
                onClick={handleJoin}
                disabled={!name.trim() || !inputCode.trim() || loading || !connected}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
              >
                JOIN <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
