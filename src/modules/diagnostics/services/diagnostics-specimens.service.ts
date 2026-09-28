import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SpecimensRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import {
  CreateSpecimenDto,
  CreateAccessionDto,
  RejectSpecimenDto,
  CreateContainerDto,
  ContainerCustodyEventDto,
  ResourceCreatedDto,
  AccessionCreatedDto,
  AccessionDetailDto,
  AccessionSpecimenDetailDto,
  SpecimenDetailDto,
} from '../dto';

/**
 * Casos de uso del agregado de especímenes: acesión en laboratorio (UC-20-01),
 * rechazo con solicitud de recolección (UC-20-02) y cadena de custodia / traslado
 * de contenedor (UC-20-03). Incluye dos endpoints de soporte (alta de espécimen y
 * de contenedor) porque el módulo no expone un UC para crearlos y son el padre
 * necesario de los flujos anteriores.
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos: las FK son columnas uuid planas y MikroORM no ordena
 * inserts entre entidades no relacionadas.
 */
@Injectable()
export class DiagnosticsSpecimensService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SpecimensRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsSpecimensService.name);
  }

  /** Soporte: da de alta un espécimen en estado recolectado. */
  async createSpecimen(
    dto: CreateSpecimenDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.specimen.create', actorId: actor.id },
      'Creating specimen',
    );
    return this.em.transactional(async (tx) => {
      const specimen = this.repo.createSpecimen(tx, {
        patientProfileId: dto.patientProfileId,
        custodianTenantId: dto.custodianTenantId,
        specimenTypeConceptId: dto.specimenTypeConceptId,
        statusConceptId: DIAG.SPECIMEN_COLLECTED,
        serviceRequestId: dto.serviceRequestId,
        encounterId: dto.encounterId,
        bodySiteConceptId: dto.bodySiteConceptId,
        collectionMethodConceptId: dto.collectionMethodConceptId,
        collectedAt: new Date(),
        collectorProfileId: dto.collectorProfileId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: specimen.id, status: specimen.statusConceptId };
    });
  }

  /** UC-20-01: acesiona uno o más especímenes recibidos en el laboratorio. */
  async accession(
    dto: CreateAccessionDto,
    actor: AuthenticatedUser,
  ): Promise<AccessionCreatedDto> {
    this.logger.info(
      {
        operation: 'diagnostics.accession.create',
        count: dto.specimenIds.length,
      },
      'Accessioning specimens',
    );
    return this.em.transactional(async (tx) => {
      const tenantId =
        dto.custodianTenantId ??
        (await this.tenantOfSpecimen(tx, dto.specimenIds[0]));

      // Precondición: todos los especímenes existen y están en un estado acesionable.
      const specimens = [];
      for (const specimenId of dto.specimenIds) {
        const specimen = await this.repo.findSpecimen(tx, specimenId);
        if (!specimen) {
          throw new ResourceNotFoundException('Espécimen no encontrado', {
            specimenId,
          });
        }
        if (specimen.statusConceptId === DIAG.SPECIMEN_REJECTED) {
          throw new PreconditionFailedException(
            'El espécimen está rechazado y no puede acesionarse',
            {
              specimenId,
            },
          );
        }
        specimens.push(specimen);
      }

      const accession = this.repo.createAccession(tx, {
        custodianTenantId: tenantId,
        patientProfileId: dto.patientProfileId,
        accessionNumber: dto.accessionNumber ?? `ACC-${Date.now()}`,
        receivedAt: new Date(),
        priorityConceptId: dto.priorityConceptId ?? DIAG.PRIORITY_ROUTINE,
        statusConceptId: DIAG.ACCESSION_RECEIVED,
        serviceRequestId: dto.serviceRequestId,
        actorUserId: actor.id,
      });
      await tx.flush();

      const accessionSpecimenIds: string[] = [];
      let sequence = 1;
      for (const specimen of specimens) {
        const item = this.repo.addAccessionSpecimen(tx, {
          laboratoryAccessionId: accession.id,
          specimenId: specimen.id,
          sequenceNumber: sequence++,
          statusConceptId: DIAG.ACCESSION_ITEM_RECEIVED,
        });
        // Marca el espécimen como recibido y registra la recepción en custodia.
        specimen.receivedAt = new Date();
        specimen.statusConceptId = DIAG.SPECIMEN_RECEIVED;
        touch(specimen, actor.id);
        this.repo.recordCustodyEvent(tx, {
          specimenId: specimen.id,
          custodyEventTypeConceptId: DIAG.CUSTODY_RECEPTION,
          occurredAt: new Date(),
          signedByUserId: actor.id,
        });
        await tx.flush();
        accessionSpecimenIds.push(item.id);
      }

      return {
        id: accession.id,
        status: accession.statusConceptId,
        accessionSpecimenIds,
      };
    });
  }

  /** UC-20-02: rechaza un espécimen y (opcional) solicita nueva recolección. */
  async reject(
    specimenId: string,
    dto: RejectSpecimenDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.specimen.reject', specimenId },
      'Rejecting specimen',
    );
    return this.em.transactional(async (tx) => {
      const specimen = await this.repo.findSpecimen(tx, specimenId);
      if (!specimen)
        throw new ResourceNotFoundException('Espécimen no encontrado', {
          specimenId,
        });
      if (specimen.statusConceptId === DIAG.SPECIMEN_REJECTED) {
        throw new PreconditionFailedException(
          'El espécimen ya está rechazado',
          { specimenId },
        );
      }

      const rejection = this.repo.recordRejection(tx, {
        specimenId,
        rejectedAt: new Date(),
        rejectionReasonConceptId:
          dto.rejectionReasonConceptId ?? DIAG.REJECTION_REASON_QUALITY,
        rejectedByProfileId: dto.rejectedByProfileId,
        notes: dto.notes,
        recollectionRequired: dto.recollectionRequired,
        recollectionServiceRequestId: dto.recollectionServiceRequestId,
      });

      specimen.statusConceptId = DIAG.SPECIMEN_REJECTED;
      touch(specimen, actor.id);
      // Cancela las pruebas de orden dependientes del espécimen.
      await this.repo.cancelTestsForSpecimen(
        tx,
        specimenId,
        DIAG.TEST_CANCELLED,
      );
      await tx.flush();

      return { id: rejection.id, status: specimen.statusConceptId };
    });
  }

  /** Soporte: crea un contenedor para un espécimen. */
  async createContainer(
    specimenId: string,
    dto: CreateContainerDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.container.create', specimenId },
      'Creating container',
    );
    return this.em.transactional(async (tx) => {
      const specimen = await this.repo.findSpecimen(tx, specimenId);
      if (!specimen)
        throw new ResourceNotFoundException('Espécimen no encontrado', {
          specimenId,
        });

      const container = this.repo.createContainer(tx, {
        specimenId,
        containerIdentifier: dto.containerIdentifier,
        containerTypeConceptId: dto.containerTypeConceptId,
        statusConceptId: DIAG.CONTAINER_ACTIVE,
        additiveConceptId: dto.additiveConceptId,
        parentContainerId: dto.parentContainerId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: container.id, status: container.statusConceptId };
    });
  }

  /** UC-20-03: registra el traslado/custodia de un contenedor. */
  async recordCustodyEvent(
    containerId: string,
    dto: ContainerCustodyEventDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.container.custody', containerId },
      'Recording container custody event',
    );
    return this.em.transactional(async (tx) => {
      const container = await this.repo.findContainer(tx, containerId);
      if (!container)
        throw new ResourceNotFoundException('Contenedor no encontrado', {
          containerId,
        });

      this.repo.recordContainerEvent(tx, {
        specimenContainerId: containerId,
        eventTypeConceptId:
          dto.eventTypeConceptId ?? DIAG.CONTAINER_EVENT_TRANSFER,
        occurredAt: new Date(),
        temperatureCelsius: dto.temperatureCelsius,
        notes: dto.notes,
      });
      const custody = this.repo.recordCustodyEvent(tx, {
        specimenId: dto.specimenId,
        specimenContainerId: containerId,
        custodyEventTypeConceptId: DIAG.CUSTODY_TRANSFER,
        occurredAt: new Date(),
        toPartyTypeConceptId: dto.toPartyTypeConceptId,
        toPartyId: dto.toPartyId,
        sealIdentifier: dto.sealIdentifier,
        evidenceHash: dto.evidenceHash,
        signedByUserId: actor.id,
      });

      container.statusConceptId =
        dto.destinationStatusConceptId ?? DIAG.CONTAINER_STORED;
      touch(container, actor.id);
      await tx.flush();

      return { id: custody.id, status: container.statusConceptId };
    });
  }

  /**
   * Lectura (CL-47): detalle de una acesión con sus especímenes, contenedores
   * y cadena de custodia. Acotada al tenant del actor — otro laboratorio
   * recibe 404, no 403, para no confirmar que el id existe.
   */
  async getAccession(
    id: string,
    custodianTenantId: string,
  ): Promise<AccessionDetailDto> {
    const em = this.em.fork();
    const accession = await this.repo.findAccessionForTenant(
      em,
      id,
      custodianTenantId,
    );
    if (!accession) {
      throw new ResourceNotFoundException('Acesión no encontrada', { id });
    }

    const items = await this.repo.findAccessionSpecimens(em, id);
    const specimenIds = items.map((item) => item.specimenId);
    const [specimenes, contenedores, custodia] = await Promise.all([
      this.repo.findSpecimensByIds(em, specimenIds),
      this.repo.findContainersBySpecimenIds(em, specimenIds),
      this.repo.findCustodyEventsBySpecimenIds(em, specimenIds),
    ]);
    const specimenPorId = new Map(specimenes.map((s) => [s.id, s]));

    const specimens: AccessionSpecimenDetailDto[] = [];
    for (const item of items) {
      const specimen = specimenPorId.get(item.specimenId);
      if (!specimen) continue; // No debería pasar: FK íntegra, defensivo.
      specimens.push({
        accessionSpecimenId: item.id,
        sequenceNumber: item.sequenceNumber,
        statusConceptId: item.statusConceptId,
        specimen: this.toSpecimenDetail(
          specimen,
          contenedores.filter((c) => c.specimenId === specimen.id),
          custodia.filter((c) => c.specimenId === specimen.id),
        ),
      });
    }

    return {
      id: accession.id,
      custodianTenantId: accession.custodianTenantId,
      patientProfileId: accession.patientProfileId,
      accessionNumber: accession.accessionNumber,
      receivedAt: accession.receivedAt,
      priorityConceptId: accession.priorityConceptId,
      statusConceptId: accession.statusConceptId,
      specimens,
    };
  }

  /**
   * Lectura (CL-47): detalle de un espécimen con su cadena de custodia.
   * Mismo criterio de aislamiento que {@link getAccession}.
   */
  async getSpecimen(
    id: string,
    custodianTenantId: string,
  ): Promise<SpecimenDetailDto> {
    const em = this.em.fork();
    const specimen = await this.repo.findSpecimenForTenant(
      em,
      id,
      custodianTenantId,
    );
    if (!specimen) {
      throw new ResourceNotFoundException('Espécimen no encontrado', { id });
    }
    const [contenedores, custodia] = await Promise.all([
      this.repo.findContainersBySpecimenIds(em, [id]),
      this.repo.findCustodyEventsBySpecimenIds(em, [id]),
    ]);
    return this.toSpecimenDetail(specimen, contenedores, custodia);
  }

  /** Proyecta un espécimen, sus contenedores y su custodia al DTO de lectura. */
  private toSpecimenDetail(
    specimen: {
      id: string;
      patientProfileId: string;
      specimenTypeConceptId: string;
      statusConceptId: string;
      collectedAt?: Date;
      receivedAt?: Date;
    },
    containers: readonly {
      id: string;
      containerIdentifier: string;
      containerTypeConceptId: string;
      statusConceptId: string;
    }[],
    custodyEvents: readonly {
      id: string;
      specimenContainerId?: string;
      custodyEventTypeConceptId: string;
      occurredAt: Date;
      fromPartyTypeConceptId?: string;
      toPartyTypeConceptId?: string;
      sealIdentifier?: string;
      signedByUserId?: string;
    }[],
  ): SpecimenDetailDto {
    return {
      id: specimen.id,
      patientProfileId: specimen.patientProfileId,
      specimenTypeConceptId: specimen.specimenTypeConceptId,
      statusConceptId: specimen.statusConceptId,
      collectedAt: specimen.collectedAt,
      receivedAt: specimen.receivedAt,
      containers: containers.map((c) => ({
        id: c.id,
        containerIdentifier: c.containerIdentifier,
        containerTypeConceptId: c.containerTypeConceptId,
        statusConceptId: c.statusConceptId,
      })),
      custodyEvents: custodyEvents.map((e) => ({
        id: e.id,
        specimenContainerId: e.specimenContainerId,
        custodyEventTypeConceptId: e.custodyEventTypeConceptId,
        occurredAt: e.occurredAt,
        fromPartyTypeConceptId: e.fromPartyTypeConceptId,
        toPartyTypeConceptId: e.toPartyTypeConceptId,
        sealIdentifier: e.sealIdentifier,
        signedByUserId: e.signedByUserId,
      })),
    };
  }

  /** Resuelve el tenant custodio del espécimen para acesiones sin tenant explícito. */
  private async tenantOfSpecimen(
    em: EntityManager,
    specimenId: string,
  ): Promise<string> {
    const specimen = await this.repo.findSpecimen(em, specimenId);
    if (!specimen)
      throw new ResourceNotFoundException('Espécimen no encontrado', {
        specimenId,
      });
    return specimen.custodianTenantId;
  }
}
