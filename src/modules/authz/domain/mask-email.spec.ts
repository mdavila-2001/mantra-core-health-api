import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it.each([
    ['maria.perez@clinica.org', 'm***@c***.org'],
    ['  A@b.co ', 'A***@b***.co'],
    ['x@mail.example.com', 'x***@m***.com'],
  ])('masks %s', (input, expected) => {
    expect(maskEmail(input)).toBe(expected);
  });

  it.each([
    ['a national id used as login', '1234567-LP'],
    ['two arrobas', 'a@b@c.com'],
    ['no local part', '@clinica.org'],
    ['no top-level label', 'a@localhost'],
    ['trailing dot', 'a@b.'],
    ['empty', ''],
  ])('returns null for %s', (_label, input) => {
    expect(maskEmail(input)).toBeNull();
  });

  it('returns null for null and undefined', () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail(undefined)).toBeNull();
  });

  it('never contains the original local part beyond its first character', () => {
    expect(maskEmail('secretname@clinica.org')).not.toContain('ecret');
  });
});
