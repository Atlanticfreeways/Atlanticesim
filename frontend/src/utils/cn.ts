/**
 * Class Name Utility
 * Merges Tailwind classes with proper precedence
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
