import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, MapPin, Plus, Check, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { SupervisedStudent } from "@/services/facultyApi";

interface AdvisedStudent {
  id: string;
  name: string;
  degree: "博士" | "硕士" | "博士后";
  startYear: number;
  endYear?: number;
  currentPosition?: string;
}

interface Props {
  advisedStudents: AdvisedStudent[];
  onSave?: (students: SupervisedStudent[]) => Promise<void>;
}

const degreeColor: Record<AdvisedStudent["degree"], string> = {
  博士: "bg-violet-100 text-violet-700 border-violet-200",
  硕士: "bg-blue-100 text-blue-700 border-blue-200",
  博士后: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const DEGREE_OPTIONS = ["博士", "硕士", "博士后"] as const;

const emptyNewStudent = () => ({
  name: "",
  degree: "博士" as "博士" | "硕士" | "博士后",
  startYear: "",
  endYear: "",
  currentPosition: "",
});

export function StatsSidebar({ advisedStudents, onSave }: Props) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedStudents, setEditedStudents] = useState<AdvisedStudent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState(emptyNewStudent());

  const handleEnterEdit = () => {
    setEditedStudents([...advisedStudents]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedStudents([]);
    setShowAddForm(false);
    setEditingIdx(null);
    setNewStudent(emptyNewStudent());
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const apiStudents: SupervisedStudent[] = editedStudents.map((s) => ({
        name: s.name,
        degree: s.degree,
        start_year: s.startYear,
        end_year: s.endYear,
        current_position: s.currentPosition,
      }));
      await onSave(apiStudents);
      setIsEditMode(false);
      setShowAddForm(false);
      setEditingIdx(null);
    } catch (e) {
      console.error("Failed to save students:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (idx: number) => {
    setEditedStudents((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const handleUpdate = (idx: number, field: string, value: any) => {
    setEditedStudents((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleAddStudent = () => {
    if (!newStudent.name.trim()) return;
    const student: AdvisedStudent = {
      id: String(Date.now()),
      name: newStudent.name.trim(),
      degree: newStudent.degree,
      startYear: Number(newStudent.startYear) || 0,
      endYear: newStudent.endYear ? Number(newStudent.endYear) : undefined,
      currentPosition: newStudent.currentPosition.trim() || undefined,
    };
    setEditedStudents((prev) => [...prev, student]);
    setNewStudent(emptyNewStudent());
    setShowAddForm(false);
  };

  const displayStudents = isEditMode ? editedStudents : advisedStudents;

  return (
    <aside className="w-80 shrink-0 space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className={cn("px-5 py-4 border-b border-gray-100 flex items-center gap-2 transition-colors", isEditMode && "bg-primary-50/40")}>
          <GraduationCap className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">指导学生</h3>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {displayStudents.length} 人
          </span>
          {onSave && !isEditMode && (
            <button
              onClick={handleEnterEdit}
              className="ml-1 flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              编辑
            </button>
          )}
          {isEditMode && (
            <div className="flex gap-1 ml-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                {isSaving ? "保存中" : "保存"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
              >
                取消
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 max-h-[480px] overflow-y-auto custom-scrollbar">
          {displayStudents.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <GraduationCap className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">暂无指导学生记录</p>
            </div>
          ) : (
            displayStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {student.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditMode && editingIdx === index ? (
                    /* Inline edit form for existing student */
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => handleUpdate(index, "name", e.target.value)}
                        placeholder="姓名"
                        className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <select
                        value={student.degree}
                        onChange={(e) => handleUpdate(index, "degree", e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      >
                        {DEGREE_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={String(student.startYear || "")}
                          onChange={(e) =>
                            handleUpdate(index, "startYear", Number(e.target.value) || 0)
                          }
                          placeholder="入学年份"
                          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <input
                          type="text"
                          value={String(student.endYear || "")}
                          onChange={(e) =>
                            handleUpdate(
                              index,
                              "endYear",
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                          placeholder="毕业年份"
                          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={student.currentPosition || ""}
                        onChange={(e) => handleUpdate(index, "currentPosition", e.target.value)}
                        placeholder="当前职位"
                        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <button
                        onClick={() => setEditingIdx(null)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Check className="w-3 h-3" /> 完成
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900">{student.name}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                            degreeColor[student.degree],
                          )}
                        >
                          {student.degree}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {student.endYear
                          ? `${student.startYear}–${student.endYear}`
                          : `${student.startYear}–在读`}
                      </div>
                      {student.currentPosition && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{student.currentPosition}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isEditMode && editingIdx !== index && (
                  <div className="flex gap-1 shrink-0 self-center">
                    <button
                      onClick={() => setEditingIdx(index)}
                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}

          {/* Add student form */}
          {isEditMode && showAddForm && (
            <div className="mt-2 p-3 border border-primary-100 bg-primary-50/30 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-primary-700">添加学生</p>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))}
                placeholder="姓名 *"
                className="w-full text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <select
                value={newStudent.degree}
                onChange={(e) =>
                  setNewStudent((p) => ({
                    ...p,
                    degree: e.target.value as "博士" | "硕士" | "博士后",
                  }))
                }
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newStudent.startYear}
                  onChange={(e) => setNewStudent((p) => ({ ...p, startYear: e.target.value }))}
                  placeholder="入学年份"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={newStudent.endYear}
                  onChange={(e) => setNewStudent((p) => ({ ...p, endYear: e.target.value }))}
                  placeholder="毕业年份"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <input
                type="text"
                value={newStudent.currentPosition}
                onChange={(e) =>
                  setNewStudent((p) => ({ ...p, currentPosition: e.target.value }))
                }
                placeholder="当前职位"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAddStudent}
                  disabled={!newStudent.name.trim()}
                  className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewStudent(emptyNewStudent());
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
