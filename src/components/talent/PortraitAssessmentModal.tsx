import { AlertCircle, CheckCircle2, Clock3, FileSearch, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import type { PortraitAssessment } from "@/services/portraitApi";
import { PortraitRadarChart } from "@/components/talent/PortraitRadarChart";

interface PortraitAssessmentModalProps {
  isOpen: boolean;
  recordName: string;
  assessment: PortraitAssessment | null;
  isStarting: boolean;
  error: string | null;
  isLoadingLatest?: boolean;
  onClose: () => void;
  onStart?: () => void;
  onRetry: () => void;
}

const terminalStatuses = new Set(["completed", "insufficient", "needs_review", "failed"]);

function statusLabel(status: string | undefined): string {
  if (status === "completed") return "识别完成";
  if (status === "insufficient") return "证据不足";
  if (status === "needs_review") return "需要复核";
  if (status === "failed") return "识别失败";
  if (status === "running") return "正在分析";
  return "排队中";
}

function statusIcon(status: string | undefined) {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "needs_review" || status === "insufficient") return <ShieldAlert className="h-5 w-5 text-amber-600" />;
  if (status === "failed") return <AlertCircle className="h-5 w-5 text-red-600" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-[#146d68]" />;
  return <Clock3 className="h-5 w-5 text-slate-400" />;
}

function formatConfidence(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export function PortraitAssessmentModal({ isOpen, recordName, assessment, isStarting, error, isLoadingLatest = false, onClose, onStart, onRetry }: PortraitAssessmentModalProps) {
  const status = assessment?.status ?? (error ? "failed" : undefined);
  const output = assessment?.output_snapshot;
  const isTerminal = Boolean(status && terminalStatuses.has(status));
  const isLoading = isLoadingLatest || isStarting;
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`画像识别 · ${recordName}`} maxWidth="3xl" footer={(
      <>
        {!assessment && !error && !isLoading && onStart && <button type="button" onClick={onStart} className="inline-flex items-center gap-1.5 rounded-lg bg-[#146d68] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f5854]"><FileSearch className="h-4 w-4" />开始识别</button>}
        {error && <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d9e2de] px-3 py-2 text-sm font-semibold text-[#146d68]"><RefreshCw className="h-4 w-4" />重试</button>}
        <button type="button" onClick={onClose} className="rounded-lg bg-[#146d68] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f5854]">关闭</button>
      </>
    )}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border border-[#e2ebe8] bg-[#f8faf9] px-4 py-3">
          {statusIcon(isLoading ? "running" : status)}
          <div className="min-w-0"><p className="text-sm font-bold text-[#263b35]">{isStarting ? "正在提交识别任务" : isLoadingLatest ? "正在读取最新画像" : statusLabel(status)}</p><p className="mt-0.5 text-xs text-[#71817b]">{isLoading ? "系统正在读取资料，请稍候。" : status === "queued" || status === "running" ? "系统正在汇总资料并调用模型，请稍候。" : status === "needs_review" ? "模型发现证据冲突，建议结合原始资料复核。" : status === "insufficient" ? "当前资料不足以形成可靠结论。" : status === "failed" ? "识别任务未能完成，请检查服务状态后重试。" : assessment ? "结果已保存，可关闭此窗口。" : "当前记录尚未完成画像识别。"}</p></div>
        </div>

        {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {assessment?.status === "failed" && assessment.error_message && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{assessment.error_message}</div>}

        {!assessment && !error && !isLoading && <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#cfded9] bg-[#fbfdfc] px-6 py-12 text-center"><FileSearch className="h-8 w-8 text-[#8aa49d]" /><p className="mt-3 text-sm font-bold text-[#38524b]">尚未识别</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#71817b]">{onStart ? "当前记录没有可展示的终态画像结果，可从下方开始一次画像识别。" : "当前记录类型暂不支持画像识别。"}</p></div>}

        {assessment && isTerminal && status !== "failed" && (
          <>
            {status === "insufficient" && <div className="flex items-center gap-3 rounded-lg border border-[#dce8e4] bg-[#f8faf9] px-4 py-3"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" /><div><p className="text-sm font-bold text-[#263b35]">证据不足</p><p className="mt-0.5 text-xs text-[#71817b]">当前资料不足以形成可靠结论。</p></div></div>}
            <section className="rounded-lg border border-[#e2ebe8] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#263b35]">核心结论</h3><div className="flex gap-2 text-xs"><span className="rounded-full bg-[#e7f3ef] px-2.5 py-1 font-semibold text-[#146d68]">{assessment.recommendation_level || "待观察"}</span>{assessment.weighted_score !== null && <span className="rounded-full bg-[#f1f5f3] px-2.5 py-1 text-[#526963]">综合分 {assessment.weighted_score}</span>}</div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#526963]">{output?.core_conclusion || assessment.core_conclusion || "暂无核心结论"}</p></section>
            {output?.highlight_signals?.length ? <section><h3 className="text-sm font-bold text-[#263b35]">关键信号</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#526963]">{output.highlight_signals.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
            <section className="rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#263b35]">能力画像</h3>{assessment.evidence_coverage !== null && <span className="text-xs font-semibold text-[#71817b]">证据覆盖率 {Math.round(assessment.evidence_coverage * 100)}%</span>}</div><div className="mt-2 flex justify-center"><PortraitRadarChart dimensions={assessment.dimensions} /></div></section>
            <section><h3 className="text-sm font-bold text-[#263b35]">能力维度</h3><div className="mt-2 overflow-x-auto rounded-lg border border-[#e2ebe8]"><table className="min-w-full text-left text-sm"><thead className="bg-[#f8faf9] text-xs font-bold text-[#71817b]"><tr><th className="px-3 py-2">维度</th><th className="px-3 py-2">分数</th><th className="px-3 py-2">置信度</th><th className="px-3 py-2">证据状态</th><th className="px-3 py-2">结论</th></tr></thead><tbody>{assessment.dimensions.map((dimension) => <tr key={`${dimension.section_code}-${dimension.dimension_code}`} className="border-t border-[#edf2f0]"><td className="px-3 py-2 font-semibold text-[#38524b]">{dimension.dimension_label || dimension.dimension_code}</td><td className="px-3 py-2 text-[#526963]">{dimension.score === null ? "—" : dimension.score}</td><td className="px-3 py-2 text-[#526963]">{formatConfidence(dimension.confidence)}</td><td className="px-3 py-2 text-[#526963]">{dimension.evidence_state === "positive" ? "充分" : dimension.evidence_state === "negative" ? "负面" : "不足"}{dimension.review_state === "conflict" ? " · 冲突" : ""}</td><td className="min-w-[260px] px-3 py-2 leading-5 text-[#526963]">{dimension.conclusion}</td></tr>)}</tbody></table></div></section>
            {(output?.recommended_actions?.length || output?.recommendation_reasons?.length || output?.missing_data?.length || output?.cooperation_message) ? <section className="space-y-3 rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-4">{output.recommendation_reasons?.length ? <div><h3 className="text-sm font-bold text-[#263b35]">推荐依据</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#526963]">{output.recommendation_reasons.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}{output.recommended_actions?.length ? <div><h3 className="text-sm font-bold text-[#263b35]">建议行动</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#526963]">{output.recommended_actions.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}{output.missing_data?.length ? <div><h3 className="text-sm font-bold text-[#263b35]">缺失资料</h3><p className="mt-1 text-sm text-[#8a5c10]">{output.missing_data.join("；")}</p></div> : null}{output.cooperation_message ? <p className="text-sm leading-5 text-[#526963]">{output.cooperation_message}</p> : null}</section> : null}
          </>
        )}
      </div>
    </BaseModal>
  );
}
