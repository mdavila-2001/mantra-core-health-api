import { PROF } from './profiles.concepts';

/**
 * Cómo se nombra al dependiente desde el lado de quien lo registró.
 *
 * Es el código que viaja al cliente, no un concepto de terminología: el
 * desplegable del formulario y la tarjeta del portal hablan de «Hijo/a», y
 * traducir un uuid a esa palabra en el navegador obligaría a cada cliente a
 * conocer la tabla.
 */
export type DependentRelationshipCode =
  | 'CHILD'
  | 'PARENT'
  | 'SPOUSE'
  | 'WARD'
  | 'OTHER';

/** El dependiente visto desde quien lo representa: su código y su rótulo. */
export interface DependentRelationship {
  /** Qué es el dependiente para el titular. */
  readonly code: DependentRelationshipCode;
  /** Cómo se dice en pantalla, en castellano. */
  readonly display: string;
}

/**
 * Qué es el dependiente para el titular, a partir de lo que el titular declaró
 * ser para él.
 *
 * ## Por qué hace falta dar vuelta el parentesco
 *
 * `profiles.related_persons.relationship_concept_id` describe **a la persona
 * relacionada**, no al paciente: en el alta, elegir «Madre» significa «la
 * persona que anoto es mi madre». Las filas sembradas y las que escribe
 * `createGuardianRelatedPerson` significan eso, y cambiarle el sentido a la
 * columna para los dependientes habría hecho que la misma columna dijera dos
 * cosas distintas según quién la escribió.
 *
 * Así que el alta de un dependiente guarda lo mismo que el alta normal —la fila
 * cuelga del dependiente y la persona relacionada es el titular, que declara
 * «soy su madre»— y es la lectura la que da vuelta la frase para poder decir
 * «Hijo/a» en la tarjeta.
 *
 * ## Por qué madre y padre colapsan en uno
 *
 * Porque desde el otro lado son lo mismo: el hijo de una madre y el hijo de un
 * padre son, los dos, un hijo. El sexo del dependiente no se deduce del
 * parentesco del titular y no se usa acá para nada.
 *
 * Lo que no está en el mapa cae en `OTHER` en vez de romper: el conjunto de
 * parentescos puede crecer —hermano, amistad, vecino— y una lectura que falla
 * por un concepto nuevo dejaría sin listado a quien no tiene la culpa.
 *
 * @param relationshipConceptId - Lo que el titular declaró ser para el
 *   dependiente, como concepto de `related-person-relationship`.
 * @returns El parentesco visto desde el dependiente.
 */
export function describeDependentRelationship(
  relationshipConceptId: string,
): DependentRelationship {
  switch (relationshipConceptId) {
    case PROF.RELATIONSHIP_MOTHER:
    case PROF.RELATIONSHIP_FATHER:
      return { code: 'CHILD', display: 'Hijo/a' };
    case PROF.RELATIONSHIP_CHILD:
      return { code: 'PARENT', display: 'Padre/Madre' };
    case PROF.RELATIONSHIP_SPOUSE:
      return { code: 'SPOUSE', display: 'Cónyuge' };
    case PROF.RELATIONSHIP_GUARDIAN:
      return { code: 'WARD', display: 'Tutelado/a' };
    default:
      return { code: 'OTHER', display: 'Otro/a' };
  }
}

/**
 * Los parentescos que el titular puede declarar al registrar a un dependiente.
 *
 * No son todos los de `related-person-relationship`: un vecino o una amistad
 * describen a un contacto de emergencia, no a alguien de quien uno se hace
 * cargo. Los cinco de acá son los que sostienen una representación: madre,
 * padre, hijo o hija que cuida, cónyuge y tutor legal.
 *
 * Lo consume el `@IsIn` del DTO de alta, de modo que la lista admitida y la que
 * el formulario ofrece salgan del mismo lugar.
 */
export const DEPENDENT_RELATIONSHIP_CONCEPT_IDS: readonly string[] = [
  PROF.RELATIONSHIP_MOTHER,
  PROF.RELATIONSHIP_FATHER,
  PROF.RELATIONSHIP_CHILD,
  PROF.RELATIONSHIP_SPOUSE,
  PROF.RELATIONSHIP_GUARDIAN,
];
