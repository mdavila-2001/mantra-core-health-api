import { ForbiddenException, Injectable } from '@nestjs/common';
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
import { PractitionerAffiliationGateService } from './practitioner-affiliation-gate.service';
import { SchedulingProfessionalTimeService } from './scheduling-professional-time.service';
import type { SchedulableResources } from '../entities';
import {
  CreateResourceDto,
  ResourceResponseDto,
  CreateBookingPolicyDto,
  BookingPolicyResponseDto,
  CreateTemplateDto,
  AvailabilityExceptionListDto,
  RetireTemplateResponseDto,
  TemplateListDto,
  TemplateResponseDto,
  TemplateRuleDto,
  GenerateSlotsDto,
  GenerateSlotsResponseDto,
  CreateExceptionDto,
  ExceptionResponseDto,
  ExceptionTypeListDto,
  EXCEPTION_TYPES,
  ResourceAgendaResponseDto,
  type ResourceType,
  type ExceptionType,
} from '../dto';
import { diasLocalesQueCoinciden, horaLocalAUtc } from '../scheduling-time';
import type { DiaLocal } from '../scheduling-time';

/**
 * Roles que administran el catálogo de agendas de terceros por oficio.
 *
 * Un `PRACTITIONER` NO está acá a propósito: puede publicar y operar **su
 * propia** agenda —eso decide `esSuPerfil`—, nunca la de otro. Antes ni eso:
 * toda la cadena exigía `SCHEDULING_ADMIN`, así que un profesional recién
 * registrado no tenía forma de volverse reservable — el asistente de alta de
 * agenda moría con 403 en el primer paso, y la única vía era pedirle a un
 * administrador que corriera las cuatro llamadas a mano (o el seeder de demo,
 * que es exactamente lo que hacía que "solo aparezcan los doctores de prueba").
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín: excluirlo
 * acá le negaría en el servicio lo que el guard ya le concedió — mismo criterio
 * que `ROLES_DE_AGENDA` en `scheduling-bookings.service.ts`. Sin él, el admin
 * de arranque (sin perfil profesional en el token) caía al camino de
 * autoservicio, que exige `hpid`, y recibía 403 en toda la cadena
 * recurso → políticas → plantillas → cupos.
 */
const ROLES_QUE_ADMINISTRAN_CATALOGO: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SUPERADMIN',
];

/**
 * Mismas dos formas que acepta `scheduling-bookings.service.ts`: la tabla real
 * y el alias con el que llegaron los recursos sembrados.
 */
const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

const RESOURCE_TYPE_CONCEPT: Readonly<Record<ResourceType, string>> = {
  PRACTITIONER: CONCEPTS.RESOURCE_PRACTITIONER,
  ROOM: CONCEPTS.RESOURCE_ROOM,
  EQUIPMENT: CONCEPTS.RESOURCE_EQUIPMENT,
};

const EXCEPTION_TYPE_CONCEPT: Readonly<Record<ExceptionType, string>> = {
  ABSENCE: CONCEPTS.EXCEPTION_ABSENCE,
  HOLIDAY: CONCEPTS.EXCEPTION_HOLIDAY,
  EXTRA: CONCEPTS.EXCEPTION_EXTRA,
  VACATION: CONCEPTS.EXCEPTION_VACATION,
  CONFERENCE: CONCEPTS.EXCEPTION_CONFERENCE,
  ERRAND: CONCEPTS.EXCEPTION_ERRAND,
  OTHER: CONCEPTS.EXCEPTION_OTHER,
};

/**
 * Cómo se llama cada motivo en pantalla.
 *
 * En castellano porque es prosa que ve el usuario, y acá y no en el front
 * porque el catálogo es del servidor: una lista que crece no puede exigir un
 * despliegue del front para mostrarse.
 */
const EXCEPTION_TYPE_LABEL: Readonly<Record<ExceptionType, string>> = {
  ABSENCE: 'Ausencia',
  HOLIDAY: 'Feriado',
  VACATION: 'Vacaciones',
  CONFERENCE: 'Congreso o capacitación',
  ERRAND: 'Trámite personal',
  EXTRA: 'Atención extraordinaria',
  OTHER: 'Otro',
};

/**
 * El motivo que exige explicación.
 *
 * «Otro» sin texto no dice nada: es la única opción de la lista que no se
 * explica sola, y dejarla pasar vacía convertiría el catálogo en una casilla
 * de escape silenciosa.
 */
const MOTIVO_QUE_EXIGE_TEXTO: ExceptionType = 'OTHER';

const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_SLOT_CAPACITY = 1;

/**
 * Estados en los que una cita todavía compromete al profesional.
 *
 * Los mismos dos que usa `SchedulingBookingsService` y que ahora hace cumplir
 * la restricción `ex_appointments_practitioner_time` en la base. Una solicitud
 * pendiente no entra: nadie se comprometió todavía.
 */
const ACTIVE_BOOKING_STATES: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
];

/**
 * Cuántas citas comprometidas se nombran en el aviso de borrado.
 *
 * Un tope y no todas: el aviso existe para que el médico sepa qué resolver, y
 * una lista de doscientos ids no ayuda a nadie. El total viaja aparte, así que
 * la pantalla puede decir «y 190 más».
 */
