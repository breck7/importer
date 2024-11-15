class HTMLToScroll {
  constructor() {
    // Mapping of HTML elements to Scroll syntax
    this.blockElements = {
      h1: "# ",
      h2: "## ",
      h3: "### ",
      h4: "#### ",
      h5: "##### ",
      p: "*",
      blockquote: "> ",
      pre: "code\n",
      ul: null, // Handled specially
      ol: null, // Handled specially
      figure: null, // Handled specially
    };

    this.inlineElements = {
      strong: "*",
      b: "*",
      em: "_",
      i: "_",
      code: "`",
      a: null, // Handled specially
      img: null, // Handled specially
    };

    // Elements that should create line breaks before/after
    this.blockLevelElements = new Set([
      "div",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "figure",
    ]);
  }

  convert(html) {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Convert the body content
    return this.convertNode(doc.body).trim() + "\n";
  }

  convertNode(node, indent = "") {
    let result = "";

    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        result += indent + this.escapeSpecialCharacters(text);
      }
      return result;
    }

    // Skip comments and other node types
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return result;
    }

    const tagName = node.tagName.toLowerCase();

    // Handle block elements
    if (this.blockElements.hasOwnProperty(tagName)) {
      result += this.convertBlockElement(node, indent);
    }
    // Handle inline elements
    else if (this.inlineElements.hasOwnProperty(tagName)) {
      result += this.convertInlineElement(node, indent);
    }
    // Handle special cases
    else if (tagName === "div") {
      result += this.convertDiv(node, indent);
    }
    // Handle unknown elements by just processing their children
    else {
      for (const child of node.childNodes) {
        result += this.convertNode(child, indent);
      }
    }

    return result;
  }

  convertBlockElement(node, indent) {
    const tagName = node.tagName.toLowerCase();
    let result = "";

    switch (tagName) {
      case "ul":
        return this.convertList(node, indent, "- ");

      case "ol":
        return this.convertList(node, indent, "1. ");

      case "figure":
        return this.convertFigure(node, indent);

      case "pre":
        if (node.firstElementChild?.tagName.toLowerCase() === "code") {
          result += indent + "code\n";
          result += indent + node.textContent.trim() + "\n";
        } else {
          result += indent + "code\n";
          result += indent + node.textContent.trim() + "\n";
        }
        break;

      default:
        const prefix = this.blockElements[tagName];
        const content = this.getNodeContent(node, indent);
        result += indent + prefix + content + "\n";
    }

    return result;
  }

  convertInlineElement(node, indent) {
    const tagName = node.tagName.toLowerCase();
    let result = "";

    switch (tagName) {
      case "a":
        return this.convertLink(node, indent);

      case "img":
        return this.convertImage(node, indent);

      default:
        const marker = this.inlineElements[tagName];
        const content = this.getNodeContent(node, "");
        result += marker + content.trim() + marker;
    }

    return result;
  }

  convertList(node, indent, marker) {
    let result = "\n";
    for (const child of node.children) {
      if (child.tagName.toLowerCase() === "li") {
        result +=
          indent +
          marker +
          this.getNodeContent(child, indent + " ").trim() +
          "\n";
      }
    }
    return result;
  }

  convertLink(node, indent) {
    const href = node.getAttribute("href");
    const text = node.textContent.trim();
    const title = node.getAttribute("title");

    if (!href) return text;

    let result = text + "\n";
    result += indent + ` link ${href} ${text}`;
    if (title) {
      result += `\n${indent}  title ${title}`;
    }
    return result;
  }

  convertImage(node, indent) {
    const src = node.getAttribute("src");
    const alt = node.getAttribute("alt");

    if (!src) return "";

    let result = `\nimage ${src}`;
    if (alt) {
      result += `\n caption ${alt}`;
    }
    return result + "\n";
  }

  convertFigure(node, indent) {
    let result = "\n";
    const img = node.querySelector("img");
    const figcaption = node.querySelector("figcaption");

    if (img) {
      const src = img.getAttribute("src");
      result += indent + `image ${src}\n`;
    }

    if (figcaption) {
      result += indent + ` caption ${figcaption.textContent.trim()}\n`;
    }

    return result;
  }

  convertDiv(node, indent) {
    let result = "";
    const className = node.getAttribute("class");

    if (className) {
      result += `\n${indent}class ${className}\n`;
    }

    for (const child of node.childNodes) {
      result += this.convertNode(child, indent + (className ? " " : ""));
    }

    return result;
  }

  getNodeContent(node, indent) {
    let content = "";
    for (const child of node.childNodes) {
      content += this.convertNode(child, indent);
    }
    return content;
  }

  escapeSpecialCharacters(text) {
    return text
      .replace(/\*/g, "\\*")
      .replace(/\_/g, "\\_")
      .replace(/\`/g, "\\`")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^");
  }
}

// For Node.js environment
if (typeof window === "undefined") {
  const { JSDOM } = require("jsdom");
  global.Node = new JSDOM().window.Node;
  global.DOMParser = new JSDOM().window.DOMParser;
}

// module.exports = HTMLToScroll;
