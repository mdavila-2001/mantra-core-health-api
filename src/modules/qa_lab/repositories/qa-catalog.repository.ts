import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TestEnvironments,
  TestSuites,
  TestCases,
  TestAssertions,
  TestSchedules,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create environment data.
 */
export interface CreateEnvironmentData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a environment concept.
   */
  environmentConceptId: string;
  /**
   * Valor de base url mantenido por la instancia.
   */
  baseUrl?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de config json mantenido por la instancia.
   */
  configJson?: unknown;
  /**
   * Valor de is production safe mantenido por la instancia.
   */
  isProductionSafe: boolean;
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
 * Describe el contrato estructural de create case data.
 */
export interface CreateCaseData {
  /**
   * Identificador asociado a suite.
   */
  suiteId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a case type concept.
   */
  caseTypeConceptId?: string;
  /**
   * Identificador asociado a endpoint.
   */
  endpointId?: string;
  /**
   * Identificador asociado a http method concept.
   */
  httpMethodConceptId?: string;
  /**
   * Valor de request path mantenido por la instancia.
   */
  requestPath?: string;
  /**
   * Valor de expected http status mantenido por la instancia.
   */
  expectedHttpStatus?: number;
  /**
   * Valor de setup json mantenido por la instancia.
   */
  setupJson?: unknown;
  /**
   * Valor de teardown json mantenido por la instancia.
   */
  teardownJson?: unknown;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Valor de is critical mantenido por la instancia.
   */
  isCritical: boolean;
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
 * Describe el contrato estructural de create schedule data.
 */
export interface CreateScheduleData {
  /**
   * Identificador asociado a suite.
   */
  suiteId: string;
  /**
   * Identificador asociado a environment.
   */
  environmentId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de cron expression mantenido por la instancia.
   */
  cronExpression?: string;
  /**
   * Valor de timezone mantenido por la instancia.
   */
  timezone?: string;
  /**
   * Identificador asociado a trigger concept.
   */
  triggerConceptId: string;
  /**
   * Identificador asociado a concurrency policy concept.
   */
  concurrencyPolicyConceptId?: string;
  /**
   * Valor de next run at mantenido por la instancia.
   */
  nextRunAt?: Date;
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
 * Acceso al catálogo de pruebas de `qa_lab.*`: entornos, suites, casos,
 * aserciones y programaciones. Sin reglas de negocio.
 */
@Injectable()
export class QaCatalogRepository {
  // --- Entornos (UC-36-01) ---

