import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SchedulingCatalogRepository } from '../repositories';
import {
  CreateResourceDto,
  ResourceResponseDto,
  CreateBookingPolicyDto,
  BookingPolicyResponseDto,
  CreateTemplateDto,
  TemplateResponseDto,
  GenerateSlotsDto,
  GenerateSlotsResponseDto,
  CreateExceptionDto,
  ExceptionResponseDto,
  ResourceAgendaResponseDto,
  type ResourceType,
  type ExceptionType,
} from '../dto';

const RESOURCE_TYPE_CONCEPT: Readonly<Record<ResourceType, string>> = {
  PRACTITIONER: CONCEPTS.RESOURCE_PRACTITIONER,
  ROOM: CONCEPTS.RESOURCE_ROOM,
  EQUIPMENT: CONCEPTS.RESOURCE_EQUIPMENT,
};

const EXCEPTION_TYPE_CONCEPT: Readonly<Record<ExceptionType, string>> = {
  ABSENCE: CONCEPTS.EXCEPTION_ABSENCE,
  HOLIDAY: CONCEPTS.EXCEPTION_HOLIDAY,
  EXTRA: CONCEPTS.EXCEPTION_EXTRA,
};

const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_SLOT_CAPACITY = 1;
/** Tope de slots por ejecución: evita que una ventana enorme genere un lote inmanejable. */
const MAX_SLOTS_PER_RUN = 2000;

/**
 * Configuración de agenda: recursos, políticas, plantillas, generación de slots y
 * excepciones de disponibilidad (UC-41-01/02/03/04).
 */
