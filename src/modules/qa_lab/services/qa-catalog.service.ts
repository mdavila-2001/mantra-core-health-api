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
import { QaCatalogRepository } from '../repositories';
import {
  CreateEnvironmentDto,
  EnvironmentResponseDto,
  CreateTestCaseDto,
  TestCaseResponseDto,
  PublishSuiteDto,
  PublishSuiteResponseDto,
  CreateTestScheduleDto,
  TestScheduleResponseDto,
  type EnvironmentKind,
  type CaseType,
  type AssertionType,
  type AssertionOperator,
  type HttpMethod,
} from '../dto';

const ENVIRONMENT_CONCEPT: Readonly<Record<EnvironmentKind, string>> = {
  DEV: CONCEPTS.QA_ENV_DEV,
  STAGING: CONCEPTS.QA_ENV_STAGING,
  PRODUCTION: CONCEPTS.QA_ENV_PRODUCTION,
};

const CASE_TYPE_CONCEPT: Readonly<Record<CaseType, string>> = {
  HAPPY_PATH: CONCEPTS.CASE_TYPE_HAPPY_PATH,
  EDGE: CONCEPTS.CASE_TYPE_EDGE,
  NEGATIVE: CONCEPTS.CASE_TYPE_NEGATIVE,
};

export const HTTP_METHOD_CONCEPT: Readonly<Record<HttpMethod, string>> = {
  GET: CONCEPTS.HTTP_GET,
  POST: CONCEPTS.HTTP_POST,
  PUT: CONCEPTS.HTTP_PUT,
  PATCH: CONCEPTS.HTTP_PATCH,
  DELETE: CONCEPTS.HTTP_DELETE,
};

const ASSERTION_TYPE_CONCEPT: Readonly<Record<AssertionType, string>> = {
  STATUS_CODE: CONCEPTS.ASSERTION_STATUS_CODE,
  JSON_PATH: CONCEPTS.ASSERTION_JSON_PATH,
  HEADER: CONCEPTS.ASSERTION_HEADER,
  LATENCY: CONCEPTS.ASSERTION_LATENCY,
};

const OPERATOR_CONCEPT: Readonly<Record<AssertionOperator, string>> = {
  EQUALS: CONCEPTS.OPERATOR_EQUALS,
  NOT_EQUALS: CONCEPTS.OPERATOR_NOT_EQUALS,
  CONTAINS: CONCEPTS.OPERATOR_CONTAINS,
  EXISTS: CONCEPTS.OPERATOR_EXISTS,
  LESS_THAN: CONCEPTS.OPERATOR_LESS_THAN,
  GREATER_THAN: CONCEPTS.OPERATOR_GREATER_THAN,
};

export const CONCURRENCY_CONCEPT: Readonly<
  Record<'ALLOW' | 'FORBID' | 'QUEUE', string>
> = {
  ALLOW: CONCEPTS.CONCURRENCY_ALLOW,
  FORBID: CONCEPTS.CONCURRENCY_FORBID,
  QUEUE: CONCEPTS.CONCURRENCY_QUEUE,
};

/**
 * Catálogo de pruebas: entornos, casos con aserciones, publicación de suite y
 * programaciones (UC-36-01, 02, 03, 11).
 */
