/**
 * Sub-códigos de negocio estables para los errores de dominio de `education`.
 *
 * Van como tercer argumento de `DomainException` (y subclases): el `code`
 * dice la forma HTTP del error y `reason` cuál de las situaciones ocurrió.
 */
export enum EducationErrorReason {
  /**
   * El recurso (curso, cohorte, evaluación, inscripción, intento, lección o
   * certificado) no existe, pertenece a otro tenant o es de otro aprendiz. Se
   * responde igual en todos los casos para no confirmar que un UUID existe en
   * otra organización ni en la cuenta de otra persona.
   */
  EDUCATION_RESOURCE_OUT_OF_SCOPE = 'EDUCATION_RESOURCE_OUT_OF_SCOPE',
  /**
   * Un actor `LEARNER` intentó inscribir a otra persona. Un aprendiz solo se
   * inscribe a sí mismo; inscribir a terceros es una vía administrativa.
   */
  LEARNER_ENROLLMENT_OWNER_REQUIRED = 'LEARNER_ENROLLMENT_OWNER_REQUIRED',
}
