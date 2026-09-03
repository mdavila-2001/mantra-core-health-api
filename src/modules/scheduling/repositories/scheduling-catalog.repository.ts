import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AppointmentBookings,
  SlotHolds,
  SchedulableResources,
  BookingPolicies,
  ScheduleTemplates,
  ScheduleRules,
  AvailabilityExceptions,
  BookableSlots,
} from '../entities';
import { createdBy, touch } from '../../../common';
import { inicioDeLoReservable } from '../scheduling-time';

/**
 * Describe el contrato estructural de create resource data.
 */
export interface CreateResourceData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Valor de resource ref type mantenido por la instancia.
   */
  resourceRefType: string;
  /**
   * Identificador asociado a resource ref.
   */
  resourceRefId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Valor de capacity mantenido por la instancia.
   */
  capacity?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create booking policy data.
 */
export interface CreateBookingPolicyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de min notice minutes mantenido por la instancia.
   */
  minNoticeMinutes?: number;
  /**
   * Valor de max advance days mantenido por la instancia.
   */
  maxAdvanceDays?: number;
  /**
   * Valor de cancellation window minutes mantenido por la instancia.
   */
  cancellationWindowMinutes?: number;
  /**
   * Valor de no show fee amount mantenido por la instancia.
   */
  noShowFeeAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de max active per patient mantenido por la instancia.
   */
  maxActivePerPatient?: number;
  /**
   * Valor de hold ttl seconds mantenido por la instancia.
   */
  holdTtlSeconds?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create template data.
 */
