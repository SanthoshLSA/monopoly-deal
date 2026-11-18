import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import OpponentArea from './OpponentArea';
import CenterTable from './CenterTable';
import MyBank from './MyBank';
import MyProperties from './MyProperties';
import MyHand from './MyHand';
import CardPreviewBox from './CardPreviewBox';
import Sidebar from './Sidebar';
import HighCardCutModal from '../Modals/HighCardCutModal';
import ActionTargetModal from '../Modals/ActionTargetModal';
import ReactionModal from '../Modals/ReactionModal';
import PaymentModal from '../Modals/PaymentModal';
import DiscardModal from '../Modals/DiscardModal';
import GameOverModal from '../Modals/GameOverModal';
import CardZoomModal from '../Modals/CardZoomModal';
import { AlertCircle } from 'lucide-react';
import {
  playDrawSound,
  playCardSnapSound,
  playCoinSound,
  playRentSound,
  playJustSayNoSound,
  playTurnStartSound
} from '../../utils/audio';

export default function GameView() {
  const {
    socket,
    gameState,
    playerName,
    errorMessage,
    clearError,
    pickHighCard,
    autoPickHighCard,
    finishDeckCut,
    drawCards,
    playToBank,
    playProperty,
    moveWildcard,
    playBuilding,
    playPassGo,
    playRent,
    playDealBreaker,
    playSlyDeal,
    playForcedDeal,
    playDebtCollector,
    playBirthday,
    respondJustSayNo,
    resolveReaction,
    submitPayment,
    discardCards,
    endTurn,
    leaveRoom,
    zoomedCard,
    setZoomedCard,
    hoveredCard
  } = useSocket();

  const [selectedCard, setSelectedCard] = useState(null);
  const [modalCard, setModalCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const selfId = socket?.id;
  const selfPlayer = gameState?.players?.find(p => p.id === selfId);
  const opponents = gameState?.players?.filter(p => p.id !== selfId) || [];
  const isMyTurn = gameState?.currentTurnPlayerId === selfId;

  // Sound chime when your turn begins
  const prevTurnPlayerIdRef = useRef(null);
  useEffect(() => {
    if (gameState?.currentTurnPlayerId && gameState.currentTurnPlayerId !== prevTurnPlayerIdRef.current) {
      if (gameState.currentTurnPlayerId === selfId) {
        playTurnStartSound();
      }
    }
    prevTurnPlayerIdRef.current = gameState?.currentTurnPlayerId;
  }, [gameState?.currentTurnPlayerId, selfId]);

  // Sound alert when an action is targeted at you
  const prevPendingActionRef = useRef(null);
  useEffect(() => {
    if (gameState?.pendingAction && gameState.pendingAction !== prevPendingActionRef.current) {
      const isTarget = gameState.pendingAction.targetPlayerIds?.includes(selfId);
      if (isTarget) {
        playJustSayNoSound();
      }
    }
    prevPendingActionRef.current = gameState?.pendingAction;
  }, [gameState?.pendingAction, selfId]);

  if (!gameState) return null;

  // Manual Card Drawing from Draw Pile
  const handleDrawCards = async () => {
    clearError();
    try {
      playDrawSound();
      await drawCards();
    } catch (err) {
      console.error(err);
    }
  };

  // Direct Card Actions
  const handleBankCard = async (card) => {
    clearError();
    try {
      playCoinSound();
      await playToBank(card.id);
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayProperty = async (card) => {
    clearError();
    if (card.type === 'wildcard') {
      setModalCard(card);
    } else {
      try {
        playCardSnapSound();
        await playProperty(card.id, card.color);
        setSelectedCard(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePlayAction = (card) => {
    clearError();
    if (card.actionType === 'pass_go') {
      playDrawSound();
      playPassGo(card.id);
      setSelectedCard(null);
    } else if (card.actionType === 'its_my_birthday') {
      playRentSound();
      playBirthday(card.id);
      setSelectedCard(null);
    } else {
      setModalCard(card);
    }
  };

  const handleModalSubmit = async (params) => {
    clearError();
    try {
      if (params.action === 'play_property') {
        playCardSnapSound();
        await playProperty(modalCard.id, params.chosenColor);
      } else if (params.action === 'play_rent') {
        playRentSound();
        await playRent(modalCard.id, params.chosenColor, params.doubleRentCardId, params.targetPlayerId);
      } else if (params.action === 'play_deal_breaker') {
        playCardSnapSound();
        await playDealBreaker(modalCard.id, params.targetPlayerId, params.targetColor);
      } else if (params.action === 'play_sly_deal') {
        playCardSnapSound();
        await playSlyDeal(modalCard.id, params.targetPlayerId, params.targetCardId, params.targetColor);
      } else if (params.action === 'play_forced_deal') {
        playCardSnapSound();
        await playForcedDeal(
          modalCard.id,
          params.targetPlayerId,
          params.myCardId,
          params.myColor,
          params.theirCardId,
          params.theirColor
        );
      } else if (params.action === 'play_debt_collector') {
        playRentSound();
        await playDebtCollector(modalCard.id, params.targetPlayerId);
      } else if (params.action === 'play_building') {
        playCardSnapSound();
        await playBuilding(modalCard.id, params.targetColor);
      }
      setModalCard(null);
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveWildcard = async (cardId, fromColor, toColor) => {
    clearError();
    try {
      playCardSnapSound();
      await moveWildcard(cardId, fromColor, toColor);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndTurn = async () => {
    clearError();
    setLoading(true);
    try {
      playCardSnapSound();
      await endTurn();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondJustSayNo = async (cardId) => {
    clearError();
    try {
      playJustSayNoSound();
      await respondJustSayNo(cardId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitPayment = async (items) => {
    clearError();
    try {
      playCoinSound();
      await submitPayment(items);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-38px)] max-h-[calc(100vh-38px)] w-full overflow-hidden flex flex-col p-2 gap-2 select-none relative font-mono">
      {/* Toast Error Alert if any */}
      {errorMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 p-2.5 bg-red-950/95 border border-red-700 rounded-lg text-red-200 text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={clearError}
            className="text-[9px] uppercase font-bold text-red-300 hover:text-white ml-2 px-1.5 py-0.5 rounded bg-red-900/60"
          >
            ✕
          </button>
        </div>
      )}


      {/* ========================================================================= */}
      {/* TOP HALF: 3 Columns — Players Left | Piles Center | Players Right         */}
      {/* ========================================================================= */}
      <div className="h-[48%] flex gap-2 min-h-0">
        
        {/* Left: Player 1 & Player 2 stacked */}
        <div className="w-[32%] h-full min-h-0">
          <OpponentArea
            slots={[0, 1]}
            opponents={opponents}
            currentTurnPlayerId={gameState.currentTurnPlayerId}
            onZoomCard={(c) => setZoomedCard(c)}
          />
        </div>

        {/* Center: Draw Pile, Discard Pile & Current Turn */}
        <div className="w-[36%] h-full min-h-0">
          <CenterTable
            gameState={gameState}
            isMyTurn={isMyTurn}
            onEndTurn={handleEndTurn}
            onDrawCards={handleDrawCards}
            onZoomCard={(c) => setZoomedCard(c)}
            loading={loading}
          />
        </div>

        {/* Right: Player 3 & Player 4 stacked */}
        <div className="w-[32%] h-full min-h-0">
          <OpponentArea
            slots={[2, 3]}
            opponents={opponents}
            currentTurnPlayerId={gameState.currentTurnPlayerId}
            onZoomCard={(c) => setZoomedCard(c)}
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BOTTOM HALF: 3 Columns (Bank&Properties | My Cards 2x4 | Preview Box)     */}
      {/* ========================================================================= */}
      <div className="h-[52%] flex gap-2 min-h-0">
        
        {/* Column 1 Bottom: My Bank (Top) & My Properties (Bottom) (~35% width) */}
        <div className="w-[35%] h-full flex flex-col gap-2 min-h-0">
          {/* Top sub-box: My Bank (~18% height, compact vault) */}
          <div className="h-[18%] min-h-0">
            <MyBank
              player={selfPlayer}
              onZoomCard={(c) => setZoomedCard(c)}
            />
          </div>

          {/* Bottom sub-box: My Properties (~82% height, spacious & scrollable) */}
          <div className="h-[82%] min-h-0">
            <MyProperties
              player={selfPlayer}
              isMyTurn={isMyTurn}
              onMoveWildcard={handleMoveWildcard}
              onZoomCard={(c) => setZoomedCard(c)}
            />
          </div>
        </div>

        {/* Column 2 Bottom: My Cards 2x4 Grid (~38% width) */}
        <div className="w-[38%] h-full min-h-0">
          <MyHand
            hand={selfPlayer?.hand || []}
            isMyTurn={isMyTurn}
            actionsRemaining={gameState.turnActionsRemaining}
            turnPhase={gameState.turnPhase}
            selectedCard={selectedCard}
            onSelectCard={(c) => setSelectedCard(c)}
            onBank={handleBankCard}
            onPlayProperty={handlePlayProperty}
            onPlayAction={handlePlayAction}
            onZoomCard={(c) => setZoomedCard(c)}
          />
        </div>

        {/* Column 3 Bottom: Dedicated Card Preview Box (~27% width) */}
        <div className="w-[27%] h-full min-h-0">
          <CardPreviewBox />
        </div>

      </div>

      {/* Cut for High Card: Spread Deck Order Selection Modal */}
      <HighCardCutModal
        isOpen={!!gameState.deckCut?.active}
        deckCut={gameState.deckCut}
        players={gameState.players || []}
        selfId={selfId}
        onPickCard={(cardIndex) => pickHighCard(cardIndex)}
        onAutoPick={() => autoPickHighCard()}
        onFinish={() => finishDeckCut()}
      />

      {/* Unified Log & Chat Sidebar with Side Arrow Button */}
      <Sidebar />

      {/* High-Resolution Zoom Modal */}
      <CardZoomModal
        zoomedItem={zoomedCard}
        onClose={() => setZoomedCard(null)}
        onBank={handleBankCard}
        onPlayProperty={handlePlayProperty}
        onPlayAction={handlePlayAction}
      />

      {/* Action Target Modal for Rent, Deal Breaker, etc. */}
      <ActionTargetModal
        isOpen={!!modalCard}
        onClose={() => setModalCard(null)}
        card={modalCard}
        hand={selfPlayer?.hand || []}
        myProperties={selfPlayer?.properties || {}}
        opponents={opponents}
        actionsRemaining={gameState.turnActionsRemaining}
        onSubmitAction={handleModalSubmit}
      />

      {/* Just Say No Defense Modal */}
      <ReactionModal
        pendingAction={gameState.pendingAction}
        playerId={selfId}
        hand={selfPlayer?.hand || []}
        onJustSayNo={(cardId) => handleRespondJustSayNo(cardId)}
        onAccept={() => resolveReaction(true)}
      />

      {/* Payment Selector Modal */}
      <PaymentModal
        pendingAction={gameState.pendingAction}
        playerId={selfId}
        askingPlayer={gameState.players.find(p => p.id === gameState.pendingAction?.sourcePlayerId)}
        bank={selfPlayer?.bank || []}
        properties={selfPlayer?.properties || {}}
        onSubmitPayment={(items) => handleSubmitPayment(items)}
        onZoomCard={(c) => setZoomedCard(c)}
      />

      {/* Discard Excess Cards Modal */}
      <DiscardModal
        isOpen={isMyTurn && gameState.turnPhase === 'discard'}
        hand={selfPlayer?.hand || []}
        onDiscardCards={(ids) => discardCards(ids)}
      />

      {/* Victory Celebration Modal */}
      <GameOverModal
        winner={gameState.winner}
        selfName={playerName}
        onPlayAgain={leaveRoom}
      />
    </div>
  );
}
