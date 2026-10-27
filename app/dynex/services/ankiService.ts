// DYNEX Anki Spaced Repetition Engine (SM-2 Algorithm)
// Implements Medical Flashcard scheduling: Again (<1m), Hard (10m), Good (1d), Easy (4d)

const STORAGE_KEY_ANKI = 'dynex_anki_reviews_v1'

export interface CardReviewData {
  cardId: string
  repetitions: number
  intervalMinutes: number
  easeFactor: number
  nextReviewTimestamp: number
  lastReviewedTimestamp: number
  history?: Array<{ timestamp: number; rating: string; intervalMinutes: number }>
}

export const ankiService = {
  getAllReviews(): Record<string, CardReviewData> {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ANKI)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  },

  getCardData(cardId: string): CardReviewData {
    const reviews = this.getAllReviews()
    return (
      reviews[cardId] || {
        cardId,
        repetitions: 0,
        intervalMinutes: 0,
        easeFactor: 2.5,
        nextReviewTimestamp: 0,
        lastReviewedTimestamp: 0,
        history: []
      }
    )
  },

  submitReview(cardId: string, rating: 'again' | 'hard' | 'good' | 'easy'): CardReviewData {
    const card = this.getCardData(cardId)
    const now = Date.now()
    let intervalMinutes = 1
    let repetitions = card.repetitions
    let easeFactor = card.easeFactor

    if (rating === 'again') {
      repetitions = 0
      intervalMinutes = 1
      easeFactor = Math.max(1.3, easeFactor - 0.2)
    } else if (rating === 'hard') {
      intervalMinutes = 10
      easeFactor = Math.max(1.3, easeFactor - 0.15)
    } else if (rating === 'good') {
      if (repetitions === 0) {
        intervalMinutes = 1440 // 1 day
      } else if (repetitions === 1) {
        intervalMinutes = 1440 * 3 // 3 days
      } else {
        intervalMinutes = Math.round(card.intervalMinutes * easeFactor)
      }
      repetitions++
    } else if (rating === 'easy') {
      if (repetitions === 0) {
        intervalMinutes = 1440 * 4 // 4 days
      } else {
        intervalMinutes = Math.round(card.intervalMinutes * easeFactor * 1.3)
      }
      repetitions++
      easeFactor += 0.15
    }

    const updatedCard: CardReviewData = {
      ...card,
      repetitions,
      intervalMinutes,
      easeFactor: Number(easeFactor.toFixed(2)),
      lastReviewedTimestamp: now,
      nextReviewTimestamp: now + intervalMinutes * 60 * 1000,
      history: [
        ...(card.history || []).slice(-15),
        { timestamp: now, rating, intervalMinutes }
      ]
    }

    if (typeof window !== 'undefined') {
      const reviews = this.getAllReviews()
      reviews[cardId] = updatedCard
      localStorage.setItem(STORAGE_KEY_ANKI, JSON.stringify(reviews))
    }

    return updatedCard
  },

  getIntervalLabel(rating: 'again' | 'hard' | 'good' | 'easy', cardId?: string): string {
    if (!cardId) {
      if (rating === 'again') return '< 1 phút'
      if (rating === 'hard') return '10 phút'
      if (rating === 'good') return '1 ngày'
      if (rating === 'easy') return '4 ngày'
      return ''
    }
    const card = this.getCardData(cardId)
    if (rating === 'again') return '< 1 phút'
    if (rating === 'hard') return '10 phút'
    if (rating === 'good') {
      if (card.repetitions === 0) return '1 ngày'
      if (card.repetitions === 1) return '3 ngày'
      const days = Math.round((card.intervalMinutes * card.easeFactor) / 1440)
      return `${Math.max(1, days)} ngày`
    }
    if (rating === 'easy') {
      if (card.repetitions === 0) return '4 ngày'
      const days = Math.round((card.intervalMinutes * card.easeFactor * 1.3) / 1440)
      return `${Math.max(4, days)} ngày`
    }
    return ''
  },

  getDeckStats(masks: any[] = []) {
    const reviews = this.getAllReviews()
    let newCards = 0
    let learningCards = 0
    let masteredCards = 0

    masks.forEach(m => {
      const card = reviews[m.id]
      if (!card || card.repetitions === 0) {
        newCards++
      } else if (card.repetitions < 3) {
        learningCards++
      } else {
        masteredCards++
      }
    })

    return { newCards, learningCards, masteredCards, total: masks.length }
  }
}
