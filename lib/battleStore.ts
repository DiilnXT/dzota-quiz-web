// Store for Battle Rooms in memory with automatic expiration
// - Room lobby valid for 5 minutes (300 seconds)
// - Completed battle results retained for 2 hours (7200 seconds)

export interface BattlePlayer {
  id: string
  name: string
  avatar?: string
  isHost?: boolean
  joinedAt: number
  submitted?: boolean
  score?: number
  correctCount?: number
  totalQuestions?: number
  durationSeconds?: number
  submittedAt?: number
}

export interface BattleRoom {
  id: string
  quizId: string
  quizTitle: string
  maxPlayers: number
  status: 'waiting' | 'in_progress' | 'completed' | 'expired'
  createdAt: number
  expiresAt: number // 5 minutes after creation if still waiting
  startedAt?: number
  completedAt?: number
  resultExpiresAt?: number // 2 hours after completion
  questions?: any[] // Synced questions so all players battle the exact same test
  players: BattlePlayer[]
}

declare global {
  var dzotaBattleRooms: Map<string, BattleRoom> | undefined
}

const getStore = (): Map<string, BattleRoom> => {
  if (!globalThis.dzotaBattleRooms) {
    globalThis.dzotaBattleRooms = new Map<string, BattleRoom>()
  }
  return globalThis.dzotaBattleRooms
}

// Cleanup expired rooms
export const cleanExpiredBattles = () => {
  const store = getStore()
  const now = Date.now()

  for (const [id, room] of store.entries()) {
    // 1. If still waiting and passed 5 mins -> expire
    if (room.status === 'waiting' && now > room.expiresAt) {
      store.delete(id)
      continue
    }
    // 2. If completed and passed 2 hours -> delete
    if (room.status === 'completed' && room.resultExpiresAt && now > room.resultExpiresAt) {
      store.delete(id)
      continue
    }
    // 3. Any room older than 3 hours overall -> clean up
    if (now - room.createdAt > 3 * 3600 * 1000) {
      store.delete(id)
    }
  }
}

export const createBattleRoom = (
  quizId: string,
  quizTitle: string,
  maxPlayers: number,
  hostPlayer: { id: string; name: string; avatar?: string },
  questions?: any[]
): BattleRoom => {
  cleanExpiredBattles()
  const store = getStore()

  // Generate 6-digit numeric room code (e.g. 582914)
  let roomId = Math.floor(100000 + Math.random() * 900000).toString()
  while (store.has(roomId)) {
    roomId = Math.floor(100000 + Math.random() * 900000).toString()
  }

  const now = Date.now()
  const newRoom: BattleRoom = {
    id: roomId,
    quizId,
    quizTitle: quizTitle || 'Bài Thi',
    maxPlayers: Math.max(2, Math.min(maxPlayers || 2, 50)),
    status: 'waiting',
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    questions: questions || undefined,
    players: [
      {
        id: hostPlayer.id,
        name: hostPlayer.name || 'Người chơi 1',
        avatar: hostPlayer.avatar || '',
        isHost: true,
        joinedAt: now
      }
    ]
  }

  store.set(roomId, newRoom)
  return newRoom
}

export const getBattleRoom = (roomId: string): BattleRoom | null => {
  cleanExpiredBattles()
  const store = getStore()
  const room = store.get(roomId)
  if (!room) return null

  // Check 5 min expiration if still waiting
  if (room.status === 'waiting' && Date.now() > room.expiresAt) {
    room.status = 'expired'
    store.delete(roomId)
    return null
  }
  return room
}

export const joinBattleRoom = (
  roomId: string,
  player: { id: string; name: string; avatar?: string }
): { success: boolean; error?: string; room?: BattleRoom } => {
  cleanExpiredBattles()
  const room = getBattleRoom(roomId)
  if (!room) {
    return { success: false, error: 'Phòng thi đấu không tồn tại hoặc đã hết hạn 5 phút!' }
  }

  if (room.status !== 'waiting') {
    return { success: false, error: 'Trận thi đấu đã bắt đầu hoặc đã kết thúc!' }
  }

  // Check if player is already in room
  const existingIndex = room.players.findIndex(p => p.id === player.id)
  if (existingIndex >= 0) {
    room.players[existingIndex].name = player.name || room.players[existingIndex].name
    room.players[existingIndex].avatar = player.avatar || room.players[existingIndex].avatar
    return { success: true, room }
  }

  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: `Phòng đã đủ số lượng người (${room.maxPlayers}/${room.maxPlayers})!` }
  }

  room.players.push({
    id: player.id,
    name: player.name || `Người chơi ${room.players.length + 1}`,
    avatar: player.avatar || '',
    isHost: false,
    joinedAt: Date.now()
  })

  return { success: true, room }
}

export const startBattleRoom = (roomId: string, hostPlayerId: string): { success: boolean; error?: string; room?: BattleRoom } => {
  const room = getBattleRoom(roomId)
  if (!room) return { success: false, error: 'Phòng không tồn tại!' }

  const host = room.players.find(p => p.id === hostPlayerId)
  if (!host || !host.isHost) {
    return { success: false, error: 'Chỉ chủ phòng mới có quyền bắt đầu thi đấu!' }
  }

  if (room.players.length < 2) {
    return { success: false, error: 'Cần ít nhất 2 người tham gia để bắt đầu thi đấu!' }
  }

  room.status = 'in_progress'
  room.startedAt = Date.now()
  return { success: true, room }
}

export const submitBattleResult = (
  roomId: string,
  playerId: string,
  result: {
    score: number
    correctCount: number
    totalQuestions: number
    durationSeconds: number
  }
): { success: boolean; error?: string; room?: BattleRoom } => {
  const store = getStore()
  const room = store.get(roomId)
  if (!room) return { success: false, error: 'Phòng không tồn tại!' }

  const player = room.players.find(p => p.id === playerId)
  if (!player) return { success: false, error: 'Người chơi không có trong phòng này!' }

  player.submitted = true
  player.score = Number(result.score) || 0
  player.correctCount = Number(result.correctCount) || 0
  player.totalQuestions = Number(result.totalQuestions) || 0
  player.durationSeconds = Number(result.durationSeconds) || 0
  player.submittedAt = Date.now()

  // Sort players by score (desc), then durationSeconds (asc)
  room.players.sort((a, b) => {
    if (!a.submitted && !b.submitted) return 0
    if (!a.submitted) return 1
    if (!b.submitted) return -1
    // Higher score first
    if ((b.score ?? 0) !== (a.score ?? 0)) {
      return (b.score ?? 0) - (a.score ?? 0)
    }
    // Faster time first
    return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0)
  })

  // Check if all players submitted
  const allDone = room.players.every(p => p.submitted)
  if (allDone) {
    room.status = 'completed'
    room.completedAt = Date.now()
    room.resultExpiresAt = Date.now() + 2 * 60 * 60 * 1000 // 2 hours
  }

  return { success: true, room }
}

export const getQuizBattleHistory = (quizId: string): BattleRoom[] => {
  cleanExpiredBattles()
  const store = getStore()
  const now = Date.now()
  const results: BattleRoom[] = []

  for (const room of store.values()) {
    if (room.quizId === quizId && (room.status === 'completed' || room.players.some(p => p.submitted))) {
      // Must be within 2 hours
      const refTime = room.completedAt || room.createdAt
      if (now - refTime <= 2 * 3600 * 1000) {
        results.push(room)
      }
    }
  }

  return results.sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt))
}
