import React from 'react';

function ToolBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...styles.btn,
        background: active ? 'var(--accent-light)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--ink-2)',
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={styles.divider} />;
}

export default function EditorToolbar({ editor, disabled }) {
  if (!editor) return null;

  return (
    <div style={styles.toolbar}>
      <div style={styles.group}>
        <select
          style={styles.headingSelect}
          disabled={disabled}
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' : '0'
          }
          onChange={e => {
            const val = e.target.value;
            if (val === '0') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
          }}
        >
          <option value="0">Normal text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
      </div>

      <Divider />

      <div style={styles.group}>
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} disabled={disabled} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} disabled={disabled} title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} disabled={disabled} title="Underline (Ctrl+U)">
          <u>U</u>
        </ToolBtn>
      </div>

      <Divider />

      <div style={styles.group}>
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} disabled={disabled} title="Bullet list">
          ☰
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} disabled={disabled} title="Ordered list">
          ≡
        </ToolBtn>
      </div>

      <Divider />

      <div style={styles.group}>
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()} title="Undo (Ctrl+Z)">
          ↩
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()} title="Redo (Ctrl+Y)">
          ↪
        </ToolBtn>
      </div>
    </div>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 16px',
    borderBottom: '1px solid var(--border)',
    background: '#fff',
    flexWrap: 'wrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  group: { display: 'flex', alignItems: 'center', gap: 2 },
  btn: {
    width: 34, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    transition: 'all 120ms',
  },
  divider: { width: 1, height: 20, background: 'var(--border)', margin: '0 4px' },
  headingSelect: {
    padding: '4px 8px',
    border: '1.5px solid var(--border)',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    color: 'var(--ink)',
    background: 'transparent',
    cursor: 'pointer',
    outline: 'none',
  },
};
