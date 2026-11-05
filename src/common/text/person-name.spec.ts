import { describe, it, expect } from '@jest/globals';
import { composePersonDisplayName } from './person-name';

/**
 * La composición del nombre es la única regla que convierte las cuatro partes
 * en lo que la gente ve. Vive en un solo lugar justamente para que no discrepe
 * consigo misma entre los cinco puntos que crean personas, y estas pruebas son
 * lo que fija esa regla.
 */
describe('composePersonDisplayName', () => {
  it('une las cuatro partes en el orden en que se dicen', () => {
    expect(
      composePersonDisplayName({
        name: 'Lucía',
        middleName: 'Andrea',
        lastName: 'Mamani',
        motherLastName: 'Quispe',
      }),
    ).toBe('Lucía Andrea Mamani Quispe');
  });

  it('saltea las partes ausentes sin dejar dobles espacios', () => {
    // El caso más común de todos: sin segundo nombre y sin apellido materno.
    expect(composePersonDisplayName({ name: 'Juan', lastName: 'Pérez' })).toBe(
      'Juan Pérez',
    );
  });

  it('ignora las partes que son sólo espacios', () => {
    expect(
      composePersonDisplayName({
        name: 'Ana',
        middleName: '   ',
        lastName: 'Paz',
      }),
    ).toBe('Ana Paz');
  });

  it('recorta los bordes de cada parte', () => {
    // Un espacio pegado al copiar y pegar no tiene que llegar a la base.
    expect(composePersonDisplayName({ name: ' Ana ', lastName: ' Paz ' })).toBe(
      'Ana Paz',
    );
  });

  it('devuelve undefined cuando no hay ninguna parte', () => {
    // No una cadena vacía: la ausencia de nombre es un dato, y `undefined` deja
    // la columna en NULL en vez de guardar un nombre que es un espacio.
    expect(composePersonDisplayName({})).toBeUndefined();
    expect(composePersonDisplayName({ name: '  ' })).toBeUndefined();
  });

  it('conserva los nombres compuestos y los apellidos de varias palabras', () => {
    // Es la razón de ser del desdoble: esto no se puede reconstruir partiendo
    // una cadena por espacios.
    expect(
      composePersonDisplayName({
        name: 'Ana María',
        lastName: 'De la Cruz',
        motherLastName: 'Del Valle',
      }),
    ).toBe('Ana María De la Cruz Del Valle');
  });
});