@Injectable()
export class SchedulingCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingCatalogService.name);
  }

  /** UC-41-01: da de alta un recurso agendable. */
  async createResource(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    this.logger.info(
      { operation: 'scheduling.resource.create', tenantId: dto.tenantId },
      'Creating schedulable resource',
    );

    return this.em.transactional(async (tx) => {
      const resource = this.catalogRepo.createResource(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        resourceTypeConceptId: RESOURCE_TYPE_CONCEPT[dto.resourceType],
        resourceRefType: canonicalRefType(dto.resourceRefType),
        resourceRefId: dto.resourceRefId,
        name: dto.name,
        timeZone: dto.timeZone,
        capacity: dto.capacity ?? DEFAULT_SLOT_CAPACITY,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: resource.id,
        name: dto.name,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /** UC-41-01: define la política de reserva que gobierna holds y cancelaciones. */
  async createPolicy(
    dto: CreateBookingPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<BookingPolicyResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.policy.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating booking policy',
    );

    const duplicate = await this.catalogRepo.findPolicyByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe una política con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }

    return this.em.transactional(async (tx) => {
      const policy = this.catalogRepo.createPolicy(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        minNoticeMinutes: dto.minNoticeMinutes,
        maxAdvanceDays: dto.maxAdvanceDays,
        cancellationWindowMinutes: dto.cancellationWindowMinutes,
        noShowFeeAmount: dto.noShowFeeAmount,
        currencyConceptId: dto.noShowFeeAmount
          ? CONCEPTS.CURRENCY_BOB
          : undefined,
        maxActivePerPatient: dto.maxActivePerPatient,
        holdTtlSeconds: dto.holdTtlSeconds,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: policy.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /** UC-41-02: publica la plantilla con sus franjas semanales. */
  async createTemplate(
    resourceId: string,
    dto: CreateTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<TemplateResponseDto> {
    this.logger.info(
      { operation: 'scheduling.template.create', resourceId },
      'Publishing schedule template',
    );

    for (const rule of dto.rules) {
      if (rule.startTime >= rule.endTime) {
        throw new PreconditionFailedException(
          'La franja debe empezar antes de terminar',
          {
            dayOfWeek: rule.dayOfWeek,
          },
        );
      }
    }

    return this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException('Recurso no encontrado', {
          resourceId,
        });
      }

      const template = this.catalogRepo.createTemplate(tx, {
        resourceId,
        name: dto.name,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        slotMinutes: dto.slotMinutes ?? DEFAULT_SLOT_MINUTES,
        bookingPolicyId: dto.bookingPolicyId,
        statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
        actorUserId: actor.id,
      });
      // FK planas: persistir la plantilla ANTES de crear las franjas que la
      // referencian. `schedule_template_id` es una columna uuid suelta y no una
      // relación declarada, así que la unidad de trabajo no conoce la
      // dependencia y ordena los inserts por el orden en que descubrió las
      // entidades —donde `ScheduleRules` va antes que `ScheduleTemplates`—,
      // insertando las franjas primero y violando la FK.
      //
      // No es teórico: `POST /scheduling/resources/:id/templates` respondía 500
      // a toda petición, de modo que no se podía publicar una agenda ni, por
      // tanto, generar slots ni reservar. Cubierto por
      // `test/integration/frontend-read-flows.int-spec.ts`.
      await tx.flush();

      for (const rule of dto.rules) {
        this.catalogRepo.createRule(tx, {
          scheduleTemplateId: template.id,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          slotMinutes:
            rule.slotMinutes ?? dto.slotMinutes ?? DEFAULT_SLOT_MINUTES,
          capacityPerSlot: rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY,
          actorUserId: actor.id,
        });
      }

      return {
        id: template.id,
        name: dto.name,
        ruleCount: dto.rules.length,
        statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
      };
    });
  }

  /**
   * UC-41-03: materializa los slots de la plantilla en una ventana.
   *
   * Es idempotente: los slots que ya existen para el mismo instante se cuentan como
   * `skipped` en vez de duplicarse, de modo que el worker puede reejecutarse sin
   * ensuciar la agenda.
   */
  async generateSlots(
    templateId: string,
    dto: GenerateSlotsDto,
    actor: AuthenticatedUser,
  ): Promise<GenerateSlotsResponseDto> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        {
          from: dto.from,
          to: dto.to,
        },
      );
    }

    this.logger.info(
      {
        operation: 'scheduling.slots.generate',
        templateId,
        from: dto.from,
        to: dto.to,
      },
      'Generating bookable slots',
    );

    return this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException('Plantilla no encontrada', {
          templateId,
        });
      }

      const rules = await this.catalogRepo.findRulesByTemplate(tx, templateId);
      const existing = await this.catalogRepo.findSlotsByTemplateInRange(
        tx,
        templateId,
        from,
        to,
      );
      const existingStarts = new Set(
        existing.map((slot) => slot.startAt.getTime()),
      );

      let created = 0;
      let skipped = 0;

      for (const rule of rules) {
        const slotMinutes =
          rule.slotMinutes ?? template.slotMinutes ?? DEFAULT_SLOT_MINUTES;
        const capacity = rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY;

        for (const day of this.daysMatching(from, to, rule.dayOfWeek)) {
          const dayStart = this.atTime(day, rule.startTime);
          const dayEnd = this.atTime(day, rule.endTime);

          for (
            let cursor = dayStart;
            cursor < dayEnd;
            cursor = new Date(cursor.getTime() + slotMinutes * 60_000)
          ) {
            const end = new Date(cursor.getTime() + slotMinutes * 60_000);
            if (end > dayEnd) break;

            if (existingStarts.has(cursor.getTime())) {
              skipped += 1;
              continue;
            }
            if (created >= MAX_SLOTS_PER_RUN) {
              this.logger.warn(
                { operation: 'scheduling.slots.generate', templateId, created },
                'Slot generation hit the per-run cap; narrow the window and re-run',
              );
              return { templateId, created, skipped };
            }

            this.catalogRepo.createSlot(tx, {
              resourceId: template.resourceId,
              scheduleTemplateId: templateId,
              startAt: cursor,
              endAt: end,
              capacity,
              remainingCapacity: capacity,
              statusConceptId: CONCEPTS.SLOT_OPEN,
              actorUserId: actor.id,
            });
            existingStarts.add(cursor.getTime());
            created += 1;
          }
        }
      }

      return { templateId, created, skipped };
    });
  }

  /**
   * UC-41-04: registra una excepción de disponibilidad.
   *
   * Cuando la excepción retira disponibilidad, los slots libres que se solapan pasan
   * a `blocked`. Los que ya tienen reservas **no se tocan**: cancelar citas ya
   * confirmadas es una decisión clínica, no un efecto colateral de marcar una ausencia.
   */
  async createException(
    resourceId: string,
    dto: CreateExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new PreconditionFailedException(
        'La excepción debe empezar antes de terminar',
        {
          resourceId,
        },
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
        throw new ResourceNotFoundException('Recurso no encontrado', {
          resourceId,
        });
      }

      const isAvailable = dto.isAvailable ?? false;
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

  /**
   * UC-41-14: agenda publicada de un recurso en una ventana de tiempo.
   *
   * Es la lectura que le faltaba al módulo. Los slots se generaban con
   * `POST /scheduling/templates/:id/generate-slots` pero no había forma de
   * listarlos, así que el `slotId` que exige `POST /scheduling/slots/:id/holds`
   * sólo se podía obtener mirando la base: una agenda que no se puede leer no
   * se puede reservar desde ninguna pantalla.
   *
   * @param resourceId - Recurso cuya agenda se consulta.
   * @param options - Ventana, si se limita a lo disponible y tope de filas.
   * @returns Slots de la ventana, ordenados cronológicamente.
   * @throws ResourceNotFoundException si el recurso no existe.
   * @throws PreconditionFailedException si la ventana no empieza antes de terminar.
   */
  async getResourceAgenda(
    resourceId: string,
    options: {
      /** Inicio de la ventana (inclusive). */
      from: Date;
      /** Fin de la ventana (exclusive). */
      to: Date;
      /** Sólo los slots con cupo libre. */
      onlyAvailable: boolean;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<ResourceAgendaResponseDto> {
    if (!(options.from < options.to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: options.from.toISOString(), to: options.to.toISOString() },
      );
    }

    const em = this.em.fork();
    // Un recurso inexistente devuelve 404 y no una agenda vacía: son cosas
    // distintas y el cliente tiene que poder distinguirlas —"este médico no
    // existe" no es "este médico no tiene huecos".
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId,
      });
    }

    // Se pide una fila de más sólo para poder declarar el recorte.
    const rows = await this.catalogRepo.findSlotsByResourceInRange(
      em,
      resourceId,
      options.from,
      options.to,
      { onlyAvailable: options.onlyAvailable, limit: options.limit + 1 },
    );
    const truncated = rows.length > options.limit;
    const page = truncated ? rows.slice(0, options.limit) : rows;

    return {
      resourceId,
      from: options.from,
      to: options.to,
      items: page.map((slot) => ({
        id: slot.id,
        resourceId: slot.resourceId,
        scheduleTemplateId: slot.scheduleTemplateId,
        serviceConceptId: slot.serviceConceptId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        capacity: slot.capacity,
        remainingCapacity: slot.remainingCapacity,
        available: slot.remainingCapacity > 0,
        statusConceptId: slot.statusConceptId,
      })),
      count: page.length,
      limit: options.limit,
      truncated,
    };
  }

  /** Días del rango que caen en el día de la semana de la regla. */
  private daysMatching(from: Date, to: Date, dayOfWeek: number): Date[] {
    const days: Date[] = [];
    const cursor = new Date(from);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor < to) {
      if (cursor.getUTCDay() === dayOfWeek) days.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }

  /** Combina el día con la hora `HH:MM[:SS]` de la franja, en UTC. */
  private atTime(day: Date, time: string): Date {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const result = new Date(day);
    result.setUTCHours(hours, minutes, seconds ?? 0, 0);
    return result;
  }
}

