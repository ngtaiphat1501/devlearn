// src/app/admin/courses/[id]/quiz/page.tsx
'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ChevronRight } from 'lucide-react';

const EMPTY_Q = { question: '', codeSnippet: '', options: ['', '', '', ''], answer: 0 };

export default function ManageQuizPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_Q, options: ['', '', '', ''] });
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-quiz', id],
    queryFn: async () => { const { data } = await api.get(`/admin/courses/${id}/quiz`); return data; },
  });

  const saveQuestion = useMutation({
    mutationFn: (payload: any) => editId
      ? api.patch(`/admin/quiz-questions/${editId}`, payload)
      : api.post(`/admin/courses/${id}/quiz/questions`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-quiz', id] });
      setAdding(false); setEditId(null);
      setForm({ ...EMPTY_Q, options: ['', '', '', ''] });
      toast.success(editId ? '✓ Đã cập nhật câu hỏi' : '✓ Thêm câu hỏi thành công');
    },
    onError: () => toast.error('Lỗi lưu câu hỏi'),
  });

  const deleteQuestion = useMutation({
    mutationFn: (qId: string) => api.delete(`/admin/quiz-questions/${qId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-quiz', id] }); toast.success('✓ Đã xóa'); },
  });

  const handleSubmit = () => {
    if (!form.question.trim()) { toast.error('Nhập câu hỏi!'); return; }
    if (form.options.some(o => !o.trim())) { toast.error('Điền đủ 4 đáp án!'); return; }
    saveQuestion.mutate({
      question: form.question,
      codeSnippet: form.codeSnippet || null,
      options: form.options,
      answer: form.answer,
      position: (data?.questions?.length || 0) + 1,
    });
  };

  const startEdit = (q: any) => {
    setForm({ question: q.question, codeSnippet: q.codeSnippet || '', options: [...q.options], answer: q.answer });
    setEditId(q.id); setAdding(true);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-[13px] text-[#64748b] mb-6 flex-wrap">
          <Link href="/admin/courses" className="hover:text-[#e2e8f0]">Khóa học</Link>
          <ChevronRight size={13} />
          <span className="truncate max-w-[180px] text-[#e2e8f0]">{data?.courseTitle || '...'}</span>
          <ChevronRight size={13} />
          <span className="text-acc">Quiz</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-bold">Quản lý Quiz</h1>
            <p className="text-[12px] text-[#64748b] mt-1">{data?.questions?.length || 0} câu hỏi · Đạt khi ≥75%</p>
          </div>
          <Link href={`/admin/courses/${id}/lessons`} className="btn-secondary text-[12px] py-2 px-3">← Bài học</Link>
        </div>

        {/* Questions list */}
        {isLoading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 bg-card rounded-[10px] animate-pulse"/>)}</div>
        ) : (
          <div className="space-y-3 mb-5">
            {data?.questions?.map((q: any, i: number) => (
              <div key={q.id} className="bg-card border border-border rounded-[10px] p-4">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[11px] text-acc bg-[rgba(0,212,255,0.08)] px-2 py-1 rounded shrink-0">Q{i+1}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium mb-2">{q.question}</p>
                    {q.codeSnippet && (
                      <pre className="bg-bg border border-border rounded-[6px] px-3 py-2 font-mono text-[11px] text-acc3 mb-2 overflow-x-auto">{q.codeSnippet}</pre>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className={`text-[12px] px-2.5 py-1.5 rounded-[6px] ${oi === q.answer ? 'bg-[rgba(6,255,165,0.1)] text-acc3 font-medium' : 'bg-[rgba(255,255,255,0.03)] text-[#94a3b8]'}`}>
                          {'ABCD'[oi]}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => startEdit(q)}
                            className="p-1.5 text-acc hover:bg-[rgba(0,212,255,0.1)] rounded transition-colors text-[11px]">✏️</button>
                    <button onClick={() => { if(confirm('Xóa câu hỏi này?')) deleteQuestion.mutate(q.id); }}
                            className="p-1.5 text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {data?.questions?.length === 0 && (
              <div className="text-center py-10 text-[#64748b] text-[14px]">Chưa có câu hỏi nào. Thêm ngay!</div>
            )}
          </div>
        )}

        {/* Add/Edit form */}
        {adding ? (
          <div className="bg-card border border-border2 rounded-[12px] p-5 space-y-4">
            <h3 className="font-semibold text-[14px]">{editId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>

            <div>
              <label className="label">Câu hỏi *</label>
              <textarea value={form.question} onChange={e => setForm(p => ({...p, question: e.target.value}))}
                        rows={2} placeholder="VD: Python dùng từ khóa gì để định nghĩa hàm?"
                        className="input resize-none" />
            </div>

            <div>
              <label className="label">Code snippet (tuỳ chọn)</label>
              <textarea value={form.codeSnippet} onChange={e => setForm(p => ({...p, codeSnippet: e.target.value}))}
                        rows={3} placeholder="def hello():\n    print('Hello World')"
                        className="input resize-none font-mono text-[12px]" />
              <p className="text-[11px] text-[#64748b] mt-1">Để trống nếu không có code</p>
            </div>

            <div>
              <label className="label">4 đáp án * (chọn đáp án đúng bên cạnh)</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => setForm(p => ({...p, answer: i}))}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-bold shrink-0 transition-all ${form.answer === i ? 'border-acc3 bg-[rgba(6,255,165,0.15)] text-acc3' : 'border-border2 text-[#64748b] hover:border-acc'}`}>
                      {'ABCD'[i]}
                    </button>
                    <input value={opt} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(p => ({...p, options: opts})); }}
                           placeholder={`Đáp án ${['A','B','C','D'][i]}`} className="input flex-1 text-[13px]" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#64748b] mt-2">Bấm vào chữ cái để chọn đáp án đúng (đang chọn: <span className="text-acc3 font-bold">{'ABCD'[form.answer]}</span>)</p>
            </div>

            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={saveQuestion.isPending} className="btn-primary text-[13px] py-2.5 px-5">
                {saveQuestion.isPending ? 'Đang lưu...' : editId ? '✓ Cập nhật' : '+ Thêm câu hỏi'}
              </button>
              <button onClick={() => { setAdding(false); setEditId(null); setForm({...EMPTY_Q, options:['','','','']}); }}
                      className="btn-secondary text-[13px] py-2.5 px-4">Huỷ</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border2 rounded-[12px] text-[13px] text-[#64748b] hover:border-acc hover:text-acc transition-all">
            <Plus size={15} /> Thêm câu hỏi quiz
          </button>
        )}

        <div className="mt-6">
          <Link href="/admin/courses" className="btn-primary w-full text-center py-3 block">✓ Hoàn thành</Link>
        </div>
      </div>
    </>
  );
}
