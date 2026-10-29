// DYNEX Persistent Storage Service (LocalStorage)
import { sampleAnatomyUrl, SAMPLE_ANATOMY_FALLBACK_MASKS } from './geminiService'

const STORAGE_KEY_PROJECTS = 'dynex_projects_data_v6_clean_pc'
const STORAGE_KEY_EXAM_HISTORY = 'dynex_exam_history_v2'
const STORAGE_KEY_CLASSROOMS = 'dynex_classrooms_v1'
const STORAGE_KEY_SAVED_EXAMS = 'dynex_saved_exams_v2_clean'

export interface DynexExamStation {
  stationIndex: number
  stationId: string
  lessonId: string
  lessonTitle: string
  categoryName: string
  subFolderName: string
  imageId: string
  imageTitle: string
  imageUrl: string
  maskId: string
  officialAnswer: string
  synonyms?: string[]
  hint?: string
  targetMask: Mask
  allImageMasks: Mask[]
}

export interface DynexExamPaper {
  id: string
  title: string
  subject: string
  timePerStation: number // giây mỗi trạm (vd: 20)
  totalStations: number // số trạm (vd: 20)
  notes?: string
  generationStrategy: 'random_pool' | 'balanced_distribution'
  avoidConsecutiveSameImage: boolean
  selectedLessonIds: string[]
  stations: DynexExamStation[]
  createdAt: string
  author: string
  accessPassword?: string
}

export interface Mask {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  synonyms?: string[]
  hint?: string
  color?: string
  borderColor?: string
  textColor?: string
  opacity?: number
  texture?: string
  displayMode?: string
  isCovered?: boolean
}

export interface ImageItem {
  id: string
  title: string
  url: string
  masks: Mask[]
  createdAt?: string
}

export interface Lesson {
  id: string
  title: string
  description?: string
  createdAt?: string
  accessMode?: 'public' | 'vip_emails' | 'password'
  allowedEmails?: string[]
  accessPassword?: string
  images: ImageItem[]
}

export interface SubFolder {
  id: string
  name: string
  lessons: Lesson[]
}

export interface Category {
  id: string
  name: string
  icon?: string
  subFolders: SubFolder[]
}

export interface Project {
  id: string
  name: string
  description?: string
  author?: string
  createdAt?: string
  categories: Category[]
}

export interface DynexClassroom {
  id: string
  name: string // Tên lớp (vd: "Y Đa Khoa K47 - Tổ 2")
  pinCode: string // Mã PIN (vd: "YDK47")
  description?: string
  studentEmails: string[] // Danh sách Gmail học sinh
  assignedLessonIds: string[] // Danh sách bài học được cấp quyền
  createdAt: string
  updatedAt: string
}

