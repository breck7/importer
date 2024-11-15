class MarkdownToScroll {
  constructor() {
    // Mapping of common Markdown patterns
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
      footnoteRef: /\[\^(\d+)\]/g,
      footnoteDef: /^\[\^(\d+)\]:\s*(.+)$/,
    };
  }

  convert(markdown) {
    // Split into lines for block-level processing
    let lines = markdown.trim().split("\n");
    let scroll = "";
    let inCodeBlock = false;
    let codeBlockContent = "";
    let inTable = false;
    let tableContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks first
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = "";
          continue;
        } else {
          scroll += this.convertCodeBlock(codeBlockContent.trim()) + "\n\n";
          inCodeBlock = false;
          continue;
        }
      }

      if (inCodeBlock) {
        codeBlockContent += line + "\n";
        continue;
      }

      // Handle tables
      if (line.startsWith("|")) {
        if (!inTable) {
          inTable = true;
          tableContent = [];
        }
        if (!this.blockPatterns.tableDelimiter.test(line)) {
          tableContent.push(line);
        }
        continue;
      } else if (inTable) {
        scroll += this.convertTable(tableContent) + "\n\n";
        inTable = false;
        tableContent = [];
      }

      // Process block-level patterns
      let processed = false;

      // Headers
      const headerMatch = line.match(this.blockPatterns.header);
      if (headerMatch) {
        scroll +=
          "#".repeat(headerMatch[1].length) +
          " " +
          this.convertInlineElements(headerMatch[2]) +
          "\n\n";
        processed = true;
      }

      // Horizontal Rule
      if (this.blockPatterns.horizontalRule.test(line)) {
        scroll += "---\n\n";
        processed = true;
      }

      // Blockquotes
      const blockquoteMatch = line.match(this.blockPatterns.blockquote);
      if (blockquoteMatch) {
        scroll += "> " + this.convertInlineElements(blockquoteMatch[1]) + "\n";
        processed = true;
      }

      // Unordered Lists
      const ulMatch = line.match(this.blockPatterns.unorderedList);
      if (ulMatch) {
        scroll += "- " + this.convertInlineElements(ulMatch[1]) + "\n";
        processed = true;
      }

      // Ordered Lists
      const olMatch = line.match(this.blockPatterns.orderedList);
      if (olMatch) {
        scroll += "1. " + this.convertInlineElements(olMatch[1]) + "\n";
        processed = true;
      }

      // Footnote Definitions
      const footnoteMatch = line.match(this.blockPatterns.footnoteDef);
      if (footnoteMatch) {
        scroll +=
          "^" +
          footnoteMatch[1] +
          " " +
          this.convertInlineElements(footnoteMatch[2]) +
          "\n";
        processed = true;
      }

      // Regular paragraphs
      if (!processed && line.trim()) {
        scroll += "* " + this.convertInlineElements(line) + "\n\n";
      }

      // Preserve blank lines
      if (!line.trim()) {
        scroll += "\n";
      }
    }

    return this.cleanup(scroll);
  }

  convertInlineElements(text) {
    let result = text;

    // Convert images before links (to avoid nested parsing issues)
    result = result.replace(
      this.inlinePatterns.image,
      (match, alt, src, title) => {
        let scroll = `\nimage ${src}`;
        if (alt) scroll += `\n caption ${alt}`;
        return scroll;
      },
    );

    // Convert links
    result = result.replace(
      this.inlinePatterns.link,
      (match, text, url, title) => {
        let scroll = text + "\n link " + url + " " + text;
        if (title) scroll += "\n  title " + title;
        return scroll;
      },
    );

    // Convert other inline elements
    result = result
      .replace(this.inlinePatterns.bold, "*$1*")
      .replace(this.inlinePatterns.italic, "_$1_")
      .replace(this.inlinePatterns.code, "`$1`")
      .replace(this.inlinePatterns.strikethrough, "strike $1")
      .replace(this.inlinePatterns.footnoteRef, "^$1");

    return result;
  }

  convertCodeBlock(content) {
    return "code\n" + content;
  }

  convertTable(tableContent) {
    let scroll = "table\n";
    scroll += " data\n";

    // Convert each table row to CSV format
    tableContent.forEach((row) => {
      const cells = row
        .split("|")
        .filter((cell) => cell.trim()) // Remove empty cells from start/end
        .map((cell) => cell.trim())
        .map((cell) => this.convertInlineElements(cell))
        .join(",");
      scroll += "  " + cells + "\n";
    });

    return scroll;
  }

  cleanup(scroll) {
    return (
      scroll
        .replace(/\n{3,}/g, "\n\n") // Remove extra blank lines
        .replace(/[ \t]+$/gm, "") // Remove trailing whitespace
        .trim() + "\n"
    ); // Ensure single newline at end
  }
}

module.exports = MarkdownToScroll;
