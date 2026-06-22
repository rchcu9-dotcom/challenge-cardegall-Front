export const ORANGE_COM_EMAIL_REGEX = /^[^\s@]+@([a-z0-9-]+\.)*orange\.com$/i;

export function isOrangeComEmail(value: string): boolean {
  return ORANGE_COM_EMAIL_REGEX.test(value);
}
