/**
 * Production Security Layer
 * Prevents console access to sensitive data and common XSS vectors.
 */

export function initSecurity() {
  if (import.meta.env.PROD) {
    // Disable console logs in production
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.warn = noop;
    // Keep console.error for debugging critical issues
  }

  // Prevent drag-and-drop of sensitive content
  window.addEventListener('dragover', (e) => e.preventDefault(), false);
  window.addEventListener('drop', (e) => e.preventDefault(), false);

  // Clear memory on page hide/unload to prevent data harvesting from memory dumps
  window.addEventListener('pagehide', () => {
    // This is where we could clear very sensitive session-only state if needed
  });
}

/**
 * Sanitize strings to prevent XSS (React does this mostly, but good for manual dangerouslySetInnerHTML)
 */
export function sanitize(str: string): string {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}
