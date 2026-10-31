/**
 * JSON Schema (2020-12) de `condition_json` v1 (CONTRATO-GOBIERNO §3.10): para
 * el front (editor de permisos) y las pruebas de contrato. Describe la FORMA
 * (claves cerradas, tipos, rangos); lo que depende de datos o del átomo (zona
 * horaria real, franja vacía, aplicabilidad por átomo, filas `DENY`) lo
 * resuelve `validateCondition`. Se publica también como
 * `schemas/support-condition.v1.schema.json`, que una prueba mantiene igual.
 */

const flags = { enum: ['VIP', 'CONFIDENTIAL', 'STAFF_RELATIVE', 'PROTECTED'] };
const onViolation = { enum: ['DENY', 'REQUIRE_APPROVAL'] };
const days = (name: string) => ({
  type: 'integer',
  minimum: 0,
  maximum: 3650,
  description: name,
});

/** Esquema v1 como objeto. */
export const SUPPORT_CONDITION_SCHEMA_V1 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:mantra:delegated-access:support-condition:v1',
  title: 'Condición de un permiso de apoyo (v1)',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion'],
  properties: {
    schemaVersion: { const: 1 },
    time: {
      type: 'object',
      additionalProperties: false,
      required: ['windows'],
      properties: {
        timeZone: { type: 'string', minLength: 1 },
        windows: {
          type: 'array',
          minItems: 1,
          maxItems: 14,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['days', 'from', 'to'],
            properties: {
              days: {
                type: 'array',
                minItems: 1,
                maxItems: 7,
                uniqueItems: true,
                items: { type: 'integer', minimum: 0, maximum: 6 },
              },
              from: {
                type: 'string',
                pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$',
              },
              to: {
                type: 'string',
                pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$',
              },
            },
          },
        },
      },
    },
    limits: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['metric', 'per', 'max', 'onExceed'],
        properties: {
          metric: { enum: ['ACTIONS', 'DISTINCT_PATIENTS'] },
          per: { enum: ['HOUR', 'DAY', 'WEEK'] },
          max: { type: 'integer', minimum: 1, maximum: 10000 },
          scope: { enum: ['GRANT', 'PERSON'] },
          group: { type: 'string', pattern: '^[a-z0-9-]{1,40}$' },
          onExceed: onViolation,
        },
      },
    },
    patients: {
      type: 'object',
      additionalProperties: false,
      properties: {
        scope: {
          enum: [
            'ANY',
            'WITH_APPOINTMENT_WINDOW',
            'CARE_TEAM_OF_COVERED_DOCTOR',
          ],
        },
        appointmentWindow: {
          type: 'object',
          additionalProperties: false,
          required: ['daysBefore', 'daysAfter'],
          properties: {
            daysBefore: days('Días hacia atrás'),
            daysAfter: days('Días hacia adelante'),
            withCoveredDoctor: { type: 'boolean' },
          },
        },
        age: {
          type: 'object',
          additionalProperties: false,
          minProperties: 1,
          properties: {
            min: { type: 'integer', minimum: 0, maximum: 150 },
            max: { type: 'integer', minimum: 0, maximum: 150 },
          },
        },
        isMinor: { type: 'boolean' },
        coverage: {
          type: 'object',
          additionalProperties: false,
          required: ['mode'],
          properties: {
            mode: { enum: ['INSURED_ONLY', 'SELF_PAY_ONLY', 'ANY'] },
            carrierIds: {
              type: 'array',
              maxItems: 50,
              items: { type: 'string', minLength: 1 },
            },
          },
        },
        flags: {
          type: 'object',
          additionalProperties: false,
          required: ['anyOf'],
          properties: { anyOf: { type: 'array', items: flags } },
        },
        exclude: {
          type: 'object',
          additionalProperties: false,
          properties: {
            minors: { type: 'boolean' },
            flags: { type: 'array', items: flags },
          },
        },
      },
    },
    appointment: {
      type: 'object',
      additionalProperties: false,
      properties: {
        window: {
          type: 'object',
          additionalProperties: false,
          required: ['daysBefore', 'daysAfter'],
          properties: {
            daysBefore: days('Días hacia atrás'),
            daysAfter: days('Días hacia adelante'),
          },
        },
        leadTime: {
          type: 'object',
          additionalProperties: false,
          required: ['minHours', 'onViolation'],
          properties: {
            minHours: { type: 'number', minimum: 0, maximum: 8760 },
            onViolation,
          },
        },
        horizon: {
          type: 'object',
          additionalProperties: false,
          required: ['maxDaysAhead'],
          properties: {
            maxDaysAhead: { type: 'integer', minimum: 1, maximum: 3650 },
          },
        },
      },
    },
    channels: {
      type: 'object',
      additionalProperties: false,
      required: ['allow'],
      properties: {
        allow: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: { enum: ['CHAT', 'EMAIL'] },
        },
      },
    },
    fields: {
      type: 'object',
      propertyNames: { pattern: '^[a-z_]+(\\.[a-z_]+){2,3}$' },
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        required: ['mask'],
        properties: { mask: { enum: ['PARTIAL', 'REDACT', 'NULLIFY'] } },
      },
    },
    amount: {
      type: 'object',
      additionalProperties: false,
      required: ['currency'],
      anyOf: [
        { required: ['perTransactionMax'] },
        { required: ['perDayMax'] },
        { required: ['maxDiscountPercent'] },
      ],
      properties: {
        currency: { const: 'BOB' },
        perTransactionMax: { type: 'number', minimum: 0.01, maximum: 1e9 },
        perDayMax: { type: 'number', minimum: 0.01, maximum: 1e9 },
        maxDiscountPercent: { type: 'number', minimum: 0, maximum: 100 },
        onExceed: onViolation,
      },
    },
    session: {
      type: 'object',
      additionalProperties: false,
      required: ['maxSessionMinutes'],
      properties: {
        maxSessionMinutes: { type: 'integer', minimum: 30, maximum: 720 },
      },
    },
    network: {
      type: 'object',
      additionalProperties: false,
      required: ['require'],
      properties: { require: { enum: ['ORG_RULES', 'ANY'] } },
    },
    device: {
      type: 'object',
      additionalProperties: false,
      required: ['knownOnly'],
      properties: { knownOnly: { type: 'boolean' } },
    },
    presence: {
      type: 'object',
      additionalProperties: false,
      required: ['doctor'],
      properties: { doctor: { const: 'ONLINE' } },
    },
    obligations: {
      type: 'object',
      additionalProperties: false,
      properties: {
        requireReason: {
          type: 'object',
          additionalProperties: false,
          properties: {
            minLength: { type: 'integer', minimum: 5, maximum: 200 },
          },
        },
        stepUp: {
          type: 'object',
          additionalProperties: false,
          properties: {
            maxAgeMinutes: { type: 'integer', minimum: 1, maximum: 60 },
          },
        },
        approval: {
          type: 'object',
          additionalProperties: false,
          required: ['by'],
          properties: {
            by: { enum: ['DOCTOR', 'SECOND_APPROVER', 'SERVICE_HEAD'] },
            ttlMinutes: { type: 'integer', minimum: 5, maximum: 1440 },
          },
        },
      },
    },
    delegationCeiling: {
      type: 'object',
      additionalProperties: false,
      properties: {
        allowAtoms: {
          type: 'array',
          maxItems: 100,
          items: { type: 'string', pattern: '^[a-z_*]+(\\.[a-z_*]+)*$' },
        },
        forbidAtoms: {
          type: 'array',
          maxItems: 100,
          items: { type: 'string', pattern: '^[a-z_*]+(\\.[a-z_*]+)*$' },
        },
        templates: {
          type: 'array',
          items: {
            enum: [
              'SECRETARY',
              'MEDICAL_ASSISTANT',
              'NURSING',
              'FRONT_DESK',
              'BILLING_CASHIER',
              'CALL_CENTER',
              'ORG_MANAGEMENT',
            ],
          },
        },
        maxValidDays: { type: 'integer', minimum: 1, maximum: 3650 },
      },
    },
  },
} as const;
