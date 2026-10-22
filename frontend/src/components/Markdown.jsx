import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * react-markdown passes an internal `node` prop to every custom component.
 * Spreading it onto a DOM element emits node="[object Object]", so strip it.
 */
function withoutNode(props) {
  const clean = { ...props };
  delete clean.node;
  return clean;
}

function styled(Tag, className) {
  return function StyledMarkdownElement(props) {
    return <Tag className={className} {...withoutNode(props)} />;
  };
}

const COMPONENTS = {
  p: styled('p', 'mb-2 last:mb-0'),
  strong: styled('strong', 'font-bold text-primary'),
  em: styled('em', 'italic'),
  ul: styled('ul', 'list-disc pl-5 mb-2 space-y-1'),
  ol: styled('ol', 'list-decimal pl-5 mb-2 space-y-1'),
  li: styled('li', 'pl-0.5'),
  h1: styled('h1', 'font-serif text-[18px] font-bold text-primary mt-3 mb-1.5'),
  h2: styled('h2', 'font-serif text-[17px] font-bold text-primary mt-3 mb-1.5'),
  h3: styled('h3', 'font-serif text-[15px] font-bold text-primary mt-3 mb-1'),
  h4: styled('h4', 'font-bold text-primary mt-2 mb-1'),
  hr: () => <hr className="my-3 border-border" />,
  blockquote: styled('blockquote', 'border-l-2 border-secondary pl-3 italic my-2'),
  thead: styled('thead', 'bg-parchment'),
  th: styled('th', 'text-left font-bold text-primary p-2 border border-border align-top'),
  td: styled('td', 'p-2 border border-border align-top'),

  a: (props) => (
    <a className="text-secondary font-semibold underline" target="_blank" rel="noopener noreferrer" {...withoutNode(props)} />
  ),

  code: (props) => {
    const { className, children } = props;
    const isBlock = Boolean(className?.includes('language-')) || String(children || '').includes('\n');
    return isBlock
      ? <code className={`block text-[12px] ${className || ''}`} {...withoutNode(props)}>{children}</code>
      : <code className="bg-parchment border border-border rounded px-1 py-0.5 text-[12px]" {...withoutNode(props)}>{children}</code>;
  },

  pre: (props) => (
    <pre className="my-2 overflow-x-auto bg-parchment border border-border rounded p-2.5" {...withoutNode(props)} />
  ),

  table: (props) => (
    <div className="overflow-x-auto my-2 rounded border border-border">
      <table className="w-full text-[12px] border-collapse" {...withoutNode(props)} />
    </div>
  ),
};

/**
 * Safe markdown renderer for model output.
 *
 * Models occasionally emit HTML line breaks inside markdown table cells.
 * react-markdown escapes raw HTML, so normalise them to plain separators.
 */
export default function Markdown({ text, className = '' }) {
  const clean = String(text || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/&nbsp;/gi, ' ');

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {clean}
      </ReactMarkdown>
    </div>
  );
}
