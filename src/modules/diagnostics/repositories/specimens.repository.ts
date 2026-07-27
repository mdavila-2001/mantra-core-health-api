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
  patientProfileId: string;
  custodianTenantId: string;
  specimenTypeConceptId: string;
  statusConceptId: string;
  serviceRequestId?: string;
  encounterId?: string;
  bodySiteConceptId?: string;
  collectionMethodConceptId?: string;
  collectedAt?: Date;
  collectorProfileId?: string;
  accessionIdentifier?: string;
  actorUserId?: string;
}

/** Datos para dar de alta una acesión de laboratorio. */
export interface CreateAccessionData {
  custodianTenantId: string;
  patientProfileId: string;
  accessionNumber: string;
  receivedAt: Date;
  priorityConceptId: string;
  statusConceptId: string;
  serviceRequestId?: string;
  encounterId?: string;
  actorUserId?: string;
}

/** Datos para dar de alta un contenedor de espécimen. */
export interface CreateContainerData {
  specimenId: string;
  containerIdentifier: string;
  containerTypeConceptId: string;
  statusConceptId: string;
  additiveConceptId?: string;
  parentContainerId?: string;
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
  findSpecimen(em: EntityManager, id: string): Promise<Specimens | null> {
    return em.findOne(Specimens, { id });
  }

  findAccession(
    em: EntityManager,
    id: string,
  ): Promise<LaboratoryAccessions | null> {
    return em.findOne(LaboratoryAccessions, { id });
  }

  findContainer(
    em: EntityManager,
    id: string,
  ): Promise<SpecimenContainers | null> {
    return em.findOne(SpecimenContainers, { id });
  }

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

  addAccessionSpecimen(
    em: EntityManager,
    data: {
      laboratoryAccessionId: string;
      specimenId: string;
      sequenceNumber: number;
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
      specimenId: string;
      specimenContainerId?: string;
      custodyEventTypeConceptId: string;
      occurredAt: Date;
      toPartyTypeConceptId?: string;
      toPartyId?: string;
      sealIdentifier?: string;
      evidenceHash?: string;
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
      specimenId: string;
      rejectedAt: Date;
      rejectionReasonConceptId: string;
      rejectedByProfileId?: string;
      notes?: string;
      recollectionRequired?: boolean;
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
      specimenContainerId: string;
      eventTypeConceptId: string;
      occurredAt: Date;
      actorProfileId?: string;
      temperatureCelsius?: string;
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
