class LaTeXToScroll {
  constructor() {
    this.blockCommands = {
      'section': '# ',
      'subsection': '## ',
      'subsubsection': '### ',
      'paragraph': '*',
      'begin': {
        'itemize': '- ',
        'enumerate': '1. ',
        'quote': '> ',
        'verbatim': 'code\n',
        'center': 'center\n',
        'figure': 'figure\n',
      }
    };

    this.inlineCommands = {
      'textbf': '*',
      'textit': '_',
      'texttt': '`',
      'emph': '_',
      'href': 'link'
    };
  }

  convert(latex) {
    let scroll = latex;
    
    // Remove comments
    scroll = scroll.replace(/%.*$/gm, '');
    
    // Handle \input commands first
    scroll = this.convertInputCommands(scroll);
    
    // Handle block environments
    scroll = this.convertEnvironments(scroll);
    
    // Handle section commands
    scroll = this.convertSections(scroll);
    
    // Handle inline formatting
    scroll = this.convertInlineCommands(scroll);
    
    // Handle special characters
    scroll = this.convertSpecialCharacters(scroll);
    
    // Handle citations and references
    scroll = this.convertCitations(scroll);
    
    // Clean up extra whitespace
    scroll = this.cleanupWhitespace(scroll);
    
    return scroll;
  }

  convertInputCommands(text) {
    // Match \input{filename} with or without .tex extension
    const inputRegex = /\\input\{([^}]+)\}/g;
    return text.replace(inputRegex, (match, filename) => {
      // Remove .tex extension if present and add .scroll
      const scrollFile = filename.replace(/\.tex$/, '') + '.scroll';
      return `${scrollFile}`;
    });
  }

  convertEnvironments(text) {
    let result = text;
    
    // Match begin/end environment blocks
    const envRegex = /\\begin\{(\w+)\}([\s\S]*?)\\end\{\1\}/g;
    
    result = result.replace(envRegex, (match, env, content) => {
      const prefix = this.blockCommands.begin[env] || '';
      
      if (env === 'itemize' || env === 'enumerate') {
        return this.convertListItems(content, env);
      } else if (env === 'verbatim') {
        return `code\n${content.trim()}`;
      } else if (env === 'figure') {
        return this.convertFigure(content);
      }
      
      // Indent content for environments that need it
      const indentedContent = content
        .trim()
        .split('\n')
        .map(line => ' ' + line)
        .join('\n');
      
      return `${prefix}${indentedContent}\n`;
    });
    
    return result;
  }

  convertListItems(content, type) {
    const marker = type === 'itemize' ? '- ' : '1. ';
    return content
      .split('\\item')
      .slice(1) // Skip first empty element
      .map(item => marker + item.trim())
      .join('\n') + '\n';
  }

  convertSections(text) {
    let result = text;
    
    // Convert section commands
    Object.keys(this.blockCommands).forEach(cmd => {
      if (cmd === 'begin') return;
      const regex = new RegExp(`\\\\${cmd}{([^}]+)}`, 'g');
      result = result.replace(regex, (match, content) => {
        return `${this.blockCommands[cmd]}${content.trim()}\n`;
      });
    });
    
    return result;
  }

  convertInlineCommands(text) {
    let result = text;
    
    // Convert inline formatting commands
    Object.keys(this.inlineCommands).forEach(cmd => {
      const regex = new RegExp(`\\\\${cmd}{([^}]+)}`, 'g');
      result = result.replace(regex, (match, content) => {
        if (cmd === 'href') {
          // Handle \href{url}{text}
          const [url, linkText] = content.split('}{');
          return `${linkText.replace('}', '')}\n link ${url} ${linkText.replace('}', '')}`;
        }
        const marker = this.inlineCommands[cmd];
        return `${marker}${content}${marker}`;
      });
    });
    
    return result;
  }

  convertSpecialCharacters(text) {
    const charMap = {
      '\\&': '&',
      '\\%': '%',
      '\\$': '$',
      '\\#': '#',
      '\\_': '_',
      '\\{': '{',
      '\\}': '}',
      '~': ' ',
      '``': '"',
      "''": '"'
    };
    
    let result = text;
    Object.keys(charMap).forEach(char => {
      result = result.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), charMap[char]);
    });
    
    return result;
  }

  convertFigure(content) {
    // Extract image path and caption
    const includegraphicsRegex = /\\includegraphics(?:\[.*?\])?\{([^}]+)\}/;
    const captionRegex = /\\caption\{([^}]+)\}/;
    
    const imagePath = content.match(includegraphicsRegex)?.[1] || '';
    const caption = content.match(captionRegex)?.[1] || '';
    
    return `image ${imagePath}\n caption ${caption}\n`;
  }

  convertCitations(text) {
    let result = text;
    
    // Convert \cite{key} to ^key
    result = result.replace(/\\cite\{([^}]+)\}/g, '^$1');
    
    // Convert \ref{key} to ^key
    result = result.replace(/\\ref\{([^}]+)\}/g, '^$1');
    
    return result;
  }

  cleanupWhitespace(text) {
    return text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove extra blank lines
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .trim() + '\n'; // Ensure single newline at end
  }
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LaTeXToScroll;
}
