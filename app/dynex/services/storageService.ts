// DYNEX Persistent Storage Service (LocalStorage)
import { sampleAnatomyUrl, SAMPLE_ANATOMY_FALLBACK_MASKS } from './geminiService'

const STORAGE_KEY_PROJECTS = 'dynex_projects_data_v2'
const STORAGE_KEY_EXAM_HISTORY = 'dynex_exam_history_v2'

export const INITIAL_DATA = [
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
  getProjects(): any[] {
    if (typeof window === 'undefined') return INITIAL_DATA
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROJECTS)
      if (raw) {
        // Tự động phát hiện và sửa chữa dữ liệu lỗi font (mojibake) từ phiên bản cũ
        if (raw.includes('BÃ') || raw.includes('Ã') || raw.includes('Ä') || raw.includes('Æ') || raw.includes('áº')) {
          this.saveProjects(INITIAL_DATA)
          return INITIAL_DATA
        }
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error reading projects from storage:', e)
    }
    // Seed initial data if empty
    this.saveProjects(INITIAL_DATA)
    return INITIAL_DATA
  },

  saveProjects(projects: any[]) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects))
    } catch (e) {
      console.error('Error saving projects to storage:', e)
    }
  },

  resetDefaultData() {
    this.saveProjects(INITIAL_DATA)
    return INITIAL_DATA
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
  collectAllStations(projects: any[], selectedLessonIds: string[] | null = null): any[] {
    const stations: any[] = []
    projects.forEach(project => {
      project.categories?.forEach((category: any) => {
        category.subFolders?.forEach((sub: any) => {
          sub.lessons?.forEach((lesson: any) => {
            if (!selectedLessonIds || selectedLessonIds.includes(lesson.id)) {
              lesson.images?.forEach((img: any) => {
                img.masks?.forEach((mask: any, mIdx: number) => {
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
