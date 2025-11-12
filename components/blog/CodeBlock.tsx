'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

export default function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // 인라인 코드는 복사 버튼 없이 표시
  if (inline) {
    return <code className={className}>{children}</code>;
  }

  // 코드 블록에서 언어 추출 (language-javascript -> javascript)
  const language = className?.replace('language-', '') || 'text';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4">
      {/* 언어 표시 및 복사 버튼 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-[#30363d] bg-[#161b22] px-4 py-2">
        <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#c9d1d9] transition-colors hover:bg-[#30363d] hover:text-white"
          aria-label="코드 복사"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span>복사됨</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>복사</span>
            </>
          )}
        </button>
      </div>

      {/* 코드 블록 */}
      <pre className="!mt-0 !rounded-t-none border border-[#30363d] bg-[#0d1117] p-4 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
