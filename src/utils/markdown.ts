import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked with custom renderer for syntax highlighting
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }): string {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch (err) {
          console.error('Highlight error:', err);
        }
      }
      // Fallback to auto-detection
      try {
        const highlighted = hljs.highlightAuto(text).value;
        return `<pre><code class="hljs">${highlighted}</code></pre>`;
      } catch (err) {
        console.error('Highlight error:', err);
        return `<pre><code>${text}</code></pre>`;
      }
    }
  },
  breaks: true,
  gfm: true,
});

/**
 * Escape HTML/XML tags to prevent them from being treated as HTML
 * This allows markdown inside tags to be parsed correctly
 * Only escapes actual tags like <example>, not comparison operators like <10MB
 */
function escapeHtmlTags(text: string): string {
  // Match opening tags: <tagname> or <tagname attr="value">
  // Match closing tags: </tagname>
  // Match self-closing tags: <tagname />
  // But NOT comparison operators like <10 or >=5

  return text
    // Escape closing tags: </tagname>
    .replace(/<\/([a-zA-Z][a-zA-Z0-9_-]*)\s*>/g, '&lt;/$1&gt;')
    // Escape self-closing tags: <tagname />
    .replace(/<([a-zA-Z][a-zA-Z0-9_-]*)(\s[^>]*)?\s*\/>/g, '&lt;$1$2 /&gt;')
    // Escape opening tags: <tagname> or <tagname attr="value">
    .replace(/<([a-zA-Z][a-zA-Z0-9_-]*)(\s[^>]*)?>/g, '&lt;$1$2&gt;');
}

/**
 * Parse markdown text to HTML with syntax highlighting
 */
export function parseMarkdown(text: string): string {
  try {
    // First, escape any HTML/XML tags so they're treated as plain text
    // This allows markdown inside tags (like lists in <example>) to parse correctly
    const escapedText = escapeHtmlTags(text);

    // Then parse the markdown (lists, code blocks, etc. will work inside escaped tags)
    return marked.parse(escapedText) as string;
  } catch (error) {
    console.error('Markdown parsing error:', error);
    // Fallback to plain text with line breaks preserved
    return text.replace(/\n/g, '<br>');
  }
}

/**
 * Sanitize HTML to prevent XSS (basic implementation)
 * For production, consider using DOMPurify
 */
export function sanitizeHtml(html: string): string {
  // For now, we trust the content from Claude API
  // In production, you might want to add DOMPurify
  return html;
}
