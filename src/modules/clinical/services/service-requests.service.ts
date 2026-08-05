import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  EncountersRepository,
  ServiceRequestsRepository,
} from '../repositories';
import { CreateServiceRequestDto, ServiceRequestResponseDto } from '../dto';
import { CLIN } from '../clinical.concepts';

/** UC-08-05: creación de órdenes de servicio (service_request) en estado activo. */
@Injectable()
export class ServiceRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param serviceRequestsRepo - Valor de service requests repo requerido por la operación.
   * @param encountersRepo - Valor de encounters repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ServiceRequestsService.name);
  }

  /** UC-08-05: registra una orden de servicio con intención de orden. */
  async create(
    dto: CreateServiceRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceRequestResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.service-request.create',
        patientProfileId: dto.patientProfileId,
      },
      'Placing service request',
    );
    return this.em.transactional(async (tx) => {
      if (dto.encounterId) {
        const encounter = await this.encountersRepo.findById(
          tx,
          dto.encounterId,
        );
        if (!encounter) {
          throw new ResourceNotFoundException('Encuentro no encontrado', {
            encounterId: dto.encounterId,
          });
        }
      }

      const sr = this.serviceRequestsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        codeConceptId: dto.codeConceptId,
        categoryConceptId: dto.categoryConceptId,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        priorityConceptId: dto.priorityConceptId,
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
        requesterProfileId: dto.requesterProfileId,
        performerTenantId: dto.performerTenantId,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical.service-request.create',
          serviceRequestId: sr.id,
        },
        'Service request placed',
      );
      return {
        id: sr.id,
        patientProfileId: sr.patientProfileId,
        status: sr.statusConceptId,
        intent: sr.intentConceptId ?? CLIN.SERVICE_REQUEST_INTENT_ORDER,
        createdAt: sr.createdAt,
      };
    });
  }
}
