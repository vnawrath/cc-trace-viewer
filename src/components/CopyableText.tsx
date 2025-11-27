import { useState } from 'react';

interface CopyableTextProps {
  text: string;
  label?: string;
  className?: string;
  maxHeight?: string;
  format?: 'text' | 'json' | 'code';
}

export function CopyableText({
  text,
  label,
  className = '',
  maxHeight = '400px',
  format = 'text'
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatText = () => {
    if (format === 'json') {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        return text;
      }
    }
    return text;
  };

  const getTextClasses = () => {
    const baseClasses = 'font-mono text-[13px] whitespace-pre-wrap break-all leading-relaxed';

    switch (format) {
      case 'json':
        return `${baseClasses} text-gray-300`;
      case 'code':
        return `${baseClasses} text-gray-300`;
      default:
        return `${baseClasses} text-gray-300`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">{label}</h4>
          <button
            onClick={handleCopy}
            className="inline-flex items-center px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-terminal-cyan transition-colors border border-gray-700"
            type="button"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      )}

      <div
        className="bg-gray-950 border border-gray-800 rounded-md p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ maxHeight }}
      >
        {!label && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 inline-flex items-center px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded shadow-sm hover:bg-gray-700 hover:text-terminal-cyan transition-colors border border-gray-700"
            type="button"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        )}

        <div className={getTextClasses()}>
          {formatText()}
        </div>
      </div>
    </div>
  );
}