@Injectable()
export class QaCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: QaCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QaCatalogService.name);
  }

  /**
   * UC-36-01: registrar el entorno. `isProductionSafe` gobierna si los payloads
   * capturados en él pueden guardarse en claro.
   */
  async createEnvironment(
    dto: CreateEnvironmentDto,
    actor: AuthenticatedUser,
  ): Promise<EnvironmentResponseDto> {
    this.logger.info(
      { operation: 'qa.environment.create', code: dto.code },
      'Registering test environment',
    );

    const duplicate = await this.catalogRepo.findEnvironmentByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un entorno con ese código', {
        code: dto.code,
      });
    }
    // Declarar seguro un entorno de producción es exactamente lo que abriría la
    // puerta a guardar datos reales de pacientes en la evidencia de pruebas.
    if (dto.environment === 'PRODUCTION' && dto.isProductionSafe) {
      throw new PreconditionFailedException(
        'Un entorno de producción no puede declararse seguro para capturar payloads',
        { code: dto.code },
      );
    }

    return this.em.transactional(async (tx) => {
      const environment = this.catalogRepo.createEnvironment(tx, {
        code: dto.code,
        name: dto.name,
        environmentConceptId: ENVIRONMENT_CONCEPT[dto.environment],
        baseUrl: dto.baseUrl,
        tenantId: dto.tenantId,
        configJson: dto.configJson,
        isProductionSafe: dto.isProductionSafe ?? false,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: environment.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        isProductionSafe: dto.isProductionSafe ?? false,
      };
    });
  }

  /**
   * UC-36-02: definir un caso con sus aserciones en una sola transacción. Nace
   * en borrador: publicar la suite es lo que lo activa.
   */
  async createTestCase(
    suiteId: string,
    dto: CreateTestCaseDto,
    actor: AuthenticatedUser,
  ): Promise<TestCaseResponseDto> {
    this.logger.info(
      { operation: 'qa.case.create', suiteId, code: dto.code },
      'Defining test case',
    );

    for (const assertion of dto.assertions) {
      if (assertion.assertionType === 'JSON_PATH' && !assertion.jsonPath) {
        throw new PreconditionFailedException(
          'Una aserción JSON_PATH necesita su ruta',
          {
            code: dto.code,
          },
        );
      }
      // Sin valor esperado no hay nada contra qué comparar; `EXISTS` es la
      // excepción, porque su comprobación es la presencia misma.
      if (assertion.operator !== 'EXISTS' && !assertion.expectedValue) {
        throw new PreconditionFailedException(
          'La aserción necesita valor esperado',
          {
            code: dto.code,
            assertionType: assertion.assertionType,
          },
        );
      }
    }

    return this.em.transactional(async (tx) => {
      const suite = await this.catalogRepo.findSuiteForUpdate(tx, suiteId);
      if (!suite) {
        throw new ResourceNotFoundException('Suite no encontrada', { suiteId });
      }

      const duplicate = await this.catalogRepo.findCaseByCode(
        tx,
        suiteId,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe un caso con ese código en la suite',
          {
            suiteId,
            code: dto.code,
          },
        );
      }

      const existing = await this.catalogRepo.findCasesBySuite(tx, suiteId);
      const ordinal = existing.length + 1;

      const testCase = this.catalogRepo.createCase(tx, {
        suiteId,
        code: dto.code,
        name: dto.name,
        caseTypeConceptId: dto.caseType
          ? CASE_TYPE_CONCEPT[dto.caseType]
          : undefined,
        endpointId: dto.endpointId,
        httpMethodConceptId: dto.httpMethod
          ? HTTP_METHOD_CONCEPT[dto.httpMethod]
          : undefined,
        requestPath: dto.requestPath,
        expectedHttpStatus: dto.expectedHttpStatus,
        setupJson: dto.setupJson,
        teardownJson: dto.teardownJson,
        ordinal,
        isCritical: dto.isCritical ?? false,
        stateConceptId: CONCEPTS.CASE_DRAFT,
        actorUserId: actor.id,
      });

      const assertionIds = dto.assertions.map(
        (assertion, index) =>
          this.catalogRepo.createAssertion(tx, {
            testCaseId: testCase.id,
            assertionTypeConceptId:
              ASSERTION_TYPE_CONCEPT[assertion.assertionType],
            jsonPath: assertion.jsonPath,
            operatorConceptId: OPERATOR_CONCEPT[assertion.operator ?? 'EQUALS'],
            expectedValue: assertion.expectedValue,
            tolerance: assertion.tolerance,
            ordinal: index + 1,
            actorUserId: actor.id,
          }).id,
      );

      touch(suite, actor.id);

      return {
        id: testCase.id,
        code: dto.code,
        stateConceptId: CONCEPTS.CASE_DRAFT,
        ordinal,
        assertionIds,
      };
    });
  }

  /**
   * UC-36-03: publicar la suite. Activa sus casos en borrador y sube la
   * versión: lo que se ejecute a partir de aquí es este conjunto.
   */
  async publishSuite(
    suiteId: string,
    dto: PublishSuiteDto,
    actor: AuthenticatedUser,
  ): Promise<PublishSuiteResponseDto> {
    this.logger.info(
      { operation: 'qa.suite.publish', suiteId },
      'Publishing test suite',
    );

    return this.em.transactional(async (tx) => {
      const suite = await this.catalogRepo.findSuiteForUpdate(tx, suiteId);
      if (!suite) {
        throw new ResourceNotFoundException('Suite no encontrada', { suiteId });
      }

      const cases = await this.catalogRepo.findCasesBySuiteForUpdate(
        tx,
        suiteId,
      );
      if (cases.length === 0) {
        throw new PreconditionFailedException(
          'Una suite sin casos no puede publicarse',
          {
            suiteId,
          },
        );
      }

      let casesActivated = 0;
      for (const testCase of cases) {
        if (testCase.stateConceptId === CONCEPTS.CASE_ACTIVE) continue;
        testCase.stateConceptId = CONCEPTS.CASE_ACTIVE;
        touch(testCase, actor.id);
        casesActivated += 1;
      }

      const version = suite.version + 1;
      suite.version = version;
      suite.stateConceptId = CONCEPTS.SUITE_ACTIVE;
      touch(suite, actor.id);

      this.logger.info(
        {
          operation: 'qa.suite.publish',
          suiteId,
          version,
          casesActivated,
          note: dto.changeNote,
        },
        'Test suite published',
      );

      return {
        id: suiteId,
        version,
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
        casesActivated,
      };
    });
  }

  /** UC-36-11: programar la ejecución automática de la suite. */
  async createSchedule(
    dto: CreateTestScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<TestScheduleResponseDto> {
    this.logger.info(
      { operation: 'qa.schedule.create', suiteId: dto.suiteId, code: dto.code },
      'Scheduling test suite',
    );

    const nextRunAt = new Date(dto.firstRunAt);

    return this.em.transactional(async (tx) => {
      const suite = await this.catalogRepo.findSuiteById(tx, dto.suiteId);
      if (!suite) {
        throw new ResourceNotFoundException('Suite no encontrada', {
          suiteId: dto.suiteId,
        });
      }
      if (suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE) {
        throw new PreconditionFailedException('La suite no está publicada', {
          suiteId: dto.suiteId,
        });
      }

      const environment = await this.catalogRepo.findEnvironmentById(
        tx,
        dto.environmentId,
      );
      if (!environment) {
        throw new ResourceNotFoundException('Entorno no encontrado', {
          environmentId: dto.environmentId,
        });
      }
      if (environment.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El entorno no está activo', {
          environmentId: dto.environmentId,
        });
      }

      const duplicate = await this.catalogRepo.findScheduleByCode(
        tx,
        dto.suiteId,
        dto.environmentId,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una programación con ese código para la suite y el entorno',
          { code: dto.code },
        );
      }

      const schedule = this.catalogRepo.createSchedule(tx, {
        suiteId: dto.suiteId,
        environmentId: dto.environmentId,
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        cronExpression: dto.cronExpression,
        timezone: dto.timezone ?? 'UTC',
        triggerConceptId: CONCEPTS.QA_TRIGGER_SCHEDULED,
        concurrencyPolicyConceptId:
          CONCURRENCY_CONCEPT[dto.concurrencyPolicy ?? 'FORBID'],
        nextRunAt,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: schedule.id,
        code: dto.code,
        nextRunAt: nextRunAt.toISOString(),
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }
}
