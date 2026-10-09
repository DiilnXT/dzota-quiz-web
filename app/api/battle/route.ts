import { NextResponse } from 'next/server'
import {
  createBattleRoom,
  getBattleRoom,
  joinBattleRoom,
  startBattleRoom,
  submitBattleResult,
  getQuizBattleHistory
} from '@/lib/battleStore'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const quizId = searchParams.get('quizId')
    const history = searchParams.get('history')

    if (history && quizId) {
      const historyList = getQuizBattleHistory(quizId)
      return NextResponse.json({ success: true, history: historyList })
    }

    if (roomId) {
      const room = getBattleRoom(roomId)
      if (!room) {
        return NextResponse.json({ success: false, error: 'Phòng không tồn tại hoặc đã hết hạn 5 phút!' }, { status: 404 })
      }
      return NextResponse.json({ success: true, room })
    }

    return NextResponse.json({ error: 'Missing roomId or quizId' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const { quizId, quizTitle, maxPlayers, hostPlayer, questions } = body
      if (!quizId || !hostPlayer) {
        return NextResponse.json({ error: 'Thiếu thông tin tạo phòng' }, { status: 400 })
      }
      const room = createBattleRoom(quizId, quizTitle, maxPlayers, hostPlayer, questions)
      return NextResponse.json({ success: true, room })
    }

    if (action === 'join') {
      const { roomId, player } = body
      if (!roomId || !player) {
        return NextResponse.json({ error: 'Thiếu mã phòng hoặc thông tin người chơi' }, { status: 400 })
      }
      const result = joinBattleRoom(roomId, player)
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, room: result.room })
    }

    if (action === 'start') {
      const { roomId, hostPlayerId } = body
      if (!roomId || !hostPlayerId) {
        return NextResponse.json({ error: 'Thiếu thông tin bắt đầu' }, { status: 400 })
      }
      const result = startBattleRoom(roomId, hostPlayerId)
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, room: result.room })
    }

    if (action === 'submit') {
      const { roomId, playerId, result } = body
      if (!roomId || !playerId || !result) {
        return NextResponse.json({ error: 'Thiếu thông tin nộp bài' }, { status: 400 })
      }
      const submitRes = submitBattleResult(roomId, playerId, result)
      if (!submitRes.success) {
        return NextResponse.json({ success: false, error: submitRes.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, room: submitRes.room })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
