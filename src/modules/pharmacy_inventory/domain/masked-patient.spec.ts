import { documentLast3, maskedName } from './masked-patient';

describe('masked patient (FAR-02, S-4)', () => {
  describe('maskedName', () => {
    it('keeps one initial per name part', () => {
      expect(
        maskedName({
          name: 'Lucía',
          middleName: 'Fernanda',
          lastName: 'Prueba',
          motherLastName: 'Quispe',
        }),
      ).toBe('L. F. P. Q.');
    });

    it('skips the parts the person does not have', () => {
      expect(maskedName({ name: 'Lucía', lastName: 'Prueba' })).toBe('L. P.');
      expect(
        maskedName({
          name: 'Lucía',
          middleName: null,
          lastName: 'Prueba',
          motherLastName: '   ',
        }),
      ).toBe('L. P.');
    });

    it('splits compound names by spaces and hyphens', () => {
      expect(
        maskedName({ name: 'Ana  María', lastName: 'Prueba-Quispe' }),
      ).toBe('A. M. P. Q.');
    });

    it('drops lowercase particles of compound surnames', () => {
      expect(maskedName({ name: 'Ana', lastName: 'de la Prueba' })).toBe(
        'A. P.',
      );
    });

    it('keeps accents and uppercases the initial', () => {
      expect(maskedName({ name: 'ángela', lastName: 'Ñuflo' })).toBe('Á. Ñ.');
    });

    it('ignores leading punctuation inside a word', () => {
      expect(maskedName({ name: '(Ana)', lastName: "O'Prueba" })).toBe('A. O.');
    });

    it('falls back to the display name only when every part is empty', () => {
      expect(maskedName({ displayName: 'Ana Prueba' })).toBe('A. P.');
      expect(maskedName({ name: 'Lucía', displayName: 'Otra Persona' })).toBe(
        'L.',
      );
    });

    it('returns null without any name', () => {
      expect(maskedName({})).toBeNull();
      expect(
        maskedName({ name: '', lastName: ' ', displayName: null }),
      ).toBeNull();
    });
  });

  describe('documentLast3', () => {
    it('takes the last 3 digits of the number, not of the suffix', () => {
      expect(documentLast3('4567890 LP')).toBe('890');
      expect(documentLast3('1234-1A')).toBe('234');
    });

    it('ignores thousands separators: dots, spaces and hyphens before 3 digits', () => {
      expect(documentLast3('1.234.567')).toBe('567');
      expect(documentLast3('123.456.789')).toBe('789');
      expect(documentLast3('12 345 678')).toBe('678');
      expect(documentLast3('12-345-678 LP')).toBe('678');
      expect(documentLast3('1.234.567-1A')).toBe('567');
    });

    it('a separated number of 3 digits or less is still null', () => {
      expect(documentLast3('1.23')).toBeNull();
      expect(documentLast3('12 3')).toBeNull();
    });

    it('reads the number even behind a prefix', () => {
      expect(documentLast3('E-7654321')).toBe('321');
    });

    it('returns null for a number of 3 digits or less', () => {
      expect(documentLast3('12')).toBeNull();
      expect(documentLast3('123')).toBeNull();
      expect(documentLast3('AB-12')).toBeNull();
    });

    it('returns null without a document or without digits', () => {
      expect(documentLast3(null)).toBeNull();
      expect(documentLast3(undefined)).toBeNull();
      expect(documentLast3('')).toBeNull();
      expect(documentLast3('SIN NUMERO')).toBeNull();
    });
  });
});
