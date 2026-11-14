/**
 * Sannivesham AI — Markdown Formatter Module
 * Safe HTML formatting and sanitization for AI chat responses
 */

export function formatMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Bold & Italics
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Unordered Lists
  html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");

  // Ordered Lists
  html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

  // Line breaks to paragraphs
  html = html.replace(/\n\n+/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p><h3>/g, "<h3>").replace(/<\/h3><\/p>/g, "</h3>");
  html = html.replace(/<p><blockquote>/g, "<blockquote>").replace(/<\/blockquote><\/p>/g, "</blockquote>");
  html = html.replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>");

  return html;
}
