import { Inject, Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ADULT_AGE_YEARS,
  DEFAULT_TIME_ZONE,
  ageInYears,
  atomMeta,
  deviceCookieEnabledFromEnv,
  endOfZonedDayExclusive,
  requiredFacets,
  startOfZonedDay,
  type Facet,
  type GovernanceRuleFacts,
  type SupportAccessContext,
  type SupportAccessFacts,
  type SupportCondition,
  type UsageKey,
  type UsageReading,
  type UsageSnapshot,
} from '../domain';
import {
  SUPPORT_DEVICE_PORT,
  SUPPORT_NETWORK_POLICY_PORT,
  SUPPORT_PATIENT_FACTS_PORT,
  SUPPORT_PRESENCE_PORT,
  SUPPORT_SESSION_INFO_PORT,
  SUPPORT_STEP_UP_PORT,
  SUPPORT_TENANT_ZONE_PORT,
  type DevicePort,
  type NetworkPolicyPort,
  type PatientFactsPort,
  type PatientFactsRecord,
  type PresencePort,
  type SessionInfoPort,
  type SessionRecord,
  type SupportStepUpPort,
  type TenantZonePort,
} from './support-access-context.ports';
import { SupportUsageCounter } from './support-usage-counter';

/** Vida de la zona horaria de una organización en memoria. */
const ZONE_TTL_MS = 5 * 60_000;
/** Tope de vueltas de la evaluación perezosa (hay 7 facetas; sobra). */
const MAX_PASSES = 10;

/** Qué necesita el conjunto de condiciones en juego (cota superior de lo que se cargará). */
export interface FacetDemand {
  /** Facetas que alguna condición menciona. */
  readonly facets: ReadonlySet<Facet>;
  /** Rango de citas del paciente que hace falta (en días), si alguna condición lo usa. */
  readonly bookingRange?: {
    readonly daysBefore: number;
    readonly daysAfter: number;
  };
  /** ¿Alguna condición mira la cobertura del paciente? */
  readonly needsCoverage: boolean;
  /** ¿Alguna condición mira el equipo asistencial? */
  readonly needsCareTeam: boolean;
  /** ¿Alguna condición necesita la fecha de nacimiento? */
  readonly needsBirthDate: boolean;
  /** ¿Hay alguna condición? (sin ellas no se resuelve ni la zona horaria). */
  readonly hasConditions: boolean;
  /** ¿Alguna condición mira la hora de la cita (`appointment`)? */
  readonly needsAppointment: boolean;
}

/** Datos con los que se resuelven las facetas de UNA decisión. */
export interface FacetRequest {
  /** Contexto de transacción. */
  readonly em: EntityManager;
  /** Organización. */
  readonly tenantId: string;
  /** Persona de apoyo. */
  readonly userId: string;
  /** Doctor de la acción (presencia). */
  readonly practitionerProfileId?: string;
  /** Contexto de la acción, ya con ip, sesión y dispositivo del PIP. */
  readonly context: SupportAccessContext;
  /** Instante de la decisión. */
  readonly now: Date;
  /** Qué hace falta. */
  readonly demand: FacetDemand;
}

/** Lo ya resuelto en una evaluación. */
interface LoadedState {
  readonly loaded: Set<Facet>;
  patient?: PatientFactsRecord;
  session?: SessionRecord;
  network?: { satisfiesOrgRules: boolean; orgHasAllowRules: boolean };
  device?: { trusted: boolean };
  doctorOnline?: boolean;
  stepUpAge?: number | null;
  stepUpEnrolled?: boolean;
  usage: Map<string, UsageReading>;
  /** Claves de contador ya leídas. */
  usageRead: Set<string>;
}

/** Resultado de la evaluación perezosa. */
export interface LazyEvaluation<R> {
  /** Lo que devolvió la última pasada del motor. */
  readonly result: R;
  /** Hechos resueltos (para el explicar y para el registro). */
  readonly facts?: SupportAccessFacts;
  /** Facetas que se tuvieron que consultar. */
  readonly loaded: readonly Facet[];
}

/** Lo que el motor necesita saber del resultado para pedir más datos. */
export interface LazyProbe {
  /** Contadores que la pasada leyó (claves y topes). */
  readonly usage: { readonly readings: readonly UsageSnapshot[] };
}

