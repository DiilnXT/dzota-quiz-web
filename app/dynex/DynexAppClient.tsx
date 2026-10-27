'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './components/Header';
import AdminTreeNav from './components/AdminTreeNav';
import MaskEditor from './components/MaskEditor';
import FlashcardMode from './components/FlashcardMode';
import MedicalSpottingExam from './components/MedicalSpottingExam';
import ExamHistory from './components/ExamHistory';
import StudentPortal from './components/StudentPortal';
import ClassroomManager from './components/ClassroomManager';
import SettingsModal from './components/SettingsModal';
import ShareAccessModal from './components/ShareAccessModal';
import LoginModal from './components/LoginModal';
import CreateContentModal from './components/CreateContentModal';
import DeckSelectorModal from './components/DeckSelectorModal';
import { storageService, Project, Lesson, ImageItem, Mask } from './services/storageService';
import { authService, DynexUser } from './services/authService';
import { getStoredApiKey, getStoredModel } from './services/geminiService';
import { ShieldCheck, Layers } from 'lucide-react';

interface DynexAppClientProps {
  initialUser?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  } | null;
  isEmbedded?: boolean;
}

export type DynexTabType = 'learn' | 'flashcard' | 'exam' | 'admin' | 'classes' | 'history';

function DynexInnerClient({ initialUser, isEmbedded = false }: DynexAppClientProps) {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentTab, setCurrentTab] = useState<DynexTabType>('learn');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [currentImageId, setCurrentImageId] = useState<string>('');

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');

  // Share & Access Control modal
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareLessonTarget, setShareLessonTarget] = useState<Lesson | null>(null);

  // User Auth & Login modal
  const [currentUser, setCurrentUser] = useState<DynexUser | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Create Content modal (+ Tạo mới Bài học, Chương, Hệ cơ quan)
  const [isCreateContentOpen, setIsCreateContentOpen] = useState(false);

  // Multi-deck selector modal (Ôn luyện đa chương / đa bài)
  const [isDeckSelectorOpen, setIsDeckSelectorOpen] = useState(false);

  // Exam history
  const [examHistory, setExamHistory] = useState<any[]>([]);

  // Sidebar toggle
  const [isTreeSidebarOpen, setIsTreeSidebarOpen] = useState(true);

  // Sync initial user from Dzota session
  useEffect(() => {
    if (initialUser && initialUser.email) {
      const synched = authService.syncWithDzotaSession({
        id: initialUser.id,
        email: initialUser.email,
        name: initialUser.name || initialUser.email.split('@')[0],
        role: initialUser.role || 'student',
      });
      setCurrentUser(synched);
    } else {
      setCurrentUser(authService.getCurrentUser());
    }
  }, [initialUser]);

  // Load initial data & URL params
  useEffect(() => {
    const loadedProjects = storageService.getProjects();
    setProjects(loadedProjects);
    setExamHistory(storageService.getExamHistory());
    setApiKey(getStoredApiKey());
    setGeminiModel(getStoredModel());

    // Check shared URL query params (e.g. ?lessonId=les_nao&tab=flashcard or &mode=flashcard)
    const lessonParam = searchParams.get('lessonId');
    const tabParam = searchParams.get('tab') || searchParams.get('mode');

    if (tabParam && ['learn', 'admin', 'flashcard', 'exam', 'classes', 'history'].includes(tabParam)) {
      setCurrentTab(tabParam as DynexTabType);
    }

    if (loadedProjects.length > 0) {
      setSelectedProjectId(loadedProjects[0].id);

      let targetLesson: Lesson | null = null;
      if (lessonParam) {
        for (const proj of loadedProjects) {
          for (const cat of proj.categories || []) {
            for (const sub of cat.subFolders || []) {
              const found = sub.lessons?.find(l => l.id === lessonParam);
              if (found) {
                targetLesson = found;
                setSelectedProjectId(proj.id);
                break;
              }
            }
            if (targetLesson) break;
          }
          if (targetLesson) break;
        }
      }

      if (!targetLesson) {
        const firstCat = loadedProjects[0].categories?.[0];
        const firstSub = firstCat?.subFolders?.[0];
        targetLesson = firstSub?.lessons?.[0] || null;
      }

      if (targetLesson) {
        setSelectedLessonId(targetLesson.id);
        if (targetLesson.images && targetLesson.images.length > 0) {
          setCurrentImageId(targetLesson.images[0].id);
        }
      }
    }
  }, [searchParams]);

  // Sync projects state to storage
  const updateProjectsState = (newProjects: Project[]) => {
    setProjects(newProjects);
    storageService.saveProjects(newProjects);
  };

  // Current selected project and lesson helper
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  let currentLesson: Lesson | null = null;
  if (currentProject) {
    for (const cat of currentProject.categories || []) {
      for (const sub of cat.subFolders || []) {
        const found = sub.lessons?.find(l => l.id === selectedLessonId);
        if (found) {
          currentLesson = found;
          break;
        }
      }
      if (currentLesson) break;
    }
  }

  const currentImage: ImageItem | undefined =
    currentLesson?.images?.find(img => img.id === currentImageId) || currentLesson?.images?.[0];

  // 1. Project CRUD
  const handleAddProject = ({ name, description }: { name: string; description: string }) => {
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      author: 'Nhật Duy',
      createdAt: new Date().toISOString(),
      categories: []
    };
    const updated = [...projects, newProj];
    updateProjectsState(updated);
    setSelectedProjectId(newProj.id);
  };

  const handleDeleteProject = (projId: string) => {
    const updated = projects.filter(p => p.id !== projId);
    updateProjectsState(updated);
    if (updated.length > 0) {
      setSelectedProjectId(updated[0].id);
    }
  };

  // 2. Category CRUD (Thư mục lớn)
  const handleAddCategory = (projectId: string, name: string) => {
    const updated = projects.map(proj => {
      if (proj.id !== projectId) return proj;
      const newCat = {
        id: `cat_${Date.now()}`,
        name,
        icon: 'Folder',
        subFolders: []
      };
      return { ...proj, categories: [...(proj.categories || []), newCat] };
    });
    updateProjectsState(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).filter(c => c.id !== catId)
      };
    });
    updateProjectsState(updated);
  };

  // 3. SubFolder CRUD (Thư mục con)
  const handleAddSubFolder = (categoryId: string, name: string) => {
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => {
          if (cat.id !== categoryId) return cat;
          const newSub = {
            id: `sub_${Date.now()}`,
            name,
            lessons: []
          };
          return { ...cat, subFolders: [...(cat.subFolders || []), newSub] };
        })
      };
    });
    updateProjectsState(updated);
  };

  const handleDeleteSubFolder = (catId: string, subId: string) => {
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => {
          if (cat.id !== catId) return cat;
          return {
            ...cat,
            subFolders: (cat.subFolders || []).filter(s => s.id !== subId)
          };
        })
      };
    });
    updateProjectsState(updated);
  };

  // 4. Lesson CRUD (Bài học)
  const handleAddLesson = (
    subFolderId: string, 
    title: string, 
    options?: { description?: string; imageUrl?: string; accessMode?: string; accessPassword?: string }
  ) => {
    const newImageId = options?.imageUrl ? `img_${Date.now()}` : undefined;
    const newLesson: Lesson = {
      id: `les_${Date.now()}`,
      title,
      description: options?.description || 'Nội dung thực hành giải phẫu chi tiết',
      createdAt: new Date().toISOString(),
      accessMode: options?.accessMode || 'public',
      allowedEmails: [],
      accessPassword: options?.accessPassword || '',
      images: options?.imageUrl ? [
        {
          id: newImageId!,
          title: title,
          url: options.imageUrl,
          masks: []
        }
      ] : []
    };

    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => ({
          ...cat,
          subFolders: (cat.subFolders || []).map(sub => {
            if (sub.id !== subFolderId) return sub;
            return { ...sub, lessons: [...(sub.lessons || []), newLesson] };
          })
        }))
      };
    });
    updateProjectsState(updated);
    setSelectedLessonId(newLesson.id);
    if (newImageId) {
      setCurrentImageId(newImageId);
    }
  };

  const handleDeleteLesson = (catId: string, subId: string, lessonId: string) => {
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => {
          if (cat.id !== catId) return cat;
          return {
            ...cat,
            subFolders: (cat.subFolders || []).map(sub => {
              if (sub.id !== subId) return sub;
              return {
                ...sub,
                lessons: (sub.lessons || []).filter(l => l.id !== lessonId)
              };
            })
          };
        })
      };
    });
    updateProjectsState(updated);
    if (selectedLessonId === lessonId) {
      setSelectedLessonId('');
    }
  };

  // 5. Image & Mask Handling inside Lesson
  const handleAddImage = (newImage: ImageItem) => {
    if (!currentLesson) return;
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => ({
          ...cat,
          subFolders: (cat.subFolders || []).map(sub => ({
            ...sub,
            lessons: (sub.lessons || []).map(les => {
              if (les.id !== currentLesson!.id) return les;
              return {
                ...les,
                images: [...(les.images || []), newImage]
              };
            })
          }))
        }))
      };
    });
    updateProjectsState(updated);
    setCurrentImageId(newImage.id);
  };

  const handleUpdateImageMasks = (imageId: string, newMasks: Mask[]) => {
    if (!currentLesson) return;
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => ({
          ...cat,
          subFolders: (cat.subFolders || []).map(sub => ({
            ...sub,
            lessons: (sub.lessons || []).map(les => {
              if (les.id !== currentLesson!.id) return les;
              return {
                ...les,
                images: (les.images || []).map(img => {
                  if (img.id !== imageId) return img;
                  return { ...img, masks: newMasks };
                })
              };
            })
          }))
        }))
      };
    });
    updateProjectsState(updated);
  };

  const handleDeleteImage = (imageId: string) => {
    if (!currentLesson) return;
    const updated = projects.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => ({
          ...cat,
          subFolders: (cat.subFolders || []).map(sub => ({
            ...sub,
            lessons: (sub.lessons || []).map(les => {
              if (les.id !== currentLesson!.id) return les;
              const remainingImages = (les.images || []).filter(img => img.id !== imageId);
              return { ...les, images: remainingImages };
            })
          }))
        }))
      };
    });
    updateProjectsState(updated);
    const remaining = currentLesson.images.filter(img => img.id !== imageId);
    if (remaining.length > 0) {
      setCurrentImageId(remaining[0].id);
    } else {
      setCurrentImageId('');
    }
  };

  // 6. Lesson Access Control Update
  const handleUpdateLessonAccess = (lessonId: string, accessConfig: any) => {
    const updated = projects.map(proj => {
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => ({
          ...cat,
          subFolders: (cat.subFolders || []).map(sub => ({
            ...sub,
            lessons: (sub.lessons || []).map(les => {
              if (les.id !== lessonId) return les;
              return {
                ...les,
                ...accessConfig
              };
            })
          }))
        }))
      };
    });
    updateProjectsState(updated);
  };

  // Exam result saving
  const handleSaveExamResult = (summary: any) => {
    storageService.saveExamResult(summary);
    setExamHistory(storageService.getExamHistory());
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dynex_exam_history_v2');
      setExamHistory([]);
    }
  };

  return (
    <div className={`${isEmbedded ? 'min-h-[85vh] rounded-2xl' : 'min-h-screen'} flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-indigo-500 selection:text-white`}>
      {/* Top Navbar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreateModal={() => setIsCreateContentOpen(true)}
        geminiModel={geminiModel}
        hasApiKey={Boolean(apiKey)}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        isEmbedded={isEmbedded}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-7 flex flex-col">
        {/* Tab 0: Student Learning Portal (Góc Học Tập Y Khoa) */}
        {currentTab === 'learn' && (
          <StudentPortal
            projects={projects}
            currentUser={currentUser}
            onSelectLessonForFlashcard={(lessonId, projId) => {
              setSelectedProjectId(projId);
              setSelectedLessonId(lessonId);
              setCurrentTab('flashcard');
            }}
            onSelectLessonForExam={(lessonId) => {
              setSelectedLessonId(lessonId);
              setCurrentTab('exam');
            }}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenClassroomManager={() => setCurrentTab('classes')}
            onOpenCreateModal={() => setIsCreateContentOpen(true)}
            onOpenShare={(les) => {
              setShareLessonTarget(les);
              setIsShareOpen(true);
            }}
            onOpenDeckSelector={() => setIsDeckSelectorOpen(true)}
          />
        )}

        {/* Tab 1: Admin & Structure / Mask Occlusion Studio */}
        {currentTab === 'admin' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-5 relative">
            {/* Toggle Left Sidebar Button */}
            <button
              onClick={() => setIsTreeSidebarOpen(!isTreeSidebarOpen)}
              className="hidden lg:flex absolute -left-3 top-4 z-20 items-center justify-center w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
              title={isTreeSidebarOpen ? 'Thu gọn danh mục bài học' : 'Mở rộng danh mục bài học'}
            >
              {isTreeSidebarOpen ? '◀' : '▶'}
            </button>

            {/* Sidebar Navigation Tree */}
            {isTreeSidebarOpen && (
              <AdminTreeNav
                projects={projects}
                selectedProjectId={selectedProjectId}
                selectedLessonId={selectedLessonId}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                  const proj = projects.find(p => p.id === id);
                  const firstLes = proj?.categories?.[0]?.subFolders?.[0]?.lessons?.[0];
                  if (firstLes) {
                    setSelectedLessonId(firstLes.id);
                    setCurrentImageId(firstLes.images?.[0]?.id || '');
                  }
                }}
                onSelectLesson={(id) => {
                  setSelectedLessonId(id);
                  for (const cat of currentProject?.categories || []) {
                    for (const sub of cat.subFolders || []) {
                      const l = sub.lessons?.find(item => item.id === id);
                      if (l && l.images && l.images.length > 0) {
                        setCurrentImageId(l.images[0].id);
                        return;
                      }
                    }
                  }
                  setCurrentImageId('');
                }}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddSubFolder={handleAddSubFolder}
                onDeleteSubFolder={handleDeleteSubFolder}
                onAddLesson={handleAddLesson}
                onDeleteLesson={handleDeleteLesson}
              />
            )}

            {/* Right: Interactive Canvas Editor */}
            <div className="flex-1 min-h-[620px] flex flex-col">
              {currentLesson ? (
                <MaskEditor
                  lesson={currentLesson}
                  currentImage={currentImage}
                  onUpdateImageMasks={handleUpdateImageMasks}
                  onAddImage={handleAddImage}
                  onSelectImage={(id) => setCurrentImageId(id)}
                  onDeleteImage={handleDeleteImage}
                  onOpenShare={(les) => {
                    setShareLessonTarget(les);
                    setIsShareOpen(true);
                  }}
                />
              ) : (
                <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Layers className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">
                    Hãy chọn hoặc tạo một bài học từ danh mục bên trái
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Bạn có thể tạo các thư mục lớn theo hệ cơ quan (Tuần hoàn, Thần kinh, Tiêu hoá...), chia thành các chương và bài học giải phẫu để quản lý sơ đồ và ô che thông minh.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Flashcard Study Mode (Anki SM-2 Spaced Repetition) */}
        {currentTab === 'flashcard' && (
          <FlashcardMode
            projects={projects}
            defaultLessonId={selectedLessonId}
            currentUser={currentUser}
            onOpenShare={(les) => {
              setShareLessonTarget(les);
              setIsShareOpen(true);
            }}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {/* Tab 3: Medical Spotting Exam (Thi Chạy Trạm 20 Trạm OSCE) */}
        {currentTab === 'exam' && (
          <MedicalSpottingExam
            projects={projects}
            onSaveExamResult={handleSaveExamResult}
          />
        )}

        {/* Tab 5: Classroom & Permission Whitelist Manager */}
        {currentTab === 'classes' && (
          <ClassroomManager
            projects={projects}
            onProjectsUpdated={(newProjects) => {
              updateProjectsState(newProjects);
            }}
          />
        )}

        {/* Tab 6: Exam History & Analytics */}
        {currentTab === 'history' && (
          <ExamHistory
            history={examHistory}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Footer */}
      {!isEmbedded && (
        <footer className="border-t border-slate-800/80 bg-[#0B0F19]/90 py-4 px-6 text-xs text-slate-400 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">
                DYNEX x DZOTA QUIZ
              </span>
              <span>•</span>
              <span>Hệ Thống Giải Phẫu & Thi Chạy Trạm Y Khoa AI</span>
            </div>

            <div className="flex items-center gap-2 font-semibold bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bản quyền: <span className="text-white font-bold">Nhật Duy</span></span>
            </div>
          </div>
        </footer>
      )}

      {/* Settings Modal (Gemini 3.6 Flash) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={({ apiKey, model }) => {
          setApiKey(apiKey);
          setGeminiModel(model);
        }}
      />

      {/* Share & Access Control Modal */}
      {isShareOpen && shareLessonTarget && (
        <ShareAccessModal
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setShareLessonTarget(null);
          }}
          lesson={shareLessonTarget}
          onUpdateLessonAccess={handleUpdateLessonAccess}
        />
      )}

      {/* Google Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      {/* Create Content Modal (+ Bài Học, Chương, Hệ Cơ Quan) */}
      <CreateContentModal
        isOpen={isCreateContentOpen}
        onClose={() => setIsCreateContentOpen(false)}
        projects={projects}
        selectedProjectId={selectedProjectId || projects[0]?.id || ''}
        onAddProject={handleAddProject}
        onAddCategory={handleAddCategory}
        onAddSubFolder={handleAddSubFolder}
        onAddLesson={handleAddLesson}
        onSelectCreatedLesson={(id) => {
          setSelectedLessonId(id);
          setCurrentTab('admin');
        }}
      />

      {/* Multi-chapter & Multi-lesson Deck Selector Modal */}
      <DeckSelectorModal
        isOpen={isDeckSelectorOpen}
        onClose={() => setIsDeckSelectorOpen(false)}
        projects={projects}
        initialSelectedLessonIds={selectedLessonId ? [selectedLessonId] : []}
        onStartSession={({ selectedLessonIds: chosenIds, studyMode }) => {
          setIsDeckSelectorOpen(false);
          if (chosenIds.length > 0) {
            setSelectedLessonId(chosenIds[0]);
          }
          if (studyMode === 'anki') {
            setCurrentTab('flashcard');
          } else {
            setCurrentTab('exam');
          }
        }}
      />
    </div>
  );
}

export default function DynexAppClient({ initialUser, isEmbedded = false }: DynexAppClientProps) {
  return (
    <Suspense
      fallback={
        <div className={`${isEmbedded ? 'min-h-[500px]' : 'min-h-screen'} bg-[#0B0F19] text-white flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Đang khởi tạo DYNEX Anatomy Studio...</p>
          </div>
        </div>
      }
    >
      <DynexInnerClient initialUser={initialUser} isEmbedded={isEmbedded} />
    </Suspense>
  );
}
