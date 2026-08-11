/**
 * Las partes del nombre de una persona, tal como las declara `profiles.persons`.
 *
 * Todas opcionales: un recién nacido, una urgencia sin identificar o un registro
 * importado pueden llegar sin ninguna.
 */
export interface PersonNameParts {
  /** Nombre de pila. */
  readonly name?: string;
  /** Segundo nombre. Mucha gente no tiene. */
  readonly middleName?: string;
  /** Apellido paterno. */
  readonly lastName?: string;
  /** Apellido materno. No todas las jurisdicciones lo emiten. */
  readonly motherLastName?: string;
}

/**
 * El nombre para mostrar, compuesto a partir de sus partes.
 *
 * Vive acá y no en el servicio que da de alta a un paciente porque `persons` se
 * crea desde cinco lugares distintos —autoservicio, alta administrativa, alta
 * asistida, registro de profesional y persona relacionada— y una regla de
 * composición repetida cinco veces es una regla que en algún momento va a
 * discrepar consigo misma.
 *
 * Une las partes presentes en el orden en que se dicen y saltea las ausentes,
 * que es lo habitual: sin esto, alguien sin segundo nombre quedaría con un
 * doble espacio en medio del nombre.
 *
 * @param partes - Las partes declaradas del nombre.
 * @returns El nombre compuesto, o `undefined` si no había ninguna parte.
 */
export function composePersonDisplayName(
  partes: PersonNameParts,
): string | undefined {
  const compuesto = [
    partes.name,
    partes.middleName,
    partes.lastName,
    partes.motherLastName,
  ]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => parte !== undefined && parte !== '')
    .join(' ');

  return compuesto === '' ? undefined : compuesto;
}
