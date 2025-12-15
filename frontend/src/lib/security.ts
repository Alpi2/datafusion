import DOMPurify from "dompurify";

export function sanitizeHtml(dirty: string): string {
  try {
    return DOMPurify.sanitize(dirty);
  } catch (e) {
    return "";
  }
}

export function sanitizeText(input: string): string {
  return sanitizeHtml(input);
}
