import React, { useState, useEffect, useCallback } from "react";
import { X, Save, Pencil, Trash2, Loader2, Feather } from "lucide-react";

interface JournalNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, userId }) => {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/journal/notes?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setNotes(data.notes || []);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("[JournalModal] Erro ao carregar notas:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      setNewText("");
      setEditingId(null);
      fetchNotes();
    }
  }, [isOpen, fetchNotes]);

  const handleCreate = async () => {
    if (!newText.trim() || savingNew) return;
    setSavingNew(true);
    setError(null);
    try {
      const res = await fetch("/api/journal/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: newText }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setNewText("");
      await fetchNotes();
    } catch (err) {
      console.error("[JournalModal] Erro ao criar nota:", err);
      setError("Não foi possível salvar a nota. Tente novamente.");
    } finally {
      setSavingNew(false);
    }
  };

  const startEdit = (note: JournalNote) => {
    setEditingId(note.id);
    setEditText(note.content);
  };

  const handleUpdate = async () => {
    if (!editingId || !editText.trim() || savingEdit) return;
    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/journal/notes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: editText }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      setEditingId(null);
      setEditText("");
      await fetchNotes();
    } catch (err) {
      console.error("[JournalModal] Erro ao atualizar nota:", err);
      setError("Não foi possível atualizar a nota.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/journal/notes/${id}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchNotes();
    } catch (err) {
      console.error("[JournalModal] Erro ao excluir nota:", err);
      setError("Não foi possível excluir a nota.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#4a3f35]/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#d9d4c7] bg-[#f4f1eb]/95 shadow-2xl shadow-[#4a3f35]/10 p-5 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#4a3f35] flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#5c4d66]" />
              Diário Alquímico
            </h2>
            <p className="text-xs text-[#8c7f70] font-light">
              Registre insights, sonhos e revelações. Cada nota fica salva separadamente.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar diário"
            className="p-2 rounded-lg text-[#8c7f70] hover:text-[#4a3f35] hover:bg-[#e8e4db] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Nova nota */}
        <div className="rounded-xl border border-[#8c7f70]/15 bg-[#faf7f4] p-4 mb-5">
          <p className="font-sans text-[10px] tracking-[0.1em] uppercase text-[#8c7f70] font-medium mb-2">
            Nova nota
          </p>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Registre seus insights e revelações..."
            className="w-full min-h-[110px] p-3 rounded-lg border border-[#8c7f70]/10 bg-white/60 font-sans text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed placeholder:text-[#8c7f70]/50 resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30 focus:border-[#5c4d66]/30 transition-colors"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] text-[#8c7f70] font-light">
              Clique em <strong>Salvar nota</strong> para guardar.
            </p>
            <button
              onClick={handleCreate}
              disabled={!newText.trim() || savingNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8c6239] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#6b4a2b] transition-colors disabled:opacity-50"
            >
              {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar nota
            </button>
          </div>
        </div>

        {/* Lista de notas */}
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-[#8c7f70] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando suas notas...
          </div>
        ) : notes.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#8c7f70]">
            Nenhuma nota ainda. Escreva a primeira acima.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const isEditing = editingId === note.id;
              return (
                <div
                  key={note.id}
                  className="rounded-xl border border-[#8c7f70]/15 bg-white/50 px-4 py-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[9px] text-[#8c7f70] uppercase tracking-widest">
                      {formatDate(note.updated_at !== note.created_at ? note.updated_at : note.created_at)}
                      {note.updated_at !== note.created_at && " (editada)"}
                    </p>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1.5 text-[#8c7f70] hover:text-[#5c4d66] transition-colors"
                          aria-label="Editar nota"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          disabled={deletingId === note.id}
                          className="p-1.5 text-[#8c7f70] hover:text-red-600 transition-colors disabled:opacity-40"
                          aria-label="Excluir nota"
                        >
                          {deletingId === note.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[100px] p-3 rounded-lg border border-[#e6e2d8] bg-white/80 text-xs sm:text-[13px] text-[#4a3f35] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[#5c4d66]/30"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingId(null); setEditText(""); }}
                          disabled={savingEdit}
                          className="px-3 py-1.5 rounded-lg border border-[#e6e2d8] text-[#8c7f70] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ede9de] transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleUpdate}
                          disabled={savingEdit || !editText.trim() || editText === note.content}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8c6239] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#6b4a2b] transition-colors disabled:opacity-50"
                        >
                          {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-sans text-[13px] text-[#3c352d] leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
