// Store for Battle Rooms with PostgreSQL (Prisma SystemSetting) persistence and automatic expiration
// - Room lobby valid for 5 minutes (300 seconds)
// - Completed battle results retained for 2 hours (7200 seconds)
// - Dual storage: PostgreSQL DB for cross-serverless synchronization + memory cache fallback

import prisma from '@/lib/prisma'

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

const ROOM_PREFIX = 'battle_room_'

// Helper: Save room to both DB and memory cache
async function saveRoomToStorage(room: BattleRoom): Promise<void> {
  const store = getStore()
  store.set(room.id, room)
  try {
    await prisma.systemSetting.upsert({
      where: { key: ROOM_PREFIX + room.id },
      update: { value: JSON.stringify(room) },
      create: { key: ROOM_PREFIX + room.id, value: JSON.stringify(room) }
    })
  } catch (err) {
    console.warn('Battle DB save fallback to memory:', err)
  }
}

// Helper: Retrieve room from DB (primary) or memory cache (fallback)
async function getRoomFromStorage(roomId: string): Promise<BattleRoom | null> {
  const store = getStore()
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: ROOM_PREFIX + roomId }
    })
    if (record?.value) {
      const room = JSON.parse(record.value) as BattleRoom
      store.set(roomId, room)
      return room
    }
  } catch (err) {
    console.warn('Battle DB read fallback to memory:', err)
  }
  return store.get(roomId) || null
}

// Helper: Delete room from both DB and memory
async function deleteRoomFromStorage(roomId: string): Promise<void> {
  const store = getStore()
  store.delete(roomId)
  try {
    await prisma.systemSetting.delete({
      where: { key: ROOM_PREFIX + roomId }
    }).catch(() => {})
  } catch (err) {
    // Ignore error if already deleted
  }
}

// Cleanup expired rooms
export const cleanExpiredBattles = async () => {
  const now = Date.now()
  const store = getStore()

  // 1. Cleanup in-memory
  for (const [id, room] of store.entries()) {
    if (room.status === 'waiting' && now > room.expiresAt) {
      store.delete(id)
      continue
    }
    if (room.status === 'completed' && room.resultExpiresAt && now > room.resultExpiresAt) {
      store.delete(id)
      continue
    }
    if (now - room.createdAt > 3 * 3600 * 1000) {
      store.delete(id)
    }
  }

  // 2. Cleanup in DB (best-effort)
  try {
    const records = await prisma.systemSetting.findMany({
      where: { key: { startsWith: ROOM_PREFIX } }
    })
    for (const r of records) {
      try {
        const room = JSON.parse(r.value) as BattleRoom
        if (
          (room.status === 'waiting' && now > room.expiresAt) ||
          (room.status === 'completed' && room.resultExpiresAt && now > room.resultExpiresAt) ||
          (now - room.createdAt > 3 * 3600 * 1000)
        ) {
          await deleteRoomFromStorage(room.id)
        }
      } catch (e) {}
    }
  } catch (e) {}
}

