
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';
import { fileUploadService } from '@/services/fileUploadService';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
  hideAttachments?: boolean;
}

export const MarkdownRenderer = ({ content, className, compact = false, hideAttachments = false }: MarkdownRendererProps) => {
  // Filter out attachment images if hideAttachments is true
  let processedContent = content;
  if (hideAttachments) {
    // Remove image markdown that contains subtask-attachments URLs
    processedContent = content.replace(/!\[[^\]]*\]\([^)]*subtask-attachments[^)]*\)/g, '');
    // Clean up extra newlines left behind
    processedContent = processedContent.replace(/\n\n+/g, '\n\n').trim();
  }

  // Truncate content if it's too long for compact view
  const displayContent = compact && processedContent.length > 150 
    ? processedContent.substring(0, 150) + '...'
    : processedContent;

  return (
    <div className={cn(
      "prose prose-sm max-w-none",
      compact && "line-clamp-2",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Customize rendering for compact view
          p: ({ children }) => (
            <p className={cn(
              "my-1",
              compact && "inline"
            )}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-1 ml-4 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1 ml-4 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="my-0.5">
              {children}
            </li>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
};
