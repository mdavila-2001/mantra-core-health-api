import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { CareSpaceTemplateGuard } from '../support/care-space-template-guard';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import {
  ShiftSlotsDto,
  ShiftSlotsResponseDto,
} from '../../../presentation/dto';
import { SlotMoveNotifier } from '../support/slot-move-notifier';

/** Corre la agenda (adelanta o atrasa sus cupos libres). */
@Injectable()
export class ShiftSlotsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly moveNotifier: SlotMoveNotifier,
    private readonly logger: PinoLogger,
    private readonly careSpaces: CareSpaceTemplateGuard,
  ) {
    this.logger.setContext(ShiftSlotsUseCase.name);
  }

  async execute(
    resourceId: string,
    dto: ShiftSlotsDto,
    actor: AuthenticatedUser,
  ): Promise<ShiftSlotsResponseDto> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana termina antes de empezar',
        { from: dto.from, to: dto.to },
      );
    }
    if (dto.shiftMinutes === 0) {
      throw new PreconditionFailedException(
        'Mover cero minutos no cambia nada: elija cuánto correr la agenda',
        { shiftMinutes: 0 },
      );
    }

    this.logger.info(
      {
        operation: 'scheduling.slots.shift',
        resourceId,
        shiftMinutes: dto.shiftMinutes,
      },
      'Shifting slots',
    );

    const moved = await this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException('Recurso no encontrado', {
          resourceId,
        });
      }
      this.careSpaces.assertResourceInActiveTenant(resource);
      this.access.assertActorResource(resource, actor);
      // Correr los turnos de un consultorio es tocar el consultorio: la misma autoridad que para
      // editar su horario. Primero la del recurso atado a una sala, antes de leer nada.
      await this.careSpaces.assertMayManageBound(
        tx,
        resource,
        [resource.careSpaceId],
        actor,
      );

      const slots = await this.catalogRepo.findSlotsOfResourceForUpdate(
        tx,
        resourceId,
        from,
        to,
        dto.slotIds,
      );
      if (slots.length === 0) {
        return { ids: [] as string[], displaced: 0 };
      }
      // Y la de cada consultorio al que pertenecen los turnos afectados (el de su plantilla),
      // antes de mover ninguno.
      const templateIds = [
        ...new Set(
          slots
            .map((slot) => slot.scheduleTemplateId)
            .filter((id): id is string => !!id),
        ),
      ];
      const spaceIds: (string | null | undefined)[] = [];
      for (const templateId of templateIds) {
        const template = await this.catalogRepo.findTemplateById(
          tx,
          templateId,
        );
        spaceIds.push(template?.careSpaceId);
      }
      await this.careSpaces.assertMayManageBound(tx, resource, spaceIds, actor);

      const ms = dto.shiftMinutes * 60_000;
      for (const slot of slots) {
        slot.startAt = new Date(slot.startAt.getTime() + ms);
        if (slot.endAt !== undefined && slot.endAt !== null) {
          slot.endAt = new Date(slot.endAt.getTime() + ms);
        }
        touch(slot, actor.id);
      }

      // El `flush` explícito acá y no al cerrar: si el horario nuevo pisa otra
      // cita, queremos el `23P01` DENTRO de la transacción para que la reversión
      // sea de todos los cupos y no de algunos.
      await tx.flush();

      return { ids: slots.map((c) => c.id), displaced: slots.length };
    });

    const notified = await this.moveNotifier.notifyOfMove(
      moved.ids,
      dto.shiftMinutes,
    );

    return {
      movedSlots: moved.displaced,
      notified: notified,
      shiftMinutes: dto.shiftMinutes,
    };
  }
}
