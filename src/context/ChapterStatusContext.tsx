import React, { createContext, useContext, useState, useCallback } from 'react';

export type ChapterStatus = 'pending' | 'in-progress' | 'completed';

interface ChapterStatusContextValue {
  overrides: Record<string, ChapterStatus>;
  setStatus: (chapterId: string, status: ChapterStatus) => void;
}

const ChapterStatusContext = createContext<ChapterStatusContextValue | null>(null);

export const ChapterStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overrides, setOverrides] = useState<Record<string, ChapterStatus>>({});

  const setStatus = useCallback((chapterId: string, status: ChapterStatus) => {
    setOverrides(prev => ({ ...prev, [chapterId]: status }));
    // TODO once you have a backend: fire the API/mutation call here too, e.g.
    // api.updateChapterStatus(chapterId, status);
  }, []);

  return (
    <ChapterStatusContext.Provider value={{ overrides, setStatus }}>
      {children}
    </ChapterStatusContext.Provider>
  );
};

// Merges live overrides on top of whatever useChapters() returns,
// so every page (admin/student/parent) shows the same status.
export function useChapterStatuses<T extends { id: string; status: ChapterStatus }>(chapters: T[]) {
  const ctx = useContext(ChapterStatusContext);
  if (!ctx) throw new Error('useChapterStatuses must be used inside <ChapterStatusProvider>');
  const { overrides, setStatus } = ctx;

  const merged = chapters.map(ch => ({
    ...ch,
    status: overrides[ch.id] ?? ch.status,
  }));

  return { chapters: merged, setStatus };
}