/**
 * PIP de la política del personal de apoyo (CONTRATO-GOBIERNO §3.2 y §8.1):
 * resuelve los hechos de una decisión **perezosamente** y solo los que el motor
 * toca. Sin condiciones el costo es cero: no se consulta nada.
 *
 * ## Cómo se carga solo lo necesario
 *
 * `requiredFacets` acota lo que PODRÍA hacer falta (cota superior, sobre las
 * condiciones de los permisos y las reglas de la organización). Dentro de esa
 * cota, el motor se corre con una vista de hechos que registra qué faceta lee y
 * no tenía: se carga SOLO esa, una vez, y se vuelve a correr (el motor es puro y
 * cuesta microsegundos). Como el motor evalúa de lo barato a lo caro y se detiene
 * en el primer incumplimiento, las facetas caras (red, presencia, contadores) no
 * se consultan si una barata ya negó. En `peek` (explicar/simular) se cargan
 * todas de una vez para poder decir «qué faltaría».
 *
 * ## Falla cerrado
 *
 * Cada puerto devuelve `undefined` ante un error: el motor ve el hecho ausente,
 * la condición queda indeterminada (`I`) y no se abre nada. Los contadores
 * degradan a memoria (nunca «0 usados» por no saber).
 */
@Injectable()
export class SupportAccessContextLoader {
  private readonly zones = new Map<string, { at: number; zone?: string }>();

  /**
   * @param counter - Contadores de límites y montos.
   * @param logger - Logger estructurado.
   * @param patients - Hechos de paciente.
   * @param sessions - Sesión del token.
   * @param network - Reglas de red de la organización.
   * @param devices - Dispositivos de confianza.
   * @param presence - Presencia del doctor.
   * @param stepUp - Paso extra por sesión.
   * @param tenantZone - Zona horaria de la organización.
   */
  constructor(
    private readonly counter: SupportUsageCounter,
    private readonly logger: PinoLogger,
    @Optional()
    @Inject(SUPPORT_PATIENT_FACTS_PORT)
    private readonly patients?: PatientFactsPort,
    @Optional()
    @Inject(SUPPORT_SESSION_INFO_PORT)
    private readonly sessions?: SessionInfoPort,
    @Optional()
    @Inject(SUPPORT_NETWORK_POLICY_PORT)
    private readonly network?: NetworkPolicyPort,
    @Optional()
    @Inject(SUPPORT_DEVICE_PORT)
    private readonly devices?: DevicePort,
    @Optional()
    @Inject(SUPPORT_PRESENCE_PORT)
    private readonly presence?: PresencePort,
    @Optional()
    @Inject(SUPPORT_STEP_UP_PORT)
    private readonly stepUp?: SupportStepUpPort,
    @Optional()
    @Inject(SUPPORT_TENANT_ZONE_PORT)
    private readonly tenantZone?: TenantZonePort,
  ) {
    this.logger.setContext(SupportAccessContextLoader.name);
  }

  /**
   * Qué podrían necesitar las condiciones en juego (permisos de la persona y
   * reglas `REQUIRE_CONDITION` de la organización).
   *
   * @param conditions - Todas las condiciones que pueden intervenir.
   * @param atom - Átomo evaluado.
   * @returns La cota superior de facetas y de datos de paciente.
   */
  demandOf(
    conditions: readonly SupportCondition[],
    atom: string | undefined,
  ): FacetDemand {
    const facets = new Set<Facet>();
    let before = -1;
    let after = -1;
    let needsCoverage = false;
    let needsCareTeam = false;
    let needsBirthDate = false;
    let needsAppointment = false;
    // El segundo paso lo puede exigir el catálogo del átomo aunque no haya condiciones.
    if (atom && atomMeta(atom)?.requiresStepUp) facets.add('stepUp');
    for (const c of conditions) {
      for (const f of requiredFacets(c, atom)) facets.add(f);
      if (c.appointment) needsAppointment = true;
      const p = c.patients;
      if (!p) continue;
      if (p.coverage && p.coverage.mode !== 'ANY') needsCoverage = true;
      if (p.coverage?.carrierIds?.length) needsCoverage = true;
      if (p.scope === 'CARE_TEAM_OF_COVERED_DOCTOR') needsCareTeam = true;
      if (p.age || p.isMinor !== undefined || p.exclude?.minors)
        needsBirthDate = true;
      if (p.scope === 'WITH_APPOINTMENT_WINDOW') {
        const w = p.appointmentWindow ?? { daysBefore: 0, daysAfter: 0 };
        before = Math.max(before, w.daysBefore);
        after = Math.max(after, w.daysAfter);
      }
    }
    return {
      facets,
      ...(before >= 0
        ? { bookingRange: { daysBefore: before, daysAfter: after } }
        : {}),
      needsCoverage,
      needsCareTeam,
      needsBirthDate,
      hasConditions: conditions.length > 0,
      needsAppointment,
    };
  }

