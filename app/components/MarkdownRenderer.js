'use client'

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content, className, enableCopy = true }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ inline, className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            return !inline && match ? (
              <div className="rounded-lg my-2 overflow-hidden relative group">
                <div className="flex justify-between items-center px-3 py-2 bg-zen-200 border-b border-zen-300">
                  <span className="text-xs text-zen-500 font-mono">
                    {match[1]}
                  </span>
                  {enableCopy && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zen-500 hover:text-zen-700"
                      title="Copy code"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="!m-0 !p-3"
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-zen-200 px-1 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="bg-zen-100 rounded-lg p-3 my-2 overflow-x-auto">
              <pre className="text-sm">{children}</pre>
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-zen-300 pl-4 my-2 italic text-zen-500">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-zen-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zen-300 px-3 py-2 bg-zen-100 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zen-300 px-3 py-2">
              {children}
            </td>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">
              {children}
            </ol>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-matcha-400 hover:text-matcha-300 hover:underline"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold my-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold my-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold my-2">{children}</h3>
          ),
          hr: () => (
            <hr className="border-zen-300 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
