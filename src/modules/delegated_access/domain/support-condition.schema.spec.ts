import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { SUPPORT_CONDITION_SCHEMA_V1 } from './support-condition.schema';
import {
  validateCondition,
  type ValidateConditionOptions,
} from './support-conditions.validate';

const FILE = join(
  process.cwd(),
  'src',
  'modules',
  'delegated_access',
  'domain',
  'schemas',
  'support-condition.v1.schema.json',
);

/** Casos de FORMA que el esquema y el validador deben juzgar igual. */
const SHAPE_CASES: readonly (readonly [
  string,
  unknown,
  ValidateConditionOptions?,
])[] = [
  ['mínima', { schemaVersion: 1 }],
  [
    'ejemplo A del contrato',
    {
      schemaVersion: 1,
      time: {
        timeZone: 'America/La_Paz',
        windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
      },
      network: { require: 'ORG_RULES' },
    },
  ],
  [
    'límite',
    {
      schemaVersion: 1,
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
    },
  ],
  [
    'pacientes',
    {
      schemaVersion: 1,
      patients: {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: {
          daysBefore: 0,
          daysAfter: 7,
          withCoveredDoctor: true,
        },
        age: { min: 18 },
        isMinor: false,
        coverage: { mode: 'INSURED_ONLY', carrierIds: ['c1'] },
        flags: { anyOf: [] },
        exclude: { minors: true, flags: ['VIP'] },
      },
    },
  ],
  [
    'cita',
    {
      schemaVersion: 1,
      appointment: {
        window: { daysBefore: 1, daysAfter: 14 },
        leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
        horizon: { maxDaysAhead: 90 },
      },
    },
  ],
  ['canales', { schemaVersion: 1, channels: { allow: ['CHAT', 'EMAIL'] } }],
  [
    'campos',
    {
      schemaVersion: 1,
      fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
    },
    { grantAtoms: ['agenda.appointment.view.reason'] },
  ],
  [
    'monto',
    {
      schemaVersion: 1,
      amount: { currency: 'BOB', perTransactionMax: 500, onExceed: 'DENY' },
    },
  ],
  [
    'obligaciones',
    {
      schemaVersion: 1,
      obligations: {
        requireReason: { minLength: 10 },
        stepUp: { maxAgeMinutes: 10 },
        approval: { by: 'DOCTOR', ttlMinutes: 60 },
      },
    },
  ],
  [
    'techo de delegación',
    {
      schemaVersion: 1,
      delegationCeiling: {
        allowAtoms: ['agenda.*'],
        forbidAtoms: ['billing.*'],
        templates: ['SECRETARY'],
        maxValidDays: 180,
      },
    },
  ],
  ['sin versión', {}],
  ['versión 2', { schemaVersion: 2 }],
  ['clave desconocida', { schemaVersion: 1, horario: {} }],
  [
    'clave desconocida anidada',
    {
      schemaVersion: 1,
      appointment: { leadTime: { minHours: 24, onViolation: 'DENY', x: 1 } },
    },
  ],
  ['límites vacíos', { schemaVersion: 1, limits: [] }],
  [
    'tope 0',
    {
      schemaVersion: 1,
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 0, onExceed: 'DENY' }],
    },
  ],
  [
    'hora mal escrita',
    {
      schemaVersion: 1,
      time: { windows: [{ days: [1], from: '8am', to: '09:00' }] },
    },
  ],
  [
    'día 7',
    {
      schemaVersion: 1,
      time: { windows: [{ days: [7], from: '08:00', to: '09:00' }] },
    },
  ],
  ['sin ventanas', { schemaVersion: 1, time: { windows: [] } }],
  ['sesión corta', { schemaVersion: 1, session: { maxSessionMinutes: 29 } }],
  [
    'moneda',
    {
      schemaVersion: 1,
      amount: { currency: 'USD', perTransactionMax: 5, onExceed: 'DENY' },
    },
  ],
  [
    'monto sin tope',
    { schemaVersion: 1, amount: { currency: 'BOB', onExceed: 'DENY' } },
  ],
  ['red desconocida', { schemaVersion: 1, network: { require: 'MAYBE' } }],
  [
    'motivo corto',
    { schemaVersion: 1, obligations: { requireReason: { minLength: 4 } } },
  ],
  [
    'bandera desconocida',
    { schemaVersion: 1, patients: { exclude: { flags: ['SECRETO'] } } },
  ],
  ['nulo', { schemaVersion: 1, time: null }],
];

describe('JSON Schema v1 de condition_json', () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const validate = ajv.compile(SUPPORT_CONDITION_SCHEMA_V1 as object);

  it('el archivo publicado es idéntico al esquema generado de las constantes', () => {
    expect(JSON.parse(readFileSync(FILE, 'utf8'))).toEqual(
      SUPPORT_CONDITION_SCHEMA_V1,
    );
  });

  it('es un esquema 2020-12 válido', () => {
    expect(SUPPORT_CONDITION_SCHEMA_V1.$schema).toBe(
      'https://json-schema.org/draft/2020-12/schema',
    );
    expect(ajv.validateSchema(SUPPORT_CONDITION_SCHEMA_V1 as object)).toBe(
      true,
    );
  });

  it.each(
    SHAPE_CASES.map(
      ([name, condition, options]) => [name, { condition, options }] as const,
    ),
  )(
    'esquema y validador coinciden en la forma: %s',
    (_name, { condition, options }) => {
      const byValidator =
        validateCondition(condition, options ?? {}).length === 0;
      expect({ condition, valid: validate(condition) }).toEqual({
        condition,
        valid: byValidator,
      });
    },
  );
});
