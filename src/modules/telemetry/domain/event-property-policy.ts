/**
 * Política de propiedades de un evento de actividad (TEL-03).
 *
 * El esquema del evento (`activity_event_schema_definitions`) declara qué
 * propiedades admite (`propertySchemaJson`), qué patrones están prohibidos
 * (`prohibitedPropertyPatternsJson`) y si admite datos de salud (`phiAllowed`).
 * Esta función las aplica **antes** de crear la entidad y antes de armar el
 * reenvío a un proveedor externo: lo que no pasa por aquí no se persiste ni
 * sale del sistema.
 *
 * Reglas, todas por defecto cerradas:
 *
 * - Una propiedad se admite sólo si el esquema la declara en `properties`. Un
 *   esquema sin `properties` no admite ninguna.
 * - El valor debe corresponder al tipo declarado (`string`, `number`,
 *   `integer` o `boolean`) y respetar `maxLength`, `minLength`, `minimum`,
 *   `maximum`, `enum` y `pattern` si el esquema los trae.
 * - Una propiedad marcada `phi: true` sólo se admite si `phiAllowed` es `true`.
 * - Los nombres y valores prohibidos (los del esquema y, mientras `phiAllowed`
 *   no sea `true`, una base de identificadores personales) se rechazan.
 * - La clasificación del dato la fija el servidor desde el esquema; la que
 *   declare el cliente no participa.
 *
 * El módulo no registra ni devuelve el nombre ni el valor de la propiedad
 * rechazada: sólo la regla incumplida.
 */

/** Regla incumplida por una propiedad. */
export type PropertyRule =
  | 'NOT_DECLARED'
  | 'DUPLICATE'
  | 'TYPE_MISMATCH'
  | 'VALUE_OUT_OF_RANGE'
  | 'PROHIBITED_NAME'
  | 'PROHIBITED_VALUE'
  | 'PHI_NOT_ALLOWED'
  | 'SCHEMA_INVALID';

/** Se lanza cuando una propiedad incumple el esquema; no lleva nombre ni valor. */
export class EventPropertyRejection extends Error {
  constructor(readonly rule: PropertyRule) {
    super(`Propiedad de evento rechazada: ${rule}`);
    this.name = 'EventPropertyRejection';
  }
}

/** Lo que de un esquema interesa para validar propiedades. */
export interface EventSchemaPolicy {
  /** Nombre del esquema, el único dato que se informa del rechazo. */
  readonly eventName: string;
  /** JSON Schema simplificado de las propiedades admitidas. */
  readonly propertySchemaJson?: unknown;
  /** Nombres y patrones prohibidos. */
  readonly prohibitedPropertyPatternsJson?: unknown;
  /** `true` sólo si el esquema admite datos de salud. */
  readonly phiAllowed?: boolean | null;
  /** Clasificación que el servidor asigna a lo marcado `pii`/`phi`. */
  readonly piiClassificationConceptId?: string | null;
}

/** Propiedad tal como llega del cliente. */
export interface RawEventProperty {
  readonly propertyName: string;
  readonly valueType?: 'STRING' | 'NUMBER' | 'BOOLEAN';
  readonly valueString?: string;
  readonly valueNumber?: number;
  readonly valueBoolean?: boolean;
}

/** Propiedad aceptada, ya minimizada. */
export interface ValidatedEventProperty {
  readonly propertyName: string;
  readonly valueType: 'STRING' | 'NUMBER' | 'BOOLEAN';
  readonly valueString?: string;
  readonly valueNumber?: number;
  readonly valueBoolean?: boolean;
  /** `true` si el esquema marca la propiedad como dato personal o de salud. */
  readonly sensitive: boolean;
  /** `true` si puede viajar al proveedor externo. */
  readonly forwardable: boolean;
}

interface DeclaredProperty {
  readonly type: 'string' | 'number' | 'integer' | 'boolean';
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly enum?: readonly (string | number | boolean)[];
  readonly pattern?: RegExp;
  readonly phi: boolean;
  readonly pii: boolean;
  readonly forward: boolean;
}

/** Tope de longitud de un valor de texto si el esquema no fija uno menor. */
export const DEFAULT_MAX_STRING_LENGTH = 4000;

/**
 * Identificadores personales que ninguna propiedad puede nombrar mientras el
 * esquema no admita datos de salud. Se comparan contra los tokens del nombre
 * (`patient_email` → `patient`, `email`), no contra subcadenas, para no
 * rechazar `screen_name` por contener «name».
 */