const TOPE_DE_CITAS_EN_EL_AVISO = 10;
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
    private readonly vinculos: PractitionerAffiliationGateService,
    private readonly tiempoProfesional: SchedulingProfessionalTimeService,
  ) {
    this.logger.setContext(SchedulingCatalogService.name);
  }

  /** UC-41-01: da de alta un recurso agendable. */
  async createResource(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    this.assertPuedeCrearRecurso(dto, actor);
    await this.assertVinculoConLaOrganizacion(dto.tenantId, actor);
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

    this.assertTenantDelActor(dto.tenantId, actor);

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
      this.assertRecursoDelActor(resource, actor);
      await this.assertSinSolapeConSusOtrasAgendas(tx, resource, dto);

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
          // Sin `?? 0`: la columna es anulable a propósito y ausente se lee
          // como cero al generar. Escribir un cero que nadie declaró borraría
          // la diferencia entre «no lo dijeron» y «dijeron que no hay respiro».
          gapMinutes: rule.gapMinutes,
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
  /**
   * Retira un horario publicado — **avisando primero si tiene gente citada**.
   *
   * ## Por qué no borra y avisa después
   *
   * El propietario pidió «borrar definitivamente», y definitivamente no se
   * deshace. Una plantilla con pacientes citados no es una fila: son personas
   * que van a presentarse un día a una hora. Borrarla en silencio las deja sin
   * turno **y sin enterarse**, porque el borrado de la plantilla no dispara
   * ningún aviso de cancelación — cancelar es otra operación, con su motivo
   * obligatorio y su aviso a la contraparte.
   *
   * Así que si hay compromisos vivos esto **no borra**: responde 409 con la
   * lista de citas que hay que resolver primero. El médico va, las cancela o
   * las mueve —con motivo, avisando, como corresponde— y recién entonces el
   * horario se puede borrar.
   *
   * ## Cancelar no libera el horario
   *
   * Esto frena con **cualquier** cita, viva o histórica, y la distinción está
   * en el mensaje, no en la decisión. El motivo es de esquema:
   * `appointment_bookings.bookable_slot_id` es `NOT NULL`, así que una cita
   * cancelada **fija su cupo para siempre**. Borrar ese cupo sería borrar el
   * registro de que esa persona tuvo un turno.
   *
   * Por eso el techo es real y no se puede esquivar cancelando todo primero.
   * Un horario que ya tuvo pacientes no se borra: se retira. Esa otra salida
   * —borrado lógico por estado— es P-10-2 y sigue sin decidir.
   *
   * ## Retira, no borra — y no es una preferencia
   *
   * `audit.schedule_templates_history` referencia toda plantilla publicada, con
   * una fila escrita al publicar. **Ninguna plantilla publicada se puede borrar
   * nunca.** Se descubrió ejecutándolo contra la base, no leyéndolo, y es lo
   * que cierra P-10-2: de las tres salidas posibles el esquema ya había
   * elegido, y es el retiro lógico.
   *
   * Lo que sí se suelta son los cupos que **nadie tocó**: derivados puros, que
   * dejarlos publicados seguiría ofreciendo turnos de una agenda retirada. Los
   * cupos con historia se quedan, aunque su cita esté cancelada.
   *
   * @param templateId - Plantilla a borrar.
   * @param actor - Quién lo pide; tiene que ser su agenda o administrarla.
   * @returns Qué se borró, con el tamaño de lo que arrastró.
   */
  async retireTemplate(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<RetireTemplateResponseDto> {
    this.logger.info(
      { operation: 'scheduling.template.retire', templateId },
      'Retiring schedule template',
    );

    return this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException('Plantilla no encontrada', {
          templateId,
        });
      }

      const resource = await this.catalogRepo.findResourceById(
        tx,
        template.resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException(
          'Recurso de la plantilla no encontrado',
          {
            resourceId: template.resourceId,
          },
        );
      }
      this.assertRecursoDelActor(resource, actor);

      const citas = await this.catalogRepo.findBookingsOfTemplate(
        tx,
        templateId,
        ACTIVE_BOOKING_STATES,
        TOPE_DE_CITAS_EN_EL_AVISO,
      );

      // Sólo las VIVAS frenan. El historial ya no es un obstáculo: retirar no
      // lo toca, y ése era el motivo por el que el borrado duro estaba
      // condenado. Una cita cancelada de marzo no puede impedir que el médico
      // deje de publicar su horario en septiembre.
      if (citas.live > 0) {
        throw new ConflictException(
          'El horario tiene citas comprometidas: resolvelas antes de retirarlo',
          {
            templateId,
            // Las dos cifras, porque son dos situaciones distintas: las vivas
            // se resuelven cancelando o moviendo; las históricas no se
            // resuelven con nada.
            liveBookings: citas.live,
            totalBookings: citas.total,
            // Los ids y no los nombres: quien recibe esto es la pantalla, que
            // ya sabe pedir cada cita con su permiso. Mandar nombres acá
            // filtraría pacientes a cualquiera que administre agendas.
            bookingIds: citas.sample.map((booking) => booking.id),
            truncated: citas.total > citas.sample.length,
          },
        );
      }

      const retiro = await this.catalogRepo.retireTemplate(
        tx,
        templateId,
        CONCEPTS.TEMPLATE_RETIRED,
        actor.id,
      );

      return {
        id: templateId,
        statusConceptId: CONCEPTS.TEMPLATE_RETIRED,
        releasedSlots: retiro.releasedSlots,
        keptSlots: retiro.keptSlots,
      };
    });
  }

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

      // La zona de la sede, que es en la que están escritas las reglas. Sin
      // recurso —o sin zona declarada— se cae a UTC, que es exactamente lo que
      // hacía antes: así una agenda sin zona no cambia de comportamiento.
      const resource = await this.catalogRepo.findResourceById(
        tx,
        template.resourceId,
      );
      const zona = resource?.timeZone ?? 'UTC';
      if (resource) this.assertRecursoDelActor(resource, actor);

      // REGLA MADRE (AG-1): los cupos que caerían sobre un compromiso del
      // profesional no se generan. Se cargan UNA vez para toda la ventana —
      // consultar por cupo sería un viaje a la base por cada media hora—.
      const compromisos =
        resource &&
        TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)
          ? await this.tiempoProfesional.compromisos(
              tx,
              resource.resourceRefId,
              from,
              to,
            )
          : [];

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
      let omittedByCommitments = 0;

      for (const rule of rules) {
        const slotMinutes =
          rule.slotMinutes ?? template.slotMinutes ?? DEFAULT_SLOT_MINUTES;
        const capacity = rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY;
        // El respiro entre consultas. Ausente ≡ 0: la columna es anulable y
        // nadie está obligado a declararlo.
        //
        // El PASO del generador es `slot + gap`; la DURACIÓN de cada turno
        // sigue siendo `slot`. Confundirlos alargaría la consulta en vez de
        // separarla de la siguiente, que es justo lo contrario de lo que el
        // respiro existe para hacer.
        const gapMinutes = rule.gapMinutes ?? 0;
        const pasoMinutes = slotMinutes + gapMinutes;

        for (const day of diasLocalesQueCoinciden(
          from,
          to,
          rule.dayOfWeek,
          zona,
        )) {
          const dayStart = horaLocalAUtc(day, rule.startTime, zona);
          const dayEnd = horaLocalAUtc(day, rule.endTime, zona);

          for (
            let cursor = dayStart;
            cursor < dayEnd;
            cursor = new Date(cursor.getTime() + pasoMinutes * 60_000)
          ) {
            const end = new Date(cursor.getTime() + slotMinutes * 60_000);
            if (end > dayEnd) break;
            // El barrido de días locales se ensancha un día por lado, porque un
            // día de la sede puede empezar antes de `from` o terminar después de
            // `to`. Acá se recorta a lo que se pidió: sin esto, una ventana de
            // un día en una zona al oeste de UTC materializaría cupos del día
            // anterior.
            if (cursor < from || end > to) continue;

            if (existingStarts.has(cursor.getTime())) {
              skipped += 1;
              continue;
            }
            // El cupo que pisa un compromiso se SALTEA, no aborta la corrida:
            // la cirugía del jueves no puede impedir generar el resto del mes.
            if (
              compromisos.some(
                (compromiso: { startAt: Date; endAt: Date }) =>
                  compromiso.startAt < end && compromiso.endAt > cursor,
              )
            ) {
              omittedByCommitments += 1;
              continue;
            }
            if (created >= MAX_SLOTS_PER_RUN) {
              this.logger.warn(
                { operation: 'scheduling.slots.generate', templateId, created },
                'Slot generation hit the per-run cap; narrow the window and re-run',
              );
              return { templateId, created, skipped, omittedByCommitments };
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

      return { templateId, created, skipped, omittedByCommitments };
    });
  }

  /**
   * UC-41-04: registra una excepción de disponibilidad.
   *
   * Cuando la excepción retira disponibilidad, los slots libres que se solapan pasan
   * a `blocked`. Los que ya tienen reservas **no se tocan**: cancelar citas ya
   * confirmadas es una decisión clínica, no un efecto colateral de marcar una ausencia.
   */
  /**
   * Los motivos de bloqueo que la pantalla puede ofrecer.
   *
   * Existe porque el catálogo estaba en la base y **no lo publicaba nadie**: la
   * columna `exception_type_concept_id` es obligatoria y el formulario no tenía
   * de dónde sacar las opciones, así que en la práctica todo bloqueo nacía con
   * el mismo valor.
   *
   * Devuelve la etiqueta ya en castellano y el `conceptId` real, para que el
   * front no tenga que mapear códigos ni mantener su propia copia de la lista.
   * Cuando el catálogo crezca, la pantalla se entera sola.
   *
   * `requiresText` es la única regla que viaja con el catálogo: es lo que
   * permite al formulario pedir la explicación en el momento, sin conocer de
   * antemano cuál de los motivos la exige.
   */
  listExceptionTypes(): ExceptionTypeListDto {
    return {
      items: EXCEPTION_TYPES.map((type) => ({
        type,
        conceptId: EXCEPTION_TYPE_CONCEPT[type],
        label: EXCEPTION_TYPE_LABEL[type],
        requiresText: type === MOTIVO_QUE_EXIGE_TEXTO,
        // `EXTRA` no bloquea: abre disponibilidad fuera del patrón. Viaja en la
        // misma lista porque es una excepción más, pero la pantalla necesita
        // distinguirlo para no ofrecerlo donde se espera un bloqueo.
        blocks: type !== 'EXTRA',
      })),
    };
  }

  async createException(
    resourceId: string,
    dto: CreateExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    // «Otro» sin explicación no dice nada. Se comprueba en el servidor y no
    // sólo en el formulario: la regla es del catálogo, no de la pantalla.
    if (
      dto.exceptionType === MOTIVO_QUE_EXIGE_TEXTO &&
      (dto.reason === undefined || dto.reason.trim() === '')
    ) {
      throw new PreconditionFailedException(
        'Elegiste «Otro» como motivo: escribí cuál es',
        { resourceId, exceptionType: dto.exceptionType },
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

      // AG-3: el tiempo ocupado no desplaza pacientes en silencio. Si el rango
      // pisa una cita CONFIRMADA del profesional —en esta sede o en otra—, el
      // doctor recibe el conflicto y decide: reprograma a la persona o elige
      // otro rato. Lo pendiente no bloquea la creación: nunca va a poder
      // aceptarse encima (la regla madre lo rechaza), que es la misma
      // protección sin congelar el calendario por preguntas sin responder.
      // Una reunión que pisa OTRA reunión es inofensiva y no se valida.
      if (
        !isAvailable &&
        TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)
      ) {
        const confirmadas = await this.tiempoProfesional.citasConfirmadas(
          tx,
          resource.resourceRefId,
          startAt,
          endAt,
        );
        if (confirmadas.length > 0) {
          const primera = confirmadas[0];
          throw new PreconditionFailedException(
            `Tenés una cita confirmada en ese rato${
              primera.resourceName ? ` en «${primera.resourceName}»` : ''
            }. Reprogramala primero o elegí otro horario.`,
            {
              bookingId: primera.id,
              startAt: primera.startAt,
              endAt: primera.endAt,
            },
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
      {
        onlyAvailable: options.onlyAvailable,
        ahora: new Date(),
        limit: options.limit + 1,
        // Lo que se ofrece tiene que poder pedirse: un cupo bloqueado por una
        // excepción (AG-3) o retirado por una cita puntual (AG-2) conserva su
        // capacidad, así que el filtro de capacidad no lo ve y se colaba entre
        // los disponibles. El concepto lo aporta el servicio, como en la ruta
        // hermana del portal.
        openStatusConceptId: CONCEPTS.SLOT_OPEN,
      },
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
  /** Si el actor administra agendas ajenas por oficio. */
  private esAdministradorDeCatalogo(actor: AuthenticatedUser): boolean {
    return actor.roles.some((rol) =>
      ROLES_QUE_ADMINISTRAN_CATALOGO.includes(rol),
    );
  }

  /**
   * Autoriza el alta de un recurso: administradores, cualquiera; un profesional,
   * solo el suyo.
   *
   * Las cuatro condiciones del camino de autoservicio son deliberadas: el tipo
   * tiene que ser `PRACTITIONER` (un profesional no da de alta salas ni
   * equipos), la referencia tiene que apuntar a un perfil profesional, ese
   * perfil tiene que ser el del token (`hpid` — identificación, no permiso), y
   * el tenant tiene que ser uno de los suyos, porque `GET /scheduling/resources`
   * filtra por tenant y un recurso creado en otro sería invisible para siempre.
   */
  /**
   * Rechaza publicar una franja que choca con otra agenda del mismo profesional.
   *
   * ## Por qué el choque importa
   *
   * Un médico con dos consultorios puede declarar «lunes 9 a 12» en los dos, y
   * el motor genera cupos simultáneos en ambos. No hay error visible hasta que
   * dos pacientes reservan la misma hora en lugares distintos y alguien tiene
   * que llamar a uno de los dos. El conflicto no es de datos: es que **una
   * persona no puede estar en dos lugares**.
   *
   * Se valida al publicar la plantilla y no al generar los cupos porque es el
   * momento en que la persona todavía está decidiendo su horario: rechazar
   * recién al materializar sería avisarle cuando ya lo dio por hecho.
   *
   * ## Por qué se comparan instantes y no textos
   *
   * Las franjas declaran horas de **pared** y cada sede puede estar en otra
   * zona, así que comparar «09:00» con «09:00» compara dos cosas distintas: a
   * las nueve de La Paz son las diez en São Paulo. Comparando textos no sólo
   * sobran rechazos —que se resuelven editando—, sino que **faltan**: La Paz
   * 13–15 y São Paulo 14–16 no se tocan como texto y son el mismo rato. Un
   * falso permiso termina en dos pacientes citados, que es justo lo que esta
   * comprobación existe para evitar.
   *
   * Las dos franjas se proyectan sobre una **semana de referencia** —la del
   * `validFrom` de la plantilla, o la de hoy— con los mismos helpers que usa la
   * generación de cupos, y se comparan como instantes. Es una simplificación
   * consciente: en las dos semanas del año en que una zona cambia de horario,
   * dos franjas al filo podrían evaluarse con el desplazamiento de la semana
   * equivocada. Recorrer todas las semanas de vigencia es mucho trabajo para un
   * borde de una hora.
   *
   * ## Qué NO comprueba
   *
   * Sólo recursos que apuntan al mismo `resource_ref_id`. Una sala o un equipo
   * no tienen este problema —dos salas sí pueden abrir a la misma hora— y por
   * eso la comprobación se saltea cuando el recurso no referencia un perfil
   * profesional.
   *
   * Tampoco las plantillas en borrador (todavía no ocupan horario) ni las
   * vencidas: una cuyo `validTo` ya pasó no puede chocar con nada que se
   * publique hoy, y hacerla chocar dejaría trabado a quien cambió de sede.
   */
  private async assertSinSolapeConSusOtrasAgendas(
    tx: EntityManager,
    resource: SchedulableResources,
    dto: CreateTemplateDto,
  ): Promise<void> {
    const semana = semanaDeReferencia(
      dto.validFrom ? new Date(dto.validFrom) : new Date(),
    );
    const zonaPropia = resource.timeZone ?? 'UTC';

    const nuevas = dto.rules.map((rule) => ({
      etiqueta: etiquetaDeFranja(rule),
      ...intervaloEnSemana(
        semana,
        rule.dayOfWeek,
        rule.startTime,
        rule.endTime,
        zonaPropia,
      ),
    }));

    // Primero contra sí mismas: dos franjas del mismo envío que se pisan son el
    // caso más frecuente, y detectarlo no cuesta una consulta.
    for (let i = 0; i < nuevas.length; i += 1) {
      for (let j = i + 1; j < nuevas.length; j += 1) {
        if (seSolapan(nuevas[i], nuevas[j])) {
          throw new PreconditionFailedException(
            'Dos franjas de esta agenda se solapan entre sí',
            { nueva: nuevas[i].etiqueta, existente: nuevas[j].etiqueta },
          );
        }
      }
    }

    if (!TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)) {
      return;
    }

    const ajenas = await this.catalogRepo.findRulesByResourceOwner(
      tx,
      resource.resourceRefId,
      CONCEPTS.TEMPLATE_PUBLISHED,
      resource.id,
    );

    for (const otra of ajenas) {
      if (estaVencida(otra.validTo, semana.inicio)) continue;

      const existente = {
        etiqueta: etiquetaDeFranja(otra.rule),
        ...intervaloEnSemana(
          semana,
          otra.rule.dayOfWeek,
          otra.rule.startTime,
          otra.rule.endTime,
          otra.timeZone ?? 'UTC',
        ),
      };

      const choque = nuevas.find((nueva) => seSolapan(nueva, existente));
      if (choque) {
        // El mensaje dice CUÁL agenda y CUÁNDO, no sólo que hay un choque.
        // Antes era «Ya tenés una agenda publicada que se superpone con esa
        // franja» y el detalle viajaba en `details`, que el traductor de
        // errores del front descarta: la persona leía que no podía publicar
        // y no tenía forma de saber contra qué. Con varias agendas por
        // médico en los datos sembrados, eso es un callejón sin salida.
        throw new PreconditionFailedException(
          `Ya tenés «${otra.resourceName}» el ${existente.etiqueta}, que se cruza con este ` +
            'horario. Cambiá el horario o el día, o editá esa otra agenda.',
          {
            dayOfWeek: otra.rule.dayOfWeek,
            nueva: choque.etiqueta,
            existente: existente.etiqueta,
            agenda: otra.resourceName,
          },
        );
      }
    }
  }

  private assertPuedeCrearRecurso(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): void {
    if (this.esAdministradorDeCatalogo(actor)) return;

    const esSuPerfil =
      dto.resourceType === 'PRACTITIONER' &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(
        canonicalRefType(dto.resourceRefType),
      ) &&
      actor.practitionerProfileId !== undefined &&
      dto.resourceRefId === actor.practitionerProfileId;
    if (!esSuPerfil) {
      throw new ForbiddenException(
        'Un profesional solo puede publicar su propia agenda: el recurso debe ' +
          'apuntar a su perfil profesional.',
      );
    }
    this.assertTenantDelActor(dto.tenantId, actor);
  }

  /**
   * Exige vínculo aprobado con la organización antes de publicar en ella.
   *
   * ## Qué regla implementa
   *
   * El registro de procesos describe al médico atendiendo en varios sitios —«los
   * hospitales públicos que está de turno» (MEDICO 3.1) y «las diferentes
   * clínicas privadas o centros que atiende» (3.2)—, y esto es lo que decide en
   * cuáles puede hacerlo: **pertenecer a la organización**, aprobado por ella.
   *
   * `assertPuedeCrearRecurso` ya comprueba dos cosas distintas de ésta: que la
   * agenda sea del propio perfil, y que el tenant esté entre los del token. Lo
   * segundo dice «tenés acceso a esa organización»; esto dice «esa organización
   * te aceptó como profesional suyo», que no es lo mismo: una secretaria
   * pertenece al tenant y no publica agenda médica en él.
   *
   * ## Por qué el vínculo a UNA sede habilita toda la organización
   *
   * La afiliación apunta a una sede (`practice_site_id`) y el recurso a un
   * tenant, así que hay que resolver `sede → práctica → tenant`. Un médico
   * vinculado a la sede Miraflores de un hospital queda habilitado para publicar
   * en ese hospital, no sólo en esa sede. Es lo que el modelo permite hoy sin
   * columnas nuevas, y es la lectura conservadora: la organización que aprobó al
   * profesional lo aprobó como suyo. Acotar por sede es una decisión posterior y
   * necesita que la aprobación diga a qué sede aplica.
   *
   * ## Por qué 422 y no 403
   *
   * Un 403 dice «no podés» y deja al médico sin saber qué hacer. Acá el camino
   * existe y es corto —pedir el vínculo—, así que el error lo nombra. Es la
   * misma decisión que el resto del módulo: `PreconditionFailedException` en
   * este proyecto responde **422**, no 412.
   *
   * @param tenantId - La organización donde se quiere publicar.
   * @param actor - Quien publica.
   */

  /**
   * Elimina un tiempo ocupado (o cualquier excepción) del calendario.
   *
   * ## Borrar NO resucita los cupos retirados
   *
   * Es la semántica menos sorprendente, y queda declarada: los cupos que la
   * excepción bloqueó siguen bloqueados, y se regeneran con la plantilla si
   * corresponde. Resucitarlos automáticamente ofrecería horarios que el doctor
   * quizá bloqueó por otro motivo mientras tanto.
   *
   * @param exceptionId - La excepción a eliminar.
   * @param actor - Quien la elimina; tiene que poder operar el recurso.
   */
  async removeException(
    exceptionId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const exception = await this.catalogRepo.findExceptionById(
        tx,
        exceptionId,
      );
      if (!exception) {
        throw new ResourceNotFoundException('Excepción no encontrada', {
          exceptionId,
        });
      }
      const resource = await this.catalogRepo.findResourceById(
        tx,
        exception.resourceId,
      );
      if (resource) this.assertRecursoDelActor(resource, actor);

      this.logger.info(
        { operation: 'scheduling.exception.remove', exceptionId },
        'Removing availability exception',
      );
      this.catalogRepo.removeException(tx, exception);
    });
  }

  private async assertVinculoConLaOrganizacion(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.esAdministradorDeCatalogo(actor)) return;

    const veredicto = await this.vinculos.evaluar(tenantId, actor);

    // `ausente` NO es una negativa: significa que nadie dijo nada sobre esta
    // organización. Quien llega hasta acá ya pasó el aislamiento de tenant, o
    // sea que la organización es suya — y la membresía ya lo autorizó.
    //
    // Tratarlo como negativa era un defecto con consecuencia visible: un médico
    // que declaraba trabajar en un hospital perdía la capacidad de publicar en
    // **su propio consultorio**, porque su único vínculo con sede apuntaba a
    // otra organización. Se encontró ejecutándolo, no leyéndolo.
    if (
      veredicto === 'sin-vinculos' ||
      veredicto === 'aprobado' ||
      veredicto === 'ausente'
    ) {
      return;
    }

    throw new PreconditionFailedException(
      veredicto === 'pendiente'
        ? 'Tu vínculo con esta organización todavía está pendiente de ' +
            'aprobación. Cuando la acepten vas a poder publicar tu agenda acá.'
        : 'Tu vínculo con esta organización no está vigente, así que no podés ' +
            'publicar agenda acá. Hablá con ellos para reactivarlo.',
      { tenantId, vinculo: veredicto },
    );
  }

  /**
   * Autoriza operar un recurso ya existente (plantillas, generación de cupos).
   *
   * Mismo criterio que `scheduling-bookings.service.ts` para «esta agenda es
   * tuya»: la referencia del recurso apunta al perfil del token, aceptando las
   * dos formas de `resourceRefType` que conviven en los datos.
   */
  /**
   * UC-41-02 (lectura): las plantillas publicadas de un recurso, con sus franjas.
   *
   * Es la lectura que faltaba. Hasta ahora `scheduling` sólo exponía los dos
   * POST de plantilla, así que quien publicaba un horario no podía volver a
   * verlo nunca más: por eso «Mi agenda» no existía y el nombre de la plantilla
   * que el alta pedía era una etiqueta a ciegas.
   *
   * Un recurso sin plantillas devuelve una lista vacía, no 404: el recurso
   * existe y todavía no publicó horario, que es un estado normal recién creada
   * la agenda.
   *
   * @param resourceId - Recurso cuyas plantillas se leen.
   * @param actor - Quien consulta; sólo el dueño del recurso o el catálogo.
   * @returns Sus plantillas, de la más reciente a la más vieja.
   */
  async listTemplates(
    resourceId: string,
    actor: AuthenticatedUser,
  ): Promise<TemplateListDto> {
    const em = this.em.fork();
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId,
      });
    }
    this.assertRecursoDelActor(resource, actor);

    const plantillas = await this.catalogRepo.findTemplatesByResource(
      em,
      resourceId,
    );
    const franjas = await this.catalogRepo.findRulesByTemplates(
      em,
      plantillas.map((plantilla) => plantilla.id),
    );

    // Se agrupan en memoria porque ya vinieron todas en una consulta: volver a
    // filtrar por plantilla sería una consulta por fila.
    const porPlantilla = new Map<string, TemplateRuleDto[]>();
    for (const franja of franjas) {
      const lista = porPlantilla.get(franja.scheduleTemplateId) ?? [];
      lista.push({
        dayOfWeek: franja.dayOfWeek,
        startTime: franja.startTime,
        endTime: franja.endTime,
        // `== null` a propósito: una columna anulable que nadie completó
        // vuelve de MikroORM como `null`, no como `undefined`, y compararla
        // contra `undefined` la deja pasar. Es el mismo defecto que en el paso
        // de la foto del alta (#165), encontrado igual: probando contra la base
        // y no leyendo el diff.
        ...(franja.slotMinutes == null
          ? {}
          : { slotMinutes: franja.slotMinutes }),
        ...(franja.capacityPerSlot == null
          ? {}
          : { capacityPerSlot: franja.capacityPerSlot }),
        ...(franja.gapMinutes == null ? {} : { gapMinutes: franja.gapMinutes }),
      });
      porPlantilla.set(franja.scheduleTemplateId, lista);
    }

    const items = plantillas.map((plantilla) => ({
      id: plantilla.id,
      name: plantilla.name,
      rules: porPlantilla.get(plantilla.id) ?? [],
      ...(plantilla.slotMinutes == null
        ? {}
        : { slotMinutes: plantilla.slotMinutes }),
      ...(plantilla.validFrom == null
        ? {}
        : { validFrom: plantilla.validFrom.toISOString() }),
      ...(plantilla.validTo == null
        ? {}
        : { validTo: plantilla.validTo.toISOString() }),
      ...(plantilla.bookingPolicyId == null
        ? {}
        : { bookingPolicyId: plantilla.bookingPolicyId }),
      statusConceptId: plantilla.statusConceptId,
      retired: plantilla.statusConceptId === CONCEPTS.TEMPLATE_RETIRED,
    }));

    return { items, count: items.length };
  }

  /**
   * UC-41-04 (lectura): las excepciones de un recurso en una ventana.
   *
   * Es el hueco gemelo del `GET` de plantillas: se podían **crear** excepciones
   * y no leerlas. Sin esta lectura, el calendario del médico no puede
   * distinguir un día bloqueado de un día sin agenda —los dos aparecen sin
   * cupos—, y esa diferencia es justamente lo que hay que mostrar: uno es «no
   * atiendo los miércoles» y el otro «ese miércoles no atiendo, y por esto».
   *
   * @param resourceId - Recurso cuyas excepciones se leen.
   * @param from - Inicio de la ventana.
   * @param to - Fin de la ventana.
   * @param actor - Quien consulta; sólo el dueño del recurso o el catálogo.
   * @returns Las excepciones que se solapan con la ventana.
   */
  async listExceptions(
    resourceId: string,
    from: Date,
    to: Date,
    actor: AuthenticatedUser,
  ): Promise<AvailabilityExceptionListDto> {
    if (!(from < to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: from.toISOString(), to: to.toISOString() },
      );
    }

    const em = this.em.fork();
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId,
      });
    }
    // Quién puede leer, y CUÁNTO ve, son dos preguntas distintas.
    //
    // El profesional y quien administra el catálogo ven todo, incluido el texto
    // libre. Un paciente ve el motivo catalogado y NUNCA el texto libre, y sólo
    // de un médico con el que tiene cita — la misma regla con la que se
    // resuelve qué historial ve.
    const esDelActor = this.puedeAdministrarRecurso(resource, actor);
    let puedeLeer = esDelActor;
    if (!puedeLeer && actor.patientProfileId !== undefined) {
      puedeLeer = await this.catalogRepo.patientHasBookingWithResource(
        em,
        resourceId,
        actor.patientProfileId,
      );
    }
    if (!puedeLeer) {
      throw new ForbiddenException('No podés ver los bloqueos de esta agenda');
    }

    const filas = await this.catalogRepo.findExceptionsByResourceInRange(
      em,
      resourceId,
      from,
      to,
    );

    const items = filas.map((fila) => ({
      id: fila.id,
      exceptionTypeConceptId: fila.exceptionTypeConceptId,
      startAt: fila.startAt.toISOString(),
      endAt: fila.endAt.toISOString(),
      // El motivo catalogado viaja para todos: es una etiqueta de una lista
      // cerrada —«Vacaciones», «Congreso»— y no puede contener nada que el
      // profesional no haya elegido a propósito.
      reasonLabel: this.etiquetaDeMotivo(fila.exceptionTypeConceptId),
      // El texto libre, en cambio, SÓLO para quien administra la agenda. Es lo
      // que el médico escribe cuando elige «Otro», y ahí puede aparecer
      // cualquier cosa: «cirugía de la Sra. Pérez» son datos clínicos de un
      // tercero. Se omite, no se vacía.
      //
      // `== null` y no `=== undefined`: una columna anulable sin completar
      // vuelve como `null`, y la guarda estricta la dejaría pasar (#174).
      ...(esDelActor && fila.reason != null ? { reason: fila.reason } : {}),
      ...(fila.isAvailable == null ? {} : { isAvailable: fila.isAvailable }),
    }));

    return { items, count: items.length };
  }

  /**
   * Cómo se llama un motivo, desde su concepto.
   *
   * El mapa va en la otra dirección que {@link EXCEPTION_TYPE_CONCEPT}: la fila
   * guarda el uuid y la pantalla necesita la palabra.
   */
  private etiquetaDeMotivo(conceptId: string): string {
    const tipo = EXCEPTION_TYPES.find(
      (t) => EXCEPTION_TYPE_CONCEPT[t] === conceptId,
    );
    // Un concepto que no está en el catálogo es un dato viejo o sembrado por
    // fuera. Se dice «Bloqueado» en vez de mostrar un uuid o romper la lectura.
    return tipo === undefined ? 'Bloqueado' : EXCEPTION_TYPE_LABEL[tipo];
  }

  /**
   * Si el actor administra este recurso. Es {@link assertRecursoDelActor} sin
   * lanzar, para los casos en que «no» no es un error sino menos detalle.
   */
  private puedeAdministrarRecurso(
    resource: { resourceRefType: string; resourceRefId: string },
    actor: AuthenticatedUser,
  ): boolean {
    try {
      this.assertRecursoDelActor(resource, actor);
      return true;
    } catch {
      return false;
    }
  }

  private assertRecursoDelActor(
    resource: { resourceRefType: string; resourceRefId: string },
    actor: AuthenticatedUser,
  ): void {
    if (this.esAdministradorDeCatalogo(actor)) return;

    const esSuAgenda =
      actor.practitionerProfileId !== undefined &&
      resource.resourceRefId === actor.practitionerProfileId &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType);
    if (!esSuAgenda) {
      throw new ForbiddenException(
        'Esta agenda es de otro profesional: solo la administra quien atiende ' +
          'en ella.',
      );
    }
  }

  /**
   * El tenant del payload tiene que ser uno del actor.
   *
   * Para un administrador no aplica (opera cualquier tenant); para el
   * autoservicio evita dos males: publicar en un tenant ajeno, y publicarse en
   * uno del que no es miembro — donde su agenda existiría pero jamás se
   * listaría, que es una forma silenciosa de no existir.
   */
  private assertTenantDelActor(
    tenantId: string,
    actor: AuthenticatedUser,
  ): void {
    if (this.esAdministradorDeCatalogo(actor)) return;
    if (!actor.tenantIds?.includes(tenantId)) {
      throw new ForbiddenException(
        'El tenant indicado no es uno de los del actor.',
      );
    }
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

/** Milisegundos de un día del calendario. */
const UN_DIA_MS = 24 * 60 * 60 * 1000;

/** Los siete días de la semana, para nombrar la franja que choca. */
const NOMBRE_DEL_DIA: readonly string[] = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/**
 * Una semana concreta del calendario sobre la que proyectar franjas semanales.
 *
 * Las reglas de una plantilla no tienen fecha —dicen «los lunes»—, y dos horas
 * de pared de zonas distintas no se pueden comparar sin aterrizarlas en un
 * instante. Esta es esa tierra: siete fechas reales, una por día de la semana.
 */
interface SemanaDeReferencia {
  /** Fecha del calendario de cada día de la semana, indexada 0 = domingo. */
  readonly fechas: readonly DiaLocal[];
  /** Domingo de la semana, como instante, para descartar plantillas vencidas. */
  readonly inicio: Date;
}

/**
 * La semana del calendario que contiene el instante dado.
 *
 * Las fechas se toman del calendario UTC porque lo único que se necesita de
 * ellas es que sean siete días consecutivos con el día de semana correcto: la
 * zona entra después, al convertir cada hora de pared sobre esas fechas.
 *
 * @param desde - Instante de referencia.
 * @returns Las siete fechas de esa semana y su domingo.
 */
function semanaDeReferencia(desde: Date): SemanaDeReferencia {
  const base = Date.UTC(
    desde.getUTCFullYear(),
    desde.getUTCMonth(),
    desde.getUTCDate(),
  );
  const domingo = base - new Date(base).getUTCDay() * UN_DIA_MS;

  const fechas = Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(domingo + indice * UN_DIA_MS);
    return {
      year: fecha.getUTCFullYear(),
      month: fecha.getUTCMonth() + 1,
      day: fecha.getUTCDate(),
    };
  });

  return { fechas, inicio: new Date(domingo) };
}

