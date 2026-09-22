import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  createdBy,
  type AuthenticatedUser,
} from '../../../common';
import { TestCases, TestEnvironments, TestSuites } from '../../qa_lab/entities';
import { QaRunsService } from '../../qa_lab/services/qa-runs.service';
import {
  approvalViolation,
  buildPlan,
  finalPlanStatus,
  PLAN_TERMINAL,
  type EnvironmentKind,
  type HttpMethod,
  type Limits,
  type PlanResult,
  type PlanStatus,
  type PlanStep,
} from '../domain/plan';
import { redactHeaders, type TargetAllowlist } from '../domain/target-guard';
import {
  ApprovePlanDto,
  ListPlansQueryDto,
  PlanRequestDto,
  UpsertTargetDto,
} from '../dto/qa-execution.dto';
import {
  ExecutionPlans,
  ExecutionTargets,
  PlanApprovals,
  PlanEvents,
} from '../entities';
import { GuardedHttpClient } from '../infrastructure/guarded-http.client';

/** Holgura del lease sobre la duración máxima de un plan (600 s como mucho). */
const LEASE_MS = 15 * 60_000;

const METHOD_BY_CONCEPT: Record<string, HttpMethod> = {
  [CONCEPTS.HTTP_GET]: 'GET',
  [CONCEPTS.HTTP_POST]: 'POST',
  [CONCEPTS.HTTP_PUT]: 'PUT',
  [CONCEPTS.HTTP_PATCH]: 'PATCH',
  [CONCEPTS.HTTP_DELETE]: 'DELETE',
};
const ENV_KIND: Record<string, EnvironmentKind> = {
  [CONCEPTS.QA_ENV_DEV]: 'DEV',
  [CONCEPTS.QA_ENV_STAGING]: 'STAGING',
  [CONCEPTS.QA_ENV_PRODUCTION]: 'PRODUCTION',
};

interface PlanContext {
  suite: TestSuites;
  environment: TestEnvironments;
  environmentKind: EnvironmentKind;
  target: ExecutionTargets;
  cases: TestCases[];
}

/** Lo que el runner saca del `setup_json` de un caso. Nada de cabeceras sensibles. */
function caseRequest(testCase: TestCases): {
  body: unknown;
  headers: Record<string, string>;
} {
  const setup = (testCase.setupJson ?? {}) as {
    request?: { body?: unknown; headers?: Record<string, unknown> };
  };
  const headers = Object.fromEntries(
    Object.entries(setup.request?.headers ?? {})
      .filter(([, value]) => typeof value === 'string')
      .map(([name, value]) => [name.toLowerCase(), value as string]),
  );
  const redacted = redactHeaders(headers);
  return {
    body: setup.request?.body ?? null,
    // Las sensibles del caso se descartan: la única credencial es la del destino.
    headers: Object.fromEntries(
      Object.entries(headers).filter(
        ([name]) => redacted[name] === headers[name],
      ),
    ),
  };
}

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : { value: value ?? null };

const iso = (date: Date | null | undefined) =>
  date ? date.toISOString() : null;

function unprocessable(message: string, details: Record<string, unknown>) {
  return new DomainException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCode.VALIDATION_FAILED,
    message,
    details,
  );
}

/**
 * Plano de ejecución de QA en el servidor. El navegador prepara y observa;
 * este servicio decide qué se llama, con qué límites y con qué aprobación, y
 * el worker `qa_lab` lo ejecuta. La evidencia se escribe con los casos de uso
 * del módulo 36 (executeCase / evaluateResult / finalizeRun), no por un camino
 * paralelo.
 */
