import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api } from '../utils/api';
import EditorToolbar from '../components/EditorToolbar';
import ShareModal from '../components/ShareModal';
import Toast from '../components/Toast';

const AUTOSAVE_DELAY = 1500;

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved | saving | unsaved
  const [showShare, setShowShare] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const saveTimer = useRef(null);
  const titleRef = useRef(null);

  const canEdit = doc && (doc.role === 'owner' || doc.role === 'edit');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        'data-placeholder': 'Start writing…',
      }
    },
    editable: false,
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus('unsaved');
      saveTimer.current = setTimeout(() => {
        triggerSave(editor.getJSON());
      }, AUTOSAVE_DELAY);
    },
  });

  useEffect(() => {
    loadDocument();
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [id]);

  useEffect(() => {
    if (editor && doc) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit, doc]);

  async function loadDocument() {
    setLoading(true);
    try {
      const data = await api.getDocument(id);
      setDoc(data);
      setTitle(data.title);

      if (editor) {
        const content = data.content
          ? (() => { try { return JSON.parse(data.content); } catch { return data.content; } })()
          : { type: 'doc', content: [{ type: 'paragraph' }] };
        editor.commands.setContent(content);
      }
    } catch (err) {
      showToast(err.message, 'error');
      if (err.message.includes('Access denied')) {
        setTimeout(() => navigate('/'), 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  // Re-set content when editor mounts after doc loads
  useEffect(() => {
    if (editor && doc && !loading) {
      const content = doc.content
        ? (() => { try { return JSON.parse(doc.content); } catch { return doc.content; } })()
        : { type: 'doc', content: [{ type: 'paragraph' }] };
      editor.commands.setContent(content);
      editor.setEditable(canEdit);
    }
  }, [editor, doc]);

  const triggerSave = useCallback(async (content) => {
    if (!canEdit) return;
    setSaveStatus('saving');
    try {
      await api.updateDocument(id, { content: JSON.stringify(content) });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('unsaved');
      showToast('Failed to save', 'error');
    }
  }, [id, canEdit]);

  async function saveTitle() {
    if (!title.trim() || title === doc?.title) { setEditingTitle(false); return; }
    try {
      await api.updateDocument(id, { title: title.trim() });
      setDoc(prev => ({ ...prev, title: title.trim() }));
      setEditingTitle(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved';
  const statusColor = saveStatus === 'unsaved' ? 'var(--ink-muted)' : 'var(--success)';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ gap: 6 }}>
            ← <span style={{ fontWeight: 500 }}>DocuFlow</span>
          </button>
          <div style={styles.titleArea}>
            {editingTitle && canEdit ? (
              <input
                ref={titleRef}
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 500, border: '1.5px solid var(--accent)', padding: '4px 10px' }}
                autoFocus
              />
            ) : (
              <span
                style={styles.titleDisplay}
                onClick={() => canEdit && setEditingTitle(true)}
                title={canEdit ? 'Click to rename' : ''}
              >
                {title || 'Untitled Document'}
              </span>
            )}
            {doc && (
              <span className={`badge badge-${doc.role}`} style={{ fontSize: 10 }}>
                {doc.role === 'owner' ? 'Owner' : doc.role === 'edit' ? 'Can edit' : 'View only'}
              </span>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{ fontSize: 12, color: statusColor }}>{statusLabel}</span>
          {doc?.role === 'owner' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar editor={editor} disabled={!canEdit} />

      {/* Editor */}
      <div style={styles.editorArea}>
        {!canEdit && (
          <div style={styles.viewBanner}>
            👁 You are viewing this document in read-only mode
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {showShare && (
        <ShareModal docId={id} onClose={() => setShowShare(false)} showToast={showToast} />
      )}
      <Toast toast={toast} />
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--paper)' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: '#fff',
    borderBottom: '1px solid var(--border)',
    gap: 16,
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 },
  titleArea: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  titleDisplay: { fontSize: 16, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  editorArea: { flex: 1, overflow: 'auto', background: 'var(--paper-2)' },
  viewBanner: {
    textAlign: 'center',
    padding: '10px 20px',
    background: 'var(--accent-light)',
    color: 'var(--accent)',
    fontSize: 13,
    fontWeight: 500,
    borderBottom: '1px solid var(--border)',
  },
};
