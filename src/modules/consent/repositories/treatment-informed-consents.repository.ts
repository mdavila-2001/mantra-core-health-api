import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TreatmentInformedConsents } from '../entities';
import { createdBy } from '../../../common';
import type {
  InformedConsentChannel,
  InformedConsentExceptionType,
  InformedConsentGrantedBy,
  InformedConsentTargetType,
} from '../informed-consent.enums';

/**
 * Campos del consentimiento dirigido (v4263): a qué se consiente, la
 * información dada, quién otorga y bajo qué excepción. Todos opcionales.
 */
export interface TreatmentInformedConsentDetails {
  /** A qué se consiente. */
  targetType?: InformedConsentTargetType;
  /** Objeto consentido. */
  targetId?: string;
  /** Instantánea legible de lo consentido. */
  targetLabel?: string;
  /** Diagnóstico que lo motiva. */
  diagnosisText?: string;
  /** Naturaleza y objetivo. */
  purposeText?: string;
  /** Beneficios esperados. */
  benefitsText?: string;
  /** Riesgos frecuentes y graves. */
  risksText?: string;
  /** Riesgos personalizados. */
  personalizedRisksText?: string;
  /** Alternativas. */
  alternativesText?: string;
  /** Consecuencias de no aceptar. */
  refusalConsequencesText?: string;
  /** Preguntas del paciente y respuestas. */
  patientQuestionsText?: string;
  /** Quién otorga. */
  grantedBy?: InformedConsentGrantedBy;
  /** Nombre del representante. */
  representativeName?: string;
  /** Documento del representante. */
  representativeDocument?: string;
  /** Parentesco o calidad del representante. */
  representativeRelationship?: string;
  /** Por qué no consiente el titular. */
  incapacityReason?: string;
  /** Profesional que informa. */
  informedByProfileId?: string;
  /** Canal. */
  channel?: InformedConsentChannel;
  /** Excepción legal. */
  exceptionType?: InformedConsentExceptionType;
  /** Justificación de la excepción. */
  exceptionJustification?: string;
  /** Testigo externo. */
  witnessName?: string;
  /** Documento del testigo externo. */
  witnessDocument?: string;
  /** Idioma de la información. */
  informationLanguage?: string;
  /** Asentimiento del menor o de la persona con discapacidad. */
  assentObtained?: boolean;
  /** Notas del asentimiento. */
  assentNotes?: string;
  /** Se informó el derecho a revocar. */
  revocationRightInformed?: boolean;
}

/** Filtros del listado por paciente (v4263). */
export interface TreatmentInformedConsentFilters {
  /** Paciente titular. */
  patientProfileId: string;
  /** Tipo de objeto consentido. */
  targetType?: InformedConsentTargetType;
  /** Objeto consentido. */
  targetId?: string;
}

/** Datos mínimos para capturar un consentimiento informado de tratamiento. */
export interface CreateTreatmentInformedConsentData extends TreatmentInformedConsentDetails {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId: string;
  /**
   * Identificador asociado a procedure code concept.
   */
  procedureCodeConceptId?: string;
  /**
   * Valor de information version mantenido por la instancia.
   */
  informationVersion?: string;
  /**
   * Identificador asociado a interpreter user.
   */
  interpreterUserId?: string;
  /**
   * Identificador asociado a witness user.
   */
  witnessUserId?: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de signed at mantenido por la instancia.
   */
  signedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `consent.treatment_informed_consents` (entidad versionada). */
@Injectable()
export class TreatmentInformedConsentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<TreatmentInformedConsents | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<TreatmentInformedConsents | null> {
    return em.findOne(TreatmentInformedConsents, { id });
  }

  /**
   * Consentimientos de un paciente, del más reciente al más antiguo,
   * opcionalmente filtrados por el objeto consentido (v4263).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Paciente y, opcionalmente, tipo e id del objeto.
   * @param limit - Tope de filas.
   * @returns Los consentimientos que cumplen el filtro.
   */
  findByPatient(
    em: EntityManager,
    filters: TreatmentInformedConsentFilters,
    limit = 100,
  ): Promise<TreatmentInformedConsents[]> {
    return em.find(
      TreatmentInformedConsents,
      {
        patientProfileId: filters.patientProfileId,
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
        ...(filters.targetId ? { targetId: filters.targetId } : {}),
      },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `TreatmentInformedConsents`.
   */
  create(
    em: EntityManager,
    data: CreateTreatmentInformedConsentData,
  ): TreatmentInformedConsents {
    return em.create(
      TreatmentInformedConsents,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        encounterId: data.encounterId,
        procedureCodeConceptId: data.procedureCodeConceptId,
        informationVersion: data.informationVersion,
        interpreterUserId: data.interpreterUserId,
        witnessUserId: data.witnessUserId,
        decisionConceptId: data.decisionConceptId,
        statusConceptId: data.statusConceptId,
        signedAt: data.signedAt,
        targetType: data.targetType,
        targetId: data.targetId,
        targetLabel: data.targetLabel,
        diagnosisText: data.diagnosisText,
        purposeText: data.purposeText,
        benefitsText: data.benefitsText,
        risksText: data.risksText,
        personalizedRisksText: data.personalizedRisksText,
        alternativesText: data.alternativesText,
        refusalConsequencesText: data.refusalConsequencesText,
        patientQuestionsText: data.patientQuestionsText,
        grantedBy: data.grantedBy,
        representativeName: data.representativeName,
        representativeDocument: data.representativeDocument,
        representativeRelationship: data.representativeRelationship,
        incapacityReason: data.incapacityReason,
        informedByProfileId: data.informedByProfileId,
        channel: data.channel,
        exceptionType: data.exceptionType,
        exceptionJustification: data.exceptionJustification,
        witnessName: data.witnessName,
        witnessDocument: data.witnessDocument,
        informationLanguage: data.informationLanguage,
        assentObtained: data.assentObtained,
        assentNotes: data.assentNotes,
        revocationRightInformed: data.revocationRightInformed,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