const BASELINE_PROHIBITED_NAME_TOKENS: ReadonlySet<string> = new Set([
  'email',
  'mail',
  'correo',
  'phone',
  'telefono',
  'celular',
  'mobile_number',
  'dni',
  'ci',
  'passport',
  'pasaporte',
  'ssn',
  'nit',
  'diagnosis',
  'diagnostico',
  'patient',
  'paciente',
  'address',
  'direccion',
  'birthdate',
  'birthday',
  'dob',
  'password',
  'contrasena',
  'token',
  'secret',
  'firstname',
  'lastname',
  'fullname',
  'surname',
  'apellido',
  'nombre',
  'medication',
  'medicamento',
  'allergy',
  'alergia',
  'prescription',
  'receta',
]);

/** Valores que delatan un dato personal aunque el nombre sea inocuo. */
const BASELINE_PROHIBITED_VALUE_PATTERNS: readonly RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/u,
  /\d{7,}/u,
];

/** Divide un nombre en tokens: `patientEmail`, `patient_email` y `patient-email`. */
function nameTokens(name: string): string[] {
  const tokens = name
    .replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((token) => token.length > 0);
  // `firstName` y `first_name` deben coincidir con el token unido `firstname`.
  return [...tokens, tokens.join('')];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compile(pattern: unknown): RegExp {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new EventPropertyRejection('SCHEMA_INVALID');
  }
  try {
    return new RegExp(pattern, 'iu');
  } catch {
    throw new EventPropertyRejection('SCHEMA_INVALID');
  }
}

function patternList(value: unknown): RegExp[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new EventPropertyRejection('SCHEMA_INVALID');
  return value.map(compile);
}

function stringList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new EventPropertyRejection('SCHEMA_INVALID');
  }
  return (value as string[]).map((item) => item.toLowerCase());
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new EventPropertyRejection('SCHEMA_INVALID');
  }
  return value;
}

function parseDeclared(raw: unknown): DeclaredProperty {
  if (!isRecord(raw)) throw new EventPropertyRejection('SCHEMA_INVALID');
  const type = raw.type;
  if (
    type !== 'string' &&
    type !== 'number' &&
    type !== 'integer' &&
    type !== 'boolean'
  ) {
    throw new EventPropertyRejection('SCHEMA_INVALID');
  }
  let allowed: DeclaredProperty['enum'];
  if (raw.enum !== undefined) {
    if (
      !Array.isArray(raw.enum) ||
      raw.enum.some(
        (item) =>
          typeof item !== 'string' &&
          typeof item !== 'number' &&
          typeof item !== 'boolean',
      )
    ) {
      throw new EventPropertyRejection('SCHEMA_INVALID');
    }
    allowed = raw.enum as (string | number | boolean)[];
  }
  const phi = raw.phi === true;
  const pii = raw.pii === true;
  return {
    type,
    maxLength: optionalNumber(raw.maxLength),
    minLength: optionalNumber(raw.minLength),
    minimum: optionalNumber(raw.minimum),
    maximum: optionalNumber(raw.maximum),
    enum: allowed,
    pattern: raw.pattern === undefined ? undefined : compile(raw.pattern),
    phi,
    pii,
    // Lo sensible no sale al proveedor externo aunque el esquema lo admita.
    forward: raw.forward !== false && !phi && !pii,
  };
}

interface ProhibitedRules {
  readonly names: ReadonlySet<string>;
  readonly namePatterns: readonly RegExp[];
  readonly valuePatterns: readonly RegExp[];
}

function parseProhibited(raw: unknown, phiAllowed: boolean): ProhibitedRules {
  let names: string[] = [];
  let namePatterns: RegExp[] = [];
  let valuePatterns: RegExp[] = [];
  if (raw !== undefined && raw !== null) {
    if (!isRecord(raw)) throw new EventPropertyRejection('SCHEMA_INVALID');
    names = stringList(raw.names);
    namePatterns = patternList(raw.namePatterns);
    valuePatterns = patternList(raw.valuePatterns);
  }
  if (!phiAllowed) {
    names = [...names, ...BASELINE_PROHIBITED_NAME_TOKENS];
    valuePatterns = [...valuePatterns, ...BASELINE_PROHIBITED_VALUE_PATTERNS];
  }
  return { names: new Set(names), namePatterns, valuePatterns };
}

