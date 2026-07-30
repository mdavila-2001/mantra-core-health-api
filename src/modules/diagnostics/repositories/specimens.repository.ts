import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Specimens,
  LaboratoryAccessions,
  AccessionSpecimens,
  SpecimenChainOfCustodyEvents,
  SpecimenRejectionEvents,
  SpecimenContainers,
  SpecimenContainerEvents,
  LaboratoryWorkOrderTests,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un espécimen (endpoint de soporte). */
export interface CreateSpecimenData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a specimen type concept.
   */
  specimenTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a body site concept.
   */
  bodySiteConceptId?: string;
  /**
   * Identificador asociado a collection method concept.
   */
  collectionMethodConceptId?: string;
  /**
   * Valor de collected at mantenido por la instancia.
   */
  collectedAt?: Date;
  /**
   * Identificador asociado a collector profile.
   */
  collectorProfileId?: string;
  /**
   * Valor de accession identifier mantenido por la instancia.
   */
  accessionIdentifier?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos para dar de alta una acesión de laboratorio. */
export interface CreateAccessionData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Valor de accession number mantenido por la instancia.
   */
  accessionNumber: string;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt: Date;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos para dar de alta un contenedor de espécimen. */
export interface CreateContainerData {
  /**
   * Identificador asociado a specimen.
   */
  specimenId: string;
  /**
   * Valor de container identifier mantenido por la instancia.
   */
  containerIdentifier: string;
  /**
   * Identificador asociado a container type concept.
   */
  containerTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a additive concept.
   */
  additiveConceptId?: string;
  /**
   * Identificador asociado a parent container.
   */
  parentContainerId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del agregado de especímenes: la propia tabla `specimens`, la
 * acesión de laboratorio y sus items, la cadena de custodia (append-only), los
 * eventos de rechazo (append-only) y los contenedores con sus eventos.
 *
 * Repositorio stateless: cada método recibe el `EntityManager` activo para que el
 * servicio controle la transacción y el orden de `flush` (las FK son columnas
 * uuid planas y MikroORM no ordena inserts entre entidades no relacionadas).
 */
@Injectable()
export class SpecimensRepository {
  /**
   * Obtiene find specimen.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find specimen conforme al contrato `Promise<Specimens | null>`.
   */
  findSpecimen(em: EntityManager, id: string): Promise<Specimens | null> {
    return em.findOne(Specimens, { id });
  }

  /**
   * Obtiene find accession.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find accession conforme al contrato `Promise<LaboratoryAccessions | null>`.
   */
  findAccession(
    em: EntityManager,
    id: string,
  ): Promise<LaboratoryAccessions | null> {
    return em.findOne(LaboratoryAccessions, { id });
  }

  /**
   * Obtiene find container.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find container conforme al contrato `Promise<SpecimenContainers | null>`.
   */
  findContainer(
    em: EntityManager,
    id: string,
  ): Promise<SpecimenContainers | null> {
    return em.findOne(SpecimenContainers, { id });
  }

