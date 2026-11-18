import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('md_playerName') || '');
  const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem('md_roomCode') || '');
  const [errorMessage, setErrorMessage] = useState('');

  // Chat & Sidebar states
  const [chatMessages, setChatMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' or 'log'
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Zoomed Card Viewer state
  const [zoomedCard, setZoomedCard] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    // Connect to server (custom environment variable, localhost port 3001, or same origin)
    const serverUrl = import.meta.env.VITE_SERVER_URL || (
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:3001`
        : window.location.origin
    );

    const newSocket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to server with ID:', newSocket.id);
      setConnected(true);

      // Re-join if we have stored session
      const savedCode = sessionStorage.getItem('md_roomCode');
      const savedName = sessionStorage.getItem('md_playerName');
      if (savedCode && savedName) {
        newSocket.emit('join_room', { roomCode: savedCode, playerName: savedName }, (res) => {
          if (res?.error) {
            sessionStorage.removeItem('md_roomCode');
            setRoomCode('');
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('game_state_update', (state) => {
      setGameState(state);
      if (state.roomCode) {
        setRoomCode(state.roomCode);
        sessionStorage.setItem('md_roomCode', state.roomCode);
      }
    });

    newSocket.on('new_chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      // Only indicate when actual players send chat messages (never for server/system logs or own messages)
      const isPlayerMessage = !msg.isSystem && msg.senderName !== 'SYSTEM' && msg.senderId !== newSocket.id;
      if (isPlayerMessage) {
        setIsSidebarOpen((isOpen) => {
          if (!isOpen) {
            setUnreadChatCount((count) => count + 1);
          }
          return isOpen;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const clearError = useCallback(() => setErrorMessage(''), []);

  const emitWithPromise = useCallback((eventName, payload = {}) => {
    return new Promise((resolve, reject) => {
      if (!socket || !socket.connected) {
        setErrorMessage('Not connected to game server.');
        return reject(new Error('Not connected to game server.'));
      }
      socket.emit(eventName, payload, (res) => {
        if (res && res.error) {
          setErrorMessage(res.error);
          reject(new Error(res.error));
        } else {
          resolve(res);
        }
      });
    });
  }, [socket]);

  const createRoom = useCallback(async (name, edition = 'base') => {
    setPlayerName(name);
    sessionStorage.setItem('md_playerName', name);
    const res = await emitWithPromise('create_room', { playerName: name, edition });
    return res;
  }, [emitWithPromise]);

  const joinRoom = useCallback(async (code, name) => {
    setPlayerName(name);
    sessionStorage.setItem('md_playerName', name);
    const res = await emitWithPromise('join_room', { roomCode: code, playerName: name });
    return res;
  }, [emitWithPromise]);

  const sendChatMessage = useCallback(async (message) => {
    if (!message || !message.trim()) return;
    return emitWithPromise('send_chat_message', { message });
  }, [emitWithPromise]);

  const openSidebar = useCallback((tab = 'chat') => {
    setIsSidebarOpen(true);
    setSidebarTab(tab);
    if (tab === 'chat') {
      setUnreadChatCount(0);
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback((tab = 'chat') => {
    setIsSidebarOpen((prev) => {
      if (!prev) {
        setSidebarTab(tab);
        if (tab === 'chat') setUnreadChatCount(0);
        return true;
      }
      return false;
    });
  }, []);

  const startGame = useCallback(() => emitWithPromise('start_game'), [emitWithPromise]);
  const pickHighCard = useCallback((cardIndex) => emitWithPromise('pick_high_card', { cardIndex }), [emitWithPromise]);
  const autoPickHighCard = useCallback(() => emitWithPromise('auto_pick_high_card'), [emitWithPromise]);
  const finishDeckCut = useCallback(() => emitWithPromise('finish_deck_cut'), [emitWithPromise]);
  const drawCards = useCallback(() => emitWithPromise('draw_cards'), [emitWithPromise]);
  const playToBank = useCallback((cardId) => emitWithPromise('play_to_bank', { cardId }), [emitWithPromise]);
  const playProperty = useCallback((cardId, chosenColor) => emitWithPromise('play_property', { cardId, chosenColor }), [emitWithPromise]);
  const moveWildcard = useCallback((cardId, fromColor, toColor) => emitWithPromise('move_wildcard', { cardId, fromColor, toColor }), [emitWithPromise]);
  const playBuilding = useCallback((cardId, targetColor) => emitWithPromise('play_building', { cardId, targetColor }), [emitWithPromise]);
  const playPassGo = useCallback((cardId) => emitWithPromise('play_pass_go', { cardId }), [emitWithPromise]);
  const playRent = useCallback((cardId, chosenColor, doubleRentCardId, targetPlayerId) => 
    emitWithPromise('play_rent', { cardId, chosenColor, doubleRentCardId, targetPlayerId }), [emitWithPromise]);
  const playDealBreaker = useCallback((cardId, targetPlayerId, targetColor) => 
    emitWithPromise('play_deal_breaker', { cardId, targetPlayerId, targetColor }), [emitWithPromise]);
  const playSlyDeal = useCallback((cardId, targetPlayerId, targetCardId, targetColor) => 
    emitWithPromise('play_sly_deal', { cardId, targetPlayerId, targetCardId, targetColor }), [emitWithPromise]);
  const playForcedDeal = useCallback((cardId, targetPlayerId, myCardId, myColor, theirCardId, theirColor) => 
    emitWithPromise('play_forced_deal', { cardId, targetPlayerId, myCardId, myColor, theirCardId, theirColor }), [emitWithPromise]);
  const playDebtCollector = useCallback((cardId, targetPlayerId) => 
    emitWithPromise('play_debt_collector', { cardId, targetPlayerId }), [emitWithPromise]);
  const playBirthday = useCallback((cardId) => emitWithPromise('play_birthday', { cardId }), [emitWithPromise]);
  const respondJustSayNo = useCallback((cardId) => emitWithPromise('respond_just_say_no', { cardId }), [emitWithPromise]);
  const resolveReaction = useCallback((accepted = true) => emitWithPromise('resolve_reaction', { accepted }), [emitWithPromise]);
  const submitPayment = useCallback((paymentItems) => emitWithPromise('submit_payment', { paymentItems }), [emitWithPromise]);
  const discardCards = useCallback((cardIds) => emitWithPromise('discard_cards', { cardIds }), [emitWithPromise]);
  const endTurn = useCallback(() => emitWithPromise('end_turn'), [emitWithPromise]);

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem('md_roomCode');
    setGameState(null);
    setRoomCode('');
    window.location.reload();
  }, []);

  const value = {
    socket,
    connected,
    gameState,
    playerName,
    roomCode,
    errorMessage,
    clearError,
    createRoom,
    joinRoom,
    startGame,
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
    // Chat & Sidebar
    chatMessages,
    sendChatMessage,
    isSidebarOpen,
    sidebarTab,
    setSidebarTab,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    unreadChatCount,
    // Zoomed Card Viewer
    zoomedCard,
    setZoomedCard,
    hoveredCard,
    setHoveredCard
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
