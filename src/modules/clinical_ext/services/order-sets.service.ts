import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { OrderSetsRepository } from '../repositories';
import {
  EncountersRepository,
  ServiceRequestsRepository,
} from '../../clinical/repositories';
import { ClinicalReadService } from '../../clinical/services/clinical-read.service';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { assertBodyTenantMatches } from './clinical-ext-access';
import {
  CreateOrderSetDto,
  ApplyOrderSetDto,
  OrderSetResponseDto,
  ApplyOrderSetResponseDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';
import { CLIN } from '../../clinical/clinical.concepts';

/**
 * Plantillas de órdenes (order sets): creación de la plantilla con sus ítems y
 * aplicación con fan-out (UC-18-06). La aplicación deriva una orden por ítem
 * seleccionado y persiste, en la misma transacción, una `clinical.service_requests`
 * por ítem, enlazada al paciente/encuentro del DTO. Devuelve los ids creados.
 */
@Injectable()
export class OrderSetsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param orderSetsRepo - Valor de order sets repo requerido por la operación.
   * @param serviceRequestsRepo - Valor de service requests repo requerido por la operación.
   * @param encountersRepo - Encuentros clínicos: prueba que el encuentro es del paciente.
   * @param clinicalRead - Política de acceso a la historia del paciente.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly orderSetsRepo: OrderSetsRepository,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrderSetsService.name);
  }

  /** Crea una plantilla de órdenes con sus ítems (precondición de UC-18-06). */
  async create(
    dto: CreateOrderSetDto,
    actor: AuthenticatedUser,
  ): Promise<OrderSetResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.order_set.create', code: dto.code },
      'Creating order set',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.orderSetsRepo.findByCode(tx, dto.code);
      if (clash)
        throw new ConflictException('El código de order set ya existe', {
          code: dto.code,
        });

      const orderSet = this.orderSetsRepo.create(tx, {
        tenantId: dto.tenantId,
        specialtyConceptId: dto.specialtyConceptId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        version: 1,
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el padre antes de los ítems.
      await tx.flush();

      const items = dto.items.map((item, idx) =>
        this.orderSetsRepo.createItem(tx, {
          orderSetId: orderSet.id,
          itemTypeConceptId:
            item.itemTypeConceptId ?? CEXT.ORDER_ITEM_TYPE_SERVICE,
          codeConceptId: item.codeConceptId,
          defaultDoseText: item.defaultDoseText,
          defaultFrequencyText: item.defaultFrequencyText,
          isSelectedDefault: item.isSelectedDefault ?? true,
          ordinal: item.ordinal ?? idx,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      return {
        id: orderSet.id,
        code: orderSet.code,
        version: orderSet.version,
        itemCount: items.length,
        statusConceptId: orderSet.statusConceptId,
      };
    });
  }

  /**
   * UC-18-06: aplica el order set (fan-out de órdenes por ítem seleccionado).
   *
   * Antes de leer ítems o crear órdenes exige base de escritura sobre la
   * historia del paciente y que el encuentro sea de ese paciente y del tenant
   * activo. El tenant custodio de las órdenes sale del encuentro autorizado:
   * el del cuerpo sólo se contrasta y el de la plantilla no decide.
   */
  async apply(
    orderSetId: string,
    dto: ApplyOrderSetDto,
    actor: AuthenticatedUser,
  ): Promise<ApplyOrderSetResponseDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.order_set.apply',
        orderSetId,
        actorId: actor.id,
      },
      'Applying order set',
    );
    const activeTenantId = requireTenantId();
    assertBodyTenantMatches(dto.custodianTenantId, activeTenantId);
    await this.clinicalRead.assertCanWriteHistory(dto.patientProfileId, actor);

    return this.em.transactional(async (tx) => {
      // Un encuentro inexistente, de otro paciente o de otro tenant responde
      // igual: distinguirlos confirmaría que ese id existe en otra historia.
      const encounter = await this.encountersRepo.findById(tx, dto.encounterId);
      if (
        !encounter ||
        encounter.patientProfileId !== dto.patientProfileId ||
        encounter.tenantId !== activeTenantId
      ) {
        throw new ResourceNotFoundException(
          'Encuentro no encontrado',
          undefined,
          ClinicalExtErrorReason.ENCOUNTER_NOT_FOUND,
        );
      }

      const orderSet = await this.orderSetsRepo.findById(tx, orderSetId);
      // La plantilla sin tenant es global; la de otro tenant no existe para el actor.
      if (
        !orderSet ||
        (orderSet.tenantId && orderSet.tenantId !== activeTenantId)
      ) {
        throw new ResourceNotFoundException(
          'Order set no encontrado',
          undefined,
          ClinicalExtErrorReason.ORDER_SET_NOT_FOUND,
        );
      }
      if (orderSet.statusConceptId !== CEXT.ORDER_SET_ACTIVE) {
        throw new PreconditionFailedException('El order set no está activo', {
          orderSetId,
        });
      }

      const items = await this.orderSetsRepo.itemsBySet(tx, orderSetId);
      const selected = dto.selectedItemIds?.length
        ? items.filter((i) => dto.selectedItemIds!.includes(i.id))
        : items.filter((i) => i.isSelectedDefault);

      if (selected.length === 0) {
        throw new PreconditionFailedException(
          'No hay ítems seleccionados para aplicar',
          {
            orderSetId,
          },
        );
      }

      // El service_request exige tenant custodio (NOT NULL): el del encuentro
      // ya autorizado, que es el tenant activo.
      const custodianTenantId = encounter.tenantId;

      // Fan-out real: una service_request por ítem seleccionado, dentro de la
      // misma transacción, enlazada al paciente/encuentro del DTO.
      const appliedOrders = selected.map((item) => {
        const serviceRequest = this.serviceRequestsRepo.create(tx, {
          custodianTenantId,
          patientProfileId: dto.patientProfileId,
          encounterId: dto.encounterId,
          codeConceptId: item.codeConceptId,
          intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
          statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
          actorUserId: actor.id,
        });
        return {
          serviceRequestId: serviceRequest.id,
          orderSetItemId: item.id,
          codeConceptId: item.codeConceptId,
          doseText: item.defaultDoseText,
          frequencyText: item.defaultFrequencyText,
        };
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical_ext.order_set.apply',
          orderSetId,
          created: appliedOrders.length,
        },
        'Order set applied',
      );

      return {
        orderSetId,
        appliedOrders,
        count: appliedOrders.length,
      };
    });
  }
}