  /**
   * Crea create specimen.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create specimen conforme al contrato `Specimens`.
   */
  createSpecimen(em: EntityManager, data: CreateSpecimenData): Specimens {
    return em.create(
      Specimens,
      {
        patientProfileId: data.patientProfileId,
        custodianTenantId: data.custodianTenantId,
        specimenTypeConceptId: data.specimenTypeConceptId,
        statusConceptId: data.statusConceptId,
        serviceRequestId: data.serviceRequestId,
        encounterId: data.encounterId,
        bodySiteConceptId: data.bodySiteConceptId,
        collectionMethodConceptId: data.collectionMethodConceptId,
        collectedAt: data.collectedAt,
        collectorProfileId: data.collectorProfileId,
        accessionIdentifier: data.accessionIdentifier,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create accession.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create accession conforme al contrato `LaboratoryAccessions`.
   */
  createAccession(
    em: EntityManager,
    data: CreateAccessionData,
  ): LaboratoryAccessions {
    return em.create(
      LaboratoryAccessions,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        accessionNumber: data.accessionNumber,
        receivedAt: data.receivedAt,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        serviceRequestId: data.serviceRequestId,
        encounterId: data.encounterId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea add accession specimen.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de add accession specimen conforme al contrato `AccessionSpecimens`.
   */
  addAccessionSpecimen(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a laboratory accession.
       */
      laboratoryAccessionId: string;
      /**
       * Identificador asociado a specimen.
       */
      specimenId: string;
      /**
       * Valor de sequence number mantenido por la instancia.
       */
      sequenceNumber: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
    },
  ): AccessionSpecimens {
    return em.create(
      AccessionSpecimens,
      {
        laboratoryAccessionId: data.laboratoryAccessionId,
        specimenId: data.specimenId,
        sequenceNumber: data.sequenceNumber,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Registra un evento de cadena de custodia (append-only, sin flush). */
  recordCustodyEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a specimen.
       */
      specimenId: string;
      /**
       * Identificador asociado a specimen container.
       */
      specimenContainerId?: string;
      /**
       * Identificador asociado a custody event type concept.
       */
      custodyEventTypeConceptId: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt: Date;
      /**
       * Identificador asociado a to party type concept.
       */
      toPartyTypeConceptId?: string;
      /**
       * Identificador asociado a to party.
       */
      toPartyId?: string;
      /**
       * Valor de seal identifier mantenido por la instancia.
       */
      sealIdentifier?: string;
      /**
       * Valor de evidence hash mantenido por la instancia.
       */
      evidenceHash?: string;
      /**
       * Identificador asociado a signed by user.
       */
      signedByUserId?: string;
    },
  ): SpecimenChainOfCustodyEvents {
    return em.create(
      SpecimenChainOfCustodyEvents,
      {
        specimenId: data.specimenId,
        specimenContainerId: data.specimenContainerId,
        custodyEventTypeConceptId: data.custodyEventTypeConceptId,
        occurredAt: data.occurredAt,
        toPartyTypeConceptId: data.toPartyTypeConceptId,
        toPartyId: data.toPartyId,
        sealIdentifier: data.sealIdentifier,
        evidenceHash: data.evidenceHash,
        signedByUserId: data.signedByUserId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Registra un evento de rechazo (append-only inmutable, sin flush). */
  recordRejection(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a specimen.
       */
      specimenId: string;
      /**
       * Valor de rejected at mantenido por la instancia.
       */
      rejectedAt: Date;
      /**
       * Identificador asociado a rejection reason concept.
       */
      rejectionReasonConceptId: string;
      /**
       * Identificador asociado a rejected by profile.
       */
      rejectedByProfileId?: string;
      /**
       * Valor de notes mantenido por la instancia.
       */
      notes?: string;
      /**
       * Valor de recollection required mantenido por la instancia.
       */
      recollectionRequired?: boolean;
      /**
       * Identificador asociado a recollection service request.
       */
      recollectionServiceRequestId?: string;
    },
  ): SpecimenRejectionEvents {
    return em.create(
      SpecimenRejectionEvents,
      {
        specimenId: data.specimenId,
        rejectedAt: data.rejectedAt,
        rejectionReasonConceptId: data.rejectionReasonConceptId,
        rejectedByProfileId: data.rejectedByProfileId,
        notes: data.notes,
        recollectionRequired: data.recollectionRequired,
        recollectionServiceRequestId: data.recollectionServiceRequestId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create container.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create container conforme al contrato `SpecimenContainers`.
   */
  createContainer(
    em: EntityManager,
    data: CreateContainerData,
  ): SpecimenContainers {
    return em.create(
      SpecimenContainers,
      {
        specimenId: data.specimenId,
        containerIdentifier: data.containerIdentifier,
        containerTypeConceptId: data.containerTypeConceptId,
        statusConceptId: data.statusConceptId,
        additiveConceptId: data.additiveConceptId,
        parentContainerId: data.parentContainerId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Registra un evento de contenedor (append-only, sin flush). */
  recordContainerEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a specimen container.
       */
      specimenContainerId: string;
      /**
       * Identificador asociado a event type concept.
       */
      eventTypeConceptId: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt: Date;
      /**
       * Identificador asociado a actor profile.
       */
      actorProfileId?: string;
      /**
       * Valor de temperature celsius mantenido por la instancia.
       */
      temperatureCelsius?: string;
      /**
       * Valor de notes mantenido por la instancia.
       */
      notes?: string;
    },
  ): SpecimenContainerEvents {
    return em.create(
      SpecimenContainerEvents,
      {
        specimenContainerId: data.specimenContainerId,
        eventTypeConceptId: data.eventTypeConceptId,
        occurredAt: data.occurredAt,
        actorProfileId: data.actorProfileId,
        temperatureCelsius: data.temperatureCelsius,
        notes: data.notes,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Cancela las pruebas de orden dependientes de un espécimen rechazado. */
  cancelTestsForSpecimen(
    em: EntityManager,
    specimenId: string,
    cancelledStatusConceptId: string,
  ): Promise<number> {
    // Actualización masiva sin materializar entidades; devuelve el nº de filas.
    return em.nativeUpdate(
      LaboratoryWorkOrderTests,
      { specimenId },
      { statusConceptId: cancelledStatusConceptId, updatedAt: new Date() },
    );
  }
}
