// DYNEX Google Auth & User Session Service
// Seamlessly integrated with Dzota Quiz Authentication System

const STORAGE_KEY_USER = 'dynex_current_user_v2'

export interface DynexUser {
  id?: string
  email: string
  name: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUEST'
  isLoggedIn: boolean
  avatar?: string
}

export const authService = {
  getCurrentUser(): DynexUser {
    if (typeof window === 'undefined') {
      return {
        email: '',
        name: 'Khách vãng lai',
        role: 'GUEST',
        isLoggedIn: false,
        avatar: ''
      }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.error('Error reading current user:', e)
    }
    return {
      email: '',
      name: 'Khách vãng lai',
      role: 'GUEST',
      isLoggedIn: false,
      avatar: ''
    }
  },

  setCurrentUser(user: DynexUser | null) {
    if (typeof window === 'undefined') return
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_USER)
    } else {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    }
  },

  syncWithDzotaSession(session: any): DynexUser {
    if (!session || !session.email) {
      return this.getCurrentUser()
    }
    const cleanEmail = (session.email || '').trim().toLowerCase()
    const cleanUsername = (session.username || '').trim().toLowerCase()
    const isSuper = cleanEmail === 'lenhatduy.vietnam@gmail.com' || cleanUsername === 'duylniedu'
    const role = isSuper ? 'ADMIN' : (session.role?.toUpperCase() || 'STUDENT')
    
    const user: DynexUser = {
      id: session.id,
      email: cleanEmail,
      name: session.name || session.username || cleanEmail.split('@')[0],
      role,
      isLoggedIn: true,
      avatar: session.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${cleanEmail}`
    }
    this.setCurrentUser(user)
    return user
  },

  loginWithGoogleEmail(email: string, name: string = ''): DynexUser {
    const cleanEmail = (email || '').trim().toLowerCase()
    const isAdmin = cleanEmail === 'lenhatduy.vietnam@gmail.com' || cleanEmail.includes('admin')
    const user: DynexUser = {
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      isLoggedIn: true,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanEmail}`
    }
    this.setCurrentUser(user)
    return user
  },

  logout(): DynexUser {
    const guestUser: DynexUser = {
      email: '',
      name: 'Khách vãng lai',
      role: 'GUEST',
      isLoggedIn: false,
      avatar: ''
    }
    this.setCurrentUser(guestUser)
    return guestUser
  },

  checkAccess(lesson: any, user: DynexUser | null = null): {
    allowed: boolean
    reason?: string
    message?: string
    requiredEmails?: string[]
  } {
    const currentUser = user || this.getCurrentUser()
    if (!lesson) return { allowed: true }

    const accessMode = lesson.accessMode || 'public' // 'public' | 'vip_emails' | 'password'

    // Admin always has full access
    if (
      currentUser?.role === 'ADMIN' ||
      currentUser?.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
    ) {
      return { allowed: true, reason: 'admin' }
    }

    if (accessMode === 'public') {
      return { allowed: true, reason: 'public' }
    }

    if (accessMode === 'vip_emails') {
      const allowedList = (lesson.allowedEmails || []).map((e: string) => (e || '').trim().toLowerCase())
      if (
        currentUser?.isLoggedIn &&
        currentUser?.email &&
        allowedList.includes(currentUser.email.toLowerCase())
      ) {
        return { allowed: true, reason: 'whitelisted' }
      }
      return {
        allowed: false,
        reason: 'vip_required',
        message: 'Mô-đun Y Khoa Độc Quyền. Tài khoản của bạn chưa được cấp quyền học bài này.',
        requiredEmails: allowedList
      }
    }

    if (accessMode === 'password') {
      if (typeof window !== 'undefined') {
        const unlockedKey = `dynex_unlocked_${lesson.id}`
        const isUnlocked = sessionStorage.getItem(unlockedKey) === 'true'
        if (isUnlocked) return { allowed: true, reason: 'password_unlocked' }
      }
      return {
        allowed: false,
        reason: 'password_required',
        message: 'Mô-đun yêu cầu mã PIN hoặc mật khẩu truy cập từ giảng viên.'
      }
    }

    return { allowed: true }
  }
}
