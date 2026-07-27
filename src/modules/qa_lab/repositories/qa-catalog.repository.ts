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

export interface CreateEnvironmentData {
  code: string;
  name: string;
  environmentConceptId: string;
  baseUrl?: string;
  tenantId?: string;
  configJson?: unknown;
  isProductionSafe: boolean;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateCaseData {
  suiteId: string;
  code: string;
  name: string;
  caseTypeConceptId?: string;
  endpointId?: string;
  httpMethodConceptId?: string;
  requestPath?: string;
  expectedHttpStatus?: number;
  setupJson?: unknown;
  teardownJson?: unknown;
  ordinal: number;
  isCritical: boolean;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateScheduleData {
  suiteId: string;
  environmentId: string;
  tenantId?: string;
  code: string;
  name: string;
  cronExpression?: string;
  timezone?: string;
  triggerConceptId: string;
  concurrencyPolicyConceptId?: string;
  nextRunAt?: Date;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso al catálogo de pruebas de `qa_lab.*`: entornos, suites, casos,
 * aserciones y programaciones. Sin reglas de negocio.
 */
@Injectable()
export class QaCatalogRepository {
  // --- Entornos (UC-36-01) ---

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

  findEnvironmentById(
    em: EntityManager,
    id: string,
  ): Promise<TestEnvironments | null> {
    return em.findOne(TestEnvironments, { id });
  }

  findEnvironmentByCode(
    em: EntityManager,
    code: string,
  ): Promise<TestEnvironments | null> {
    return em.findOne(TestEnvironments, { code });
  }

  // --- Suites (UC-36-02, UC-36-03) ---

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

  findCaseById(em: EntityManager, id: string): Promise<TestCases | null> {
    return em.findOne(TestCases, { id });
  }

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

  createAssertion(
    em: EntityManager,
    data: {
      testCaseId: string;
      assertionTypeConceptId: string;
      jsonPath?: string;
      operatorConceptId?: string;
      expectedValue?: string;
      tolerance?: string;
      ordinal: number;
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
}