/**
 * Proyecta una franja semanal sobre la semana de referencia.
 *
 * @param semana - Semana sobre la que aterrizar.
 * @param diaSemana - Día de la regla, 0 = domingo.
 * @param inicio - Hora de pared de comienzo.
 * @param fin - Hora de pared de fin.
 * @param zona - Zona de la sede donde esa hora de pared se lee.
 */
function intervaloEnSemana(
  semana: SemanaDeReferencia,
  diaSemana: number,
  inicio: string,
  fin: string,
  zona: string,
): { desde: number; hasta: number } {
  const fecha = semana.fechas[((diaSemana % 7) + 7) % 7];
  return {
    desde: horaLocalAUtc(fecha, inicio, zona).getTime(),
    hasta: horaLocalAUtc(fecha, fin, zona).getTime(),
  };
}

/**
 * Si dos franjas comparten algún instante.
 *
 * Los extremos no cuentan: terminar a las 12:00 en una sede y empezar a las
 * 12:00 en otra no es estar en dos lados a la vez.
 */
function seSolapan(
  a: { desde: number; hasta: number },
  b: { desde: number; hasta: number },
): boolean {
  return a.desde < b.hasta && b.desde < a.hasta;
}

/** Cómo se nombra una franja cuando hay que decir con cuál choca. */
function etiquetaDeFranja(rule: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): string {
  const dia = NOMBRE_DEL_DIA[((rule.dayOfWeek % 7) + 7) % 7] ?? '?';
  return `${dia} ${rule.startTime}–${rule.endTime}`;
}

/**
 * Si la plantilla dejó de estar vigente antes de la semana que se evalúa.
 *
 * Una plantilla vencida no puede chocar con nada que se publique hoy, y
 * hacerla chocar dejaría trabado a quien cambió de sede el mes pasado.
 */
function estaVencida(validTo: Date | undefined, inicioSemana: Date): boolean {
  return validTo !== undefined && validTo !== null
    ? validTo.getTime() < inicioSemana.getTime()
    : false;
}
