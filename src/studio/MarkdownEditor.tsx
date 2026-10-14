import { useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
const extensions = [
  markdown({ codeLanguages: languages }),
  EditorView.lineWrapping,
  EditorView.contentAttributes.of({ 'aria-label': 'Markdown source' }),
];
export function MarkdownEditor({
  value,
  onChange,
  height = '100%',
}: {
  value: string;
  onChange: (s: string) => void;
  height?: string;
}) {
  const ref = useRef<ReactCodeMirrorRef>(null);
  const insert = (before: string, after = '') => {
    const view = ref.current?.view;
    if (!view) return;
    const range = view.state.selection.main;
    const selected = view.state.sliceDoc(range.from, range.to);
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: before + selected + after },
      selection: {
        anchor: range.from + before.length,
        head: range.from + before.length + selected.length,
      },
    });
    view.focus();
  };
  return (
    <div className="markdown-source">
      <div className="markdown-toolbar">
        {[
          ['H', '# ', ''],
          ['B', '**', '**'],
          ['I', '*', '*'],
          ['S', '~~', '~~'],
          ['List', '\n- ', ''],
          ['1.', '\n1. ', ''],
          ['Quote', '\n> ', ''],
          ['Link', '[', '](https://)'],
          ['Code', '\n```python\n', '\n```\n'],
          ['Math', '\n$$\n', '\n$$\n'],
          ['Table', '\n| Column | Value |\n| --- | --- |\n| Label | 0 |\n', ''],
          ['Slide', '\n\n---\n\n# ', ''],
          ['Notes', '\n<!-- notes: ', ' -->\n'],
        ].map(([name, before, after]) => (
          <button
            key={name}
            title={`Insert ${name}`}
            type="button"
            onClick={() => insert(before, after)}
          >
            {name}
          </button>
        ))}
      </div>
      <CodeMirror
        ref={ref}
        value={value}
        height={height}
        extensions={extensions}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
      />
    </div>
  );
}
