import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CronTime } from 'cron';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { QaCatalogRepository, QaRunsRepository } from '../repositories';
import { TestSchedules } from '../entities';
import {
  CreateEnvironmentDto,
  EnvironmentResponseDto,
  CreateTestCaseDto,
  TestCaseResponseDto,
  PublishSuiteDto,
  PublishSuiteResponseDto,
  CreateTestScheduleDto,
  TestScheduleResponseDto,
  RunDueSchedulesDto,
  DueScheduleRunResultDto,
  RunDueSchedulesResponseDto,
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
 * Estados en los que una corrida está viva y compite por el entorno. Mismo
 * criterio que `QaRunsService` para la política `FORBID`; se repite aquí en
 * vez de importarlo para no crear un ciclo entre los dos servicios.
 */
const RUN_IN_PROGRESS_STATES: readonly string[] = [
  CONCEPTS.RUN_QUEUED,
  CONCEPTS.RUN_STATUS_RUNNING,
];

/** Zona horaria por defecto cuando la programación no declara la suya. */
const DEFAULT_SCHEDULE_TIMEZONE = 'UTC';

/**
 * Catálogo de pruebas: entornos, casos con aserciones, publicación de suite y
 * programaciones (UC-36-01, 02, 03, 11).
 */
@Injectable()
export class QaCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param runsRepo - Valor de runs repo requerido por la operación (sólo
   *   para el tick de programaciones: encolar la corrida y comprobar
   *   concurrencia vive en `QaRunsRepository`).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: QaCatalogRepository,
    private readonly runsRepo: QaRunsRepository,
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

  /**
   * Tick de disparo programado (Fase 2 del plan de corrección de workers):
   * cierra el "Disparo programado" que el README documenta como pendiente.
   * `test_schedules` guarda cron y `next_run_at`, pero nada evaluaba si ya
   * estaba vencido ni disparaba la corrida — este método es exactamente eso,
   * y lo llama el worker por `POST /internal/qa/schedules/run-due`.
   *
   * Reclama el lote con `SKIP LOCKED` y, para cada programación, encola la
   * corrida si la suite y el entorno siguen aptos y la política de
   * concurrencia lo permite. `next_run_at` se avanza siempre (haya o no
   * corrida), para que una marca que no pudo dispararse no deje al tick
   * reintentando el mismo instante para siempre.
   */
  async runDueSchedules(
    dto: RunDueSchedulesDto,
    actor: AuthenticatedUser,
  ): Promise<RunDueSchedulesResponseDto> {
    const now = new Date();
    const limit = dto.limit ?? 20;

    this.logger.info(
      { operation: 'qa.schedule.run-due', limit },
      'Evaluating due test schedules',
    );

    return this.em.transactional(async (tx) => {
      const due = await this.catalogRepo.claimDueSchedules(
        tx,
        now,
        CONCEPTS.STATE_ACTIVE,
        limit,
      );

      const results: DueScheduleRunResultDto[] = [];
      let queued = 0;

      for (const schedule of due) {
        const result = await this.runDueSchedule(tx, schedule, now, actor);
        if (result.runId) queued += 1;
        results.push(result);
      }

      if (due.length > 0) {
        this.logger.info(
          {
            operation: 'qa.schedule.run-due',
            claimed: due.length,
            queued,
            skipped: due.length - queued,
          },
          'Due test schedules evaluated',
        );
      }

      return {
        claimed: due.length,
        queued,
        skipped: due.length - queued,
        results,
      };
    });
  }

  /**
   * Evalúa una única programación vencida: intenta encolar la corrida y
   * siempre calcula y asienta la próxima marca.
   */
  private async runDueSchedule(
    tx: EntityManager,
    schedule: TestSchedules,
    now: Date,
    actor: AuthenticatedUser,
  ): Promise<DueScheduleRunResultDto> {
    let runId: string | undefined;
    let runNumber: string | undefined;
    let skippedReason: string | undefined;

    const suite = await this.catalogRepo.findSuiteById(tx, schedule.suiteId);
    const environment = await this.catalogRepo.findEnvironmentById(
      tx,
      schedule.environmentId,
    );

    if (!suite || suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE) {
      skippedReason = 'SUITE_NOT_ACTIVE';
    } else if (
      !environment ||
      environment.stateConceptId !== CONCEPTS.STATE_ACTIVE
    ) {
      skippedReason = 'ENVIRONMENT_NOT_ACTIVE';
    } else {
      const policy =
        this.policyNameOf(schedule.concurrencyPolicyConceptId) ?? 'FORBID';
      if (policy === 'FORBID') {
        const running = await this.runsRepo.findRunsInProgress(
          tx,
          schedule.suiteId,
          [...RUN_IN_PROGRESS_STATES],
        );
        if (running.length > 0) skippedReason = 'SUITE_ALREADY_RUNNING';
      }

      if (!skippedReason) {
        const totalCases = await this.catalogRepo.countActiveCases(
          tx,
          schedule.suiteId,
          CONCEPTS.CASE_ACTIVE,
        );
        if (totalCases === 0) {
          skippedReason = 'NO_ACTIVE_CASES';
        } else {
          runNumber = await this.nextRunNumber(
            tx,
            schedule.suiteId,
            suite.code,
          );
          const run = this.runsRepo.createRun(tx, {
            suiteId: schedule.suiteId,
            environmentId: schedule.environmentId,
            tenantId: schedule.tenantId,
            runNumber,
            triggerConceptId: CONCEPTS.QA_TRIGGER_SCHEDULED,
            triggeredByUserId: actor.id,
            totalCases,
            statusConceptId: CONCEPTS.RUN_QUEUED,
            actorUserId: actor.id,
          });
          runId = run.id;
        }
      }
    }

    // Se ancla en la marca vencida (`schedule.nextRunAt`), no en `now`: si el
    // tick corre tarde, avanzar desde el reloj actual iría corriendo la
    // cadencia del cron hacia adelante en cada pasada en vez de mantenerla fija.
    const nextRunAt = this.computeNextRunAt(
      schedule,
      schedule.nextRunAt ?? now,
    );
    if (nextRunAt) {
      schedule.nextRunAt = nextRunAt;
    } else {
      // El esquema permite `cron_expression` nulo, pero `POST /qa/schedules`
      // siempre lo exige; si de todos modos falta (dato heredado, por
      // ejemplo), no hay marca que calcular. Deshabilitar la programación es
      // más seguro que dejarla vencida para siempre: sin una migración que
      // añada una columna nueva, no hay otra forma de que el tick deje de
      // reencontrarla en cada pasada.
      schedule.isEnabled = false;
      skippedReason ??= 'NO_CRON_EXPRESSION';
    }
    if (runId) {
      schedule.lastRunId = runId;
      schedule.lastRunAt = now;
    }
    touch(schedule, actor.id);

    if (skippedReason) {
      this.logger.warn(
        {
          operation: 'qa.schedule.run-due',
          scheduleId: schedule.id,
          reason: skippedReason,
        },
        'Scheduled test run skipped',
      );
    }

    return {
      scheduleId: schedule.id,
      runId,
      runNumber,
      nextRunAt: nextRunAt?.toISOString(),
      skippedReason,
    };
  }

  /**
   * Próxima marca del cron a partir de la marca vencida. `cron` valida y
   * calcula; el resultado llega en `DateTime` de luxon (dependencia que este
   * repo ya usa) y se convierte a `Date` nativo para la entidad.
   */
  private computeNextRunAt(
    schedule: TestSchedules,
    from: Date,
  ): Date | undefined {
    if (!schedule.cronExpression) return undefined;
    const timezone = schedule.timezone ?? DEFAULT_SCHEDULE_TIMEZONE;
    const cronTime = new CronTime(schedule.cronExpression, timezone);
    // `getNextDateFrom` sin segundo argumento deriva la zona de `from` (la del
    // proceso, si `from` es un `Date` nativo) en vez de la zona con la que se
    // construyó `CronTime` — hay que pasarla explícita también aquí, o la
    // marca calculada queda corrida por el offset entre ambas zonas.
    return cronTime.getNextDateFrom(from, timezone).toJSDate();
  }

  /** Nombre de la política a partir de su concepto, inverso de `CONCURRENCY_CONCEPT`. */
  private policyNameOf(
    conceptId?: string,
  ): 'ALLOW' | 'FORBID' | 'QUEUE' | undefined {
    if (!conceptId) return undefined;
    return (
      Object.keys(CONCURRENCY_CONCEPT) as Array<'ALLOW' | 'FORBID' | 'QUEUE'>
    ).find((name) => CONCURRENCY_CONCEPT[name] === conceptId);
  }

  /**
   * Número de corrida secuencial por suite. Mismo criterio que
   * `QaRunsService.nextRunNumber`, repetido aquí en vez de importado para no
   * cruzar la frontera de servicios sólo por esta utilidad.
   */
  private async nextRunNumber(
    tx: EntityManager,
    suiteId: string,
    suiteCode: string,
  ): Promise<string> {
    const last = await this.runsRepo.findLastRun(tx, suiteId);
    const lastSequence = last
      ? Number(last.runNumber.split('-').pop() ?? '0')
      : 0;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const candidate = `${suiteCode}-${String(lastSequence + attempt).padStart(5, '0')}`;
      if (!(await this.runsRepo.findRunByNumber(tx, candidate)))
        return candidate;
    }
    throw new ConflictException('No se pudo asignar número de corrida', {
      suiteId,
    });
  }
}