function checkValue(
  declared: DeclaredProperty,
  property: RawEventProperty,
): string | number | boolean {
  const present = [
    property.valueString !== undefined,
    property.valueNumber !== undefined,
    property.valueBoolean !== undefined,
  ].filter(Boolean).length;
  if (present !== 1) throw new EventPropertyRejection('TYPE_MISMATCH');

  if (declared.type === 'string') {
    if (
      property.valueString === undefined ||
      (property.valueType !== undefined && property.valueType !== 'STRING')
    ) {
      throw new EventPropertyRejection('TYPE_MISMATCH');
    }
    const value = property.valueString;
    const max = Math.min(
      declared.maxLength ?? DEFAULT_MAX_STRING_LENGTH,
      DEFAULT_MAX_STRING_LENGTH,
    );
    if (value.length > max || value.length < (declared.minLength ?? 0)) {
      throw new EventPropertyRejection('VALUE_OUT_OF_RANGE');
    }
    if (declared.pattern && !declared.pattern.test(value)) {
      throw new EventPropertyRejection('VALUE_OUT_OF_RANGE');
    }
    return value;
  }
  if (declared.type === 'boolean') {
    if (
      property.valueBoolean === undefined ||
      (property.valueType !== undefined && property.valueType !== 'BOOLEAN')
    ) {
      throw new EventPropertyRejection('TYPE_MISMATCH');
    }
    return property.valueBoolean;
  }
  if (
    property.valueNumber === undefined ||
    (property.valueType !== undefined && property.valueType !== 'NUMBER') ||
    (declared.type === 'integer' && !Number.isInteger(property.valueNumber))
  ) {
    throw new EventPropertyRejection('TYPE_MISMATCH');
  }
  const value = property.valueNumber;
  if (
    (declared.minimum !== undefined && value < declared.minimum) ||
    (declared.maximum !== undefined && value > declared.maximum)
  ) {
    throw new EventPropertyRejection('VALUE_OUT_OF_RANGE');
  }
  return value;
}

/**
 * Valida las propiedades de un evento contra su esquema.
 *
 * @param schema - Política del esquema del evento.
 * @param properties - Propiedades recibidas del cliente.
 * @returns Las propiedades aceptadas, minimizadas y con su clasificación.
 * @throws EventPropertyRejection con la primera regla incumplida.
 */
export function validateEventProperties(
  schema: EventSchemaPolicy,
  properties: readonly RawEventProperty[] | undefined,
): ValidatedEventProperty[] {
  if (!properties?.length) return [];

  const phiAllowed = schema.phiAllowed === true;
  const declaredByName = new Map<string, DeclaredProperty>();
  const declaredRaw = isRecord(schema.propertySchemaJson)
    ? schema.propertySchemaJson.properties
    : undefined;
  if (declaredRaw !== undefined) {
    if (!isRecord(declaredRaw)) {
      throw new EventPropertyRejection('SCHEMA_INVALID');
    }
    for (const [name, raw] of Object.entries(declaredRaw)) {
      declaredByName.set(name, parseDeclared(raw));
    }
  }
  const prohibited = parseProhibited(
    schema.prohibitedPropertyPatternsJson,
    phiAllowed,
  );

  const seen = new Set<string>();
  const accepted: ValidatedEventProperty[] = [];
  for (const property of properties) {
    const name = property.propertyName;
    if (seen.has(name)) throw new EventPropertyRejection('DUPLICATE');
    seen.add(name);

    // Lo prohibido se juzga antes que lo declarado: un esquema que declare
    // por error `email` no abre la puerta mientras no admita datos de salud.
    const tokens = nameTokens(name);
    if (
      tokens.some((token) => prohibited.names.has(token)) ||
      prohibited.namePatterns.some((pattern) => pattern.test(name))
    ) {
      throw new EventPropertyRejection('PROHIBITED_NAME');
    }

    const declared = declaredByName.get(name);
    if (!declared) throw new EventPropertyRejection('NOT_DECLARED');
    if (declared.phi && !phiAllowed) {
      throw new EventPropertyRejection('PHI_NOT_ALLOWED');
    }

    const value = checkValue(declared, property);
    if (
      typeof value === 'string' &&
      prohibited.valuePatterns.some((pattern) => pattern.test(value))
    ) {
      throw new EventPropertyRejection('PROHIBITED_VALUE');
    }
    if (declared.enum && !declared.enum.includes(value)) {
      throw new EventPropertyRejection('VALUE_OUT_OF_RANGE');
    }

    accepted.push({
      propertyName: name,
      valueType:
        typeof value === 'string'
          ? 'STRING'
          : typeof value === 'number'
            ? 'NUMBER'
            : 'BOOLEAN',
      ...(typeof value === 'string' ? { valueString: value } : {}),
      ...(typeof value === 'number' ? { valueNumber: value } : {}),
      ...(typeof value === 'boolean' ? { valueBoolean: value } : {}),
      sensitive: declared.phi || declared.pii,
      forwardable: declared.forward,
    });
  }
  return accepted;
}
