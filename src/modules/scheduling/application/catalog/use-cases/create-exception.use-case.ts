import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  CreateExceptionDto,
  ExceptionResponseDto,
} from '../../../presentation/dto';
import {
  EXCEPTION_TYPE_CONCEPT,
  REASON_REQUIRING_TEXT,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** UC-41-04: registra una excepción de disponibilidad. */
@Injectable()
export class CreateExceptionUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateExceptionUseCase.name);
  }

  async execute(
    resourceId: string,
    dto: CreateExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    // «Otro» sin explicación no dice nada. Se comprueba en el servidor y no
    // sólo en el formulario: la regla es del catálogo, no de la pantalla.
    if (
      dto.exceptionType === REASON_REQUIRING_TEXT &&
      (dto.reason === undefined || dto.reason.trim() === '')
    ) {
      throw new PreconditionFailedException(
        'Eligió «Otro» como motivo: escriba cuál es',
        { resourceId, exceptionType: dto.exceptionType },
        SchedulingErrorReason.EXCEPTION_REASON_REQUIRED,
      );
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new PreconditionFailedException(
        'La excepción debe empezar antes de terminar',
        {
          resourceId,
        },
        SchedulingErrorReason.EXCEPTION_WINDOW_INVERTED,
      );
    }

    this.logger.info(
      {
        operation: 'scheduling.exception.create',
        resourceId,
        type: dto.exceptionType,
      },
      'Registering availability exception',
    );

    return this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException(
          'Recurso no encontrado',
          {
            resourceId,
          },
          SchedulingErrorReason.RESOURCE_NOT_FOUND,
        );
      }

      const isAvailable = dto.isAvailable ?? false;

      // AG-3: el tiempo ocupado no desplaza pacientes en silencio. Si el rango
      // pisa una cita CONFIRMADA del profesional —en esta sede o en otra—, el
      // doctor recibe el conflicto y decide: reprograma a la persona o elige
      // otro rato. Lo pendiente no bloquea la creación: nunca va a poder
      // aceptarse encima (la regla madre lo rechaza), que es la misma
      // protección sin congelar el calendario por preguntas sin responder.
      // Una reunión que pisa OTRA reunión es inofensiva y no se valida.
      if (
        !isAvailable &&
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
      ) {
        const confirmed = await this.professionalTime.confirmedBookings(
          tx,
          resource.resourceRefId,
          startAt,
          endAt,
        );
        if (confirmed.length > 0) {
          const first = confirmed[0];
          throw new PreconditionFailedException(
            `Tiene una cita confirmada en ese rato${
              first.resourceName ? ` en «${first.resourceName}»` : ''
            }. Reprográmela primero o elija otro horario.`,
            {
              bookingId: first.id,
              startAt: first.startAt,
              endAt: first.endAt,
            },
            SchedulingErrorReason.PRACTITIONER_HAS_CONFIRMED_APPOINTMENT,
          );
        }
      }

      const exception = this.catalogRepo.createException(tx, {
        resourceId,
        exceptionTypeConceptId: EXCEPTION_TYPE_CONCEPT[dto.exceptionType],
        startAt,
        endAt,
        reason: dto.reason,
        isAvailable,
        actorUserId: actor.id,
      });

      let blockedSlots = 0;
      if (!isAvailable) {
        const overlapping = await this.catalogRepo.findOpenSlotsInWindow(
          tx,
          resourceId,
          startAt,
          endAt,
        );
        for (const slot of overlapping) {
          const untouched = slot.remainingCapacity === slot.capacity;
          if (slot.statusConceptId === CONCEPTS.SLOT_OPEN && untouched) {
            slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
            touch(slot, actor.id);
            blockedSlots += 1;
          }
        }
      }

      return { id: exception.id, blockedSlots };
    });
  }
}
