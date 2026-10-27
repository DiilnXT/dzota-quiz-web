// DYNEX Persistent Storage Service (LocalStorage)
import { sampleAnatomyUrl, SAMPLE_ANATOMY_FALLBACK_MASKS } from './geminiService'

const STORAGE_KEY_PROJECTS = 'dynex_projects_data_v2'
const STORAGE_KEY_EXAM_HISTORY = 'dynex_exam_history_v2'
const STORAGE_KEY_CLASSROOMS = 'dynex_classrooms_v1'

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

export const INITIAL_DATA: Project[] = [
  {
    id: 'proj_med_1',
    name: 'Dự Án Y Khoa DYNEX - Giải Phẫu Học Toàn Thư',
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

export const storageService = {
  getProjects(): Project[] {
    if (typeof window === 'undefined') return INITIAL_DATA
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROJECTS)
      if (raw) {
        // Tự động phát hiện và dọn dẹp lỗi font mojibake từ bản cũ
        if (raw.includes('BÃ') || raw.includes('Ã') || raw.includes('Ä') || raw.includes('Æ') || raw.includes('áº')) {
          this.saveProjects(INITIAL_DATA)
          return INITIAL_DATA
        }
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Tự động nâng cấp tọa độ mẫu sơ đồ gan nếu còn là tọa độ cũ (width < 32%)
          let needsUpdate = false
          parsed.forEach((p: any) => {
            p.categories?.forEach((c: any) => {
              c.subFolders?.forEach((s: any) => {
                s.lessons?.forEach((l: any) => {
                  l.images?.forEach((img: any) => {
                    if (img.masks && img.masks.length > 0) {
                      const firstMask = img.masks[0]
                      if (firstMask.id === 'mask_sample_1' && (firstMask.width < 32 || firstMask.height < 15)) {
                        img.masks = SAMPLE_ANATOMY_FALLBACK_MASKS.map(m => ({ ...m }))
                        needsUpdate = true
                      }
                    }
                  })
                })
              })
            })
          })
          if (needsUpdate) {
            this.saveProjects(parsed)
          }
          return parsed
        }
      }
    } catch (e) {
      console.error('Error reading projects from storage:', e)
    }
    this.saveProjects(INITIAL_DATA)
    return INITIAL_DATA
  },

  saveProjects(projects: Project[]) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects))
    } catch (e) {
      console.error('Error saving projects to storage:', e)
    }
  },

  resetDefaultData(): Project[] {
    this.saveProjects(INITIAL_DATA)
    return INITIAL_DATA
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
  }
}

