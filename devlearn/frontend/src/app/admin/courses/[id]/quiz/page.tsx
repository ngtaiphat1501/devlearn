'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import api from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet: string | null;
  options: string[];
  answer: number;
  position: number;
}

const makeEmptyQuestion = () => ({
  question: '',
  codeSnippet: '',
  options: ['', '', '', ''],
  answer: 0,
});

export default function AdminQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState('');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState(makeEmptyQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<QuizQuestion>>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchQuiz();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Dùng /admin/courses/:id/quiz (đã có trong admin.routes.ts)
      // KHÔNG dùng /courses/:id/quiz vì route đó là dành cho student
      const res = await api.get(`/admin/courses/${courseId}/quiz`);
      setCourseTitle(res.data.courseTitle ?? '');
      setQuizId(res.data.quizId ?? null);
      setQuestions(res.data.questions ?? []);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error('Lỗi tải quiz');
      }
      // 404 = chưa có quiz, là bình thường
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const handleCreateQuiz = async () => {
    setSaving(true);
    try {
      // FIX: Dùng /admin/courses/:id/quiz
      const res = await api.post(`/admin/courses/${courseId}/quiz`);
      setQuizId(res.data.id ?? res.data.quiz?.id);
      toast.success('Đã tạo quiz!');
    } catch {
      toast.error('Không thể tạo quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQ.question.trim()) {
      toast.error('Nhập nội dung câu hỏi');
      return;
    }
    if (newQ.options.some((o) => !o.trim())) {
      toast.error('Điền đủ 4 đáp án');
      return;
    }
    setSaving(true);
    try {
      // FIX: Dùng /admin/courses/:id/quiz/questions
      const res = await api.post(`/admin/courses/${courseId}/quiz/questions`, {
        question: newQ.question,
        codeSnippet: newQ.codeSnippet || null,
        options: newQ.options,
        answer: newQ.answer,
        position: questions.length + 1,
      });
      setQuestions((prev) => [...prev, res.data]);
      setNewQ(makeEmptyQuestion());
      setShowAddForm(false);
      toast.success('Đã thêm câu hỏi!');
    } catch {
      toast.error('Lỗi thêm câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      // FIX: Dùng /admin/quiz-questions/:id (route đúng trong admin.routes.ts)
      await api.delete(`/admin/quiz-questions/${qId}`);
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
      toast.success('Đã xóa');
    } catch {
      toast.error('Lỗi xóa câu hỏi');
    }
  };

  const handleSaveEdit = async (qId: string) => {
    setSaving(true);
    try {
      // FIX: Dùng /admin/quiz-questions/:id (route đúng trong admin.routes.ts)
      const res = await api.patch(`/admin/quiz-questions/${qId}`, editData);
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, ...res.data } : q))
      );
      setEditingId(null);
      toast.success('Đã lưu!');
    } catch {
      toast.error('Lỗi lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-acc" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border2 bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-[#94a3b8] hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[#64748b] uppercase tracking-wider">Quiz</p>
            <h1 className="text-[16px] font-semibold">{courseTitle || 'Đang tải...'}</h1>
          </div>
        </div>
        <Link
          href={`/admin/courses/${courseId}/lessons`}
          className="px-3 py-1.5 text-[12px] border border-border2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          Bài học
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Chưa có quiz */}
        {!quizId ? (
          <div className="text-center py-20">
            <div className="text-[48px] mb-4">📝</div>
            <p className="text-[15px] font-medium mb-2">Chưa có quiz</p>
            <p className="text-[13px] text-[#64748b] mb-6">
              Tạo quiz để học viên có thể kiểm tra kiến thức
            </p>
            <button
              onClick={handleCreateQuiz}
              disabled={saving}
              className="px-6 py-2.5 bg-acc text-black text-[13px] font-medium rounded-xl disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Đang tạo...' : '+ Tạo Quiz'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quiz info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] text-[#64748b] font-mono">
                // {questions.length} câu hỏi · pass ≥ 75%
              </p>
            </div>

            {/* Questions */}
            {questions.map((q, i) => (
              <div key={q.id} className="bg-card border border-border2 rounded-xl p-5">
                {editingId === q.id ? (
                  /* ── Edit form ── */
                  <div className="space-y-3">
                    <textarea
                      value={editData.question ?? ''}
                      onChange={(e) => setEditData((p) => ({ ...p, question: e.target.value }))}
                      rows={2}
                      className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px] resize-none focus:border-acc outline-none transition-colors"
                      placeholder="Nội dung câu hỏi *"
                    />
                    <textarea
                      value={editData.codeSnippet ?? ''}
                      onChange={(e) => setEditData((p) => ({ ...p, codeSnippet: e.target.value }))}
                      rows={3}
                      className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[12px] font-mono resize-none focus:border-acc outline-none transition-colors"
                      placeholder="Code snippet (tùy chọn)"
                    />
                    <p className="text-[11px] text-[#64748b]">
                      Click radio để chọn đáp án đúng
                    </p>
                    <div className="space-y-2">
                      {((editData.options as string[]) ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`edit-${q.id}`}
                            checked={editData.answer === oi}
                            onChange={() => setEditData((p) => ({ ...p, answer: oi }))}
                            className="accent-acc"
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...((editData.options as string[]) ?? [])];
                              opts[oi] = e.target.value;
                              setEditData((p) => ({ ...p, options: opts }));
                            }}
                            className="flex-1 bg-background border border-border2 rounded-lg px-3 py-1.5 text-[12px] focus:border-acc outline-none transition-colors"
                            placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(q.id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-acc text-black text-[12px] font-medium rounded-lg disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 border border-border2 text-[12px] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-[14px] font-medium leading-snug">
                        <span className="text-acc font-mono mr-1.5">Q{i + 1}.</span>
                        {q.question}
                      </p>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(q.id);
                            setEditData({ ...q });
                          }}
                          className="text-[11px] text-[#94a3b8] hover:text-foreground px-2 py-1 rounded transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-[#ef4444] hover:text-red-300 p-1 rounded transition-colors hover:bg-[rgba(239,68,68,0.08)]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {q.codeSnippet && (
                      <pre className="bg-background border border-border2 rounded-lg p-3 text-[11px] font-mono mb-3 overflow-x-auto text-acc3 leading-relaxed">
                        {q.codeSnippet}
                      </pre>
                    )}

                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] ${
                            oi === q.answer
                              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                              : 'bg-[rgba(255,255,255,0.02)] border border-transparent'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                              oi === q.answer ? 'border-green-400' : 'border-[#64748b]'
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {oi === q.answer && (
                            <span className="text-[10px] font-medium">✓ Đáp án đúng</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add question form */}
            {showAddForm ? (
              <div className="bg-card border border-acc/25 rounded-xl p-5 space-y-3">
                <p className="text-[13px] font-medium text-acc">
                  Câu hỏi {questions.length + 1}
                </p>
                <textarea
                  value={newQ.question}
                  onChange={(e) => setNewQ((p) => ({ ...p, question: e.target.value }))}
                  rows={2}
                  className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px] resize-none focus:border-acc outline-none transition-colors"
                  placeholder="Nội dung câu hỏi *"
                  autoFocus
                />
                <textarea
                  value={newQ.codeSnippet}
                  onChange={(e) => setNewQ((p) => ({ ...p, codeSnippet: e.target.value }))}
                  rows={3}
                  className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[12px] font-mono resize-none focus:border-acc outline-none transition-colors"
                  placeholder="Code snippet (tùy chọn)"
                />
                <p className="text-[11px] text-[#64748b]">Click radio để chọn đáp án đúng</p>
                <div className="space-y-2">
                  {newQ.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="new-q-ans"
                        checked={newQ.answer === oi}
                        onChange={() => setNewQ((p) => ({ ...p, answer: oi }))}
                        className="accent-acc"
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const opts = [...newQ.options];
                          opts[oi] = e.target.value;
                          setNewQ((p) => ({ ...p, options: opts }));
                        }}
                        className="flex-1 bg-background border border-border2 rounded-lg px-3 py-1.5 text-[12px] focus:border-acc outline-none transition-colors"
                        placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddQuestion}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-acc text-black text-[13px] font-medium rounded-lg disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Thêm câu hỏi
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewQ(makeEmptyQuestion());
                    }}
                    className="px-4 py-2 border border-border2 text-[13px] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border2 rounded-xl text-[13px] text-[#64748b] hover:text-acc hover:border-acc transition-colors"
              >
                <Plus size={14} /> Thêm câu hỏi mới
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}