/**
 * Alias conocidos de una misma tabla, colapsados a su nombre real.
 *
 * `resourceRefType` es texto libre —el recurso puede apuntar a un profesional, a
 * una sala o a un equipo, y esas tablas viven en módulos distintos— así que
 * nada impedía que dos clientes escribieran dos nombres para lo mismo. Y pasó:
 * el ejemplo del contrato dice `health_practitioner_profiles` —el nombre real de
 * la tabla— y los recursos sembrados traían `practitioner_profiles`.
 *
 * La consecuencia no era cosmética. Quien cruza el recurso con un perfil
 * profesional —el portal, para saber cuál agenda es la del médico que entró; la
 * confirmación de una reserva, para poner el profesional en la cita clínica—
 * tiene que comparar **tabla e identificador**, y con dos nombres en circulación
 * la mitad de los recursos no coincidía con ninguno.
 *
 * Se normaliza al escribir en vez de tolerar al leer, que es donde el arreglo
 * dura: lo que entra queda canónico y los consumidores nuevos no heredan la
 * ambigüedad. Las filas anteriores se siguen tolerando en lectura hasta que se
 * regeneren los seeds.
 */
const ALIAS_DE_TABLA: Readonly<Record<string, string>> = {
  practitioner_profiles: 'health_practitioner_profiles',
};

function canonicalRefType(refType: string): string {
  return ALIAS_DE_TABLA[refType] ?? refType;
}
