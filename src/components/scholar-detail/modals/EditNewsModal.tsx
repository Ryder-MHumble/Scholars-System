import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import type {
  ScholarNews,
  ScholarNewsCreate,
  ScholarNewsUpdate,
} from "@/services/scholarApi/types";

interface EditNewsModalProps {
  news?: ScholarNews;
  onClose: () => void;
  onSubmit: (payload: ScholarNewsCreate | ScholarNewsUpdate) => Promise<void>;
}

export function EditNewsModal({ news, onClose, onSubmit }: EditNewsModalProps) {
  const [form, setForm] = useState({
    title: news?.title ?? "",
    news_type: news?.news_type ?? "",
    summary: news?.summary ?? "",
    content: news?.content ?? "",
    published_at: news?.published_at?.slice(0, 10) ?? "",
    source_url: news?.source_url ?? "",
    event_id: news?.event_id ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim() || !form.published_at) return;
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: form.title.trim(),
        news_type: form.news_type.trim() || null,
        summary: form.summary.trim() || null,
        content: form.content.trim() || null,
        published_at: `${form.published_at}T00:00:00Z`,
        source_url: form.source_url.trim() || null,
        event_id: form.event_id.trim() || null,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title={news ? "编辑学者活动" : "新增学者活动"}
      maxWidth="lg"
      closeOnBackdropClick={!isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting || !form.title.trim() || !form.published_at}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            保存
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <label className="block text-sm text-gray-700">
          <span className="mb-1 block text-xs font-medium text-gray-500">标题 *</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            <span className="mb-1 block text-xs font-medium text-gray-500">类型</span>
            <input
              value={form.news_type}
              onChange={(event) => setForm((current) => ({ ...current, news_type: event.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
            />
          </label>
          <label className="block text-sm text-gray-700">
            <span className="mb-1 block text-xs font-medium text-gray-500">发布日期 *</span>
            <input
              type="date"
              value={form.published_at}
              onChange={(event) => setForm((current) => ({ ...current, published_at: event.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
            />
          </label>
        </div>
        <label className="block text-sm text-gray-700">
          <span className="mb-1 block text-xs font-medium text-gray-500">摘要</span>
          <textarea
            rows={2}
            value={form.summary}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
          />
        </label>
        <label className="block text-sm text-gray-700">
          <span className="mb-1 block text-xs font-medium text-gray-500">正文</span>
          <textarea
            rows={5}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
          />
        </label>
        <label className="block text-sm text-gray-700">
          <span className="mb-1 block text-xs font-medium text-gray-500">来源 URL</span>
          <input
            type="url"
            value={form.source_url}
            onChange={(event) => setForm((current) => ({ ...current, source_url: event.target.value }))}
            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
          />
        </label>
        <label className="block text-sm text-gray-700">
          <span className="mb-1 block text-xs font-medium text-gray-500">关联活动 ID</span>
          <input
            value={form.event_id}
            onChange={(event) => setForm((current) => ({ ...current, event_id: event.target.value }))}
            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400"
          />
        </label>
      </div>
    </BaseModal>
  );
}
