import * as Joi from 'joi';

/**
 * Configuración de las admisiones de profesionales (v4.2.67).
 *
 * Son decisiones del stakeholder que todavía no están cerradas (issue #203 del
 * vault), así que se implementan configurables con valores por defecto
 * sensatos. Los que protegen la verificación quedan **activados en producción**
 * y apagados en desarrollo y pruebas, para no trabar a quien desarrolla:
 *
 * | Variable | Default producción | Default dev/test | Qué hace |
 * |---|---|---|---|
 * | `ADMISSIONS_FOUR_EYES` | `true` | `false` | Quien resuelve (verificar/rechazar) no puede ser quien tomó la revisión ni haber revisado un ítem. Apagado, la resolución queda marcada `four_eyes_waived`. |
 * | `ADMISSIONS_SECURITY_ADMIN_INHERITS` | `false` | `true` | `SECURITY_ADMIN` actúa como revisor/aprobador sin tener asignado el rol `ADMISSIONS_*`. En producción los roles se asignan explícitamente. `SUPERADMIN` es el comodín de plataforma y siempre puede, sujeto al resto de las reglas. |
 * | `ADMISSIONS_SLA_BUSINESS_DAYS` | `3` | `3` | Plazo de respuesta, en días hábiles (lun-vie, sin feriados), desde el envío. |
 * | `ADMISSIONS_DEFAULT_VALIDITY_MONTHS` | `36` | `36` | Vigencia de la verificación si ninguna matrícula declara su vencimiento. |
 * | `ADMISSIONS_INFO_WINDOW_DAYS` | `30` | `30` | Plazo del solicitante para responder a una petición de información; vencido, la solicitud pasa a ABANDONADA. |
 * | `ADMISSIONS_MAX_RESUBMISSIONS` | `3` | `3` | Reenvíos que puede hacer el solicitante. |
 */
export interface AdmissionsConfig {
  readonly fourEyes: boolean;
  readonly securityAdminInherits: boolean;
  readonly slaBusinessDays: number;
  readonly defaultValidityMonths: number;
  readonly infoWindowDays: number;
  readonly maxResubmissions: number;
}

/** Valores por defecto que no dependen del entorno. */
export const ADMISSIONS_DEFAULTS = {
  slaBusinessDays: 3,
  defaultValidityMonths: 36,
  infoWindowDays: 30,
  maxResubmissions: 3,
} as const;

/** Esquema de entorno, para que un valor mal escrito aborte el arranque. */
export const admissionsEnvSchema = Joi.object({
  ADMISSIONS_FOUR_EYES: Joi.boolean().truthy('true').falsy('false').empty(''),
  ADMISSIONS_SECURITY_ADMIN_INHERITS: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .empty(''),
  ADMISSIONS_SLA_BUSINESS_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(ADMISSIONS_DEFAULTS.slaBusinessDays),
  ADMISSIONS_DEFAULT_VALIDITY_MONTHS: Joi.number()
    .integer()
    .min(1)
    .max(120)
    .default(ADMISSIONS_DEFAULTS.defaultValidityMonths),
  ADMISSIONS_INFO_WINDOW_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(ADMISSIONS_DEFAULTS.infoWindowDays),
  ADMISSIONS_MAX_RESUBMISSIONS: Joi.number()
    .integer()
    .min(0)
    .max(20)
    .default(ADMISSIONS_DEFAULTS.maxResubmissions),
});

function positiveInt(value: string | undefined, fallback: number, allowZero = false): number {
  const parsed = Number(value);
  if (value === undefined || value === '' || !Number.isInteger(parsed)) return fallback;
  return parsed > 0 || (allowZero && parsed === 0) ? parsed : fallback;
}

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

/** Lee la configuración del entorno dado (por defecto `process.env`). */
export function loadAdmissionsConfig(
  source: NodeJS.ProcessEnv = process.env,
): AdmissionsConfig {
  const production = source.NODE_ENV === 'production';
  return {
    fourEyes: flag(source.ADMISSIONS_FOUR_EYES, production),
    securityAdminInherits: flag(
      source.ADMISSIONS_SECURITY_ADMIN_INHERITS,
      !production,
    ),
    slaBusinessDays: positiveInt(
      source.ADMISSIONS_SLA_BUSINESS_DAYS,
      ADMISSIONS_DEFAULTS.slaBusinessDays,
    ),
    defaultValidityMonths: positiveInt(
      source.ADMISSIONS_DEFAULT_VALIDITY_MONTHS,
      ADMISSIONS_DEFAULTS.defaultValidityMonths,
    ),
    infoWindowDays: positiveInt(
      source.ADMISSIONS_INFO_WINDOW_DAYS,
      ADMISSIONS_DEFAULTS.infoWindowDays,
    ),
    maxResubmissions: positiveInt(
      source.ADMISSIONS_MAX_RESUBMISSIONS,
      ADMISSIONS_DEFAULTS.maxResubmissions,
      true,
    ),
  };
}
