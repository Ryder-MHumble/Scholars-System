import { create } from 'zustand';
import type { Scholar, ScholarWithInstitution } from '@/types';
import { scholars as mockScholars } from '@/data/scholars';
import { universities } from '@/data/universities';

interface ScholarFilters {
  universityId?: string;
  departmentId?: string;
  title?: string;
  researchField?: string;
  query?: string;
}

interface ScholarStore {
  scholars: Scholar[];
  filters: ScholarFilters;
  viewMode: 'grid' | 'table';
  currentPage: number;
  pageSize: number;
  setFilter: (key: keyof ScholarFilters, value: string | undefined) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'table') => void;
  setPage: (page: number) => void;
  updateScholar: (id: string, data: Partial<Scholar>) => void;
  getFilteredScholars: () => ScholarWithInstitution[];
  getScholarById: (id: string) => ScholarWithInstitution | undefined;
}

function enrichScholar(s: Scholar): ScholarWithInstitution {
  const uni = universities.find((u) => u.id === s.universityId);
  const dept = uni?.departments.find((d) => d.id === s.departmentId);
  return {
    ...s,
    universityName: uni?.name ?? '',
    departmentName: dept?.name ?? '',
  };
}

export const useScholarStore = create<ScholarStore>((set, get) => ({
  scholars: [...mockScholars],
  filters: {},
  viewMode: 'grid',
  currentPage: 1,
  pageSize: 12,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value }, currentPage: 1 })),
  clearFilters: () => set({ filters: {}, currentPage: 1 }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPage: (page) => set({ currentPage: page }),
  updateScholar: (id, data) =>
    set((s) => ({
      scholars: s.scholars.map((sc) =>
        sc.id === id ? { ...sc, ...data, updatedAt: new Date().toISOString() } : sc,
      ),
    })),
  getFilteredScholars: () => {
    const { scholars, filters } = get();
    let result = scholars;
    if (filters.universityId) {
      result = result.filter((s) => s.universityId === filters.universityId);
    }
    if (filters.departmentId) {
      result = result.filter((s) => s.departmentId === filters.departmentId);
    }
    if (filters.title) {
      result = result.filter((s) => s.title === filters.title);
    }
    if (filters.researchField) {
      result = result.filter((s) => s.researchFields.includes(filters.researchField!));
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
          s.researchFields.some((f) => f.toLowerCase().includes(q)),
      );
    }
    return result.map(enrichScholar);
  },
  getScholarById: (id) => {
    const scholar = get().scholars.find((s) => s.id === id);
    return scholar ? enrichScholar(scholar) : undefined;
  },
}));