  /**
   * Todas las condiciones que pueden intervenir en una decisión de la persona.
   *
   * @param grantConditions - Condiciones de sus permisos y de sus átomos.
   * @param rules - Reglas de la organización.
   * @returns La lista plana.
   */
  conditionsOf(
    grantConditions: readonly (SupportCondition | null | undefined)[],
    rules: readonly GovernanceRuleFacts[],
  ): SupportCondition[] {
    return [
      ...grantConditions.filter((c): c is SupportCondition => !!c),
      ...rules
        .filter((r) => r.kind === 'REQUIRE_CONDITION' && r.condition)
        .map((r) => r.condition as SupportCondition),
    ];
  }

  /**
   * Zona horaria de la organización (caché de 5 min; sin zona declarada o sin
   * puerto, la de La Paz la pone el motor).
   *
   * @param em - Contexto de lectura.
   * @param tenantId - Organización.
   * @returns La zona IANA, o `undefined`.
   */
  async timeZoneOf(
    em: EntityManager,
    tenantId: string,
  ): Promise<string | undefined> {
    const hit = this.zones.get(tenantId);
    if (hit && Date.now() - hit.at < ZONE_TTL_MS) return hit.zone;
    if (!this.tenantZone) return undefined;
    try {
      const zone = await this.tenantZone.timeZoneOf(em, tenantId);
      this.zones.set(tenantId, { at: Date.now(), zone });
      return zone;
    } catch {
      return undefined;
    }
  }

