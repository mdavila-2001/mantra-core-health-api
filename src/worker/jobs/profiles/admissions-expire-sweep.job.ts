import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, validateCronExpression } from 'cron';
import { PinoLogger } from 'nestjs-pino';
import {
  ADMISSIONS_DEFAULTS,
  loadAdmissionsConfig,
} from '../../../modules/profiles/domain/admissions/admissions.config';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/** Nombre del trabajo en el registro del scheduler (y en los logs). */
export const ADMISSIONS_SWEEP_JOB_NAME = 'profiles.admissions-expire-sweep';

/** Refleja `AdmissionSweepResultDto` (`modules/profiles/presentation/dto`). */
interface AdmissionsSweepResult {
  expired: number;
  abandoned: number;
  skipped: boolean;
}

/**
 * Barrido de vencimientos y abandonos de las admisiones de profesionales.
 *
 * `POST /admissions/expire-sweep` baja las verificaciones cuya vigencia pasó
 * (VERIFICADA a EXPIRADA, y con ellas el check) y cierra por abandono las
 * solicitudes cuyo solicitante no respondió (INFORMACION_REQUERIDA a
 * ABANDONADA). Existía y funcionaba, pero **nadie lo llamaba**: sin este job
 * una verificación vencida seguía mostrando el check hasta que un
 * administrador se acordara de disparar el barrido a mano. Es el mismo defecto
 * que `badge-expiry` cierra para los sellos de comunidad.
 *
 * ## Qué garantiza
 *
 * - **Cadencia configurable.** `ADMISSIONS_EXPIRE_SWEEP_CRON` (por defecto,
 *   cada hora en punto) y `ADMISSIONS_EXPIRE_SWEEP_ENABLED` (por defecto
 *   encendido). Una expresión inválida NO tumba el worker: se avisa en el log y
 *   rige la de por defecto, porque un worker caído por una coma mal puesta deja
 *   a todos sin barrido, no sólo a quien se equivocó.
 * - **Un solo nodo.** El cerrojo vive en la API (`pg_try_advisory_xact_lock` en
 *   `expireSweep`), no en el worker: así también cubre a dos réplicas del
 *   worker y a un administrador que dispare el barrido a mano a la vez. La
 *   segunda corrida responde `skipped: true`.
 * - **Idempotente.** Una segunda corrida no encuentra nada; por eso se declara
 *   `idempotent: true` y un corte de red durante el POST se puede reintentar.
 * - **Auditado como `SYSTEM`.** Llama con el token de la cuenta de servicio:
 *   el endpoint sella `ADMISSIONS_EXPIRY_SWEPT` y cada cambio de estado queda en
 *   la bitácora de la admisión con rol `SYSTEM`.
 * - **No tira el proceso.** Todo error de un tick se registra y se descarta
 *   (`runTick`); el callback del cron nunca devuelve una promesa rechazada.
 */
@Injectable()
export class AdmissionsExpireSweepJob implements OnApplicationBootstrap {
  /**
   * @param api - Cliente HTTP autenticado como `SYSTEM` contra la propia API.
   * @param registry - Registro del scheduler, donde se da de alta el cron.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly api: SystemApiClient,
    private readonly registry: SchedulerRegistry,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdmissionsExpireSweepJob.name);
  }

  /** Agenda el barrido según el entorno. Nunca lanza. */
  onApplicationBootstrap(): void {
    try {
      this.schedule();
    } catch (error) {
      this.logger.error(
        { operation: ADMISSIONS_SWEEP_JOB_NAME, err: error },
        'No se pudo agendar el barrido de admisiones; el worker sigue sin él',
      );
    }
  }

  /**
   * Da de alta el cron.
   *
   * @returns La expresión agendada, o `null` si el barrido está apagado.
   */
  schedule(): string | null {
    const config = loadAdmissionsConfig();
    if (!config.expireSweepEnabled) {
      this.logger.warn(
        { operation: ADMISSIONS_SWEEP_JOB_NAME },
        'ADMISSIONS_EXPIRE_SWEEP_ENABLED=false: nada vencerá ni se abandonará solo',
      );
      return null;
    }

    let expression = config.expireSweepCron;
    const check = validateCronExpression(expression);
    if (!check.valid) {
      this.logger.error(
        {
          operation: ADMISSIONS_SWEEP_JOB_NAME,
          configured: expression,
          fallback: ADMISSIONS_DEFAULTS.expireSweepCron,
        },
        'ADMISSIONS_EXPIRE_SWEEP_CRON no es una expresión cron válida; rige la de por defecto',
      );
      expression = ADMISSIONS_DEFAULTS.expireSweepCron;
    }

    const job = CronJob.from({
      cronTime: expression,
      onTick: () => this.tick(),
      start: true,
      // Si un tick sigue en vuelo, el siguiente espera en vez de apilarse.
      waitForCompletion: true,
      errorHandler: (error: unknown) =>
        this.logger.error(
          { operation: ADMISSIONS_SWEEP_JOB_NAME, err: error },
          'Falló el callback del cron del barrido de admisiones',
        ),
    });
    this.registry.addCronJob(ADMISSIONS_SWEEP_JOB_NAME, job);
    this.logger.info(
      { operation: ADMISSIONS_SWEEP_JOB_NAME, cron: expression },
      'Barrido de admisiones agendado',
    );
    return expression;
  }

  /** Dispara un barrido. Nunca lanza. */
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.profiles.admissions-expire-sweep',
      async () => {
        const result = await this.api.post<AdmissionsSweepResult>(
          '/admissions/expire-sweep',
          {},
          { idempotent: true },
        );

        if (result.skipped) {
          this.logger.info(
            { operation: ADMISSIONS_SWEEP_JOB_NAME, skipped: true },
            'Otro nodo tenía el barrido en curso',
          );
          return;
        }
        // Sin novedades no se dice nada: un log por hora anunciando que no pasó
        // nada entierra el que sí importa.
        if (result.expired + result.abandoned === 0) return;

        this.logger.info(
          {
            operation: ADMISSIONS_SWEEP_JOB_NAME,
            expired: result.expired,
            abandoned: result.abandoned,
          },
          'Admisiones vencidas y abandonadas barridas',
        );
      },
    );
  }
}
