import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  SupportAccessReason,
  atomMatchesPattern,
  canSearchPatients,
  evaluateSupportAccess,
  isEngagementLive,
  type EngagementFacts,
  type SupportAccessContext,
  type SupportAccessDecision,
  type SupportAccessQuery,
  type SupportActionInput,
} from '../domain';
import { atomsOfGrant } from '../domain/support-access.candidates';
import {
  SupportAccessRepository,
  type EngagementRecord,
} from '../repositories';
import { RoleTemplates } from '../entities';
import { SupportDecisionPipeline } from './support-decision-pipeline';
import { SupportOnboardingGate } from './support-onboarding-gate';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';
import { toGrantFacts } from './support-grant-facts';
import { isRlsEnforced, withTenantContext } from './tenant-context';

/** Veredicto de responder en nombre de un doctor, con lo que hace falta para sellar el mensaje. */
export interface SupportReplyDecision extends SupportAccessDecision {
  /** Delegación doctor ↔ persona que lo respalda, si se permitió. */
  readonly delegateAssignmentId?: string;
  /** ¿El paciente ve «respondido por su equipo»? */
  readonly disclosureShown?: boolean;
}

/** Un doctor de la bandeja de la persona de apoyo, con lo que puede hacer con él. */
export interface SupportInboxDoctorAccess {
  /** Organización. */
  readonly tenantId: string;
  /** Perfil profesional del doctor. */
  readonly practitionerProfileId: string;
  /** Asignación de rol del doctor en la organización: el id que usa la agenda. */
  readonly roleAssignmentId: string;
  /**
   * ¿Puede responder en su nombre? Siempre `true` en la bandeja: ver exige el
   * mismo permiso del doctor que responder.
   */
  readonly replyAllowed: boolean;
  /** Por qué no, si no puede (sin uso mientras `replyAllowed` sea siempre `true`). */
  readonly replyBlockedReason?: SupportAccessReason;
  /** ¿El paciente ve «respondido por su equipo»? */
  readonly disclosureShown: boolean;
  /** Delegación doctor ↔ persona, si existe. */
  readonly delegateAssignmentId?: string;
}

/** Lo que se sabe de una respuesta en nombre del doctor (condiciones y efectos). */
export interface ReplyOptions {
  /** Canales por los que sale el mensaje (`channels.allow`). */
  readonly channels?: readonly ('CHAT' | 'EMAIL')[];
  /** Paciente de la conversación 1 a 1 (`patients.*`). */
  readonly patientProfileId?: string;
  /** `true` si es la respuesta REAL: consume, pide desafíos y deja registro. */
  readonly act?: boolean;
}

/**
 * Evaluador en memoria de la agenda combinada. Se crea con la estructura (vínculo,
 * reglas de la organización, permisos) y, tras `prime`, con los hechos de los
 * pacientes de la lista cargados EN LOTE (una consulta para todos). Sin `prime`
 * una condición que necesita hechos queda indeterminada (falla cerrado).
 */
export type SupportAccessEvaluator = ((question: {
  action: SupportActionInput;
  practitionerProfileId?: string;
  healthcareServiceId?: string;
  careSpaceId?: string;
  context?: SupportAccessContext;
}) => SupportAccessDecision) & {
  /** Carga, en lote, los hechos de los pacientes que van a aparecer. */
  prime?: (patientProfileIds: readonly string[]) => Promise<void>;
};

/** Entrada de {@link SupportAccessPolicy.can}. */
export interface SupportAccessInput {
  /** Persona de apoyo que actúa. */
  readonly userId: string;
  /** Organización en la que actúa. */
  readonly tenantId: string;
  /** Acción que quiere hacer: un átomo del catálogo o uno de los 15 códigos antiguos. */
  readonly action: SupportActionInput;
  /**
   * Lo que el llamador sabe de la acción (paciente, hora de la cita, canales,
   * monto, motivo, aprobación). Opcional: sin él un permiso sin condiciones se
   * decide como siempre. El origen, la sesión y el dispositivo los completa el
   * servidor, nunca el cliente.
   */
  readonly context?: SupportAccessContext;
  /**
   * Completa el contexto con lo que cuesta una consulta (la hora de la cita):
   * solo se invoca si alguna condición lo usa o hay una aprobación que comparar.
   */
  readonly completeContext?: () => Promise<Partial<SupportAccessContext>>;
  /** Si es `true` la decisión devuelve además su traza (`trace`). */
  readonly explain?: boolean;
  /** Asignación de rol del doctor de la cita. */
  readonly practitionerRoleAssignmentId?: string;
  /**
   * Perfil del doctor de la cita, para quien conoce al doctor y no su
   * asignación de rol (la agenda): basta con que tenga alguna en la organización.
   */
  readonly practitionerProfileId?: string;
  /** Servicio de la cita. */
  readonly healthcareServiceId?: string;
  /** Espacio de la cita. */
  readonly careSpaceId?: string;
}

/**
 * Decide si una persona de apoyo puede hacer una acción sobre la agenda de un
 * doctor. Es el servicio central del módulo, exportado a los demás.
 *
 * La regla (vínculo activo → aceptación del doctor → algún permiso cubre la cita
 * → el permiso incluye la acción → registro) vive en la función pura
 * `evaluateSupportAccess`; esta clase solo carga los datos, verifica que doctor,
 * servicio y espacio sean de la organización y deja el registro estructurado de
 * cada decisión (identificadores, nunca contenido clínico).
 */
