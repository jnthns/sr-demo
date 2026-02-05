'use client'

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content, className, enableCopy = true }) {
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ inline, className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            return !inline && match ? (
              <div className="rounded-md my-2 overflow-hidden relative group">
                <div className="flex justify-between items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {match[1]}
                  </span>
                  {enableCopy && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Copy code"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <SyntaxHighlighter
                  style={isDarkMode ? oneDark : oneLight}
                  language={match[1]}
                  PreTag="div"
                  className="!m-0 !p-3"
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 my-2 overflow-x-auto">
              <pre className="text-sm">{children}</pre>
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic text-gray-600 dark:text-gray-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
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
              className="text-blue-600 dark:text-blue-400 hover:underline"
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
            <hr className="border-gray-300 dark:border-gray-600 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
