class MarkdownToScroll {
  constructor() {
    this.blockPatterns = {
      header: /^(#{1,6})\s+(.+)$/,
      horizontalRule: /^[\*\-_]{3,}$/,
      blockquote: /^>\s*(.+)$/,
      unorderedList: /^[\*\-+]\s+(.+)$/,
      orderedList: /^\d+\.\s+(.+)$/,
      codeBlock: /^```(\w*)\n([\s\S]*?)```$/m,
      table: /^\|(.+)\|$/,
      tableDelimiter: /^\|(?:[-:]+[-| :]*)\|$/,
    };

    this.inlinePatterns = {
      bold: /\*\*(.+?)\*\*/g,
      italic: /\b_(.+?)_\b/g,
      code: /`(.+?)`/g,
      strikethrough: /~~(.+?)~~/g,
      link: /\[([^\]]+)\]\(([^)]+)\)(?:\{([^}]+)\})?/g,
      image: /!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]+)\})?/g,
    };
  }

  convert(markdown) {
    if (!markdown) return '';
    
    let lines = markdown.toString().trim().split('\n');
    let scroll = '';
    let inCodeBlock = false;
    let codeBlockContent = '';
    let inList = false;
    let listIndentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trimEnd();
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = '';
          continue;
        } else {
          scroll += 'code\n' + codeBlockContent.trim() + '\n\n';
          inCodeBlock = false;
          continue;
        }
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle horizontal rules
      if (this.blockPatterns.horizontalRule.test(line)) {
        scroll += '---\n\n';
        continue;
      }

      // Handle headers
      const headerMatch = line.match(this.blockPatterns.header);
      if (headerMatch) {
        scroll += '#'.repeat(headerMatch[1].length) + ' ' + 
                  this.convertInlineElements(headerMatch[2]) + '\n\n';
        continue;
      }

      // Handle blockquotes
      const blockquoteMatch = line.match(this.blockPatterns.blockquote);
      if (blockquoteMatch) {
        scroll += '> ' + this.convertInlineElements(blockquoteMatch[1]) + '\n';
        continue;
      }

      // Handle lists
      const ulMatch = line.match(this.blockPatterns.unorderedList);
      const olMatch = line.match(this.blockPatterns.orderedList);
      if (ulMatch || olMatch) {
        const content = (ulMatch || olMatch)[1];
        const marker = ulMatch ? '- ' : '1. ';
        scroll += marker + this.convertInlineElements(content) + '\n';
        continue;
      }

      // Handle regular paragraphs
      if (line.trim()) {
        scroll += '* ' + this.convertInlineElements(line) + '\n\n';
      } else {
        scroll += '\n';
      }
    }

    return this.cleanup(scroll);
  }

  convertInlineElements(text) {
    if (!text) return '';
    let result = text.toString();

    // Convert images before links
    result = result.replace(this.inlinePatterns.image, (match, alt, src, title) => {
      let scroll = `\nimage ${src}`;
      if (alt) scroll += `\n caption ${alt}`;
      return scroll;
    });

    // Convert links
    result = result.replace(this.inlinePatterns.link, (match, text, url) => {
      return `${text}\n link ${url} ${text}`;
    });

    // Convert other inline elements
    result = result
      .replace(this.inlinePatterns.bold, '*$1*')
      .replace(this.inlinePatterns.italic, '_$1_')
      .replace(this.inlinePatterns.code, '`$1`')
      .replace(this.inlinePatterns.strikethrough, 'strike $1');

    return result;
  }

  cleanup(scroll) {
    return scroll
      .replace(/\n{3,}/g, '\n\n')     // Remove extra blank lines
      .replace(/[ \t]+$/gm, '')        // Remove trailing whitespace
      .replace(/\^undefined\n/g, '')   // Remove undefined references
      .replace(/\n\n+/g, '\n\n')      // Normalize multiple newlines
      .trim() + '\n';                  // Ensure single newline at end
  }
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownToScroll;
}
