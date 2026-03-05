import { useState, useCallback } from "react";
import type { ProjectListItem } from "@/types/project";
import {
  fetchProjectList,
  createProject,
  patchProject,
  deleteProject,
} from "@/services/projectApi";
import type { ProjectCreateRequest, ProjectPatchRequest } from "@/types/project";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(
    async (p = 1, search?: string, status?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProjectList(p, 20, search, status);
        setProjects(data.items);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const addProject = useCallback(async (data: ProjectCreateRequest) => {
    const created = await createProject(data);
    return created;
  }, []);

  const updateProject = useCallback(
    async (id: string, data: ProjectPatchRequest) => {
      const updated = await patchProject(id, data);
      return updated;
    },
    [],
  );

  const removeProject = useCallback(async (id: string) => {
    await deleteProject(id);
  }, []);

  return {
    projects,
    total,
    page,
    totalPages,
    loading,
    error,
    loadProjects,
    addProject,
    updateProject,
    removeProject,
  };
}
