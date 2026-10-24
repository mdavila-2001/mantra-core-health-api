/**
 * Normaliza un texto opcional que el titular puede querer dejar en blanco.
 *
 * `''` —y un texto de sólo espacios— significa «esto no lo tengo», no «tengo un
 * dato vacío». La columna es nullable, así que la forma de decirlo es `NULL`:
 * guardar la cadena vacía dejaría un valor que la lectura devolvería como `""`,
 * indistinguible de un dato real y contrario a la convención del contrato —lo
 * que no se declaró viaja ausente—. Además metería un espacio de más al
 * recomponer el nombre visible.
 *
 * @param value - Lo que llegó en el cuerpo.
 * @returns El texto, o `undefined` para que la columna quede en `NULL`.
 */
export function optionalText(value: string): string | undefined {
  return value.trim() === '' ? undefined : value;
}

/** Lo único que {@link applyOccupation} necesita del cuerpo del `PATCH`. */
export interface DeclaredOccupation {
  readonly occupationConceptId?: string;
  readonly occupationFreeText?: string;
}

/** Lo único que {@link applyCompany} necesita del cuerpo del `PATCH`. */
export interface DeclaredCompany {
  readonly workEmployerConceptId?: string;
  readonly workEmployerFreeText?: string;
}

/**
 * Escribe la ocupación, que se declara de dos formas que no pueden convivir.
 *
 * La persona tiene una sola ocupación, y el modelo la guarda en dos columnas: el
 * concepto del catálogo (`VS_BO_OCCUPATION`) para lo que está en la lista y el
 * texto libre para lo que no. Dejar las dos con valor diría que tiene dos, y la
 * lectura tendría que elegir una por su cuenta.
 *
 * La regla es la misma del alta: **el catálogo gana**. Declarar un concepto borra
 * el texto libre —aunque venga en el mismo cuerpo—, y declarar un texto borra el
 * concepto, porque escribir la ocupación a mano es decir que no está en la lista.
 * Vaciar uno de los dos no toca al otro: es quitar lo que se declaró, no
 * redeclararlo.
 *
 * Compartida entre `PATCH /profiles/patients/me` y `PATCH
 * /profiles/practitioners/me`: la persona tiene una ocupación
 * independientemente de qué perfil clínico traiga encima, y las dos columnas
 * viven en `profiles.persons`. El parámetro `dto` se tipa estructuralmente
 * (`OcupacionDeclarada`) para que sirva a los dos DTOs sin acoplar este
 * archivo a ninguno.
 *
 * @param person - La persona bajo edición, que se muta.
 * @param dto - Los campos que llegaron en el cuerpo.
 */
interface PersonWorkFields {
  occupationConceptId?: string;
  occupationFreeText?: string;
  workEmployerConceptId?: string;
  workEmployerFreeText?: string;
}

export function applyOccupation(
  person: PersonWorkFields,
  dto: DeclaredOccupation,
): void {
  const declaredConcept = dto.occupationConceptId;

  if (dto.occupationFreeText !== undefined) {
    person.occupationFreeText = optionalText(dto.occupationFreeText);
    // Sólo un texto con contenido desplaza al concepto: vaciarlo es quedarse sin
    // texto, no negar la ocupación del catálogo. Y si el cuerpo también trae
    // concepto, decide el bloque de abajo y éste sobra.
    if (
      person.occupationFreeText !== undefined &&
      declaredConcept === undefined
    ) {
      person.occupationConceptId = undefined;
    }
  }

  if (declaredConcept !== undefined) {
    person.occupationConceptId = optionalText(declaredConcept);
    if (person.occupationConceptId !== undefined) {
      person.occupationFreeText = undefined;
    }
  }
}

/**
 * Escribe la empresa donde trabaja, con la misma regla de las dos formas que
 * no pueden convivir que rige la ocupación — ver {@link applyOccupation}, del
 * que ésta es la copia exacta para `work_employer_concept_id`/
 * `work_employer_free_text`. Existe separada y no parametrizada porque las dos
 * parejas de columnas viven en la misma entidad y una función genérica sobre
 * «cuál par» sería más difícil de leer que la duplicación de ocho líneas.
 *
 * Mismo motivo de {@link applyOccupation} para vivir acá y no en un servicio:
 * paciente y profesional comparten la columna, no el DTO.
 *
 * @param person - La persona bajo edición, que se muta.
 * @param dto - Los campos que llegaron en el cuerpo.
 */
export function applyCompany(
  person: PersonWorkFields,
  dto: DeclaredCompany,
): void {
  const declaredConcept = dto.workEmployerConceptId;

  if (dto.workEmployerFreeText !== undefined) {
    person.workEmployerFreeText = optionalText(dto.workEmployerFreeText);
    if (
      person.workEmployerFreeText !== undefined &&
      declaredConcept === undefined
    ) {
      person.workEmployerConceptId = undefined;
    }
  }

  if (declaredConcept !== undefined) {
    person.workEmployerConceptId = optionalText(declaredConcept);
    if (person.workEmployerConceptId !== undefined) {
      person.workEmployerFreeText = undefined;
    }
  }
}