@Injectable()
export class SupportAccessPolicy {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lecturas de vínculos, permisos y estructura.
   * @param logger - Logger estructurado.
   * @param pipeline - Reglas de la organización, hechos perezosos, contadores,
   *   aprobaciones y registro de decisiones. Sin él la política decide como
   *   antes del gobierno de accesos (sin condiciones, reglas ni registro).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SupportAccessRepository,
    private readonly logger: PinoLogger,
    @Optional() private readonly pipeline?: SupportDecisionPipeline,
    @Optional() private readonly onboarding?: SupportOnboardingGate,
  ) {
    this.logger.setContext(SupportAccessPolicy.name);
  }

  /**
   * ¿Puede la persona de apoyo hacer la acción sobre ese doctor, servicio y espacio?
   *
   * @param input - Persona, organización, acción y objetivo.
   * @param em - Transacción activa, si la hay; sin ella se lee en un fork.
   * @returns El veredicto con su motivo y el permiso que lo habilitó.
   */
  async can(
    input: SupportAccessInput,
    em?: EntityManager,
  ): Promise<SupportAccessDecision> {
    // Con RLS, una lectura sin transacción no ve ninguna fila: quien no trae la
    // suya abre una acotada a la organización de la pregunta.
    if (!em && isRlsEnforced()) {
      return this.em.transactional((tx) =>
        // N-5: dentro de una petición con RLS esta transacción es un savepoint y
        // `set_config` NO se revierte al liberarlo: se devuelve el contexto previo.
        withTenantContext(tx, input.tenantId, () => this.can(input, tx)),
      );
    }
    const reader = em ?? this.em.fork();
    const decision = await this.decide(reader, input);
    this.logger.info(
      {
        operation: 'delegated_access.support_access.decision',
        userId: input.userId,
        tenantId: input.tenantId,
        action: input.action,
        allowed: decision.allowed,
        ...(decision.effect ? { effect: decision.effect } : {}),
        reason: decision.reason,
        grantId: decision.grantId,
      },
      'Support access decision',
    );
    return decision;
  }

  /**
   * ¿Puede la persona responder mensajes en nombre de un doctor? Prueba cada
   * organización donde la persona tiene vínculo y el doctor tiene asignación; la
   * primera que lo permita decide, y de ella sale la delegación y si se muestra
   * «respondido por su equipo».
   *
   * @param userId - Persona de apoyo.
   * @param practitionerProfileId - Perfil del doctor en nombre de quien responde.
   * @param em - Transacción activa, si la hay.
   * @param onlyTenantId - Si se indica, solo cuenta esa organización: la de la
   *   conversación, para que un vínculo con otra organización del mismo doctor
   *   no abra una conversación que no es de la suya.
   * @param options - Lo que se sabe de la respuesta: canales (`CHAT`/`EMAIL`) y
   *   paciente (conversación 1 a 1) para las condiciones; `act: true` cuando es
   *   la respuesta REAL (consume contadores, pide motivo/aprobación y queda en
   *   la bitácora de decisiones). Sin `act` es una comprobación de elegibilidad
   *   (p. ej. a quién se puede asignar) y no deja efectos.
   * @returns El veredicto, con la delegación y la divulgación si se permitió.
   */
  async canReplyOnBehalf(
    userId: string,
    practitionerProfileId: string,
    em?: EntityManager,
    onlyTenantId?: string,
    options?: ReplyOptions,
  ): Promise<SupportReplyDecision> {
    const reader = em ?? this.em.fork();
    const mine = await this.repo.findEngagements(reader, {
      userId,
      ...(onlyTenantId ? { tenantId: onlyTenantId } : {}),
    });
    if (mine.length === 0) {
      return { allowed: false, reason: SupportAccessReason.NO_ENGAGEMENT };
    }
    const roles = await this.repo.findRoleAssignmentsOfProfile(
      reader,
      practitionerProfileId,
    );
    const tenants = [...new Set(roles.map((r) => r.tenantId))].filter(
      (tenantId) => !onlyTenantId || tenantId === onlyTenantId,
    );
    let last: SupportAccessDecision = {
      allowed: false,
      reason: SupportAccessReason.TARGET_OUTSIDE_TENANT,
    };
    for (const tenantId of tenants) {
      const here = mine.filter((e) => e.tenantId === tenantId);
      if (here.length === 0) continue;
      const facts = await this.loadFacts(reader, here);
      const decision = await this.decideReply(
        reader,
        tenantId,
        userId,
        facts,
        practitionerProfileId,
        options,
      );
      last = decision;
      if (!decision.allowed) continue;
      const delegations = await this.repo.findDelegationsOfEngagements(
        reader,
        here.map((e) => e.assignment.id),
      );
      const delegation = delegations.find(
        (d) =>
          d.practitionerProfileId === practitionerProfileId &&
          !!d.delegate.acceptedAt &&
          d.delegate.mayReplyOnBehalf === true &&
          d.delegate.statusConceptId === STATUS.ACTIVE,
      )?.delegate;
      this.logger.info(
        {
          operation: 'delegated_access.support_access.decision',
          userId,
          tenantId,
          action: 'messages.reply_on_behalf',
          allowed: true,
          grantId: decision.grantId,
        },
        'Support reply decision',
      );
      return {
        ...decision,
        delegateAssignmentId: delegation?.id,
        disclosureShown:
          delegation?.replyDisclosureConceptId !== DELEG.REPLY_DISCLOSURE_HIDE,
      };
    }
    this.logger.info(
      {
        operation: 'delegated_access.support_access.decision',
        userId,
        action: 'messages.reply_on_behalf',
        allowed: false,
        reason: last.reason,
      },
      'Support reply decision',
    );
    return last;
  }

  /**
   * La respuesta REAL en nombre del doctor: igual que {@link canReplyOnBehalf}
   * con `act: true` (cuenta contra los topes, pide motivo, paso extra o
   * aprobación si el permiso lo exige y queda en la bitácora de decisiones).
   * Es la que llama la mensajería al enviar; las comprobaciones de elegibilidad
   * (a quién se puede asignar) siguen usando `canReplyOnBehalf`.
   *
   * @param userId - Persona de apoyo.
   * @param practitionerProfileId - Perfil del doctor.
   * @param em - Transacción activa.
   * @param onlyTenantId - Organización de la conversación.
   * @param options - Canales del mensaje y paciente de la conversación 1 a 1.
   * @returns El veredicto, con la delegación y la divulgación si se permitió.
   */
  canReplyOnBehalfActing(
    userId: string,
    practitionerProfileId: string,
    em: EntityManager | undefined,
    onlyTenantId: string | undefined,
    options: Omit<ReplyOptions, 'act'>,
  ): Promise<SupportReplyDecision> {
    return this.canReplyOnBehalf(
      userId,
      practitionerProfileId,
      em,
      onlyTenantId,
      {
        ...options,
        act: true,
      },
    );
  }

  /**
   * Decide responder en nombre de un doctor en UNA organización. La respuesta
   * real (`act`) pasa por la decisión completa; la comprobación de elegibilidad
   * solo lee (misma regla, sin consumir ni registrar).
   */
  private async decideReply(
    em: EntityManager,
    tenantId: string,
    userId: string,
    facts: EngagementFacts[],
    practitionerProfileId: string,
    options: ReplyOptions | undefined,
  ): Promise<SupportAccessDecision> {
    const query: SupportAccessQuery = {
      action: 'messages.conversation.reply_on_behalf',
      practitionerProfileId,
      ...(options?.channels || options?.patientProfileId
        ? {
            context: {
              ...(options.channels ? { channels: options.channels } : {}),
              ...(options.patientProfileId
                ? { patientProfileId: options.patientProfileId }
                : {}),
            },
          }
        : {}),
    };
    if (!this.pipeline) return evaluateSupportAccess(facts, query, new Date());
    const act = options?.act === true;
    const result = await this.pipeline.evaluate({
      em,
      tenantId,
      userId,
      engagements: facts,
      query,
      sideEffects: act,
    });
    return result.decision;
  }

  /**
   * Un evaluador para decidir muchas citas de una vez: carga una sola vez los
   * vínculos, los permisos, los doctores y los espacios de la organización y
   * responde cada pregunta en memoria con la misma función pura que `can`. Es lo
   * que permite armar la agenda combinada sin una consulta por cita y acción.
   *
   * @param userId - Persona de apoyo.
   * @param tenantId - Organización.
   * @param em - Transacción activa, si la hay.
   * @returns Una función `pregunta → veredicto`.
   */
  async evaluatorFor(
    userId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<SupportAccessEvaluator> {
    // Mismo criterio que `can`: con RLS la carga corre en una transacción de la
    // organización y el evaluador devuelto trabaja en memoria.
    if (!em && isRlsEnforced()) {
      return this.em.transactional((tx) =>
        withTenantContext(tx, tenantId, () =>
          this.evaluatorFor(userId, tenantId, tx),
        ),
      );
    }
    const reader = em ?? this.em.fork();
    const engagements = await this.repo.findEngagements(reader, {
      userId,
      tenantId,
    });
    if (engagements.length === 0) {
      return () => ({
        allowed: false,
        reason: SupportAccessReason.NO_ENGAGEMENT,
      });
    }
    const facts = await this.loadFacts(reader, engagements);
    const roles = await this.repo.findRoleAssignmentsOfTenant(reader, tenantId);
    const spaceIds = await this.repo.findCareSpaceIdsOfTenant(reader, tenantId);
    const spaces = await this.repo.findCareSpaces(reader, spaceIds);
    const rolesOf = new Map<string, string[]>();
    for (const role of roles) {
      rolesOf.set(role.practitionerProfileId, [
        ...(rolesOf.get(role.practitionerProfileId) ?? []),
        role.id,
      ]);
    }
    const now = new Date();
    // Con el gobierno de accesos: reglas de la organización y condiciones se
    // resuelven UNA vez para toda la lista (pacientes en lote); sin él, la
    // función pura de siempre.
    const listing = (
      patientProfileIds: readonly string[],
      withFacts: boolean,
    ) =>
      this.pipeline!.prepareListing({
        em: reader,
        tenantId,
        userId,
        engagements: facts,
        patientProfileIds,
        practitionerProfileIds: [...rolesOf.keys()],
        now,
        withFacts,
      });
    let decide: (query: SupportAccessQuery) => SupportAccessDecision = this
      .pipeline
      ? await listing([], false)
      : (query) => evaluateSupportAccess(facts, query, now);
    const evaluate: SupportAccessEvaluator = (question) => {
      const roleIds = question.practitionerProfileId
        ? rolesOf.get(question.practitionerProfileId)
        : undefined;
      if (question.practitionerProfileId && !roleIds) {
        return {
          allowed: false,
          reason: SupportAccessReason.TARGET_OUTSIDE_TENANT,
        };
      }
      const space = question.careSpaceId
        ? spaces.get(question.careSpaceId)
        : undefined;
      if (question.careSpaceId && !space) {
        return {
          allowed: false,
          reason: SupportAccessReason.TARGET_OUTSIDE_TENANT,
        };
      }
      return decide({
        action: question.action,
        practitionerProfileId: question.practitionerProfileId,
        practitionerRoleAssignmentIds: roleIds,
        healthcareServiceId: question.healthcareServiceId,
        careSpaceId: question.careSpaceId,
        careSpacePath: space?.locationPath,
        careSpaceSiteId: space?.practiceSiteId,
        ...(question.context ? { context: question.context } : {}),
      });
    };
    if (this.pipeline) {
      evaluate.prime = async (patientProfileIds) => {
        decide = await listing(patientProfileIds, true);
      };
    }
    return evaluate;
  }

  /**
   * ¿Se muestra «respondido por su equipo» cuando la persona de apoyo actúa en
   * nombre de este doctor? Es el ajuste SHOW/HIDE de la delegación que el doctor
   * aceptó con ella; por defecto se muestra. No decide si puede actuar, solo
   * cómo se rotula lo que sale en el nombre del doctor.
   *
   * @param userId - Persona de apoyo.
   * @param practitionerProfileId - Perfil del doctor.
   * @param em - Transacción activa, si la hay.
   * @param onlyTenantId - Limita a una organización.
   * @returns `false` solo si el doctor eligió ocultarlo.
   */
  async replyDisclosureOf(
    userId: string,
    practitionerProfileId: string,
    em?: EntityManager,
    onlyTenantId?: string,
  ): Promise<boolean> {
    const reader = em ?? this.em.fork();
    const mine = await this.repo.findEngagements(reader, {
      userId,
      ...(onlyTenantId ? { tenantId: onlyTenantId } : {}),
    });
    if (mine.length === 0) return true;
    const delegations = await this.repo.findDelegationsOfEngagements(
      reader,
      mine.map((e) => e.assignment.id),
    );
    const delegation = delegations.find(
      (d) =>
        d.practitionerProfileId === practitionerProfileId &&
        !!d.delegate.acceptedAt &&
        d.delegate.statusConceptId === STATUS.ACTIVE,
    )?.delegate;
    return delegation?.replyDisclosureConceptId !== DELEG.REPLY_DISCLOSURE_HIDE;
  }

  /**
   * Doctores en cuyo nombre la persona puede responder mensajes: los de cada
   * organización donde tiene vínculo vigente, con la aceptación del doctor, un
   * permiso `messages.reply_on_behalf` que lo cubra y la autorización de responder
   * del propio doctor. Es lo que delimita su bandeja.
   *
   * @param userId - Persona de apoyo.
   * @param em - Transacción activa, si la hay.
   * @param onlyTenantId - Limita el resultado a una organización.
   * @returns Pares organización ↔ doctor, con la divulgación que sella el mensaje.
   */
  async replyableDoctors(
    userId: string,
    em?: EntityManager,
    onlyTenantId?: string,
  ): Promise<
    {
      tenantId: string;
      practitionerProfileId: string;
      disclosureShown: boolean;
    }[]
  > {
    const reader = em ?? this.em.fork();
    const mine = await this.repo.findEngagements(reader, {
      userId,
      ...(onlyTenantId ? { tenantId: onlyTenantId } : {}),
    });
    const out: {
      tenantId: string;
      practitionerProfileId: string;
      disclosureShown: boolean;
    }[] = [];
    const tenants = [...new Set(mine.map((e) => e.tenantId))];
    const now = new Date();
    for (const tenantId of tenants) {
      const here = mine.filter((e) => e.tenantId === tenantId);
      const facts = await this.loadFacts(reader, here);
      const roles = await this.repo.findRoleAssignmentsOfTenant(
        reader,
        tenantId,
      );
      const doctors = [...new Set(roles.map((r) => r.practitionerProfileId))];
      const delegations = await this.repo.findDelegationsOfEngagements(
        reader,
        here.map((e) => e.assignment.id),
      );
      for (const practitionerProfileId of doctors) {
        if (
          !(await this.listed(
            reader,
            tenantId,
            facts,
            practitionerProfileId,
            now,
          ))
        )
          continue;
        const delegation = delegations.find(
          (d) =>
            d.practitionerProfileId === practitionerProfileId &&
            !!d.delegate.acceptedAt &&
            d.delegate.mayReplyOnBehalf === true &&
            d.delegate.statusConceptId === STATUS.ACTIVE,
        )?.delegate;
        out.push({
          tenantId,
          practitionerProfileId,
          disclosureShown:
            delegation?.replyDisclosureConceptId !==
            DELEG.REPLY_DISCLOSURE_HIDE,
        });
      }
    }
    return out;
  }

  /**
   * Organizaciones donde la persona tiene un vínculo de apoyo VIVO (activo,
   * vigente, membresía activa y recertificación al día). Es lo que acota las
   * lecturas `me/*` con RLS: solo se entra a estas organizaciones, nunca a todas.
   * Lee únicamente filas de la propia persona (su usuario es el filtro).
   *
   * @param userId - Persona de apoyo.
   * @param em - Transacción activa, si la hay; sin ella se lee en un fork.
   * @param onlyTenantId - Si se indica, solo esa organización.
   * @returns Ids de organización, sin repetir.
   */
  async liveEngagementTenants(
    userId: string,
    em?: EntityManager,
    onlyTenantId?: string,
  ): Promise<string[]> {
    const reader = em ?? this.em.fork();
    const mine = await this.repo.findEngagements(reader, {
      userId,
      ...(onlyTenantId ? { tenantId: onlyTenantId } : {}),
    });
    const now = new Date();
    const live = mine.filter(
      ({ assignment, membershipStatusConceptId, membershipEndDate }) =>
        isEngagementLive(
          {
            assignmentActive: assignment.statusConceptId === STATUS.ACTIVE,
            validFrom: assignment.validFrom,
            validTo: assignment.validTo,
            membershipActive:
              membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE,
            membershipEndDate,
            nextRecertificationAt: assignment.nextRecertificationAt,
          },
          now,
        ),
    );
    return [...new Set(live.map((e) => e.tenantId))];
  }

  /**
   * Doctores de UNA organización cuyas conversaciones la persona puede ver. Ve la
   * conversación quien tiene vínculo vivo, la aceptación del doctor, el permiso
   * del doctor para responder en su nombre (`may_reply_on_behalf`) y un permiso
   * `messages.reply_on_behalf` que cubre al doctor: la misma regla de
   * `canReplyOnBehalf`. Una aceptación sin `may_reply_on_behalf` (la que el
   * doctor da solo para la agenda) no abre su bandeja: leer sus conversaciones es
   * más amplio que agendar. Por eso todo doctor devuelto aquí admite respuesta
   * (`replyAllowed` es siempre `true`).
   *
   * Las organizaciones se leen de a una: con RLS el llamador entra a cada una con
   * `PersonScope.inTenant` antes de llamar.
   *
   * @param userId - Persona de apoyo.
   * @param tenantId - Organización ya verificada con vínculo vivo.
   * @param em - Transacción activa, si la hay.
   * @returns Los doctores visibles, con la delegación y la divulgación de cada uno.
   */
  async inboxDoctorsOfTenant(
    userId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<SupportInboxDoctorAccess[]> {
    const reader = em ?? this.em.fork();
    const mine = await this.repo.findEngagements(reader, { userId, tenantId });
    if (mine.length === 0) return [];
    const facts = await this.loadFacts(reader, mine);
    const roles = await this.repo.findRoleAssignmentsOfTenant(reader, tenantId);
    const delegations = await this.repo.findDelegationsOfEngagements(
      reader,
      mine.map((e) => e.assignment.id),
    );
    const firstRole = new Map<string, string>();
    for (const role of roles) {
      if (!firstRole.has(role.practitionerProfileId)) {
        firstRole.set(role.practitionerProfileId, role.id);
      }
    }
    const now = new Date();
    const out: SupportInboxDoctorAccess[] = [];
    for (const [practitionerProfileId, roleAssignmentId] of firstRole) {
      if (
        !(await this.listed(
          reader,
          tenantId,
          facts,
          practitionerProfileId,
          now,
        ))
      )
        continue;
      const delegation = delegations.find(
        (d) =>
          d.practitionerProfileId === practitionerProfileId &&
          !!d.delegate.acceptedAt &&
          d.delegate.statusConceptId === STATUS.ACTIVE,
      )?.delegate;
      out.push({
        tenantId,
        practitionerProfileId,
        roleAssignmentId,
        replyAllowed: true,
        disclosureShown:
          delegation?.replyDisclosureConceptId !== DELEG.REPLY_DISCLOSURE_HIDE,
        delegateAssignmentId: delegation?.id,
      });
    }
    return out;
  }

  /**
   * Decide, conversación por conversación, si la persona puede LEER la bandeja
   * de ese doctor con ese paciente (SEG A-A3). Es la misma decisión que
   * responder en su nombre (`messages.conversation.reply_on_behalf`) pero en
   * modo `peek` y con los hechos del paciente cargados en lote: así se aplican
   * al leer las condiciones del permiso (horario, red, sesión, dispositivo,
   * topes) y la exclusión de pacientes (VIP, confidencial, banderas, edad,
   * cobertura), que antes solo cerraban el envío. Falla cerrado: sin paciente
   * identificado, una condición que lo necesita queda indeterminada y niega.
   *
   * Un desafío (`CHALLENGE`: motivo, paso extra o aprobación al RESPONDER) no
   * oculta la conversación: pedirá lo que corresponda al actuar.
   *
   * @param userId - Persona de apoyo.
   * @param tenantId - Organización (ya verificada con vínculo vivo).
   * @param items - Conversaciones a decidir (`key` la identifica en la respuesta).
   * @param em - Transacción activa (con RLS, ya dentro de la organización).
   * @returns `key → true` si la conversación se puede mostrar.
   */
  async decideInboxConversations(
    userId: string,
    tenantId: string,
    items: readonly {
      readonly key: string;
      readonly practitionerProfileId: string;
      readonly patientProfileId?: string;
    }[],
    em?: EntityManager,
  ): Promise<Map<string, boolean>> {
    const out = new Map<string, boolean>();
    if (items.length === 0) return out;
    const evaluate = await this.evaluatorFor(userId, tenantId, em);
    await evaluate.prime?.([
      ...new Set(
        items.map((i) => i.patientProfileId).filter((id): id is string => !!id),
      ),
    ]);
    for (const item of items) {
      const decision = evaluate({
        action: 'messages.conversation.reply_on_behalf',
        practitionerProfileId: item.practitionerProfileId,
        ...(item.patientProfileId
          ? { context: { patientProfileId: item.patientProfileId } }
          : {}),
      });
      out.set(item.key, decision.allowed || decision.effect === 'CHALLENGE');
    }
    return out;
  }

  /**
   * ¿El perfil es el de un doctor con asignación de rol vigente en la
   * organización? Sirve para no atar una respuesta preparada o un permiso a un
   * doctor de otra organización.
   *
   * @param practitionerProfileId - Perfil profesional.
   * @param tenantId - Organización.
   * @param em - Transacción activa, si la hay.
   * @returns `true` si atiende en esa organización.
   */
  async isDoctorOfTenant(
    practitionerProfileId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<boolean> {
    const reader = em ?? this.em.fork();
    const roles = await this.repo.findRoleAssignmentsOfPractitioner(
      reader,
      practitionerProfileId,
      tenantId,
    );
    return roles.length > 0;
  }

  /**
   * Personas de apoyo de una organización que pueden responder en nombre de un
   * doctor (vínculo vivo, aceptación del doctor con permiso de responder y un
   * permiso `messages.reply_on_behalf` que lo cubre). Es la lista de a quién se
   * le puede asignar una conversación de ese doctor.
   *
   * @param tenantId - Organización ya verificada.
   * @param practitionerProfileId - Doctor.
   * @param em - Transacción activa, si la hay.
   * @returns Ids de usuario, sin repetir.
   */
  async replyersOfDoctor(
    tenantId: string,
    practitionerProfileId: string,
    em?: EntityManager,
  ): Promise<string[]> {
    const reader = em ?? this.em.fork();
    const records = await this.repo.findEngagements(reader, { tenantId });
    if (records.length === 0) return [];
    const facts = await this.loadFacts(reader, records);
    const userOf = new Map(records.map((r) => [r.assignment.id, r.userId]));
    const now = new Date();
    const out = new Set<string>();
    for (const userId of new Set(records.map((r) => r.userId))) {
      const mine = facts.filter((f) => userOf.get(f.engagementId) === userId);
      if (await this.listed(reader, tenantId, mine, practitionerProfileId, now))
        out.add(userId);
    }
    return [...out];
  }

  /**
   * ¿Puede la persona buscar pacientes en la organización?
   *
   * @param userId - Persona de apoyo.
   * @param tenantId - Organización.
   * @param em - Transacción activa, si la hay.
   * @returns `true` si tiene vínculo vigente con un permiso que trate con pacientes.
   */
  async canSearchPatients(
    userId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<boolean> {
    const reader = em ?? this.em.fork();
    const engagements = await this.repo.findEngagements(reader, {
      userId,
      tenantId,
    });
    if (engagements.length === 0) return false;
    const facts = await this.loadFacts(reader, engagements);
    const now = new Date();
    if (!canSearchPatients(facts, now)) return false;
    // Una regla de la organización que prohíbe la búsqueda de pacientes (p. ej.
    // `DENY_PERMISSION` sobre `patients.search.exact` para una plantilla) se
    // aplica también aquí: la búsqueda no depende de un doctor concreto.
    return !(await this.deniedByOrgRule(
      reader,
      tenantId,
      facts,
      'patients.search.exact',
      now,
    ));
  }

  /**
   * De los pacientes encontrados por una búsqueda exacta, cuáles ve la persona:
   * las condiciones `patients` de sus permisos (alcance, edad, banderas,
   * cobertura) actúan como filtro y el cupo de pacientes distintos se consume
   * solo por los que quedan. Un paciente fuera del alcance es indistinguible de
   * uno inexistente. Sin condiciones devuelve la lista tal cual.
   *
   * @param userId - Persona de apoyo.
   * @param tenantId - Organización.
   * @param patientProfileIds - Pacientes encontrados.
   * @param em - Transacción activa, si la hay.
   * @returns Los ids visibles.
   */
  async filterSearchResults(
    userId: string,
    tenantId: string,
    patientProfileIds: readonly string[],
    em?: EntityManager,
  ): Promise<Set<string>> {
    if (!this.pipeline || patientProfileIds.length === 0) {
      return new Set(patientProfileIds);
    }
    const reader = em ?? this.em.fork();
    const engagements = await this.repo.findEngagements(reader, {
      userId,
      tenantId,
    });
    if (engagements.length === 0) return new Set();
    const facts = await this.loadFacts(reader, engagements);
    return this.pipeline.filterPatients({
      em: reader,
      tenantId,
      userId,
      engagements: facts,
      atom: 'patients.search.exact',
      patientProfileIds,
    });
  }

  /**
   * ¿Una regla `DENY_PERMISSION` de la organización cierra el átomo para TODOS
   * los vínculos vivos de la persona que lo tienen? (Quien tiene el átomo por un
   * vínculo de otra plantilla no queda cerrado por la regla de esta.)
   */
  async deniedByOrgRule(
    em: EntityManager,
    tenantId: string,
    facts: readonly EngagementFacts[],
    atom: string,
    now: Date,
  ): Promise<boolean> {
    if (!this.pipeline) return false;
    const rules = (await this.pipeline.rulesFor(em, tenantId, now)).filter(
      (r) =>
        r.kind === 'DENY_PERMISSION' &&
        atomMatchesPattern(atom, r.permissionPattern),
    );
    if (rules.length === 0) return false;
    const holders = facts.filter(
      (e) =>
        e.active &&
        e.grants.some(
          (g) => g.active && g.effect !== 'DENY' && atomsOfGrant(g).has(atom),
        ),
    );
    return (
      holders.length > 0 &&
      holders.every((e) =>
        rules.some(
          (r) => !r.roleTemplateCode || r.roleTemplateCode === e.templateCode,
        ),
      )
    );
  }

  /**
   * Deja en `access_decision_log` la denegación de una regla de la organización
   * (`DENY_PERMISSION`) que cierra un átomo de pacientes (buscar o registrar), que
   * no pasa por el motor por doctor. Solo asienta; no decide.
   *
   * @param em - Transacción activa.
   * @param tenantId - Organización.
   * @param userId - Persona que intentó.
   * @param atom - Átomo cerrado.
   */
  async recordOrgRuleDenial(
    em: EntityManager,
    tenantId: string,
    userId: string,
    atom: string,
  ): Promise<void> {
    await this.denyEarly(
      em,
      { userId, tenantId, action: atom } as SupportAccessInput,
      SupportAccessReason.ORG_RULE_DENY,
    );
  }

  /**
   * ¿Se lista a este doctor para la persona? Misma decisión estructural que
   * responder en su nombre (vínculo, aceptación, permiso, reglas de la
   * organización y prohibiciones), pero una condición de contexto que hoy no se
   * cumple (horario, canal, paciente…) NO oculta al doctor: lo que importa se
   * vuelve a decidir al responder.
   */
  private async listed(
    em: EntityManager,
    tenantId: string,
    facts: EngagementFacts[],
    practitionerProfileId: string,
    now: Date,
  ): Promise<boolean> {
    const query: SupportAccessQuery = {
      action: 'messages.conversation.reply_on_behalf',
      practitionerProfileId,
    };
    if (!this.pipeline) return evaluateSupportAccess(facts, query, now).allowed;
    const decision = await this.pipeline.evaluateStructure({
      em,
      tenantId,
      engagements: facts,
      query,
      now,
    });
    return (
      decision.allowed ||
      decision.effect === 'CHALLENGE' ||
      (decision.effect === 'DENY' && (decision.unmet?.length ?? 0) > 0)
    );
  }

  /** Carga los datos, valida el tenant del objetivo y delega en el motor (y su servicio de gobierno). */
  private async decide(
    em: EntityManager,
    input: SupportAccessInput,
  ): Promise<SupportAccessDecision> {
    const engagements = await this.repo.findEngagements(em, {
      userId: input.userId,
      tenantId: input.tenantId,
    });
    if (engagements.length === 0) {
      return this.denyEarly(em, input, SupportAccessReason.NO_ENGAGEMENT);
    }

    const target = await this.resolveTarget(em, input);
    if (!target) {
      return this.denyEarly(
        em,
        input,
        SupportAccessReason.TARGET_OUTSIDE_TENANT,
      );
    }

    const facts = await this.loadFacts(em, engagements);
    const query: SupportAccessQuery = {
      action: input.action,
      practitionerProfileId: target.practitionerProfileId,
      practitionerRoleAssignmentIds: target.practitionerRoleAssignmentIds,
      healthcareServiceId: input.healthcareServiceId,
      careSpaceId: input.careSpaceId,
      careSpacePath: target.careSpacePath,
      careSpaceSiteId: target.careSpaceSiteId,
      ...(input.context ? { context: input.context } : {}),
    };
    if (!this.pipeline) return evaluateSupportAccess(facts, query, new Date());
    const result = await this.pipeline.evaluate({
      em,
      tenantId: input.tenantId,
      userId: input.userId,
      engagements: facts,
      query,
      ...(input.completeContext
        ? { completeContext: input.completeContext }
        : {}),
    });
    return input.explain
      ? { ...result.decision, trace: result.trace }
      : result.decision;
  }

  /** `DENY` previo al motor (sin vínculo u objetivo ajeno): también deja asiento. */
  private async denyEarly(
    em: EntityManager,
    input: SupportAccessInput,
    reason: SupportAccessReason,
  ): Promise<SupportAccessDecision> {
    const decision: SupportAccessDecision = { allowed: false, reason };
    if (!this.pipeline) return decision;
    await this.pipeline.recordEarlyDeny(
      {
        em,
        tenantId: input.tenantId,
        userId: input.userId,
        query: {
          action: input.action,
          ...(input.context ? { context: input.context } : {}),
        },
      },
      decision,
    );
    return { ...decision, effect: 'DENY' };
  }

  /** Resuelve el perfil del doctor y la ruta del espacio; `null` si algo es ajeno. */
  private async resolveTarget(
    em: EntityManager,
    input: SupportAccessInput,
  ): Promise<{
    practitionerProfileId?: string;
    practitionerRoleAssignmentIds?: string[];
    careSpacePath?: string;
    careSpaceSiteId?: string;
  } | null> {
    let practitionerProfileId: string | undefined;
    let practitionerRoleAssignmentIds: string[] | undefined;
    if (input.practitionerProfileId) {
      const roles = await this.repo.findRoleAssignmentsOfPractitioner(
        em,
        input.practitionerProfileId,
        input.tenantId,
      );
      if (roles.length === 0) return null;
      practitionerProfileId = input.practitionerProfileId;
      practitionerRoleAssignmentIds = roles.map((r) => r.id);
    } else if (input.practitionerRoleAssignmentId) {
      const roles = await this.repo.findRoleAssignments(em, [
        input.practitionerRoleAssignmentId,
      ]);
      const role = roles.get(input.practitionerRoleAssignmentId);
      if (!role || role.tenantId !== input.tenantId) return null;
      practitionerProfileId = role.practitionerProfileId;
      practitionerRoleAssignmentIds = [role.id];
    }
    if (input.healthcareServiceId) {
      const services = await this.repo.findServices(em, [
        input.healthcareServiceId,
      ]);
      const service = services.get(input.healthcareServiceId);
      if (!service || service.tenantId !== input.tenantId) return null;
    }
    let careSpacePath: string | undefined;
    let careSpaceSiteId: string | undefined;
    if (input.careSpaceId) {
      const spaces = await this.repo.findCareSpaces(em, [input.careSpaceId]);
      const space = spaces.get(input.careSpaceId);
      if (!space || space.tenantId !== input.tenantId) return null;
      careSpacePath = space.locationPath;
      careSpaceSiteId = space.practiceSiteId;
    }
    return {
      practitionerProfileId,
      practitionerRoleAssignmentIds,
      careSpacePath,
      careSpaceSiteId,
    };
  }

  /**
   * Hechos de los vínculos: permisos con sus acciones y doctores que aceptaron.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param engagements - Vínculos ya cargados.
   * @returns Los hechos listos para la evaluación pura.
   */
  async loadFacts(
    em: EntityManager,
    engagements: readonly EngagementRecord[],
  ): Promise<EngagementFacts[]> {
    const ids = engagements.map((e) => e.assignment.id);
    const grants = await this.repo.findGrantsWithActions(em, ids);
    const delegations = await this.repo.findDelegationsOfEngagements(em, ids);
    const roles = await this.repo.findRoleAssignments(
      em,
      grants
        .map((g) => g.grant.practitionerRoleAssignmentId)
        .filter((id): id is string => !!id),
    );
    const now = Date.now();
    const instant = new Date(now);
    const templateCodes = await this.templateCodesOf(em, engagements);
    // Compuerta de ingreso (D-03): solo vínculos nuevos y sin ingreso completo.
    const gates = this.onboarding
      ? await this.onboarding.gatesFor(em, engagements, instant)
      : undefined;
    return engagements.map((record) => {
      const { assignment } = record;
      const gate = gates?.get(assignment.id);
      return {
        engagementId: assignment.id,
        userId: record.userId,
        ...(gate?.incomplete
          ? { onboardingIncomplete: true, onboardingPending: gate.pending }
          : {}),
        ...(templateCodes.get(assignment.id)
          ? { templateCode: templateCodes.get(assignment.id) }
          : {}),
        // Vínculo, membresía y recertificación se miran aquí, en cada decisión:
        // no depende de que el barrido del worker ya haya corrido.
        active: isEngagementLive(
          {
            assignmentActive: assignment.statusConceptId === STATUS.ACTIVE,
            membershipActive:
              record.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE,
            membershipEndDate: record.membershipEndDate,
            nextRecertificationAt: assignment.nextRecertificationAt,
          },
          instant,
        ),
        validFrom: assignment.validFrom,
        validTo: assignment.validTo,
        acceptances: delegations
          .filter(
            ({ delegate }) =>
              delegate.delegateUserAssignmentId === assignment.id &&
              !!delegate.acceptedAt &&
              delegate.statusConceptId === STATUS.ACTIVE &&
              (!delegate.validTo || delegate.validTo.getTime() > now),
          )
          .map(({ delegate, practitionerProfileId }) => ({
            practitionerProfileId,
            mayReplyOnBehalf: delegate.mayReplyOnBehalf === true,
          })),
        grants: grants
          .filter((g) => g.grant.organizationUserAssignmentId === assignment.id)
          .map(({ grant, permissionIds, actions }) =>
            toGrantFacts(
              grant,
              permissionIds,
              grant.practitionerRoleAssignmentId
                ? roles.get(grant.practitionerRoleAssignmentId)
                    ?.practitionerProfileId
                : undefined,
              actions,
            ),
          ),
      };
    });
  }

  /**
   * Código de plantilla de cada vínculo, SOLO si alguna regla de la
   * organización lo necesita (`roleTemplateCode`): sin reglas por plantilla no
   * hay consulta de más (las reglas están en caché).
   */
  private async templateCodesOf(
    em: EntityManager,
    engagements: readonly EngagementRecord[],
  ): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (!this.pipeline || engagements.length === 0) return out;
    const now = new Date();
    let needed = false;
    for (const tenantId of new Set(engagements.map((e) => e.tenantId))) {
      const rules = await this.pipeline.rulesFor(em, tenantId, now);
      if (rules.some((r) => r.roleTemplateCode)) needed = true;
    }
    if (!needed) return out;
    const ids = [
      ...new Set(
        engagements
          .map((e) => e.assignment.roleTemplateId)
          .filter((id): id is string => !!id),
      ),
    ];
    if (ids.length === 0) return out;
    const templates = await em.find(RoleTemplates, { id: { $in: ids } });
    const codeOf = new Map(templates.map((t) => [t.id, t.code]));
    for (const e of engagements) {
      const code = e.assignment.roleTemplateId
        ? codeOf.get(e.assignment.roleTemplateId)
        : undefined;
      if (code) out.set(e.assignment.id, code);
    }
    return out;
  }
}
