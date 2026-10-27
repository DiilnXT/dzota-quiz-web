// DYNEX Google Auth & User Session Service
// Seamlessly integrated with Dzota Quiz Authentication System & Classroom Whitelist
import { storageService, DynexClassroom } from './storageService'

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
    reason?: 'admin' | 'public' | 'classroom' | 'whitelist' | 'pin_unlocked' | 'restricted'
    classroomName?: string
    message?: string
    requiredEmails?: string[]
  } {
    const currentUser = user || this.getCurrentUser()
    if (!lesson) return { allowed: true }

    const cleanEmail = (currentUser?.email || '').trim().toLowerCase()

    // 1. Admin & Creator always have complete access
    if (
      currentUser?.role === 'ADMIN' ||
      cleanEmail === 'lenhatduy.vietnam@gmail.com'
    ) {
      return { allowed: true, reason: 'admin' }
    }

    // 2. Check if already unlocked via PIN in sessionStorage
    if (typeof window !== 'undefined') {
      const unlockedKey = `dynex_unlocked_${lesson.id}`
      if (sessionStorage.getItem(unlockedKey) === 'true') {
        return { allowed: true, reason: 'pin_unlocked' }
      }
    }

    // 3. Check Classroom membership (Highest priority for student management)
    if (currentUser?.isLoggedIn && cleanEmail) {
      try {
        const classrooms = storageService.getClassrooms()
        const assignedClass = classrooms.find(cls => 
          cls.assignedLessonIds?.includes(lesson.id) &&
          cls.studentEmails?.some(e => e.toLowerCase() === cleanEmail)
        )
        if (assignedClass) {
          return { 
            allowed: true, 
            reason: 'classroom', 
            classroomName: assignedClass.name 
          }
        }
      } catch (err) {
        console.error('Error verifying classroom access:', err)
      }
    }

    // 4. Public access mode
    const accessMode = lesson.accessMode || 'public' // 'public' | 'vip_emails' | 'password'
    if (accessMode === 'public') {
      return { allowed: true, reason: 'public' }
    }

    // 5. Individual email whitelist
    if (accessMode === 'vip_emails') {
      const allowedList = (lesson.allowedEmails || []).map((e: string) => (e || '').trim().toLowerCase())
      if (currentUser?.isLoggedIn && cleanEmail && allowedList.includes(cleanEmail)) {
        return { allowed: true, reason: 'whitelist' }
      }
      return {
        allowed: false,
        reason: 'restricted',
        message: 'Mô-đun Y Khoa Độc Quyền. Tài khoản Gmail của bạn chưa được cấp phép hoặc chưa tham gia lớp học có bài này.',
        requiredEmails: allowedList
      }
    }

    // 6. Password / PIN mode
    if (accessMode === 'password') {
      return {
        allowed: false,
        reason: 'restricted',
        message: 'Mô-đun yêu cầu nhập mã PIN Lớp học hoặc mật khẩu truy cập từ giảng viên.'
      }
    }

    return { allowed: true }
  },

  // Try unlocking lesson with a PIN (either lesson password or classroom PIN)
  unlockWithPin(lessonId: string, enteredPin: string, lessonPassword?: string): boolean {
    if (!enteredPin) return false
    const cleanPin = enteredPin.trim().toUpperCase()

    // Check lesson password
    if (lessonPassword && lessonPassword.trim().toUpperCase() === cleanPin) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`dynex_unlocked_${lessonId}`, 'true')
      }
      return true
    }

    // Check all classrooms assigned to this lesson
    try {
      const classrooms = storageService.getClassrooms()
      const matchingClass = classrooms.find(cls => 
        cls.assignedLessonIds?.includes(lessonId) &&
        cls.pinCode?.trim().toUpperCase() === cleanPin
      )
      if (matchingClass) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`dynex_unlocked_${lessonId}`, 'true')
        }
        return true
      }
    } catch (e) {
      console.error('Error unlocking with classroom pin:', e)
    }

    return false
  }
}