export interface CreateTemplateData {
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  slotMinutes?: number;
  /**
   * Identificador asociado a booking policy.
   */
  bookingPolicyId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create rule data.
 */
export interface CreateRuleData {
  /**
   * Identificador asociado a schedule template.
   */
  scheduleTemplateId: string;
  /**
   * Valor de day of week mantenido por la instancia.
   */
  dayOfWeek: number;
  /**
   * Valor de start time mantenido por la instancia.
   */
  startTime: string;
  /**
   * Valor de end time mantenido por la instancia.
   */
  endTime: string;
  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  slotMinutes?: number;
  /**
   * Valor de capacity per slot mantenido por la instancia.
   */
  capacityPerSlot?: number;
  /**
   * Minutos de respiro entre un turno y el siguiente. Anulable: ausente ≡ 0.
   */
  gapMinutes?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create exception data.
 */
export interface CreateExceptionData {
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a exception type concept.
   */
  exceptionTypeConceptId: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt: Date;
  /**
   * Valor de end at mantenido por la instancia.
   */
  endAt: Date;
  /**
   * Valor de reason mantenido por la instancia.
   */
  reason?: string;
  /**
   * Valor de is available mantenido por la instancia.
   */
  isAvailable: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create slot data.
 */
export interface CreateSlotData {
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a schedule template.
   */
  scheduleTemplateId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt: Date;
  /**
   * Valor de end at mantenido por la instancia.
   */
  endAt: Date;
  /**
   * Valor de capacity mantenido por la instancia.
   */
  capacity: number;
  /**
   * Valor de remaining capacity mantenido por la instancia.
   */
  remainingCapacity: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de la configuración de agenda: recursos, políticas, plantillas y slots. */
@Injectable()
export class SchedulingCatalogRepository {
  /**
   * Crea create resource.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create resource conforme al contrato `SchedulableResources`.
   */
  createResource(
    em: EntityManager,
    data: CreateResourceData,
  ): SchedulableResources {
    return em.create(
      SchedulableResources,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        resourceRefType: data.resourceRefType,
        resourceRefId: data.resourceRefId,
        name: data.name,
        timeZone: data.timeZone,
        capacity: data.capacity,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find resource by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find resource by id conforme al contrato `Promise<SchedulableResources | null>`.
   */
  findResourceById(
    em: EntityManager,
    id: string,
  ): Promise<SchedulableResources | null> {
    return em.findOne(SchedulableResources, { id });
  }

  /**
   * Crea create policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create policy conforme al contrato `BookingPolicies`.
   */
  createPolicy(
    em: EntityManager,
    data: CreateBookingPolicyData,
  ): BookingPolicies {
    return em.create(
      BookingPolicies,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        minNoticeMinutes: data.minNoticeMinutes,
        maxAdvanceDays: data.maxAdvanceDays,
        cancellationWindowMinutes: data.cancellationWindowMinutes,
        noShowFeeAmount: data.noShowFeeAmount,
        currencyConceptId: data.currencyConceptId,
        maxActivePerPatient: data.maxActivePerPatient,
        holdTtlSeconds: data.holdTtlSeconds,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy by id conforme al contrato `Promise<BookingPolicies | null>`.
   */
  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<BookingPolicies | null> {
    return em.findOne(BookingPolicies, { id });
  }

  /** La UNIQUE es `(tenant_id, code)`; esta lectura anticipa el conflicto. */
  findPolicyByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<BookingPolicies | null> {
    return em.findOne(BookingPolicies, { tenantId, code });
  }

  /**
   * Crea create template.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create template conforme al contrato `ScheduleTemplates`.
   */
  createTemplate(
    em: EntityManager,
    data: CreateTemplateData,
  ): ScheduleTemplates {
    return em.create(
      ScheduleTemplates,
      {
        resourceId: data.resourceId,
        name: data.name,
        serviceConceptId: data.serviceConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        slotMinutes: data.slotMinutes,
        bookingPolicyId: data.bookingPolicyId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find template by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find template by id conforme al contrato `Promise<ScheduleTemplates | null>`.
   */
  findTemplateById(
    em: EntityManager,
    id: string,
  ): Promise<ScheduleTemplates | null> {
    return em.findOne(ScheduleTemplates, { id });
  }

  /**
   * Las plantillas de un recurso, de la más reciente a la más vieja.
   *
   * El orden importa: la que gobierna hoy es la última publicada, y es la que
   * la tarjeta del médico tiene que mostrar primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceId - Recurso cuyas plantillas se leen.
   * @returns Sus plantillas.
   */
  findTemplatesByResource(
    em: EntityManager,
    resourceId: string,
  ): Promise<ScheduleTemplates[]> {
    return em.find(
      ScheduleTemplates,
      { resourceId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Las franjas de varias plantillas, en una sola consulta.
   *
   * Se piden en lote y no una por plantilla: un recurso con seis plantillas
   * haría seis viajes para pintar una tarjeta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param templateIds - Plantillas cuyas franjas se leen.
   * @returns Las franjas, ordenadas por día y hora.
   */
  findRulesByTemplates(
    em: EntityManager,
    templateIds: readonly string[],
  ): Promise<ScheduleRules[]> {
    if (templateIds.length === 0) return Promise.resolve([]);
    return em.find(
      ScheduleRules,
      { scheduleTemplateId: { $in: [...templateIds] } },
      { orderBy: { dayOfWeek: 'ASC', startTime: 'ASC' } },
    );
  }

  /**
   * Crea create rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create rule conforme al contrato `ScheduleRules`.
   */
  createRule(em: EntityManager, data: CreateRuleData): ScheduleRules {
    return em.create(
      ScheduleRules,
      {
        scheduleTemplateId: data.scheduleTemplateId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        slotMinutes: data.slotMinutes,
        capacityPerSlot: data.capacityPerSlot,
        gapMinutes: data.gapMinutes,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find rules by template.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param scheduleTemplateId - Identificador de schedule template.
   * @returns Resultado de find rules by template conforme al contrato `Promise<ScheduleRules[]>`.
   */
  findRulesByTemplate(
    em: EntityManager,
    scheduleTemplateId: string,
  ): Promise<ScheduleRules[]> {
    return em.find(ScheduleRules, { scheduleTemplateId });
  }

  /**
   * Las franjas vigentes del profesional en **todos** sus recursos.
   *
   * Existe para poder rechazar un solape antes de publicarlo: un médico con dos
   * consultorios puede declarar «lunes 9–12» en los dos, y el motor generaría
   * cupos simultáneos en dos lugares. El paciente reserva uno y el profesional
   * descubre el choque cuando ya hay dos personas citadas.
   *
   * Se busca por `resource_ref_id` —el vínculo del recurso con el perfil— y no
   * por tenant: el mismo profesional puede publicar en organizaciones distintas
   * y el choque es igual de real, porque el que no puede estar en dos lugares
   * es él.
   *
   * Sólo plantillas **publicadas**: una en borrador todavía no ocupa horario.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceRefId - Perfil profesional dueño de los recursos.
   * @param publishedStatusConceptId - Estado que cuenta como publicada.
   * Devuelve también la **zona** de cada sede y la **vigencia** de cada
   * plantilla: sin ellas, quien compara sólo puede mirar el texto de la hora, y
   * «las nueve» de dos sedes en zonas distintas no son el mismo momento.
   *
   * @param exceptResourceId - Recurso que se está editando, si se excluye.
   * @returns Las franjas, con su recurso, su zona y la vigencia de su plantilla.
   */
  async findRulesByResourceOwner(
    em: EntityManager,
    resourceRefId: string,
    publishedStatusConceptId: string,
    exceptResourceId?: string,
  ): Promise<
    {
      rule: ScheduleRules;
      resourceId: string;
      resourceName: string;
      timeZone?: string;
      validTo?: Date;
    }[]
  > {
    const recursos = await em.find(SchedulableResources, { resourceRefId });
    const suyos = recursos.filter((recurso) => recurso.id !== exceptResourceId);
    if (suyos.length === 0) return [];

    const plantillas = await em.find(ScheduleTemplates, {
      resourceId: { $in: suyos.map((recurso) => recurso.id) },
      statusConceptId: publishedStatusConceptId,
    });
    if (plantillas.length === 0) return [];

    const franjas = await em.find(ScheduleRules, {
      scheduleTemplateId: { $in: plantillas.map((plantilla) => plantilla.id) },
    });

    const recursoPorPlantilla = new Map(
      plantillas.map((plantilla) => [plantilla.id, plantilla.resourceId]),
    );
    const nombrePorRecurso = new Map(
      suyos.map((recurso) => [recurso.id, recurso.name]),
    );
    const zonaPorRecurso = new Map(
      suyos.map((recurso) => [recurso.id, recurso.timeZone]),
    );
    const vigenciaPorPlantilla = new Map(
      plantillas.map((plantilla) => [plantilla.id, plantilla.validTo]),
    );

    return franjas.map((rule) => {
      const resourceId = recursoPorPlantilla.get(rule.scheduleTemplateId) ?? '';
      return {
        rule,
        resourceId,
        resourceName: nombrePorRecurso.get(resourceId) ?? '',
        timeZone: zonaPorRecurso.get(resourceId),
        validTo: vigenciaPorPlantilla.get(rule.scheduleTemplateId),
      };
    });
  }

  /**
   * Los cupos ABIERTOS y sin tomar del profesional que pisan un rango,
   * cruzando todas sus sedes.
   *
   * Es la retracción de AG-2/AG-3: la cita que el doctor se pone encima de
   * horarios que él mismo ofreció los retira — con aviso, sin preguntar. Sólo
   * los intactos: un cupo con una reserva adentro no se toca desde acá (eso lo
   * gobierna la política de choques).
   *
   * Se materializa vía entidades y no SQL crudo porque el llamador los MUTA:
   * las filas crudas no pasan por la unidad de trabajo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceRefId - El perfil profesional dueño de los recursos.
   * @param desde - Inicio del rango.
   * @param hasta - Fin del rango.
   * @param openStatusConceptId - El concepto de cupo abierto.
   * @returns Los cupos abiertos e intactos que se cruzan.
   */
  async findOpenSlotsOfProfessionalInWindow(
    em: EntityManager,
    resourceRefId: string,
    desde: Date,
    hasta: Date,
    openStatusConceptId: string,
  ): Promise<BookableSlots[]> {
    const recursos = await em.find(SchedulableResources, { resourceRefId });
    if (recursos.length === 0) return [];

    const slots = await em.find(BookableSlots, {
      resourceId: { $in: recursos.map((recurso) => recurso.id) },
      statusConceptId: openStatusConceptId,
      startAt: { $lt: hasta },
      endAt: { $gt: desde },
    });
    return slots.filter((slot) => slot.remainingCapacity === slot.capacity);
  }

  /**
   * Una excepción por su id, o `null` si no existe.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - La excepción buscada.
   * @returns La fila, o `null`.
   */
  findExceptionById(
    em: EntityManager,
    id: string,
  ): Promise<AvailabilityExceptions | null> {
    return em.findOne(AvailabilityExceptions, { id });
  }

  /**
   * Elimina una excepción.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param exception - La fila a eliminar.
   */
  removeException(em: EntityManager, exception: AvailabilityExceptions): void {
    em.remove(exception);
  }

  /**
   * Crea create exception.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create exception conforme al contrato `AvailabilityExceptions`.
   */
  createException(
    em: EntityManager,
    data: CreateExceptionData,
  ): AvailabilityExceptions {
    return em.create(
      AvailabilityExceptions,
      {
        resourceId: data.resourceId,
        exceptionTypeConceptId: data.exceptionTypeConceptId,
        startAt: data.startAt,
        endAt: data.endAt,
        reason: data.reason,
        isAvailable: data.isAvailable,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create slot.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create slot conforme al contrato `BookableSlots`.
   */
  createSlot(em: EntityManager, data: CreateSlotData): BookableSlots {
    return em.create(
      BookableSlots,
      {
        resourceId: data.resourceId,
        scheduleTemplateId: data.scheduleTemplateId,
        serviceConceptId: data.serviceConceptId,
        startAt: data.startAt,
        endAt: data.endAt,
        capacity: data.capacity,
        remainingCapacity: data.remainingCapacity,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Slots ya generados para la plantilla en la ventana pedida. La regeneración es
   * idempotente: los que ya existen no se vuelven a crear.
   */
  /**
   * Las citas que cuelgan de los cupos de una plantilla, vivas e históricas.
   *
   * Devuelve las dos cifras a propósito, porque son dos conversaciones
   * distintas con quien quiere borrar el horario:
   *
   * - **`live`** son compromisos: gente que va a presentarse. Se resuelven
   *   cancelando o moviendo, y entonces el número baja.
   * - **`total`** incluye además las canceladas y las cumplidas, que **no se
   *   pueden resolver**: `appointment_bookings.bookable_slot_id` es `NOT NULL`,
   *   así que una cita histórica fija su cupo para siempre. Borrar ese cupo
   *   sería borrar el registro de que esa persona tuvo un turno.
   *
   * Por eso cancelar **no** libera un horario para ser borrado. Es lo que hace
   * que «borrar definitivamente» tenga un techo real, y no un techo que se
   * pueda esquivar cancelando todo primero.
   *
   * @param em - Contexto de persistencia.
   * @param scheduleTemplateId - Plantilla que se quiere borrar.
   * @param activeStates - Estados en los que una cita todavía compromete.
   * @param limit - Tope de la lista que se devuelve al cliente.
   */
  async findBookingsOfTemplate(
    em: EntityManager,
    scheduleTemplateId: string,
    activeStates: readonly string[],
    limit: number,
  ): Promise<{
    total: number;
    live: number;
    sample: AppointmentBookings[];
  }> {
    const slots = await em.find(
      BookableSlots,
      { scheduleTemplateId },
      { fields: ['id'] },
    );
    if (slots.length === 0) return { total: 0, live: 0, sample: [] };

    const enSusCupos = { bookableSlotId: { $in: slots.map((s) => s.id) } };
    const total = await em.count(AppointmentBookings, enSusCupos);
    if (total === 0) return { total: 0, live: 0, sample: [] };

    const conEstadoVivo = {
      ...enSusCupos,
      statusConceptId: { $in: [...activeStates] },
    };
    const live = await em.count(AppointmentBookings, conEstadoVivo);

    // La muestra prioriza las vivas: son las accionables, y son las que el
    // médico necesita ver nombradas para ir a resolverlas.
    const sample = await em.find(
      AppointmentBookings,
      live > 0 ? conEstadoVivo : enSusCupos,
      { limit },
    );
    return { total, live, sample };
  }

  /**
   * Retira un horario: deja de publicarse y suelta lo que nadie usó.
   *
   * **No borra la plantilla.** No es una preferencia: es lo único posible.
   * `audit.schedule_templates_history` referencia toda plantilla publicada —una
   * fila por plantilla, escrita al publicar— así que ninguna se puede borrar
   * nunca. Se descubrió ejecutándolo, no leyéndolo (P-10-2).
   *
   * Lo que sí se va son los **cupos que nadie tocó**: no tienen cita ni la
   * tuvieron, son derivados puros de la plantilla, y dejarlos publicados
   * después de retirar el horario sería seguir ofreciendo turnos de una agenda
   * que ya no existe.
   *
   * Los cupos **con historia se quedan**, aunque la cita esté cancelada:
   * `appointment_bookings.bookable_slot_id` es `NOT NULL`, así que borrar ese
   * cupo sería borrar el registro de que alguien tuvo un turno.
   *
   * Las retenciones de los cupos que se van se borran con ellos: son efímeras
   * —tienen TTL y no comprometen a nadie— y su FK bloquearía el borrado. Es la
   * primera de las tres barreras que apareció corriendo esto contra la base.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param scheduleTemplateId - Plantilla a retirar.
   * @param retiredStatusConceptId - Estado con el que queda.
   * @param actorUserId - Quién la retira.
   * @returns Cuántos cupos libres se soltaron y cuántos quedaron por tener historia.
   */
  /**
   * Vuelve a poner en vigencia una plantilla retirada.
   *
   * **No regenera los cupos**, y es deliberado: retirar los borró, y volver a
   * crearlos es `generate-slots` con la ventana que el profesional elija. Un
   * horario que se reactiva solo con los cupos del mes pasado abriría turnos en
   * fechas que ya pasaron.
   *
   * El servicio se encarga de decirlo; acá sólo se cambia el estado.
   */
  async reactivateTemplate(
    em: EntityManager,
    scheduleTemplateId: string,
    activeStatusConceptId: string,
    actorUserId: string,
  ): Promise<void> {
    const plantilla = await em.findOne(ScheduleTemplates, {
      id: scheduleTemplateId,
    });
    if (plantilla) {
      plantilla.statusConceptId = activeStatusConceptId;
      touch(plantilla, actorUserId);
    }
  }

  async retireTemplate(
    em: EntityManager,
    scheduleTemplateId: string,
    retiredStatusConceptId: string,
    actorUserId: string,
  ): Promise<{ releasedSlots: number; keptSlots: number }> {
    const cupos = await em.find(
      BookableSlots,
      { scheduleTemplateId },
      { fields: ['id'] },
    );

    let releasedSlots = 0;
    let keptSlots = 0;

    if (cupos.length > 0) {
      const ids = cupos.map((cupo) => cupo.id);
      const conHistoria = await em.find(
        AppointmentBookings,
        { bookableSlotId: { $in: ids } },
        { fields: ['bookableSlotId'] },
      );
      const intocables = new Set(
        conHistoria.map((booking) => booking.bookableSlotId),
      );
      const libres = ids.filter((id) => !intocables.has(id));
      keptSlots = ids.length - libres.length;

      if (libres.length > 0) {
        await em.nativeDelete(SlotHolds, {
          bookableSlotId: { $in: libres },
        });
        releasedSlots = await em.nativeDelete(BookableSlots, {
          id: { $in: libres },
        });
      }
    }

    const plantilla = await em.findOne(ScheduleTemplates, {
      id: scheduleTemplateId,
    });
    if (plantilla) {
      plantilla.statusConceptId = retiredStatusConceptId;
      touch(plantilla, actorUserId);
    }

    return { releasedSlots, keptSlots };
  }

  /**
   * Si un paciente tiene alguna cita con este recurso.
   *
   * Es la regla que decide si puede ver por qué el profesional bloqueó un rato:
   * **sólo del médico con el que tiene cita**, que es el mismo criterio con el
   * que ya se resuelve qué historial ve. Sin cita no hay vínculo, y el motivo
   * de un bloqueo es información del consultorio, no del público.
   *
   * Mira TODAS las citas, incluidas las canceladas y las cumplidas: alguien que
   * se atendió el mes pasado y quiere volver sigue siendo su paciente, y
   * enterarse de que su médico está de vacaciones le ahorra el viaje.
   *
   * @param em - Contexto de persistencia.
   * @param resourceId - La agenda que se quiere leer.
   * @param patientProfileId - Quién pregunta.
   */
  async patientHasBookingWithResource(
    em: EntityManager,
    resourceId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    const cuantas = await em.count(AppointmentBookings, {
      resourceId,
      patientProfileId,
    });
    return cuantas > 0;
  }

  findSlotsByTemplateInRange(
    em: EntityManager,
    scheduleTemplateId: string,
    from: Date,
    to: Date,
  ): Promise<BookableSlots[]> {
    return em.find(BookableSlots, {
      scheduleTemplateId,
      startAt: { $gte: from, $lt: to },
    });
  }

  /**
   * Agenda publicada de un recurso en una ventana de tiempo (UC-41-14).
   *
   * Es la consulta que hace posible reservar desde una pantalla: hasta ahora los
   * slots se generaban pero no se podían listar, así que el único modo de
   * conseguir un `slotId` para tomar un hold era mirar la base de datos.
   *
   * `onlyAvailable` descarta lo que no se puede pedir, por **dos** motivos
   * distintos y ambos necesarios:
   *
   * - **Sin capacidad restante**: el slot sigue marcado como abierto pero un
   *   hold vivo ya se llevó el cupo; ofrecerlo lleva a un 409 al reservar.
   * - **Sin estado abierto**: desde AG-2 y AG-3 un slot puede quedar
   *   `SLOT_BLOCKED` conservando su capacidad —lo bloquea una excepción de
   *   disponibilidad, o lo retira una cita puntual que lo pisa—. Su
   *   `remaining_capacity` sigue en 1, así que el filtro de capacidad no lo ve.
   *
   * El segundo faltaba, y el journey de AG-6 lo midió: sobre el mismo día, esta
   * ruta ofrecía **10** horarios y la hermana del portal —`GET
   * /scheduling/slots`, que sí compara el estado— ofrecía **2**. Los ocho de
   * diferencia eran la reunión del médico y las tres horas de una cirugía: si
   * un cliente los mostraba, el paciente elegía un horario que iba a fallar.
   *
   * Con `ahora` descarta además los que ya empezaron —un turno de ayer no se
   * puede pedir—; ver {@link inicioDeLoReservable}.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceId - Recurso cuya agenda se consulta.
   * @param from - Inicio de la ventana (inclusive).
   * @param to - Fin de la ventana (exclusive).
   * @param options - `onlyAvailable`, `ahora` para descartar vencidos y tope de filas.
   * @returns Slots ordenados cronológicamente.
   */
  findSlotsByResourceInRange(
    em: EntityManager,
    resourceId: string,
    from: Date,
    to: Date,
    options: {
      onlyAvailable: boolean;
      limit: number;
      ahora?: Date;
      /** El concepto de «cupo abierto», cuando `onlyAvailable`. */
      openStatusConceptId?: string;
    },
  ): Promise<BookableSlots[]> {
    const desde =
      options.onlyAvailable && options.ahora
        ? inicioDeLoReservable(from, options.ahora)
        : from;

    const where: Record<string, unknown> = {
      resourceId,
      startAt: { $gte: desde, $lt: to },
    };
    if (options.onlyAvailable) {
      where.remainingCapacity = { $gt: 0 };
      // El concepto lo aporta el servicio, igual que en la ruta hermana: la
      // consulta no depende de una constante del catálogo.
      if (options.openStatusConceptId) {
        where.statusConceptId = options.openStatusConceptId;
      }
    }
    return em.find(BookableSlots, where, {
      orderBy: { startAt: 'ASC' },
      limit: options.limit,
    });
  }

  /**
   * Las excepciones de un recurso que tocan una ventana.
   *
   * Se cruza por solape y no por contención: un bloqueo de tres días que
   * empieza el mes pasado y termina el 2 afecta al mes que se está mirando, y
   * pedir sólo las que empiezan dentro lo dejaría afuera.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceId - Recurso cuyas excepciones se leen.
   * @param from - Inicio de la ventana.
   * @param to - Fin de la ventana.
   * @returns Las excepciones que se solapan, cronológicamente.
   */
  findExceptionsByResourceInRange(
    em: EntityManager,
    resourceId: string,
    from: Date,
    to: Date,
  ): Promise<AvailabilityExceptions[]> {
    return em.find(
      AvailabilityExceptions,
      { resourceId, startAt: { $lt: to }, endAt: { $gt: from } },
      { orderBy: { startAt: 'ASC' } },
    );
  }

  /** Slots del recurso que se solapan con una excepción de no disponibilidad. */
  findOpenSlotsInWindow(
    em: EntityManager,
    resourceId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<BookableSlots[]> {
    return em.find(BookableSlots, {
      resourceId,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });
  }
}
