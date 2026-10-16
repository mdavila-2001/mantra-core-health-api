import type { UnitOfWork } from './unit-of-work';

/** El encuentro que se abre al atender a quien llegó al mostrador. */
export interface NewEncounter {
  patientProfileId: string;
  tenantId: string;
  primaryPractitionerId?: string;
  classConceptId: string;
  statusConceptId: string;
  reasonText?: string;
  appointmentId: string;
  startAt: Date;
  actorUserId: string;
}

/** Quién atiende el encuentro. */
export interface NewEncounterParticipant {
  encounterId: string;
  practitionerProfileId: string;
  participantRoleConceptId: string;
  statusConceptId: string;
  isResponsible: boolean;
  periodStart?: Date;
  actorUserId: string;
}

/** Referencia al encuentro recién abierto. */
export interface EncounterRef {
  readonly id: string;
  readonly startAt?: Date;
}

/** Apertura de encuentros clínicos desde la agenda (contexto `clinical`). */
export interface ClinicalEncountersPort {
  /** Abre el encuentro dentro de la unidad de trabajo del llamador. */
  open(uow: UnitOfWork, data: NewEncounter): EncounterRef;

  /** Agrega al profesional que atiende. El encuentro ya debe existir. */
  addParticipant(uow: UnitOfWork, data: NewEncounterParticipant): void;
}

/** Token de inyección de los encuentros clínicos. */
export const CLINICAL_ENCOUNTERS_PORT = Symbol('CLINICAL_ENCOUNTERS_PORT');