export const INITIAL_CLASSROOMS: DynexClassroom[] = [
  {
    id: 'cls_y_k47_tieu_hoa',
    name: 'Lớp Y Đa Khoa K47 - Module Tiêu Hóa',
    pinCode: 'Y47MED',
    description: 'Lớp học phần Giải phẫu hệ Tiêu Hóa, Gan Mật & Tụy',
    studentEmails: ['lenhatduy.vietnam@gmail.com', 'sinhvien.ykhoa@gmail.com'],
    assignedLessonIds: ['les_gan_tuy_da_day'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const INITIAL_SAVED_EXAMS: DynexExamPaper[] = [
  {
    id: 'exam_osce_mau_tieu_hoa',
    title: 'Đề Thi Chạy Trạm OSCE Chuẩn: Hệ Tiêu Hóa, Gan Mật & Tụy (Đề Mẫu K47)',
    subject: 'Giải Phẫu Học 1',
    timePerStation: 20,
    totalStations: 8,
    notes: 'Đề thi chuẩn 8 trạm giải phẫu mặt trước gan, môn vị, tá tràng và tụy. Ô che 100% đặc kín, âm thanh chuông chuyển trạm.',
    generationStrategy: 'balanced_distribution',
    avoidConsecutiveSameImage: true,
    selectedLessonIds: ['les_gan_tuy_da_day'],
    createdAt: new Date().toISOString(),
    author: 'Lê Nhật Duy (Dzota Y Khoa K26)',
    stations: SAMPLE_ANATOMY_FALLBACK_MASKS.map((m, idx) => ({
      stationIndex: idx,
      lessonId: 'les_gan_tuy_da_day',
      lessonTitle: 'Bài 1: Giải phẫu Gan, Đường Mật, Môn Vị, Tá Tràng & Tuyến Tụy',
      categoryName: 'Hệ Tiêu Hóa (Digestive System)',
      subFolderName: 'Chương 1: Các Tạng Dưới Hoành & Đường Mật',
      imageId: 'img_gan_1',
      imageTitle: 'Sơ đồ Giải Phẫu Gan - Đường Mật - Dạ Dày - Tụy (Chuẩn Giáo Trình)',
      imageUrl: sampleAnatomyUrl,
      targetMask: { ...m },
      allImageMasks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(item => ({ ...item }))
    }))
  },
  {
    id: 'osce_gph_co_chi_tren',
    title: 'Chạy Trạm Cơ - Xương - Mạch Máu Chi Trên & Đám Rối Cánh Tay (15 Trạm)',
    subject: 'Giải Phẫu Chi Trên',
    timePerStation: 20,
    totalStations: 8,
    notes: 'Nhận diện nguyên ủy, bám tận, thần kinh chi phối và mạch máu cấp máu chi trên.',
    generationStrategy: 'balanced_distribution',
    avoidConsecutiveSameImage: true,
    selectedLessonIds: ['les_gan_tuy_da_day'],
    createdAt: new Date().toISOString(),
    author: 'Lê Nhật Duy (Dzota Y Khoa K26)',
    stations: SAMPLE_ANATOMY_FALLBACK_MASKS.map((m, idx) => ({
      stationIndex: idx,
      lessonId: 'les_chi_tren',
      lessonTitle: 'Bài 2: Giải phẫu Cơ, Xương & Mạch Thần Kinh Chi Trên',
      categoryName: 'Hệ Vận Động & Chi',
      subFolderName: 'Chương 2: Cơ & Đám Rối Thần Kinh',
      imageId: 'img_chi_tren',
      imageTitle: 'Tiêu bản Chi Trên & Đám Rối Thần Kinh Cánh Tay',
      imageUrl: sampleAnatomyUrl,
      targetMask: { ...m },
      allImageMasks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(item => ({ ...item }))
    }))
  },
  {
    id: 'osce_ck1_gph',
    title: 'Chạy Trạm Tổng Hợp Thi CK1/Nội Trú: Tim Mạch - Hô Hấp - Tiêu Hóa (20 Trạm)',
    subject: 'Giải Phẫu Nội Trú / Sau Đại Học',
    timePerStation: 20,
    totalStations: 8,
    notes: 'Bộ tiêu bản kinh điển phân biệt rãnh gian thất, cuống phổi, tĩnh mạch cửa và mạc treo.',
    generationStrategy: 'balanced_distribution',
    avoidConsecutiveSameImage: true,
    selectedLessonIds: ['les_gan_tuy_da_day'],
    createdAt: new Date().toISOString(),
    author: 'Lê Nhật Duy (Dzota Y Khoa K26)',
    stations: SAMPLE_ANATOMY_FALLBACK_MASKS.map((m, idx) => ({
      stationIndex: idx,
      lessonId: 'les_noi_tru',
      lessonTitle: 'Bài 3: Tiêu Bản Giải Phẫu Ôn Thi Nội Trú Y Hà Nội / Y Dược TP.HCM',
      categoryName: 'Chuyên Khoa 1 & Bác Sĩ Nội Trú',
      subFolderName: 'Chương 3: Tổng Hợp Các Tạng Lồng Ngực & Ổ Bụng',
      imageId: 'img_noi_tru',
      imageTitle: 'Mô hình Đa Tạng Tim Mạch - Hô Hấp - Tiêu Hóa',
      imageUrl: sampleAnatomyUrl,
      targetMask: { ...m },
      allImageMasks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(item => ({ ...item }))
    }))
  },
  {
    id: 'osce_duoc_khangsinh',
    title: 'Chạy Trạm Nhận Diện Hoạt Chất & Cơ Chế Kháng Sinh - Dược Lý Lâm Sàng (12 Trạm)',
    subject: 'Dược Lý Học',
    timePerStation: 20,
    totalStations: 8,
    notes: 'Cơ chế tác động ức chế thành tế bào, ribosom 30S/50S, độc tính chọn lọc và tương tác thuốc.',
    generationStrategy: 'balanced_distribution',
    avoidConsecutiveSameImage: true,
    selectedLessonIds: ['les_gan_tuy_da_day'],
    createdAt: new Date().toISOString(),
    author: 'Lê Nhật Duy (Dzota Y Khoa K26)',
    stations: SAMPLE_ANATOMY_FALLBACK_MASKS.map((m, idx) => ({
      stationIndex: idx,
      lessonId: 'les_duoc_ly',
      lessonTitle: 'Bài 4: Nhận Diện Hoạt Chất & Cơ Chế Kháng Sinh Vi Sinh',
      categoryName: 'Dược Lý Lâm Sàng',
      subFolderName: 'Chương 4: Kháng Sinh & Hóa Trị Liệu',
      imageId: 'img_duoc_ly',
      imageTitle: 'Sơ đồ Phân Loại Kháng Sinh Theo Đích Tác Động',
      imageUrl: sampleAnatomyUrl,
      targetMask: { ...m },
      allImageMasks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(item => ({ ...item }))
    }))
  },
  {
    id: 'osce_tim_mach_ecg',
    title: 'Chạy Trạm Điện Tâm Đồ ECG: Rối Loạn Nhịp & Nhồi Máu Cơ Tim Cấp (10 Trạm)',
    subject: 'Nội Khoa Tim Mạch',
    timePerStation: 20,
    totalStations: 8,
    notes: 'Đọc nhanh ST chênh lên theo vùng chuyển đạo, rung nhĩ, cuồng nhĩ, block nhánh và ngoại tâm thu.',
    generationStrategy: 'balanced_distribution',
    avoidConsecutiveSameImage: true,
    selectedLessonIds: ['les_gan_tuy_da_day'],
    createdAt: new Date().toISOString(),
    author: 'Lê Nhật Duy (Dzota Y Khoa K26)',
    stations: SAMPLE_ANATOMY_FALLBACK_MASKS.map((m, idx) => ({
      stationIndex: idx,
      lessonId: 'les_ecg',
      lessonTitle: 'Bài 5: Điện Tâm Đồ Cấp Cứu Rối Loạn Nhịp & Hội Chứng Vành Cấp',
      categoryName: 'Tim Mạch Lâm Sàng',
      subFolderName: 'Chương 5: Điện Sinh Học Cơ Tim',
      imageId: 'img_ecg',
      imageTitle: 'Dải Băng Ghi Điện Tâm Đồ 12 Chuyển Đạo',
      imageUrl: sampleAnatomyUrl,
      targetMask: { ...m },
      allImageMasks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(item => ({ ...item }))
    }))
  }
]

// CÂY THƯ MỤC GIẢI PHẪU CHUẨN Y KHOA (Môn -> Chương -> Chủ Đề -> Bài Học)
export const DEFAULT_ANATOMY_CURRICULUM: Project[] = [
  {
    id: 'proj_med_1',
    name: 'Môn Giải Phẫu Học 1 (Đại Cương & Các Tạng)',
    description: 'Hệ thống ngân hàng dữ liệu hình ảnh giải phẫu y khoa chuyên sâu phục vụ học tập và thi chạy trạm OSCE.',
    author: 'Nhật Duy',
    createdAt: new Date().toISOString(),
    categories: [
      {
        id: 'cat_tieu_hoa',
        name: 'Hệ Tiêu Hóa (Digestive System)',
        icon: 'Stethoscope',
        subFolders: [
          {
            id: 'sub_gan_mat',
            name: 'Chương 1: Các Tạng Dưới Hoành & Đường Mật',
            lessons: [
              {
                id: 'les_gan_tuy_da_day',
                title: 'Bài 1: Giải phẫu Gan, Đường Mật, Môn Vị, Tá Tràng & Tuyến Tụy',
                description: 'Tổng quan chi tiết cấu trúc giải phẫu học mặt trước của hệ thống gan mật và tá tụy.',
                createdAt: new Date().toISOString(),
                accessMode: 'public',
                allowedEmails: [],
                accessPassword: '',
                images: [
                  {
                    id: 'img_gan_1',
                    title: 'Sơ đồ Giải Phẫu Gan - Đường Mật - Dạ Dày - Tụy (Chuẩn Giáo Trình)',
                    url: sampleAnatomyUrl,
                    masks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(m => ({ ...m })),
                    createdAt: new Date().toISOString()
                  }
                ]
              },
              {
                id: 'les_ruot_da_day',
                title: 'Bài 2: Cấu tạo Dạ dày & Các tầng thành ống tiêu hóa',
                description: 'Cấu tạo giải phẫu vi thể và đại thể của dạ dày, các cơ vòng môn vị.',
                createdAt: new Date().toISOString(),
                accessMode: 'public',
                allowedEmails: [],
                accessPassword: '',
                images: []
              }
            ]
          },
          {
            id: 'sub_ruot_non_gia',
            name: 'Chương 2: Ruột Non, Ruột Già & Mạc Treo',
            lessons: []
          }
        ]
      },
      {
        id: 'cat_tuan_hoan',
        name: 'Hệ Tuần Hoàn & Tim Mạch (Cardiovascular)',
        icon: 'Heart',
        subFolders: [
          {
            id: 'sub_tim_mach_lon',
            name: 'Chương 1: Giải Phẫu Tim & Các Mạch Máu Lớn',
            lessons: []
          }
        ]
      },
      {
        id: 'cat_than_kinh',
        name: 'Hệ Thần Kinh Trung Ương (Neuroanatomy)',
        icon: 'Brain',
        subFolders: [
          {
            id: 'sub_nao_bo',
            name: 'Chương 1: Bán Cầu Đại Não & Thân Não',
            lessons: []
          }
        ]
      }
    ]
  }
]

export const INITIAL_DATA: Project[] = DEFAULT_ANATOMY_CURRICULUM

export const storageService = {
  getProjects(): Project[] {
    if (typeof window === 'undefined') return INITIAL_DATA
    try {
      let raw = localStorage.getItem(STORAGE_KEY_PROJECTS)
      if (!raw) {
        // Kiểm tra các bản lưu trước đó của người dùng (v3, v2, v1) để không bị mất dữ liệu đã tạo
        raw = localStorage.getItem('dynex_projects_data_v3') || 
              localStorage.getItem('dynex_projects_data_v2') || 
              localStorage.getItem('dynex_projects_data_v1')
        if (raw) {
          localStorage.setItem(STORAGE_KEY_PROJECTS, raw)
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Nếu có danh mục (categories), trả về dữ liệu người dùng
          const hasCategories = parsed.some(p => p.categories && p.categories.length > 0)
          if (hasCategories) {
            return parsed
          }
        }
      }
    } catch (e) {
      console.error('Error reading projects from storage:', e)
    }
    this.saveProjects(INITIAL_DATA)
    return INITIAL_DATA
  },

  resetDefaultCurriculum(): Project[] {
    this.saveProjects(DEFAULT_ANATOMY_CURRICULUM)
    return DEFAULT_ANATOMY_CURRICULUM
  },

  clearAllData(): Project[] {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_PROJECTS)
        localStorage.removeItem('dynex_projects_data_v3')
        localStorage.removeItem('dynex_projects_data_v2')
        localStorage.removeItem('dynex_projects_data_v1')
        localStorage.removeItem(STORAGE_KEY_SAVED_EXAMS)
        localStorage.removeItem('dynex_saved_exams_v1')
      } catch (e) {
        console.error('Error clearing all dynex data:', e)
      }
    }
    this.saveProjects(INITIAL_DATA)
    return INITIAL_DATA
  },

  saveProjects(projects: Project[]) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects))
      // Background sync full curriculum to API
      fetch('/api/dynex/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects })
      }).catch(() => {})
    } catch (e) {
      console.error('Error saving projects to storage:', e)
    }
  },

  async getProjectsAsync(): Promise<Project[]> {
    const local = this.getProjects()
    const hasLessons = local.some(p => p.categories?.some(c => c.subFolders?.some(s => (s.lessons?.length || 0) > 0)))
    if (hasLessons) return local

    try {
      const res = await fetch('/api/dynex/projects')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          this.saveProjects(data.projects)
          return data.projects
        }
      }
    } catch (e) {
      console.warn('Error fetching server projects:', e)
    }
    return local
  },

  resetDefaultData(): Project[] {
    return this.clearAllData()
  },

  // ─── CLASSROOM & ACCESS CONTROL METHODS ───
  getClassrooms(): DynexClassroom[] {
    if (typeof window === 'undefined') return INITIAL_CLASSROOMS
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CLASSROOMS)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error reading classrooms:', e)
    }
    this.saveClassrooms(INITIAL_CLASSROOMS)
    return INITIAL_CLASSROOMS
  },

  saveClassrooms(classrooms: DynexClassroom[]) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_CLASSROOMS, JSON.stringify(classrooms))
    } catch (e) {
      console.error('Error saving classrooms:', e)
    }
  },

  createClassroom(data: {
    name: string
    pinCode?: string
    description?: string
    studentEmails: string[]
    assignedLessonIds: string[]
  }): DynexClassroom {
    const classrooms = this.getClassrooms()
    const newClass: DynexClassroom = {
      id: `cls_${Date.now()}`,
      name: data.name.trim(),
      pinCode: (data.pinCode || `PIN${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase(),
      description: data.description?.trim() || '',
      studentEmails: Array.from(new Set(data.studentEmails.map(e => e.trim().toLowerCase()).filter(Boolean))),
      assignedLessonIds: Array.from(new Set(data.assignedLessonIds)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    classrooms.unshift(newClass)
    this.saveClassrooms(classrooms)
    return newClass
  },

  updateClassroom(id: string, updates: Partial<DynexClassroom>): DynexClassroom | null {
    const classrooms = this.getClassrooms()
    const idx = classrooms.findIndex(c => c.id === id)
    if (idx === -1) return null
    classrooms[idx] = {
      ...classrooms[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    this.saveClassrooms(classrooms)
    return classrooms[idx]
  },

  deleteClassroom(id: string): boolean {
    const classrooms = this.getClassrooms()
    const filtered = classrooms.filter(c => c.id !== id)
    this.saveClassrooms(filtered)
    return true
  },

  // Helper to parse pasted email lists (separated by comma, semicolon, space, newline)
  parseEmailsInput(text: string): string[] {
    if (!text) return []
    const tokens = text.split(/[\s,;\n\r\t]+/)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails: string[] = []
    tokens.forEach(t => {
      const clean = t.trim().toLowerCase()
      if (clean && emailRegex.test(clean)) {
        validEmails.push(clean)
      }
    })
    return Array.from(new Set(validEmails))
  },

  // Helper to collect all lessons across all projects
  getAllLessons(projects?: Project[]): Array<{
    id: string
    title: string
    description?: string
    categoryName: string
    subFolderName: string
    projectName: string
    accessMode?: string
    imagesCount: number
    masksCount: number
  }> {
    const projs = projects || this.getProjects()
    const list: any[] = []
    projs.forEach(p => {
      p.categories?.forEach(cat => {
        cat.subFolders?.forEach(sub => {
          sub.lessons?.forEach(les => {
            const masksCount = les.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0
            list.push({
              id: les.id,
              title: les.title,
              description: les.description,
              categoryName: cat.name,
              subFolderName: sub.name,
              projectName: p.name,
              accessMode: les.accessMode || 'public',
              imagesCount: les.images?.length || 0,
              masksCount
            })
          })
        })
      })
    })
    return list
  },

  getExamHistory(): any[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EXAM_HISTORY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  saveExamResult(result: any) {
    if (typeof window === 'undefined') return
    try {
      const history = this.getExamHistory()
      history.unshift({
        ...result,
        id: `exam_${Date.now()}`,
        completedAt: new Date().toISOString()
      })
      // Keep last 50 exams
      localStorage.setItem(STORAGE_KEY_EXAM_HISTORY, JSON.stringify(history.slice(0, 50)))
    } catch (e) {
      console.error('Error saving exam result:', e)
    }
  },

  // ─── SAVED OSCE EXAM PAPERS MANAGEMENT ───
  getSavedExams(): DynexExamPaper[] {
    if (typeof window === 'undefined') return INITIAL_SAVED_EXAMS
    try {
      let raw = localStorage.getItem(STORAGE_KEY_SAVED_EXAMS)
      if (!raw) {
        raw = localStorage.getItem('dynex_saved_exams_v1')
        if (raw) {
          localStorage.setItem(STORAGE_KEY_SAVED_EXAMS, raw)
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Error reading saved exams from storage:', e)
    }
    if (INITIAL_SAVED_EXAMS.length > 0) {
      this.saveExam(INITIAL_SAVED_EXAMS[0])
    }
    return INITIAL_SAVED_EXAMS
  },

  saveExam(exam: DynexExamPaper): void {
    if (typeof window === 'undefined') return
    try {
      const list = this.getSavedExams()
      const existingIdx = list.findIndex(e => e.id === exam.id)
      if (existingIdx >= 0) {
        list[existingIdx] = exam
      } else {
        list.unshift(exam)
      }
      localStorage.setItem(STORAGE_KEY_SAVED_EXAMS, JSON.stringify(list))

      // Sync to API in background so links work across devices/browsers
      fetch('/api/dynex/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam)
      }).catch(err => console.warn('Background sync exam to API error:', err))
    } catch (e) {
      console.error('Error saving exam to storage:', e)
    }
  },

  deleteExam(examId: string): void {
    if (typeof window === 'undefined') return
    try {
      const list = this.getSavedExams()
      const filtered = list.filter(e => e.id !== examId)
      localStorage.setItem(STORAGE_KEY_SAVED_EXAMS, JSON.stringify(filtered))

      // Delete from API in background
      fetch(`/api/dynex/exams?id=${encodeURIComponent(examId)}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Background delete exam from API error:', err))
    } catch (e) {
      console.error('Error deleting exam:', e)
    }
  },

  getExamById(examId: string): DynexExamPaper | null {
    const list = this.getSavedExams()
    const found = list.find(e => e.id === examId)
    if (found) return found
    const fallbackDefault = INITIAL_SAVED_EXAMS.find(e => e.id === examId)
    return fallbackDefault || null
  },

  async getExamByIdAsync(examId: string): Promise<DynexExamPaper | null> {
    const local = this.getExamById(examId)
    if (local) return local

    try {
      const res = await fetch(`/api/dynex/exams?id=${encodeURIComponent(examId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.exam) {
          // Cache to local storage
          this.saveExam(data.exam)
          return data.exam
        }
      }
    } catch (e) {
      console.warn('Error fetching exam by ID from API:', e)
    }

    return null
  },

  // ─── SMART OSCE EXAM STATION GENERATOR ───
  generateOsceExamStations(params: {
    projects: Project[]
    selectedLessonIds: string[]
    totalStations: number
    strategy?: 'random_pool' | 'balanced_distribution'
    avoidConsecutiveSameImage?: boolean
  }): DynexExamStation[] {
    const {
      projects,
      selectedLessonIds,
      totalStations = 20,
      strategy = 'random_pool',
      avoidConsecutiveSameImage = true
    } = params

    // 1. Gather all available lessons matching selectedLessonIds
    const lessonsMap = new Map<string, { lesson: Lesson; category: Category; subFolder: SubFolder; project: Project }>()
    projects.forEach(project => {
      project.categories?.forEach(category => {
        category.subFolders?.forEach(sub => {
          sub.lessons?.forEach(lesson => {
            if (selectedLessonIds.includes(lesson.id)) {
              lessonsMap.set(lesson.id, { lesson, category, subFolder: sub, project })
            }
          })
        })
      })
    })

    // 2. Collect atomic candidate pool grouped by lesson and image
    const candidateList: Array<{
      lesson: Lesson
      category: Category
      subFolder: SubFolder
      image: ImageItem
      mask: Mask
    }> = []

    const lessonItemsMap = new Map<string, Array<{
      lesson: Lesson
      category: Category
      subFolder: SubFolder
      image: ImageItem
      mask: Mask
    }>>()

    lessonsMap.forEach(({ lesson, category, subFolder }) => {
      const list: typeof candidateList = []
      lesson.images?.forEach(img => {
        img.masks?.forEach(mask => {
          const item = { lesson, category, subFolder, image: img, mask }
          candidateList.push(item)
          list.push(item)
        })
      })
      if (list.length > 0) {
        lessonItemsMap.set(lesson.id, list)
      }
    })

    if (candidateList.length === 0) {
      return []
    }

    let selectedItems: typeof candidateList = []

    // Strategy A: Balanced Distribution among selected lessons
    if (strategy === 'balanced_distribution' && lessonItemsMap.size > 1) {
      const activeLessonIds = Array.from(lessonItemsMap.keys())
      const quotaPerLesson = Math.max(1, Math.floor(totalStations / activeLessonIds.length))
      const remainder = totalStations % activeLessonIds.length

      const pools: Record<string, typeof candidateList> = {}
      activeLessonIds.forEach(lId => {
        pools[lId] = [...(lessonItemsMap.get(lId) || [])].sort(() => 0.5 - Math.random())
      })

      activeLessonIds.forEach((lId, idx) => {
        const takeCount = quotaPerLesson + (idx < remainder ? 1 : 0)
        const pool = pools[lId]
        for (let i = 0; i < takeCount; i++) {
          if (pool && pool.length > 0) {
            selectedItems.push(pool.pop()!)
          } else {
            selectedItems.push(candidateList[Math.floor(Math.random() * candidateList.length)])
          }
        }
      })
    } else {
      // Strategy B: Random Pool
      const shuffled = [...candidateList].sort(() => 0.5 - Math.random())
      let i = 0
      while (selectedItems.length < totalStations) {
        selectedItems.push(shuffled[i % shuffled.length])
        i++
      }
    }

    // 3. Apply Anti-Consecutive Image Sorter (tỉ lệ các trạm liên tiếp chung 1 hình là thấp)
    if (avoidConsecutiveSameImage && selectedItems.length > 2) {
      const imageBuckets = new Map<string, typeof candidateList>()
      selectedItems.forEach(item => {
        const arr = imageBuckets.get(item.image.id) || []
        arr.push(item)
        imageBuckets.set(item.image.id, arr)
      })

      const arranged: typeof candidateList = []
      let lastImageId = ''

      while (arranged.length < selectedItems.length) {
        let bestImageId = ''
        let maxCount = -1

        for (const [imgId, bucket] of imageBuckets.entries()) {
          if (bucket.length > 0 && imgId !== lastImageId && bucket.length > maxCount) {
            maxCount = bucket.length
            bestImageId = imgId
          }
        }

        if (!bestImageId) {
          for (const [imgId, bucket] of imageBuckets.entries()) {
            if (bucket.length > 0) {
              bestImageId = imgId
              break
            }
          }
        }

        if (!bestImageId) break

        const bucket = imageBuckets.get(bestImageId)!
        const item = bucket.pop()!
        arranged.push(item)
        lastImageId = bestImageId
      }

      selectedItems = arranged
    }

    // 4. Transform to DynexExamStation
    return selectedItems.map((item, idx) => ({
      stationIndex: idx + 1,
      stationId: `st_${idx + 1}_${item.mask.id}`,
      lessonId: item.lesson.id,
      lessonTitle: item.lesson.title,
      categoryName: item.category.name,
      subFolderName: item.subFolder.name,
      imageId: item.image.id,
      imageTitle: item.image.title,
      imageUrl: item.image.url,
      maskId: item.mask.id,
      officialAnswer: item.mask.label,
      synonyms: item.mask.synonyms || [],
      hint: item.mask.hint || `Chi tiết trọng tâm của ${item.lesson.title}`,
      targetMask: item.mask,
      allImageMasks: item.image.masks || []
    }))
  },

  // Collect all available test stations (masks) across all or specific lessons
  collectAllStations(projects: Project[], selectedLessonIds: string[] | null = null): any[] {
    const stations: any[] = []
    projects.forEach(project => {
      project.categories?.forEach((category: Category) => {
        category.subFolders?.forEach((sub: SubFolder) => {
          sub.lessons?.forEach((lesson: Lesson) => {
            if (!selectedLessonIds || selectedLessonIds.includes(lesson.id)) {
              lesson.images?.forEach((img: ImageItem) => {
                img.masks?.forEach((mask: Mask, mIdx: number) => {
                  stations.push({
                    stationUid: `${img.id}_${mask.id}`,
                    projectTitle: project.name,
                    categoryName: category.name,
                    subFolderName: sub.name,
                    lessonTitle: lesson.title,
                    imageTitle: img.title,
                    imageUrl: img.url,
                    targetMask: mask,
                    allImageMasks: img.masks,
                    maskIndex: mIdx
                  })
                })
              })
            }
          })
        })
      })
    })
    return stations
  },

  // Create an on-the-fly exam paper for a specific lesson
  createExamFromLesson(lesson: Lesson): DynexExamPaper {
    const stations: DynexExamStation[] = []
    let idx = 0
    lesson.images?.forEach((img) => {
      img.masks?.forEach((mask) => {
        stations.push({
          stationIndex: idx++,
          stationId: `station_${idx}`,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          categoryName: 'Mô-đun Giải Phẫu',
          subFolderName: 'Thực Hành Y Khoa',
          imageId: img.id,
          imageTitle: img.title,
          imageUrl: img.url,
          maskId: mask.id,
          officialAnswer: mask.label || mask.customAnswer || '',
          synonyms: mask.synonyms || [],
          targetMask: mask,
          allImageMasks: img.masks || []
        })
      })
    })

    return {
      id: `exam_auto_${lesson.id}`,
      title: `Chạy Trạm OSCE: ${lesson.title}`,
      subject: 'Giải Phẫu Học',
      timePerStation: 20,
      totalStations: Math.max(stations.length, 1),
      notes: 'Bài thi chạy trạm OSCE tạo tự động từ bài học',
      generationStrategy: 'balanced_distribution',
      avoidConsecutiveSameImage: true,
      selectedLessonIds: [lesson.id],
      createdAt: new Date().toISOString(),
      author: 'Nhật Duy (Dzota Y Khoa)',
      stations
    }
  }
}

