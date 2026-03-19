import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  MapPin,
  Plus,
  Check,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  fetchStudents,
  createStudent,
  patchStudent,
  deleteStudent,
  type StudentRecord,
  type StudentCreate,
  type StudentPatch,
} from "@/services/scholarApi";
import { SelectInput } from "@/components/ui/SelectInput";

interface Props {
  urlHash: string;
}

const degreeColor: Record<string, string> = {
  博士: "bg-violet-100 text-violet-700 border-violet-200",
  硕士: "bg-blue-100 text-blue-700 border-blue-200",
  博士后: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColor: Record<string, string> = {
  在读: "bg-green-50 text-green-600",
  已毕业: "bg-gray-50 text-gray-500",
  已离校: "bg-red-50 text-red-500",
};

const STATUS_OPTIONS = ["在读", "已毕业", "已离校"];

const emptyAddForm = (): StudentCreate => ({
  name: "",
  degree_type: "博士",
  enrollment_year: "",
  expected_graduation_year: "",
  status: "在读",
  home_university: "",
  student_no: "",
  email: "",
  phone: "",
  notes: "",
});

export function StatsSidebar({ urlHash }: Props) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StudentPatch>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<StudentCreate>(emptyAddForm());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchStudents(urlHash)
      .then((res) => {
        setStudents(res.items);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [urlHash]);

  const handleEnterEdit = () => setIsEditMode(true);

  const handleFinishEdit = () => {
    setIsEditMode(false);
    setEditingId(null);
    setShowAddForm(false);
    setEditForm({});
    setAddForm(emptyAddForm());
  };

  const handleStartEdit = (student: StudentRecord) => {
    setEditingId(student.id);
    setEditForm({
      name: student.name,
      degree_type: student.degree_type,
      enrollment_year: student.enrollment_year,
      expected_graduation_year: student.expected_graduation_year,
      status: student.status,
      home_university: student.home_university,
      student_no: student.student_no,
      email: student.email,
      phone: student.phone,
      notes: student.notes,
    });
  };

  const handleSaveEdit = async (studentId: string) => {
    setIsSaving(true);
    try {
      const updated = await patchStudent(urlHash, studentId, editForm);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? updated : s)),
      );
      setEditingId(null);
      setEditForm({});
    } catch (e) {
      console.error("Failed to update student:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    setIsSaving(true);
    try {
      await deleteStudent(urlHash, studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (e) {
      console.error("Failed to delete student:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setIsSaving(true);
    try {
      const created = await createStudent(urlHash, addForm);
      setStudents((prev) => [...prev, created]);
      setAddForm(emptyAddForm());
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create student:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside className="w-80 shrink-0 space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div
          className={cn(
            "px-5 py-4 border-b border-gray-100 flex items-center gap-2 transition-colors",
            isEditMode && "bg-primary-50/40",
          )}
        >
          <GraduationCap className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">指导学生</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {students.length} 人
          </span>
          {!isEditMode ? (
            <button
              onClick={handleEnterEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              编辑
            </button>
          ) : (
            <button
              onClick={handleFinishEdit}
              className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            >
              完成
            </button>
          )}
        </div>

        <div className="px-5 py-3 max-h-[540px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
            </div>
          ) : students.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <GraduationCap className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">暂无指导学生记录</p>
            </div>
          ) : (
            students.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {student.name.charAt(0) || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditMode && editingId === student.id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={editForm.name ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="姓名 *"
                        className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <div className="flex gap-1">
                        <SelectInput
                          value={editForm.degree_type ?? ""}
                          onChange={(v) =>
                            setEditForm((p) => ({
                              ...p,
                              degree_type: v,
                            }))
                          }
                          className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
                        >
                          <option value="">学位</option>
                          {["博士", "硕士", "博士后"].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </SelectInput>
                        <SelectInput
                          value={editForm.status ?? "在读"}
                          onChange={(v) =>
                            setEditForm((p) => ({
                              ...p,
                              status: v,
                            }))
                          }
                          className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editForm.enrollment_year ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              enrollment_year: e.target.value,
                            }))
                          }
                          placeholder="入学年份"
                          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <input
                          type="text"
                          value={editForm.expected_graduation_year ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              expected_graduation_year: e.target.value,
                            }))
                          }
                          placeholder="预计毕业"
                          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={editForm.home_university ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            home_university: e.target.value,
                          }))
                        }
                        placeholder="所属高校"
                        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editForm.email ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                          placeholder="邮箱"
                          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <input
                          type="text"
                          value={editForm.phone ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="电话"
                          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={editForm.student_no ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            student_no: e.target.value,
                          }))
                        }
                        placeholder="学号"
                        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <textarea
                        value={editForm.notes ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="备注"
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveEdit(student.id)}
                          disabled={isSaving || !editForm.name?.trim()}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          {isSaving ? "保存中" : "保存"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({});
                          }}
                          className="flex-1 px-2 py-1.5 border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {student.name}
                        </span>
                        {student.degree_type && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                              degreeColor[student.degree_type] ??
                                "bg-gray-100 text-gray-600 border-gray-200",
                            )}
                          >
                            {student.degree_type}
                          </span>
                        )}
                        {student.status && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-medium",
                              statusColor[student.status] ??
                                "bg-gray-50 text-gray-500",
                            )}
                          >
                            {student.status}
                          </span>
                        )}
                      </div>
                      {(student.enrollment_year ||
                        student.expected_graduation_year) && (
                        <div className="text-xs text-gray-500 mb-1">
                          {student.enrollment_year &&
                          student.expected_graduation_year
                            ? `${student.enrollment_year}–${student.expected_graduation_year}`
                            : student.enrollment_year
                              ? `${student.enrollment_year} 入学`
                              : `预计 ${student.expected_graduation_year} 毕业`}
                        </div>
                      )}
                      {student.home_university && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {student.home_university}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isEditMode && editingId !== student.id && (
                  <div className="flex gap-1 shrink-0 self-center">
                    <button
                      onClick={() => handleStartEdit(student)}
                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      disabled={isSaving}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}

          {isEditMode && showAddForm && (
            <div className="mt-2 p-3 border border-primary-100 bg-primary-50/30 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-primary-700">添加学生</p>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="姓名 *"
                className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <div className="flex gap-1">
                <SelectInput
                  value={addForm.degree_type ?? "博士"}
                  onChange={(v) =>
                    setAddForm((p) => ({ ...p, degree_type: v }))
                  }
                  className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
                >
                  <option value="">学位</option>
                  {["博士", "硕士", "博士后"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  value={addForm.status ?? "在读"}
                  onChange={(v) => setAddForm((p) => ({ ...p, status: v }))}
                  className="flex-1 px-2 py-1 text-sm border-gray-200 rounded focus:ring-1 focus:ring-primary-400"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </SelectInput>
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={addForm.enrollment_year ?? ""}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      enrollment_year: e.target.value,
                    }))
                  }
                  placeholder="入学年份"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={addForm.expected_graduation_year ?? ""}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      expected_graduation_year: e.target.value,
                    }))
                  }
                  placeholder="预计毕业"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <input
                type="text"
                value={addForm.home_university ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, home_university: e.target.value }))
                }
                placeholder="所属高校"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={addForm.email ?? ""}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="邮箱"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={addForm.phone ?? ""}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="电话"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <input
                type="text"
                value={addForm.student_no ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, student_no: e.target.value }))
                }
                placeholder="学号"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <textarea
                value={addForm.notes ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="备注"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAdd}
                  disabled={!addForm.name.trim() || isSaving}
                  className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "添加中..." : "添加"}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setAddForm(emptyAddForm());
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {isEditMode && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mt-3 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 添加学生
            </button>
          )}
        </div>
      </motion.div>
    </aside>
  );
}
