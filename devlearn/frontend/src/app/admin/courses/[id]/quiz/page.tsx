'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/axios';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet: string | null;
  options: string[];
  answer: number;
  position: number;
}

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

const emptyQuestion = () => ({
  question: '',
  codeSnippet: '',
  options: ['', '', '', ''],
  answer: 0,
  position: 0,
});

export default function AdminQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState(emptyQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<QuizQuestion>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/'); return; }
    fetchQuiz();
  }, [courseId]);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/quiz`);
      setQuiz(res.data.quiz);
    } catch {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/courses/${courseId}/quiz`, { title: 'Quiz', passingScore: 75 });
      setQuiz({ ...res.data.quiz, questions: [] });
    } catch (err) {
      console.error(err);
      setError('Không thể tạo quiz');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = async () => {
    if (!newQ.question.trim()) { setError('Nhập câu hỏi'); return; }
    if (newQ.options.some(o => !o.trim())) { setError('Điền đủ 4 đáp án'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/courses/${courseId}/quiz/questions`, {
        ...newQ,
        codeSnippet: newQ.codeSnippet || null,
        position: (quiz?.questions?.length || 0) + 1,
      });
      setQuiz(prev => prev ? { ...prev, questions: [...prev.questions, res.data.question] } : prev);
      setNewQ(emptyQuestion());
      setAdding(false);
      setSuccess('Đã thêm câu hỏi!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
      setError('Lỗi thêm câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (qId: string) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      await api.delete(`/courses/${courseId}/quiz/questions/${qId}`);
      setQuiz(prev => prev ? { ...prev, questions: prev.questions.filter(q => q.id !== qId) } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  const saveQuestion = async (qId: string) => {
    setSaving(true);
    try {
      await api.patch(`/courses/${courseId}/quiz/questions/${qId}`, editData);
      setQuiz(prev => prev ? {
        ...prev,
        questions: prev.questions.map(q => q.id === qId ? { ...q, ...editData } as QuizQuestion : q)
      } : prev);
      setEditingId(null);
      setSuccess('Đã lưu!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border2 bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-[#94a3b8] hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[#64748b] uppercase tracking-wider">Quản lý Quiz</p>
            <h1 className="text-[16px] font-semibold">{quiz?.title || 'Chưa có quiz'}</h1>
          </div>
        </div>
        <Link href={`/admin/courses/${courseId}/lessons`}
          className="px-3 py-1.5 text-[12px] border border-border2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
          Bài học
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-[13px] mb-4">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-[13px] mb-4">{success}</div>}

        {!quiz ? (
          <div className="text-center py-16">
            <p className="text-[#64748b] mb-4">Khóa học này chưa có quiz</p>
            <button onClick={createQuiz} disabled={saving}
              className="px-6 py-2.5 bg-acc text-black text-[13px] font-medium rounded-xl disabled:opacity-50">
              {saving ? 'Đang tạo...' : '+ Tạo Quiz'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Questions */}
            {quiz.questions.map((q, i) => (
              <div key={q.id} className="bg-card border border-border2 rounded-xl p-5">
                {editingId === q.id ? (
                  <div className="space-y-3">
                    <textarea value={editData.question || ''} onChange={e => setEditData(p => ({ ...p, question: e.target.value }))}
                      rows={2} className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px] resize-none" placeholder="Câu hỏi *" />
                    <textarea value={editData.codeSnippet || ''} onChange={e => setEditData(p => ({ ...p, codeSnippet: e.target.value }))}
                      rows={3} className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[12px] font-mono resize-none" placeholder="Code snippet (tùy chọn)" />
                    <div className="space-y-2">
                      {(editData.options as string[] || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`edit-ans-${q.id}`} checked={editData.answer === oi}
                            onChange={() => setEditData(p => ({ ...p, answer: oi }))} />
                          <input value={opt} onChange={e => {
                            const opts = [...(editData.options as string[] || [])];
                            opts[oi] = e.target.value;
                            setEditData(p => ({ ...p, options: opts }));
                          }} className="flex-1 bg-background border border-border2 rounded-lg px-3 py-1.5 text-[12px]"
                            placeholder={`Đáp án ${oi + 1}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveQuestion(q.id)} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-acc text-black text-[12px] font-medium rounded-lg">
                        <Save size={12} /> Lưu
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-border2 text-[12px] rounded-lg">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-[14px] font-medium">Câu {i + 1}: {q.question}</p>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingId(q.id); setEditData(q); }}
                          className="text-[11px] text-[#94a3b8] hover:text-foreground px-2 py-1 transition-colors">Sửa</button>
                        <button onClick={() => deleteQuestion(q.id)} className="text-[#ef4444] hover:text-red-400 p-1">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {q.codeSnippet && (
                      <pre className="bg-background border border-border2 rounded-lg p-3 text-[11px] font-mono mb-3 overflow-x-auto">{q.codeSnippet}</pre>
                    )}
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] ${oi === q.answer ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-[rgba(255,255,255,0.02)]'}`}>
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                          {oi === q.answer && <span className="ml-auto text-[10px]">✓ Đúng</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add Question */}
            {adding ? (
              <div className="bg-card border border-acc/30 rounded-xl p-5 space-y-3">
                <h3 className="text-[13px] font-medium">Câu hỏi mới</h3>
                <textarea value={newQ.question} onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))}
                  rows={2} className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px] resize-none" placeholder="Câu hỏi *" autoFocus />
                <textarea value={newQ.codeSnippet} onChange={e => setNewQ(p => ({ ...p, codeSnippet: e.target.value }))}
                  rows={3} className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[12px] font-mono resize-none" placeholder="Code snippet (tùy chọn)" />
                <div className="space-y-2">
                  <p className="text-[11px] text-[#64748b]">Chọn đáp án đúng (click radio)</p>
                  {newQ.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name="new-ans" checked={newQ.answer === oi}
                        onChange={() => setNewQ(p => ({ ...p, answer: oi }))} />
                      <input value={opt} onChange={e => {
                        const opts = [...newQ.options];
                        opts[oi] = e.target.value;
                        setNewQ(p => ({ ...p, options: opts }));
                      }} className="flex-1 bg-background border border-border2 rounded-lg px-3 py-1.5 text-[12px]"
                        placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addQuestion} disabled={saving}
                    className="flex items-center gap-1 px-4 py-2 bg-acc text-black text-[13px] font-medium rounded-lg disabled:opacity-50">
                    <Plus size={13} /> Thêm câu hỏi
                  </button>
                  <button onClick={() => { setAdding(false); setNewQ(emptyQuestion()); setError(''); }}
                    className="px-4 py-2 border border-border2 text-[13px] rounded-lg">Hủy</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border2 rounded-xl text-[13px] text-[#64748b] hover:text-acc hover:border-acc transition-colors">
                <Plus size={14} /> Thêm câu hỏi mới
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}