@Injectable()
export class QaExecutionService {
  constructor(
    private readonly em: EntityManager,
    private readonly runs: QaRunsService,
    private readonly http: GuardedHttpClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QaExecutionService.name);
  }

  // ------------------------------------------------------------ destinos

  async upsertTarget(
    environmentId: string,
    dto: UpsertTargetDto,
    actor: AuthenticatedUser,
  ) {
    return this.em.transactional(async (tx) => {
      // Lectura fresca: "producción no admite mutaciones" no puede decidirse
      // con un entorno cacheado.
      const environment = await tx.findOne(
        TestEnvironments,
        { id: environmentId },
        { refresh: true },
      );
      if (!environment)
        throw new ResourceNotFoundException('Entorno no encontrado', {
          environmentId,
        });
      const kind = ENV_KIND[environment.environmentConceptId];
      if (kind === 'PRODUCTION' && dto.allowMutations) {
        throw unprocessable('Un destino de producción no admite mutaciones', {
          field: 'allowMutations',
        });
      }
      const now = new Date();
      let target = await tx.findOne(
        ExecutionTargets,
        { environmentId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!target) {
        target = tx.create(
          ExecutionTargets,
          {
            environmentId,
            status: 'ACTIVE',
            ...createdBy(actor.id, now),
          } as never,
          { partial: true },
        );
      }
      Object.assign(target, {
        scheme: dto.scheme,
        host: dto.host.toLowerCase(),
        port: dto.port,
        allowedPathPrefixes: dto.allowedPathPrefixes,
        allowPrivateNetwork: dto.allowPrivateNetwork ?? false,
        allowMutations: dto.allowMutations ?? false,
        authSecretRef: dto.authSecretRef,
        authHeaderName: dto.authHeaderName?.toLowerCase(),
        maxRequests: dto.maxRequests ?? 300,
        maxDurationSeconds: dto.maxDurationSeconds ?? 60,
        requestTimeoutMs: dto.requestTimeoutMs ?? 10_000,
        minIntervalMs: dto.minIntervalMs ?? 200,
        status: dto.status ?? target.status ?? 'ACTIVE',
        updatedAt: now,
        updatedByUserId: actor.id,
      });
      await tx.flush();
      return this.targetView(target);
    });
  }

  async listTargets() {
    const targets = await this.em.find(
      ExecutionTargets,
      {},
      { orderBy: { createdAt: 'asc' } },
    );
    return targets.map((target) => this.targetView(target));
  }

  private targetView(target: ExecutionTargets) {
    return {
      id: target.id,
      environmentId: target.environmentId,
      scheme: target.scheme,
      host: target.host,
      port: target.port,
      allowedPathPrefixes: target.allowedPathPrefixes as string[],
      allowPrivateNetwork: target.allowPrivateNetwork,
      allowMutations: target.allowMutations,
      // Sólo si hay credencial y cómo se llama la variable; nunca su valor.
      authSecretRef: target.authSecretRef ?? null,
      authSecretConfigured: target.authSecretRef
        ? Boolean(process.env[target.authSecretRef])
        : null,
      limits: this.targetLimits(target),
      status: target.status,
      version: target.rowVersion,
    };
  }

  private targetLimits(target: ExecutionTargets): Limits {
    return {
      maxRequests: target.maxRequests,
      maxDurationSeconds: target.maxDurationSeconds,
      requestTimeoutMs: target.requestTimeoutMs,
      minIntervalMs: target.minIntervalMs,
    };
  }

  private allowlist(
    target: ExecutionTargets,
  ): TargetAllowlist & { allowMutations: boolean } {
    return {
      scheme: target.scheme as 'http' | 'https',
      host: target.host,
      port: target.port,
      allowedPathPrefixes: target.allowedPathPrefixes as string[],
      allowPrivateNetwork: target.allowPrivateNetwork,
      allowMutations: target.allowMutations,
    };
  }

  // ------------------------------------------------------------- plan

  private async loadContext(
    tx: EntityManager,
    suiteId: string,
    environmentId: string,
  ): Promise<PlanContext> {
    const suite = await tx.findOne(TestSuites, { id: suiteId });
    if (!suite)
      throw new ResourceNotFoundException('Suite no encontrada', { suiteId });
    if (suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE) {
      throw unprocessable('La suite no está publicada', { suiteId });
    }
    const environment = await tx.findOne(TestEnvironments, {
      id: environmentId,
    });
    if (!environment)
      throw new ResourceNotFoundException('Entorno no encontrado', {
        environmentId,
      });
    if (environment.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
      throw unprocessable('El entorno no está activo', { environmentId });
    }
    const environmentKind = ENV_KIND[environment.environmentConceptId];
    if (!environmentKind)
      throw unprocessable('Tipo de entorno desconocido', { environmentId });
    const target = await tx.findOne(ExecutionTargets, { environmentId });
    if (!target || target.status !== 'ACTIVE') {
      throw unprocessable(
        'El entorno no tiene un destino aprobado para el runner',
        { environmentId },
      );
    }
    const cases = await tx.find(
      TestCases,
      { suiteId, stateConceptId: CONCEPTS.CASE_ACTIVE },
      { orderBy: { ordinal: 'asc', code: 'asc' } },
    );
    return { suite, environment, environmentKind, target, cases };
  }

  private plan(ctx: PlanContext, requested?: Partial<Limits>): PlanResult {
    return buildPlan({
      suiteId: ctx.suite.id,
      suiteVersion: ctx.suite.version,
      environmentId: ctx.environment.id,
      environmentKind: ctx.environmentKind,
      target: this.allowlist(ctx.target),
      targetMax: this.targetLimits(ctx.target),
      requested,
      cases: ctx.cases.map((testCase) => ({
        caseId: testCase.id,
        code: testCase.code,
        method: METHOD_BY_CONCEPT[testCase.httpMethodConceptId ?? ''] ?? null,
        requestPath: testCase.requestPath ?? null,
        body: caseRequest(testCase).body,
      })),
    });
  }

  /** Dry-run: planifica y explica, sin persistir ni llamar a nada. */
  async preflight(dto: PlanRequestDto) {
    const ctx = await this.loadContext(
      this.em.fork(),
      dto.suiteId,
      dto.environmentId,
    );
    const plan = this.plan(ctx, dto.limits);
    return {
      suite: {
        id: ctx.suite.id,
        code: ctx.suite.code,
        version: ctx.suite.version,
      },
      environment: {
        id: ctx.environment.id,
        code: ctx.environment.code,
        kind: ctx.environmentKind,
      },
      target: this.targetView(ctx.target),
      executable: plan.violations.length === 0,
      ...plan,
      concurrency: 1,
      loadTesting:
        'NOT_SUPPORTED: el runner ejecuta pruebas funcionales secuenciales; carga/estrés quedan fuera',
    };
  }

  async createPlan(
    dto: PlanRequestDto,
    idempotencyKey: string | undefined,
    actor: AuthenticatedUser,
  ) {
    if (idempotencyKey) {
      const existing = await this.em.findOne(ExecutionPlans, {
        requestedByUserId: actor.id,
        idempotencyKey,
      });
      if (existing)
        return { plan: await this.getPlan(existing.id), created: false };
    }
    const ctx = await this.loadContext(
      this.em.fork(),
      dto.suiteId,
      dto.environmentId,
    );
    const plan = this.plan(ctx, dto.limits);
    if (plan.violations.length > 0) {
      throw unprocessable('El plan no es ejecutable', {
        violations: plan.violations,
      });
    }
    // La corrida del módulo 36 se abre ya: es donde quedará la evidencia.
    const run = await this.runs.createRun(
      {
        suiteId: dto.suiteId,
        environmentId: dto.environmentId,
        trigger: 'MANUAL',
      } as never,
      actor,
    );
    const now = new Date();
    const entity = await this.em.transactional(async (tx) => {
      const created = tx.create(
        ExecutionPlans,
        {
          runId: run.id,
          suiteId: ctx.suite.id,
          suiteVersion: ctx.suite.version,
          environmentId: ctx.environment.id,
          targetId: ctx.target.id,
          planHash: plan.hash,
          planJson: { steps: plan.steps, clamped: plan.clamped },
          limitsJson: plan.limits,
          requiresApproval: plan.requiresApproval,
          approvalReasons: plan.approvalReasons,
          status: plan.requiresApproval ? 'PENDING_APPROVAL' : 'QUEUED',
          requestedByUserId: actor.id,
          idempotencyKey,
          attempt: 0,
          requestsSent: 0,
          casesPassed: 0,
          casesFailed: 0,
          casesNotRun: 0,
          ...createdBy(actor.id, now),
        } as never,
        { partial: true },
      );
      await tx.flush();
      await this.appendEvent(tx, created.id, 'PLAN_CREATED', null, {
        status: created.status,
        approvalReasons: plan.approvalReasons,
      });
      return created;
    });
    this.logger.info(
      {
        operation: 'qa.plan.create',
        planId: entity.id,
        runId: run.id,
        status: entity.status,
      },
      'QA execution plan accepted',
    );
    return { plan: await this.getPlan(entity.id), created: true };
  }

  async approve(planId: string, dto: ApprovePlanDto, actor: AuthenticatedUser) {
    await this.em.transactional(async (tx) => {
      const plan = await tx.findOne(
        ExecutionPlans,
        { id: planId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!plan)
        throw new ResourceNotFoundException('Plan no encontrado', { planId });
      if (plan.status !== 'PENDING_APPROVAL') {
        throw new ConflictException('El plan no está esperando aprobación', {
          status: plan.status,
        });
      }
      if (dto.planHash !== plan.planHash) {
        throw new ConflictException('El plan revisado no es el vigente', {
          planHash: plan.planHash,
        });
      }
      // Por identidad, no por rol: SUPERADMIN tampoco aprueba lo que pidió.
      if (plan.requestedByUserId && plan.requestedByUserId === actor.id) {
        throw new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Quien pidió el plan no puede aprobarlo',
          // El cliente distingue este 403 (segregación) del de rol por el código.
          {
            violations: [
              {
                field: 'approver',
                reason: 'SELF_APPROVAL',
                message: 'Quien pidió el plan no puede aprobarlo',
              },
            ],
          },
        );
      }
      const now = new Date();
      tx.create(PlanApprovals, {
        planId,
        planHash: plan.planHash,
        decision: dto.decision,
        reason: dto.reason.trim(),
        approverUserId: actor.id,
        expiresAt: new Date(
          now.getTime() + (dto.expiresInMinutes ?? 60) * 60_000,
        ),
        createdAt: now,
      });
      plan.status = dto.decision === 'APPROVED' ? 'QUEUED' : 'REJECTED';
      if (plan.status === 'REJECTED') plan.finishedAt = now;
      plan.updatedAt = now;
      plan.updatedByUserId = actor.id;
      await tx.flush();
      await this.appendEvent(
        tx,
        planId,
        dto.decision === 'APPROVED' ? 'PLAN_APPROVED' : 'PLAN_REJECTED',
        null,
        {
          approverUserId: actor.id,
        },
      );
    });
    return this.getPlan(planId);
  }

  /** En cola o pendiente se cancela ya; en marcha queda la intención y el runner la confirma. */
  async cancel(planId: string, actor: AuthenticatedUser) {
    await this.em.transactional(async (tx) => {
      const plan = await tx.findOne(
        ExecutionPlans,
        { id: planId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!plan)
        throw new ResourceNotFoundException('Plan no encontrado', { planId });
      if (PLAN_TERMINAL.includes(plan.status as PlanStatus)) {
        throw new ConflictException('El plan ya terminó', {
          status: plan.status,
        });
      }
      const now = new Date();
      plan.cancelRequestedAt ??= now;
      if (plan.status !== 'RUNNING') {
        plan.status = 'CANCELLED';
        plan.finishedAt = now;
      }
      plan.updatedAt = now;
      plan.updatedByUserId = actor.id;
      await tx.flush();
      await this.appendEvent(tx, planId, 'CANCEL_REQUESTED', null, {
        byUserId: actor.id,
      });
    });
    return this.getPlan(planId);
  }

  async listPlans(query: ListPlansQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.suiteId) where.suiteId = query.suiteId;
    const plans = await this.em.find(ExecutionPlans, where, {
      orderBy: { createdAt: 'desc', id: 'desc' },
      limit: query.limit ?? 50,
    });
    return plans.map((plan) => this.planSummary(plan));
  }

  private planSummary(plan: ExecutionPlans) {
    return {
      id: plan.id,
      runId: plan.runId,
      suiteId: plan.suiteId,
      suiteVersion: plan.suiteVersion,
      environmentId: plan.environmentId,
      planHash: plan.planHash,
      status: plan.status,
      requiresApproval: plan.requiresApproval,
      approvalReasons: (plan.approvalReasons as string[] | undefined) ?? [],
      requestedByUserId: plan.requestedByUserId ?? null,
      createdAt: iso(plan.createdAt),
      startedAt: iso(plan.startedAt),
      finishedAt: iso(plan.finishedAt),
      cancelRequestedAt: iso(plan.cancelRequestedAt),
      counters: {
        requestsSent: plan.requestsSent,
        casesPassed: plan.casesPassed,
        casesFailed: plan.casesFailed,
        casesNotRun: plan.casesNotRun,
      },
      error: plan.errorCode
        ? { code: plan.errorCode, message: plan.errorMessage ?? '' }
        : null,
    };
  }

  async getPlan(planId: string) {
    const plan = await this.em.fork().findOne(ExecutionPlans, { id: planId });
    if (!plan)
      throw new ResourceNotFoundException('Plan no encontrado', { planId });
    const [approvals, events] = await Promise.all([
      this.em
        .fork()
        .find(PlanApprovals, { planId }, { orderBy: { createdAt: 'desc' } }),
      this.em
        .fork()
        .find(PlanEvents, { planId }, { orderBy: { seq: 'asc' }, limit: 1000 }),
    ]);
    const json = plan.planJson as { steps: PlanStep[]; clamped: string[] };
    return {
      ...this.planSummary(plan),
      steps: json.steps,
      clamped: json.clamped ?? [],
      limits: plan.limitsJson as Limits,
      approvals: approvals.map((approval) => ({
        decision: approval.decision,
        planHash: approval.planHash,
        reason: approval.reason,
        approverUserId: approval.approverUserId,
        expiresAt: iso(approval.expiresAt),
        createdAt: iso(approval.createdAt),
      })),
      events: events.map((event) => ({
        seq: event.seq,
        kind: event.kind,
        caseId: event.caseId ?? null,
        detail: event.detailJson ?? null,
        at: iso(event.createdAt),
      })),
    };
  }

  private async appendEvent(
    tx: EntityManager,
    planId: string,
    kind: string,
    caseId: string | null,
    detail: Record<string, unknown> | null,
  ) {
    const [row] = await tx
      .getConnection()
      .execute<Array<{ next: number }>>(
        'SELECT coalesce(max(seq), 0) + 1 AS next FROM qa_execution.plan_events WHERE plan_id = ?',
        [planId],
        'all',
        tx.getTransactionContext(),
      );
    tx.create(PlanEvents, {
      planId,
      seq: Number(row.next),
      kind,
      caseId: caseId ?? undefined,
      detailJson: detail ?? undefined,
      createdAt: new Date(),
    });
    await tx.flush();
  }

  // ------------------------------------------------------------ runner

  /** Reclama el plan en cola más antiguo (o uno con lease vencido). */
  private async claim(leaseOwner: string) {
    return this.em.transactional(async (tx) => {
      const rows = await tx
        .getConnection()
        .execute<Array<{ id: string; attempt: number }>>(
          `UPDATE qa_execution.execution_plans p
              SET status = 'RUNNING', lease_owner = ?,
                  lease_expires_at = now() + (? || ' milliseconds')::interval,
                  attempt = p.attempt + 1, started_at = coalesce(p.started_at, now()),
                  updated_at = now(), row_version = p.row_version + 1
            WHERE p.id = (
              SELECT id FROM qa_execution.execution_plans
               WHERE status = 'QUEUED' OR (status = 'RUNNING' AND lease_expires_at < now())
               ORDER BY created_at, id LIMIT 1
               FOR UPDATE SKIP LOCKED)
          RETURNING p.id, p.attempt`,
          [leaseOwner, String(LEASE_MS)],
          'all',
          tx.getTransactionContext(),
        );
      return rows[0] ?? null;
    });
  }

  /**
   * Ejecuta el siguiente plan disponible. Lo llama el worker `qa_lab` con su
   * identidad de servicio; devuelve `claimed: 0` si no hay nada.
   */
  async runNext(actor: AuthenticatedUser) {
    const leaseOwner = `${actor.id}:${randomUUID()}`;
    const claimed = await this.claim(leaseOwner);
    if (!claimed) return { claimed: 0 };
    const planId = claimed.id;
    const fenced = { claimed: 1, planId, fenced: true };

    // Un plan que ya había empezado y cuyo worker murió NO se reintenta: algún
    // paso mutante pudo haberse hecho, y repetirlo duplicaría efectos.
    if (claimed.attempt > 1) {
      const status = await this.close(planId, leaseOwner, 'INFRA_ERROR', {
        errorCode: 'WORKER_LOST',
        errorMessage:
          'El worker anterior perdió el lease durante la ejecución; pida un plan nuevo',
      });
      await this.finalizeQuietly(planId, actor);
      return status ? { claimed: 1, planId, status } : fenced;
    }

    const plan = await this.em
      .fork()
      .findOneOrFail(ExecutionPlans, { id: planId });
    let ctx: PlanContext;
    try {
      ctx = await this.loadContext(
        this.em.fork(),
        plan.suiteId,
        plan.environmentId,
      );
    } catch (error) {
      const status = await this.close(planId, leaseOwner, 'INFRA_ERROR', {
        errorCode: 'CONTEXT_UNAVAILABLE',
        errorMessage: (error as Error).message,
      });
      return status ? { claimed: 1, planId, status } : fenced;
    }

    // El plan aprobado tiene que seguir siendo el que se va a ejecutar.
    const current = this.plan(ctx, plan.limitsJson as Limits);
    if (current.hash !== plan.planHash || current.violations.length > 0) {
      const status = await this.close(planId, leaseOwner, 'INFRA_ERROR', {
        errorCode: 'PLAN_DRIFT',
        errorMessage:
          'La suite, el destino o los límites cambiaron desde que se planificó',
      });
      await this.finalizeQuietly(planId, actor);
      return status ? { claimed: 1, planId, status } : fenced;
    }
    if (plan.requiresApproval) {
      const latest = await this.em
        .fork()
        .findOne(PlanApprovals, { planId }, { orderBy: { createdAt: 'desc' } });
      const violation = approvalViolation({
        planHash: plan.planHash,
        requesterId: plan.requestedByUserId ?? null,
        approval: latest
          ? {
              planHash: latest.planHash,
              approverId: latest.approverUserId,
              decision: latest.decision as 'APPROVED' | 'REJECTED',
              expiresAt: latest.expiresAt,
            }
          : null,
        now: new Date(),
      });
      if (violation) {
        // Vencida: vuelve a esperar aprobación en vez de fallar.
        await this.release(
          planId,
          leaseOwner,
          'PENDING_APPROVAL',
          violation.code,
        );
        return {
          claimed: 1,
          planId,
          status: 'PENDING_APPROVAL',
          reason: violation.code,
        };
      }
    }

    const target = ctx.target;
    const secret = target.authSecretRef
      ? process.env[target.authSecretRef]
      : undefined;
    if (target.authSecretRef && !secret) {
      const status = await this.close(planId, leaseOwner, 'INFRA_ERROR', {
        errorCode: 'SECRET_MISSING',
        errorMessage: `La variable ${target.authSecretRef} no está configurada en el runner`,
      });
      await this.finalizeQuietly(planId, actor);
      return status ? { claimed: 1, planId, status } : fenced;
    }
    const authHeader = target.authHeaderName ?? 'authorization';

    const limits = plan.limitsJson as Limits;
    const deadline = Date.now() + limits.maxDurationSeconds * 1000;
    const casesById = new Map(
      ctx.cases.map((testCase) => [testCase.id, testCase]),
    );
    const steps = (plan.planJson as { steps: PlanStep[] }).steps;
    const counters = { sent: 0, passed: 0, failed: 0, infra: 0, notRun: 0 };
    let cancelled = false;
    let timedOut = false;
    await this.em.transactional((tx) =>
      this.appendEvent(tx, planId, 'PLAN_STARTED', null, {
        steps: steps.length,
      }),
    );

    for (const [index, step] of steps.entries()) {
      if (await this.cancelRequested(planId)) {
        cancelled = true;
      } else if (Date.now() >= deadline) {
        timedOut = true;
      } else if (counters.sent >= limits.maxRequests) {
        timedOut = true;
      }
      if (cancelled || timedOut) {
        counters.notRun = steps.length - index;
        await this.em.transactional((tx) =>
          this.appendEvent(
            tx,
            planId,
            cancelled ? 'CANCEL_ACKNOWLEDGED' : 'BUDGET_EXHAUSTED',
            null,
            {
              notRun: counters.notRun,
            },
          ),
        );
        break;
      }

      const testCase = casesById.get(step.caseId)!;
      const request = caseRequest(testCase);
      const headers: Record<string, string> = { ...request.headers };
      if (secret) headers[authHeader] = secret;
      counters.sent += 1;
      const response = await this.http.send(
        {
          method: step.method,
          url: step.url,
          headers,
          body: step.method === 'GET' ? undefined : request.body,
          timeoutMs: limits.requestTimeoutMs,
        },
        this.allowlist(target),
      );

      // La evidencia se guarda SIN el secreto: redacción total antes de persistir.
      const recordedHeaders = redactHeaders(headers, [authHeader]);
      let kind: string;
      let detail: Record<string, unknown>;
      try {
        if (response.kind === 'RESPONSE') {
          const executed = await this.runs.executeCase(
            plan.runId,
            step.caseId,
            {
              requestBodyJson: asObject(request.body),
              requestHeadersJson: recordedHeaders,
              targetUrl: step.url,
              responseBodyJson: asObject(response.body),
              responseHeadersJson: redactHeaders(response.headers),
              httpStatus: response.status,
              latencyMs: response.latencyMs,
            },
            actor,
          );
          const evaluated = await this.runs.evaluateResult(executed.id, actor, {
            status: response.status,
            headers: response.headers,
            body: response.body,
            latencyMs: response.latencyMs,
          });
          const passed =
            evaluated.statusConceptId === CONCEPTS.CASE_RESULT_PASSED;
          if (passed) counters.passed += 1;
          else counters.failed += 1;
          kind = passed ? 'CASE_PASSED' : 'CASE_FAILED';
          detail = {
            httpStatus: response.status,
            latencyMs: response.latencyMs,
            assertionsPassed: evaluated.assertionsPassed,
            assertionsFailed: evaluated.assertionsFailed,
            truncated: response.truncated,
            redirectNotFollowed: response.redirectNotFollowed,
          };
        } else {
          const code =
            response.kind === 'BLOCKED' ? 'BLOCKED_BY_GUARD' : response.code;
          const message =
            response.kind === 'BLOCKED'
              ? response.violations.map((v) => v.code).join(', ')
              : response.message;
          await this.runs.executeCase(
            plan.runId,
            step.caseId,
            {
              requestBodyJson: asObject(request.body),
              requestHeadersJson: recordedHeaders,
              targetUrl: step.url,
              responseBodyJson: {},
              errorText: `${code}: ${message}`,
            },
            actor,
          );
          counters.infra += 1;
          kind =
            response.kind === 'BLOCKED'
              ? 'CASE_BLOCKED'
              : 'CASE_TRANSPORT_ERROR';
          detail = { code, message: message.slice(0, 300) };
        }
      } catch (error) {
        counters.infra += 1;
        kind = 'CASE_RECORDING_FAILED';
        detail = { message: (error as Error).message.slice(0, 300) };
      }
      await this.em.transactional((tx) =>
        this.appendEvent(tx, planId, kind, step.caseId, detail),
      );
      if (limits.minIntervalMs > 0 && index < steps.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, limits.minIntervalMs),
        );
      }
    }

    await this.finalizeQuietly(planId, actor);
    const status = finalPlanStatus({
      cancelled,
      timedOut,
      infraErrors: counters.infra,
      failed: counters.failed,
      executed: counters.passed + counters.failed,
    });
    const closed = await this.close(planId, leaseOwner, status, null, counters);
    this.logger.info(
      { operation: 'qa.plan.run', planId, status, ...counters },
      'QA execution plan finished',
    );
    return closed ? { claimed: 1, planId, status } : fenced;
  }

  private async cancelRequested(planId: string): Promise<boolean> {
    const [row] = await this.em
      .fork()
      .getConnection()
      .execute<Array<{ c: Date | null }>>(
        'SELECT cancel_requested_at AS c FROM qa_execution.execution_plans WHERE id = ?',
        [planId],
        'all',
      );
    return Boolean(row?.c);
  }

  /** Cierra la corrida del módulo 36; si ya estaba cerrada, no es un error del plan. */
  private async finalizeQuietly(planId: string, actor: AuthenticatedUser) {
    const plan = await this.em.fork().findOne(ExecutionPlans, { id: planId });
    if (!plan) return;
    try {
      await this.runs.finalizeRun(plan.runId, actor);
    } catch (error) {
      this.logger.warn(
        { operation: 'qa.plan.finalize', planId, err: error },
        'Run finalize skipped',
      );
    }
  }

  /** Cierre con fencing: si el lease ya no es de este worker, no escribe nada. */
  private async close(
    planId: string,
    leaseOwner: string,
    status: PlanStatus,
    error: { errorCode: string; errorMessage: string } | null,
    counters?: {
      sent: number;
      passed: number;
      failed: number;
      infra: number;
      notRun: number;
    },
  ): Promise<PlanStatus | null> {
    return this.em.transactional(async (tx) => {
      const plan = await tx.findOne(
        ExecutionPlans,
        { id: planId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!plan || plan.leaseOwner !== leaseOwner || plan.status !== 'RUNNING')
        return null;
      const now = new Date();
      plan.status = status;
      plan.finishedAt = now;
      plan.updatedAt = now;
      plan.leaseExpiresAt = undefined;
      if (error) {
        plan.errorCode = error.errorCode;
        plan.errorMessage = error.errorMessage;
      }
      if (counters) {
        plan.requestsSent = counters.sent;
        plan.casesPassed = counters.passed;
        plan.casesFailed = counters.failed + counters.infra;
        plan.casesNotRun = counters.notRun;
      }
      await tx.flush();
      await this.appendEvent(tx, planId, 'PLAN_FINISHED', null, {
        status,
        error: error?.errorCode ?? null,
      });
      return status;
    });
  }

  /** Devuelve el plan a un estado de espera (p. ej. aprobación vencida) liberando el lease. */
  private async release(
    planId: string,
    leaseOwner: string,
    status: PlanStatus,
    reason: string,
  ) {
    await this.em.transactional(async (tx) => {
      const plan = await tx.findOne(
        ExecutionPlans,
        { id: planId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!plan || plan.leaseOwner !== leaseOwner) return;
      plan.status = status;
      plan.leaseOwner = undefined;
      plan.leaseExpiresAt = undefined;
      plan.attempt = 0;
      plan.updatedAt = new Date();
      await tx.flush();
      await this.appendEvent(tx, planId, 'APPROVAL_REQUIRED_AGAIN', null, {
        reason,
      });
    });
  }
}