  /**
   * Corre el motor cargando solo lo que lee y no tenía.
   *
   * @param request - Qué hace falta resolver y con qué datos.
   * @param zone - Zona horaria de la organización (o `undefined`).
   * @param run - Una pasada del motor con la vista de hechos que se le da;
   *   devuelve su resultado y las lecturas de contadores que pidió.
   * @returns La última pasada (la que vale) y las facetas consultadas.
   */
  async evaluate<R extends LazyProbe>(
    request: FacetRequest,
    zone: string | undefined,
    run: (facts: SupportAccessFacts | undefined) => R,
  ): Promise<LazyEvaluation<R>> {
    const { demand } = request;
    if (!demand.hasConditions && demand.facets.size === 0) {
      return { result: run(undefined), loaded: [] };
    }
    const state: LoadedState = {
      loaded: new Set(),
      usage: new Map(),
      usageRead: new Set(),
    };
    const eager = request.context.peek === true;
    if (eager) {
      for (const facet of demand.facets)
        await this.loadFacet(facet, request, state);
    }
    let result!: R;
    let facts: SupportAccessFacts | undefined;
    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      const touched = new Set<Facet>();
      facts = this.view(state, touched, request, zone);
      result = run(facts);
      const missing = [...touched].filter(
        (f) => !state.loaded.has(f) && f !== 'usage' && demand.facets.has(f),
      );
      for (const facet of missing) await this.loadFacet(facet, request, state);
      const needUsage =
        touched.has('usage') &&
        result.usage.readings.some(
          (r) => !state.usageRead.has(SupportUsageCounter.serialize(r.key)),
        );
      if (needUsage)
        await this.loadUsage(request, result.usage.readings, state);
      if (missing.length === 0 && !needUsage) break;
    }
    return { result, facts, loaded: [...state.loaded] };
  }

  /**
   * Prepara los hechos para decidir MUCHAS filas en memoria (la agenda
   * combinada): carga UNA vez lo que es de la petición (sesión, red, dispositivo)
   * y los pacientes en lote, y devuelve una función `(paciente, doctor) → hechos`.
   *
   * Para listar no se leen contadores ni se pide el segundo paso: lo que sale es
   * «qué puede ofrecer la pantalla»; la acción vuelve a decidirse completa
   * (con contadores, obligaciones y registro) al ejecutarla. Un contador sin
   * leer se mide como libre SOLO aquí; el desafío de segundo paso se ofrece.
   *
   * @param request - Persona, contexto y qué pacientes y doctores aparecen.
   * @param zone - Zona horaria de la organización.
   * @returns Fábrica de hechos por fila.
   */
  async prepareListing(
    request: Omit<FacetRequest, 'practitionerProfileId'> & {
      readonly patientProfileIds: readonly string[];
      readonly practitionerProfileIds: readonly string[];
    },
    zone: string | undefined,
  ): Promise<
    (
      patientProfileId?: string,
      practitionerProfileId?: string,
    ) => SupportAccessFacts
  > {
    const state: LoadedState = {
      loaded: new Set(),
      usage: new Map(),
      usageRead: new Set(),
    };
    const { demand } = request;
    const base = { ...request, practitionerProfileId: undefined };
    for (const facet of ['session', 'network', 'device'] as const) {
      if (demand.facets.has(facet)) await this.loadFacet(facet, base, state);
    }
    let patients = new Map<string, PatientFactsRecord>();
    if (
      demand.facets.has('patient') &&
      this.patients &&
      request.patientProfileIds.length > 0
    ) {
      try {
        patients = await this.patients.loadMany(request.em, {
          tenantId: request.tenantId,
          patientProfileIds: [...new Set(request.patientProfileIds)],
          now: request.now,
          bookingRange: demand.bookingRange,
          needsCoverage: demand.needsCoverage,
          needsCareTeam: demand.needsCareTeam,
          needsBirthDate: demand.needsBirthDate,
        });
      } catch (err) {
        this.logger.warn(
          {
            operation: 'delegated_access.context.patients',
            err: err instanceof Error ? err.message : String(err),
          },
          'No se pudieron resolver los pacientes de la lista; sus condiciones quedan indeterminadas',
        );
      }
    }
    const online = new Map<string, boolean | undefined>();
    if (demand.facets.has('doctorOnline') && this.presence) {
      for (const id of new Set(request.practitionerProfileIds)) {
        online.set(id, await this.presence.isOnline(id).catch(() => undefined));
      }
    }
    const tz = zone ?? DEFAULT_TIME_ZONE;
    const { now } = request;
    return (patientProfileId, practitionerProfileId) => ({
      patient: patientProfileId
        ? patientView(patients.get(patientProfileId), now, tz)
        : undefined,
      session: state.session
        ? { startedAt: state.session.startedAt }
        : undefined,
      network: state.network,
      device: state.device,
      doctorOnline: practitionerProfileId
        ? online.get(practitionerProfileId)
        : undefined,
      stepUpAgeMinutes: null,
      stepUpEnrolled: true,
      usage: () => ({ used: 0, remaining: Number.MAX_SAFE_INTEGER }),
      ...(zone ? { orgTimeZone: zone } : {}),
    });
  }

  /** Lee los contadores que el motor pidió y no tenía. */
  private async loadUsage(
    request: FacetRequest,
    readings: readonly UsageSnapshot[],
    state: LoadedState,
  ): Promise<void> {
    const pending = readings.filter(
      (r) => !state.usageRead.has(SupportUsageCounter.serialize(r.key)),
    );
    const read = await this.counter.peek(
      request.tenantId,
      pending.map((r) => ({ key: r.key, max: r.max })),
      request.now,
    );
    for (const r of pending) {
      const id = SupportUsageCounter.serialize(r.key);
      state.usageRead.add(id);
      const value = read.get(id);
      if (value) state.usage.set(id, value);
    }
    state.loaded.add('usage');
  }

  /** Carga UNA faceta; ante cualquier error la deja ausente (indeterminada). */
  private async loadFacet(
    facet: Facet,
    request: FacetRequest,
    state: LoadedState,
  ): Promise<void> {
    state.loaded.add(facet);
    const { em, tenantId, userId, context, now, demand } = request;
    try {
      switch (facet) {
        case 'patient': {
          if (!context.patientProfileId || !this.patients) return;
          const found = await this.patients.loadMany(em, {
            tenantId,
            patientProfileIds: [context.patientProfileId],
            now,
            bookingRange: demand.bookingRange,
            needsCoverage: demand.needsCoverage,
            needsCareTeam: demand.needsCareTeam,
            needsBirthDate: demand.needsBirthDate,
          });
          state.patient = found.get(context.patientProfileId);
          return;
        }
        case 'session':
        case 'device': {
          if (!context.sessionId || !this.sessions) return;
          state.session ??= await this.sessions.find(em, context.sessionId);
          if (facet === 'device') {
            // SEG A-M5: sin cookie de dispositivo la huella es solo User-Agent +
            // SO (no autentica a nadie y un equipo nuevo nace «de confianza»):
            // «equipo conocido» no se puede afirmar, es `F` (falla cerrado).
            if (!deviceCookieEnabledFromEnv(process.env)) {
              state.device = { trusted: false };
              return;
            }
            const deviceId = context.deviceId ?? state.session?.deviceId;
            if (!deviceId || !this.devices) {
              // Sin dispositivo identificable no es «de confianza»: es `F`.
              if (this.devices && state.session)
                state.device = { trusted: false };
              return;
            }
            const trusted = await this.devices.isTrusted(em, userId, deviceId);
            if (trusted !== undefined) state.device = { trusted };
          }
          return;
        }
        case 'network': {
          if (!this.network) return;
          state.network = await this.network.evaluate(
            em,
            tenantId,
            context.ip,
            now,
          );
          return;
        }
        case 'doctorOnline': {
          if (!request.practitionerProfileId || !this.presence) return;
          state.doctorOnline = await this.presence.isOnline(
            request.practitionerProfileId,
          );
          return;
        }
        case 'stepUp': {
          if (!context.sessionId || !this.stepUp) {
            state.stepUpAge = null;
            return;
          }
          state.stepUpAge = await this.stepUp.ageMinutes(context.sessionId);
          if (state.stepUpAge === null) {
            state.stepUpEnrolled = await this.stepUp.isEnrolled(em, userId);
          }
          return;
        }
        case 'usage':
          return; // se lee por claves en `loadUsage`
      }
    } catch (err) {
      this.logger.warn(
        {
          operation: 'delegated_access.context.facet',
          facet,
          tenantId,
          err: err instanceof Error ? err.message : String(err),
        },
        'No se pudo resolver un hecho de la decisión; la condición queda indeterminada',
      );
    }
  }

  /** Vista de hechos que registra qué faceta lee el motor. */
  private view(
    state: LoadedState,
    touched: Set<Facet>,
    request: FacetRequest,
    zone: string | undefined,
  ): SupportAccessFacts {
    const { now } = request;
    const tz = zone ?? DEFAULT_TIME_ZONE;
    const touch = <T>(facet: Facet, value: T): T => {
      touched.add(facet);
      return value;
    };
    return {
      get patient() {
        touched.add('patient');
        return patientView(state.patient, now, tz);
      },
      get session() {
        return touch(
          'session',
          state.session ? { startedAt: state.session.startedAt } : undefined,
        );
      },
      get network() {
        return touch('network', state.network);
      },
      get device() {
        return touch('device', state.device);
      },
      get doctorOnline() {
        return touch('doctorOnline', state.doctorOnline);
      },
      get stepUpAgeMinutes() {
        return touch(
          'stepUp',
          state.loaded.has('stepUp') ? state.stepUpAge : undefined,
        );
      },
      get stepUpEnrolled() {
        return touch('stepUp', state.stepUpEnrolled);
      },
      get usage() {
        touched.add('usage');
        return (key: UsageKey): UsageReading => {
          const read = state.usage.get(SupportUsageCounter.serialize(key));
          // Lo que todavía no se leyó se mide como «lleno»: jamás abre un tope.
          return read ?? { used: Number.MAX_SAFE_INTEGER, remaining: 0 };
        };
      },
      ...(zone ? { orgTimeZone: zone } : {}),
    };
  }
}

