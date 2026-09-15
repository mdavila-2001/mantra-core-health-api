import { describe, it, expect } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import {
  DEPENDENT_RELATIONSHIP_CONCEPT_IDS,
  describeDependentRelationship,
} from './dependent-relationship';
import { PROF } from './profiles.concepts';

/**
 * El parentesco se guarda como lo declara el titular —«soy su madre»— y se lee
 * dado vuelta —«Hijo/a»—. Estas pruebas fijan esa inversión, que es lo único
 * que separa la fila que escribe el alta de un dependiente de la que escribe el
 * alta de un contacto de emergencia.
 */
describe('describeDependentRelationship', () => {
  it('da vuelta la frase: quien es madre o padre tiene un hijo o hija', () => {
    expect(describeDependentRelationship(PROF.RELATIONSHIP_MOTHER)).toEqual({
      code: 'CHILD',
      display: 'Hijo/a',
    });
    // Madre y padre colapsan a propósito: desde el otro lado son lo mismo, y el
    // sexo del dependiente no se deduce del parentesco de quien lo registra.
    expect(describeDependentRelationship(PROF.RELATIONSHIP_FATHER)).toEqual({
      code: 'CHILD',
      display: 'Hijo/a',
    });
  });

  it('el hijo que cuida a su padre o madre invierte al revés', () => {
    expect(describeDependentRelationship(PROF.RELATIONSHIP_CHILD)).toEqual({
      code: 'PARENT',
      display: 'Padre/Madre',
    });
  });

  it('cónyuge y tutor legal tienen cada uno su rótulo', () => {
    expect(describeDependentRelationship(PROF.RELATIONSHIP_SPOUSE)).toEqual({
      code: 'SPOUSE',
      display: 'Cónyuge',
    });
    expect(describeDependentRelationship(PROF.RELATIONSHIP_GUARDIAN)).toEqual({
      code: 'WARD',
      display: 'Tutelado/a',
    });
  });

  it('un parentesco que no está en el mapa no rompe la lectura', () => {
    // El conjunto puede crecer. Un listado que falla por un concepto nuevo deja
    // sin dependientes a quien no tiene nada que ver con ese cambio.
    expect(describeDependentRelationship(PROF.RELATIONSHIP_FRIEND)).toEqual({
      code: 'OTHER',
      display: 'Otro/a',
    });
    expect(describeDependentRelationship(randomUUID())).toEqual({
      code: 'OTHER',
      display: 'Otro/a',
    });
  });
});

describe('DEPENDENT_RELATIONSHIP_CONCEPT_IDS', () => {
  it('son los cinco que sostienen una representación', () => {
    expect([...DEPENDENT_RELATIONSHIP_CONCEPT_IDS].sort()).toEqual(
      [
        PROF.RELATIONSHIP_MOTHER,
        PROF.RELATIONSHIP_FATHER,
        PROF.RELATIONSHIP_CHILD,
        PROF.RELATIONSHIP_SPOUSE,
        PROF.RELATIONSHIP_GUARDIAN,
      ].sort(),
    );
  });

  it('ninguno de los admitidos cae en «Otro/a»', () => {
    // Si un parentesco admitido no tuviera rótulo propio, el formulario
    // ofrecería una opción que la tarjeta no sabría nombrar.
    for (const conceptId of DEPENDENT_RELATIONSHIP_CONCEPT_IDS) {
      expect(describeDependentRelationship(conceptId).code).not.toBe('OTHER');
    }
  });

  it('no ofrece contactos que no representan a nadie', () => {
    expect(DEPENDENT_RELATIONSHIP_CONCEPT_IDS).not.toContain(
      PROF.RELATIONSHIP_FRIEND,
    );
    expect(DEPENDENT_RELATIONSHIP_CONCEPT_IDS).not.toContain(
      PROF.RELATIONSHIP_OTHER,
    );
  });
});
