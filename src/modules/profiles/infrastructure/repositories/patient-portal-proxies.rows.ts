/**
 * Raw SQL row shapes of `PatientPortalProxiesRepository`.
 *
 * Split out of the repository to keep it under its frozen line budget.
 */

/**
 * Una fila de {@link PatientPortalProxiesRepository.listActiveDependentsOfUser}.
 *
 * Los nombres vienen en `snake_case` porque es SQL cruda y no pasa por el
 * mapeo del ORM; el servicio los traduce al contrato de cara al cliente.
 */
export interface DependentRow {
  /** Identificador del apoderamiento que sostiene la representación. */
  readonly proxy_id: string;
  /** Perfil de paciente del dependiente. */
  readonly patient_profile_id: string;
  /** Persona del dependiente. */
  readonly person_id: string;
  /** Nombre de pila. */
  readonly name: string | null;
  /** Segundo nombre. */
  readonly middle_name: string | null;
  /** Apellido paterno. */
  readonly last_name: string | null;
  /** Apellido materno. */
  readonly mother_last_name: string | null;
  /** Nombre visible ya compuesto. */
  readonly display_name: string | null;
  /** Fecha de nacimiento, ya en `YYYY-MM-DD`. */
  readonly birth_date: string | null;
  /** Lo que el titular declaró ser para el dependiente. */
  readonly relationship_concept_id: string | null;
  /** Si la fila de parentesco afirma la tutela. */
  readonly is_legal_guardian: boolean | null;
  /** Documento de identidad vigente del dependiente, si lo declaró. */
  readonly national_id: string | null;
  /** Sex at birth concept of the dependent, if declared. */
  readonly sex_at_birth_concept_id: string | null;
}

/** Representante activo del paciente, listo para la ficha propia. */
export interface GuardianRow {
  readonly display_name: string | null;
  readonly relationship_concept_id: string | null;
  readonly is_legal_guardian: boolean | null;
  readonly phone: string | null;
}

/**
 * Una fila de {@link PatientPortalProxiesRepository.listPendingForPatient}.
 *
 * Nombres en `snake_case` por ser SQL cruda. Las partes del nombre pueden venir
 * `null` si la cuenta que pidió ya no tiene persona vinculada.
 */
export interface PendingRequestRow {
  /** Identificador del apoderamiento pendiente, que es el de la solicitud. */
  readonly id: string;
  /** Cuándo se pidió. */
  readonly created_at: Date | string;
  /** Nombre de pila de quien pide. */
  readonly name: string | null;
  /** Segundo nombre. */
  readonly middle_name: string | null;
  /** Apellido paterno. */
  readonly last_name: string | null;
  /** Apellido materno. */
  readonly mother_last_name: string | null;
  /** Nombre visible ya compuesto. */
  readonly display_name: string | null;
}

/**
 * Los criterios de {@link PatientPortalProxiesRepository.searchRepresentableByName}.
 */
export interface RepresentableSearch {
  /** Persona del titular, que no es candidata de sí misma. */
  readonly ownerPersonId: string;
  /** Cuenta del titular, para excluir a quien ya representa o ya pidió. */
  readonly proxyUserId: string;
  /**
   * Palabras de la búsqueda, ya sin tildes ni mayúsculas y sólo con letras y
   * dígitos: cada una tiene que abrir alguna palabra del nombre.
   */
  readonly tokens: readonly string[];
  /** Instante contra el que se mide la vigencia de la representación. */
  readonly now: Date;
  /** Tope de filas. */
  readonly limit: number;
}

/**
 * Una fila de {@link PatientPortalProxiesRepository.searchRepresentableByName}.
 *
 * Nombres en `snake_case` por ser SQL cruda.
 */
export interface RepresentableCandidateRow {
  /** Perfil de paciente del candidato (es `persons.id`). */
  readonly patient_profile_id: string;
  /** Nombre visible ya compuesto. */
  readonly display_name: string | null;
  /** Nombre de pila. */
  readonly name: string | null;
  /** Segundo nombre. */
  readonly middle_name: string | null;
  /** Apellido paterno. */
  readonly last_name: string | null;
  /** Apellido materno. */
  readonly mother_last_name: string | null;
  /** Documento de identidad vigente, si lo declaró. */
  readonly national_id: string | null;
}