/** Vista de paciente del motor sobre lo que cargó el puerto. */
function patientView(
  record: PatientFactsRecord | undefined,
  now: Date,
  zone: string,
): SupportAccessFacts['patient'] {
  if (!record) return undefined;
  const age = ageInYears(record.birthDate, now);
  const careTeam = new Set(record.careTeam);
  return {
    ...(age !== undefined
      ? { ageYears: age, isMinor: age < ADULT_AGE_YEARS }
      : {}),
    birthDateKnown: age !== undefined,
    flags: record.flags,
    ...(record.insured !== undefined ? { insured: record.insured } : {}),
    ...(record.carrierIds ? { carrierIds: record.carrierIds } : {}),
    hasBookingInWindow: (window, coveredDoctors) => {
      const from = startOfZonedDay(now, zone, -window.daysBefore);
      const to = endOfZonedDayExclusive(now, zone, window.daysAfter);
      if (!from || !to) return false;
      return record.bookings.some(
        (b) =>
          b.startAt.getTime() >= from.getTime() &&
          b.startAt.getTime() < to.getTime() &&
          (!coveredDoctors ||
            (!!b.practitionerProfileId &&
              coveredDoctors.includes(b.practitionerProfileId))),
      );
    },
    inCareTeamOf: (practitionerProfileId) =>
      careTeam.has(practitionerProfileId),
  };
}
