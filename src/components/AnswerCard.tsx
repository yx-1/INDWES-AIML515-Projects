import React, { useEffect, useState } from 'react';
import { SearchRecord } from '../types';
import {
  Check,
  CheckCircle2,
  Printer,
  ExternalLink
} from 'lucide-react';
import { FEEDBACK_COMMENT_MAX_LENGTH, validateFeedbackComment } from '../lib/validation';
import { loadChecklist, saveChecklist } from '../lib/storage';
import { LoadingSpinner } from './common/LoadingSpinner';

interface AnswerCardProps {
  record: SearchRecord;
  onFeedback: (recordId: string, rating: 'helpful' | 'not_helpful', comment?: string) => Promise<void> | void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ record, onFeedback }) => {
  const [completedDocs, setCompletedDocs] = useState<Record<string, boolean>>(() =>
    loadChecklist(record.id)
  );
  const [feedbackComment, setFeedbackComment] = useState(record.feedback?.comment || '');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [tempRating, setTempRating] = useState<'helpful' | 'not_helpful' | null>(
    record.feedback?.rating || null
  );
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(!!record.feedback);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    saveChecklist(record.id, completedDocs);
  }, [record.id, completedDocs]);

  const toggleDocCheck = (docName: string) => {
    setCompletedDocs((prev) => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  const handleRatingClick = async (rating: 'helpful' | 'not_helpful') => {
    setTempRating(rating);
    setIsSavingFeedback(true);
    setFeedbackError(null);
    try {
      await onFeedback(record.id, rating);
      setHasSubmittedFeedback(true);
      setShowCommentBox(true);
    } catch (err: any) {
      console.error('Feedback error:', err);
      setFeedbackError(err?.message || 'Your rating could not be saved. Please try again.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempRating) {
      setIsSavingFeedback(true);
      try {
        const commentError = validateFeedbackComment(feedbackComment);
        if (commentError) {
          setFeedbackError(commentError);
          setIsSavingFeedback(false);
          return;
        }
        await onFeedback(record.id, tempRating, feedbackComment.trim() || undefined);
        setShowCommentBox(false);
      } catch (err: any) {
        setFeedbackError(err?.message || 'Your comment could not be saved. Please try again.');
      } finally {
        setIsSavingFeedback(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const completedCount = Object.values(completedDocs).filter(Boolean).length;
  const totalDocs = record.answer.requiredDocuments.length;

  return (
    <div
      id={`answer-card-${record.id}`}
      className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs overflow-hidden"
    >
      <div className="p-4 sm:p-6 flex-1 space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
            </svg>
          </div>

          <div className="space-y-4 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  {record.jurisdiction}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500">
                  {record.category}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                title="Print checklist"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>

            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              "{record.question}"
            </h3>

            <p className="text-sm leading-relaxed text-slate-700">
              {record.answer.summary}
            </p>

            {record.answer.keyThresholds && record.answer.keyThresholds.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Municipal Thresholds & Code Rules
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 text-slate-600 ml-1">
                  {record.answer.keyThresholds.map((threshold, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {threshold}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pre-Submission Document Checklist
                </p>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {completedCount} / {totalDocs} prepared
                </span>
              </div>

              <div className="space-y-2">
                {record.answer.requiredDocuments.map((doc, idx) => {
                  const isChecked = !!completedDocs[doc.documentName];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleDocCheck(doc.documentName)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${
                        isChecked
                          ? 'bg-slate-50/80 border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {doc.documentName}
                          </span>
                          {doc.isMandatory ? (
                            <span className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                              Conditional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Official Source Records
                </p>
                <span className="text-[11px] text-slate-400">
                  {record.jurisdiction} • {record.category}
                </span>
              </div>
              <div className="space-y-2.5">
                {record.answer.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-10 bg-red-50 border border-red-200 rounded flex items-center justify-center text-[10px] font-bold text-red-600 shrink-0">
                        PDF
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {src.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                            {record.jurisdiction}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {src.codeReference} • {src.department} • <span className="font-medium text-slate-600">{record.category}</span>
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600 min-w-0">
                          <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide shrink-0">Source URL:</span>
                          {src.urlOrDocRef.startsWith('http') ? (
                            <a
                              href={src.urlOrDocRef}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 font-medium hover:underline truncate min-w-0 flex-1 flex items-center gap-1"
                              title={src.urlOrDocRef}
                            >
                              <span className="truncate">{src.urlOrDocRef}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-600 font-medium truncate min-w-0">
                              {src.urlOrDocRef}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
        <p className="text-[11px] text-slate-500 leading-normal">
          <strong className="text-slate-700">Notice:</strong> PermitLens AI is an independent contractor research tool and is not an official permitting authority or municipal government agency. Always verify permit submittal requirements with your local building department.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Was this helpful?
            </span>
            <div className="flex items-center gap-2">
              <button
                id={`feedback-helpful-btn-${record.id}`}
                type="button"
                disabled={isSavingFeedback}
                aria-busy={isSavingFeedback}
                onClick={() => handleRatingClick('helpful')}
                className={`px-3 py-1 rounded-md border text-xs font-semibold transition cursor-pointer ${
                  tempRating === 'helpful'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-emerald-50 border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-700'
                }`}
              >
                [Helpful]
              </button>
              <button
                id={`feedback-not-helpful-btn-${record.id}`}
                type="button"
                disabled={isSavingFeedback}
                onClick={() => handleRatingClick('not_helpful')}
                className={`px-3 py-1 rounded-md border text-xs font-semibold transition cursor-pointer ${
                  tempRating === 'not_helpful'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-rose-50 border-slate-300 hover:border-rose-400 text-slate-700 hover:text-rose-700'
                }`}
              >
                [Not Helpful]
              </button>
            </div>
          </div>

          {hasSubmittedFeedback && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
              {isSavingFeedback ? (
                <LoadingSpinner className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
              <span>Thanks — your feedback was saved.</span>
            </div>
          )}
        </div>

        {feedbackError && (
          <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200" role="alert">
            {feedbackError}
          </div>
        )}
      </div>

      {showCommentBox && (
        <form onSubmit={handleCommentSubmit} className="p-3 bg-slate-100/80 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={feedbackComment}
              maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
              onChange={(e) => {
                setFeedbackComment(e.target.value);
                if (feedbackError) setFeedbackError(null);
              }}
              placeholder={
                tempRating === 'helpful'
                  ? 'Optional: What was most helpful? (e.g., document checklist, municipal code reference)'
                  : 'Optional: What was missing or could be improved?'
              }
              className="flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSavingFeedback}
              className="rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              {isSavingFeedback ? (
                <span className="inline-flex items-center gap-1">
                  <LoadingSpinner className="h-3 w-3 text-white" />
                  Saving...
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