export const createBattleRoom = async (
  quizId: string,
  quizTitle: string,
  maxPlayers: number,
  hostPlayer: { id: string; name: string; avatar?: string },
  questions?: any[]
): Promise<BattleRoom> => {
  // Generate 6-digit numeric room code (e.g. 582914)
  let roomId = Math.floor(100000 + Math.random() * 900000).toString()
  let attempts = 0
  while (attempts < 10) {
    const existing = await getRoomFromStorage(roomId)
    if (!existing) break
    roomId = Math.floor(100000 + Math.random() * 900000).toString()
    attempts++
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

  await saveRoomToStorage(newRoom)
  return newRoom
}

export const getBattleRoom = async (roomId: string): Promise<BattleRoom | null> => {
  const room = await getRoomFromStorage(roomId)
  if (!room) return null

  // Check 5 min expiration if still waiting
  if (room.status === 'waiting' && Date.now() > room.expiresAt) {
    await deleteRoomFromStorage(roomId)
    return null
  }

  // Check 2h expiration if completed
  if (room.status === 'completed' && room.resultExpiresAt && Date.now() > room.resultExpiresAt) {
    await deleteRoomFromStorage(roomId)
    return null
  }

  return room
}

export const joinBattleRoom = async (
  roomId: string,
  player: { id: string; name: string; avatar?: string }
): Promise<{ success: boolean; error?: string; room?: BattleRoom }> => {
  const room = await getBattleRoom(roomId)
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
    await saveRoomToStorage(room)
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

  await saveRoomToStorage(room)
  return { success: true, room }
}

export const startBattleRoom = async (
  roomId: string,
  hostPlayerId: string
): Promise<{ success: boolean; error?: string; room?: BattleRoom }> => {
  const room = await getBattleRoom(roomId)
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
  await saveRoomToStorage(room)
  return { success: true, room }
}

export const submitBattleResult = async (
  roomId: string,
  playerId?: string,
  playerName?: string,
  result?: {
    score: number
    correctCount: number
    totalQuestions: number
    durationSeconds: number
  }
): Promise<{ success: boolean; error?: string; room?: BattleRoom }> => {
  const room = await getBattleRoom(roomId)
  if (!room) return { success: false, error: 'Phòng không tồn tại hoặc đã hết hạn!' }
  if (!result) return { success: false, error: 'Thiếu kết quả làm bài!' }

  // 1. Try finding by playerId
  let player = playerId ? room.players.find(p => p.id === playerId) : undefined

  // 2. Fallback: try finding by playerName
  if (!player && playerName) {
    player = room.players.find(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase())
  }

  // 3. Fallback: try finding first unsubmitted player or single player
  if (!player) {
    player = room.players.find(p => !p.submitted) || room.players[0]
  }

  if (!player) {
    return { success: false, error: 'Không tìm thấy thông tin thí sinh trong phòng!' }
  }

  player.submitted = true
  player.score = Number(result.score) || 0
  player.correctCount = Number(result.correctCount) || 0
  player.totalQuestions = Number(result.totalQuestions) || 0
  player.durationSeconds = Number(result.durationSeconds) || 0
  player.submittedAt = Date.now()

  // Always mark completedAt & resultExpiresAt so the battle is recorded in history immediately!
  room.completedAt = room.completedAt || Date.now()
  room.resultExpiresAt = Date.now() + 2 * 60 * 60 * 1000 // 2 hours

  // Sort players: submitted first, higher score first, lower duration first
  room.players.sort((a, b) => {
    if (!a.submitted && !b.submitted) return 0
    if (!a.submitted) return 1
    if (!b.submitted) return -1
    if ((b.score ?? 0) !== (a.score ?? 0)) {
      return (b.score ?? 0) - (a.score ?? 0)
    }
    return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0)
  })

  // If all players submitted
  const allDone = room.players.every(p => p.submitted)
  if (allDone) {
    room.status = 'completed'
  }

  await saveRoomToStorage(room)
  return { success: true, room }
}

export const getQuizBattleHistory = async (quizId?: string | null): Promise<BattleRoom[]> => {
  const now = Date.now()
  const results: BattleRoom[] = []

  try {
    const records = await prisma.systemSetting.findMany({
      where: { key: { startsWith: ROOM_PREFIX } }
    })
    for (const r of records) {
      try {
        const room = JSON.parse(r.value) as BattleRoom
        // Cleanup expired
        if (room.status === 'waiting' && now > room.expiresAt) {
          await deleteRoomFromStorage(room.id)
          continue
        }
        const refTime = room.completedAt || room.createdAt
        if (now - refTime > 2 * 3600 * 1000) {
          await deleteRoomFromStorage(room.id)
          continue
        }

        // Include any room where at least 1 person submitted or completed
        const hasSubmissions = (room.players || []).some(p => p.submitted)
        if (hasSubmissions || room.status === 'completed') {
          if (quizId && quizId !== 'all' && quizId !== 'default') {
            if (room.quizId === quizId) {
              results.push(room)
            }
          } else {
            results.push(room)
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    // Memory fallback
    const store = getStore()
    for (const room of store.values()) {
      const refTime = room.completedAt || room.createdAt
      if (now - refTime <= 2 * 3600 * 1000) {
        const hasSubmissions = (room.players || []).some(p => p.submitted)
        if (hasSubmissions || room.status === 'completed') {
          if (quizId && quizId !== 'all' && quizId !== 'default') {
            if (room.quizId === quizId) results.push(room)
          } else {
            results.push(room)
          }
        }
      }
    }
  }

  // If user searched for a specific quizId and found nothing, fallback to all recent battles within 2h
  if (results.length === 0 && quizId && quizId !== 'all' && quizId !== 'default') {
    return getQuizBattleHistory('all')
  }

  return results.sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt))
}

