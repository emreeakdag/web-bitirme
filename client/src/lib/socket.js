import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinQuizRoom(quizId, pin, nickname, callbacks = {}, isHost = false) {
  const s = getSocket();
  if (isHost) {
    s.emit('host-join-quiz', { quizId });
  } else {
    s.emit('join-quiz', { quizId, pin, nickname, userId: callbacks.userId || null });
  }
  
  if (callbacks.onJoined) s.on('joined-success', callbacks.onJoined);
  if (callbacks.onPlayerJoined) s.on('player-joined', callbacks.onPlayerJoined);
  if (callbacks.onQuizStarted) s.on('quiz-started', callbacks.onQuizStarted);
  if (callbacks.onNewQuestion) s.on('new-question', callbacks.onNewQuestion);
  if (callbacks.onAnswerResult) s.on('answer-result', callbacks.onAnswerResult);
  if (callbacks.onLeaderboard) s.on('leaderboard-update', callbacks.onLeaderboard);
  if (callbacks.onQuizEnded) s.on('quiz-ended', callbacks.onQuizEnded);
  if (callbacks.onError) s.on('error', callbacks.onError);
  
  return s;
}

export function leaveQuizRoom(quizId) {
  const s = getSocket();
  s.emit('leave-quiz', { quizId });
}

export function joinBoardRoom(boardId, nickname) {
  const s = getSocket();
  s.emit('join-board', { boardId, nickname });
  return s;
}

export function leaveBoardRoom(boardId) {
  const s = getSocket();
  s.emit('leave-board', { boardId });
}

export function emitBoardEvent(event, data) {
  const s = getSocket();
  s.emit(event, data);
}