  /**
   * Crea create environment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create environment conforme al contrato `TestEnvironments`.
   */
  createEnvironment(
    em: EntityManager,
    data: CreateEnvironmentData,
  ): TestEnvironments {
    return em.create(
      TestEnvironments,
      {
        code: data.code,
        name: data.name,
        environmentConceptId: data.environmentConceptId,
        baseUrl: data.baseUrl,
        tenantId: data.tenantId,
        configJson: data.configJson,
        isProductionSafe: data.isProductionSafe,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find environment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find environment by id conforme al contrato `Promise<TestEnvironments | null>`.
   */
  findEnvironmentById(
    em: EntityManager,
    id: string,
  ): Promise<TestEnvironments | null> {
    return em.findOne(TestEnvironments, { id });
  }

  /**
   * Obtiene find environment by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find environment by code conforme al contrato `Promise<TestEnvironments | null>`.
   */
  findEnvironmentByCode(
    em: EntityManager,
    code: string,
  ): Promise<TestEnvironments | null> {
    return em.findOne(TestEnvironments, { code });
  }

  // --- Suites (UC-36-02, UC-36-03) ---

  /**
   * Obtiene find suite by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find suite by id conforme al contrato `Promise<TestSuites | null>`.
   */
  findSuiteById(em: EntityManager, id: string): Promise<TestSuites | null> {
    return em.findOne(TestSuites, { id });
  }

  /** Añadir casos y publicar exigen la suite bloqueada. */
  findSuiteForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<TestSuites | null> {
    return em.findOne(
      TestSuites,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Casos y aserciones (UC-36-02, UC-36-03) ---

  /**
   * Crea create case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create case conforme al contrato `TestCases`.
   */
  createCase(em: EntityManager, data: CreateCaseData): TestCases {
    return em.create(
      TestCases,
      {
        suiteId: data.suiteId,
        code: data.code,
        name: data.name,
        caseTypeConceptId: data.caseTypeConceptId,
        endpointId: data.endpointId,
        httpMethodConceptId: data.httpMethodConceptId,
        requestPath: data.requestPath,
        expectedHttpStatus: data.expectedHttpStatus,
        setupJson: data.setupJson,
        teardownJson: data.teardownJson,
        ordinal: data.ordinal,
        isCritical: data.isCritical,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find case by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find case by id conforme al contrato `Promise<TestCases | null>`.
   */
  findCaseById(em: EntityManager, id: string): Promise<TestCases | null> {
    return em.findOne(TestCases, { id });
  }

  /**
   * Obtiene find case by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param suiteId - Identificador de suite.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find case by code conforme al contrato `Promise<TestCases | null>`.
   */
  findCaseByCode(
    em: EntityManager,
    suiteId: string,
    code: string,
  ): Promise<TestCases | null> {
    return em.findOne(TestCases, { suiteId, code });
  }

  /** Casos de la suite en orden de ejecución. */
  findCasesBySuite(em: EntityManager, suiteId: string): Promise<TestCases[]> {
    return em.find(TestCases, { suiteId }, { orderBy: { ordinal: 'ASC' } });
  }

  /** Casos de la suite bloqueados: publicar los activa todos a la vez. */
  findCasesBySuiteForUpdate(
    em: EntityManager,
    suiteId: string,
  ): Promise<TestCases[]> {
    return em.find(
      TestCases,
      { suiteId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Ejecuta la operación count active cases.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param suiteId - Identificador de suite.
   * @param activeStateConceptId - Identificador de active state concept.
   * @returns Resultado de count active cases conforme al contrato `Promise<number>`.
   */
  countActiveCases(
    em: EntityManager,
    suiteId: string,
    activeStateConceptId: string,
  ): Promise<number> {
    return em.count(TestCases, {
      suiteId,
      stateConceptId: activeStateConceptId,
    });
  }

  /**
   * Crea create assertion.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assertion conforme al contrato `TestAssertions`.
   */
  createAssertion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a test case.
       */
      testCaseId: string;
      /**
       * Identificador asociado a assertion type concept.
       */
      assertionTypeConceptId: string;
      /**
       * Valor de json path mantenido por la instancia.
       */
      jsonPath?: string;
      /**
       * Identificador asociado a operator concept.
       */
      operatorConceptId?: string;
      /**
       * Valor de expected value mantenido por la instancia.
       */
      expectedValue?: string;
      /**
       * Valor de tolerance mantenido por la instancia.
       */
      tolerance?: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): TestAssertions {
    return em.create(
      TestAssertions,
      {
        testCaseId: data.testCaseId,
        assertionTypeConceptId: data.assertionTypeConceptId,
        jsonPath: data.jsonPath,
        operatorConceptId: data.operatorConceptId,
        expectedValue: data.expectedValue,
        tolerance: data.tolerance,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Aserciones del caso en orden: la evaluación las recorre así. */
  findAssertionsByCase(
    em: EntityManager,
    testCaseId: string,
  ): Promise<TestAssertions[]> {
    return em.find(
      TestAssertions,
      { testCaseId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  // --- Programaciones (UC-36-11) ---

  /**
   * Crea create schedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schedule conforme al contrato `TestSchedules`.
   */
  createSchedule(em: EntityManager, data: CreateScheduleData): TestSchedules {
    return em.create(
      TestSchedules,
      {
        suiteId: data.suiteId,
        environmentId: data.environmentId,
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        cronExpression: data.cronExpression,
        timezone: data.timezone,
        triggerConceptId: data.triggerConceptId,
        concurrencyPolicyConceptId: data.concurrencyPolicyConceptId,
        isEnabled: true,
        nextRunAt: data.nextRunAt,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Refleja la UNIQUE(suite, entorno, código) antes de chocar con ella. */
  findScheduleByCode(
    em: EntityManager,
    suiteId: string,
    environmentId: string,
    code: string,
  ): Promise<TestSchedules | null> {
    return em.findOne(TestSchedules, { suiteId, environmentId, code });
  }

  /**
   * Programaciones vencidas: habilitadas, activas y con `next_run_at` ya
   * cumplido. La usa el tick del worker (Fase 2 del plan de corrección de
   * workers) para descubrir qué disparar — el README documenta "el tick que
   * las dispara" como pendiente; esta es la consulta de descubrimiento que le
   * faltaba. `PESSIMISTIC_PARTIAL_WRITE` (`SKIP LOCKED`) reparte el lote entre
   * varios ticks concurrentes sin que se bloqueen entre sí, igual que
   * `QueuesRepository.claimReadyJobs`.
   */
  claimDueSchedules(
    em: EntityManager,
    now: Date,
    activeStateConceptId: string,
    limit: number,
  ): Promise<TestSchedules[]> {
    return em.find(
      TestSchedules,
      {
        isEnabled: true,
        stateConceptId: activeStateConceptId,
        nextRunAt: { $lte: now },
      },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { nextRunAt: 'ASC' },
        limit,
      },
    );
  }
}
