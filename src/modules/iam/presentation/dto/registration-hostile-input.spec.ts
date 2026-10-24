import { describe, it, expect } from '@jest/globals';
import {
  BadRequestException,
  type ArgumentMetadata,
  type Type,
} from '@nestjs/common';

import { ErrorCode } from '../../../../common/errors/error-codes';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import { AssistedRegistrationDto } from './assisted-registration.dto';
import { RegisterOrganizationDto } from './register-organization.dto';
import { RegisterPatientDto } from './register-patient.dto';
import {
  AssistedPractitionerRegistrationDto,
  RegisterPractitionerDto,
} from './register-practitioner.dto';

/**
 * El alta de cada tipo de usuario, ante cualquier dato.
 *
 * Se pasa por el `ValidationPipe` real (`createGlobalValidationPipe`, el mismo
 * de `main.ts`), no por `validate()` suelto: la pregunta es qué hace la API con
 * el cuerpo, y un pipe que lanza algo distinto de un 400 es un 500 para quien
 * se registra. Dos propiedades se afirman para cada DTO:
 *
 * 1. **Cualquier valor hostil en cualquier campo** se acepta o se rechaza con
 *    un `BadRequestException` de código `VALIDATION_FAILED`. Nunca otra cosa.
 * 2. **Fallar donde debe fallar**: un obligatorio ausente o nulo, una clave que
 *    el DTO no declara (en la raíz y en los objetos anidados) y un obligatorio
 *    vacío se rechazan señalando exactamente ese campo.
 */

interface Registration {
  readonly label: string;
  readonly dto: Type<unknown>;
  /** El cuerpo válido mínimo: todo lo demás se afirma contra él. */
  readonly valid: Record<string, unknown>;
  /** Campos de la raíz que el DTO exige siempre (sin condición). */
  readonly required: readonly string[];
  /** Subobjetos de `valid` donde también se prueba una clave desconocida. */
  readonly nested: readonly string[];
}

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

const REGISTRATIONS: readonly Registration[] = [
  {
    label: 'paciente',
    dto: RegisterPatientDto,
    valid: {
      nationalId: '1234567',
      residenceMunicipalityConceptId: UUID_A,
      issuerAdministrativeAreaConceptId: UUID_B,
      password: 'secreto12',
      name: 'Ana',
      lastName: 'Paz',
      email: 'ana@ejemplo.test',
      birthDate: '1990-05-17',
      phone: '+591 70012345',
      sexAtBirth: 'FEMALE',
    },
    required: ['nationalId', 'password'],
    nested: [],
  },
  {
    label: 'profesional',
    dto: RegisterPractitionerDto,
    valid: {
      email: 'ana@ejemplo.test',
      password: 'secreto12',
      displayName: 'Ana Rojas',
      licenseNumber: 'MP-1234',
      nationalId: '4821993',
      issuerAdministrativeAreaConceptId: UUID_B,
      ownSite: {
        name: 'Consultorio Ana',
        contactPhone: '+591 70012345',
        address: { lines: ['Calle 1'], latitude: -17.78, longitude: -63.18 },
      },
    },
    required: ['email', 'password', 'licenseNumber', 'nationalId'],
    nested: ['ownSite', 'ownSite.address'],
  },
  {
    label: 'profesional asistido',
    dto: AssistedPractitionerRegistrationDto,
    valid: {
      email: 'ana@ejemplo.test',
      displayName: 'Ana Rojas',
      licenseNumber: 'MP-1234',
      nationalId: '4821993',
      issuerAdministrativeAreaConceptId: UUID_B,
      reason: 'Alta de plantel',
    },
    required: ['email', 'licenseNumber', 'nationalId', 'reason'],
    nested: [],
  },
  {
    label: 'paciente asistido',
    dto: AssistedRegistrationDto,
    valid: {
      name: 'Lucía',
      lastName: 'Mamani',
      email: 'lucia@ejemplo.test',
      reason: 'Alta en mostrador',
    },
    required: ['email', 'reason'],
    nested: [],
  },
  {
    label: 'organización',
    dto: RegisterOrganizationDto,
    valid: {
      organization: {
        code: 'CENTRO_IMAGEN_Z',
        legalName: 'Centro de Imagen Z S.R.L.',
        tenantType: 'PHARMACY',
        taxIdentifier: '1023456028',
      },
      owner: {
        email: 'ana@ejemplo.test',
        password: 'secreto12',
        name: 'Ana',
        lastName: 'Paz',
      },
    },
    required: ['organization', 'owner'],
    nested: ['organization', 'owner'],
  },
];

/** Valores que ningún formulario manda y que cualquier cliente puede mandar. */
const HOSTILE: readonly (readonly [string, unknown])[] = [
  ['null', null],
  ['cero', 0],
  ['negativo', -1],
  ['número enorme', Number.MAX_VALUE],
  ['booleano', true],
  ['arreglo vacío', []],
  ['arreglo de texto', ['x']],
  ['objeto vacío', {}],
  ['objeto', { a: 1 }],
  ['texto vacío', ''],
  ['solo espacios', '   '],
  ['texto de 100 000 caracteres', 'x'.repeat(100_000)],
  ['byte nulo', 'a\u0000b'],
  ['HTML', '<script>alert(1)</script>'],
  ['SQL', "'; DROP TABLE iam.users;--"],
  ['emoji', '😀'.repeat(300)],
  ['propiedad __proto__', JSON.parse('{"__proto__":{"polluted":true}}')],
  ['uuid mal formado', '11111111-1111-1111-1111'],
];

const metadata = (dto: Type<unknown>): ArgumentMetadata => ({
  type: 'body',
  metatype: dto,
  data: '',
});

/** Pasa el cuerpo por el pipe real y devuelve el 400 si lo hubo. */
async function run(
  dto: Type<unknown>,
  body: unknown,
): Promise<BadRequestException | null> {
  try {
    await createGlobalValidationPipe().transform(body, metadata(dto));
    return null;
  } catch (error) {
    if (error instanceof BadRequestException) return error;
    throw error;
  }
}

/** Los campos que el 400 señala, con su ruta completa. */
function violatedFields(error: BadRequestException): string[] {
  const response = error.getResponse() as {
    code?: string;
    details?: { fields?: { field: string }[] };
  };
  expect(response.code).toBe(ErrorCode.VALIDATION_FAILED);
  return (response.details?.fields ?? []).map((f) => f.field);
}

/** Copia de `body` con `value` puesto en la ruta `a.b.c`. */
function setAt(
  body: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const [head, ...rest] = path.split('.');
  const copy: Record<string, unknown> = { ...body };
  copy[head] =
    rest.length === 0
      ? value
      : setAt(copy[head] as Record<string, unknown>, rest.join('.'), value);
  return copy;
}

/** Las rutas hoja y de subobjeto del cuerpo válido, hasta dos niveles. */
function pathsOf(body: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(body).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? [path, ...pathsOf(value as Record<string, unknown>, path)]
      : [path];
  });
}

describe.each(REGISTRATIONS)('alta de $label', (registration) => {
  it('acepta el cuerpo válido mínimo', async () => {
    expect(await run(registration.dto, registration.valid)).toBeNull();
  });

  describe('cualquier valor hostil en cualquier campo', () => {
    const cases = pathsOf(registration.valid).flatMap((path) =>
      HOSTILE.map(([name, value]) => [path, name, value] as const),
    );

    it.each(cases)(
      '%s = %s: se acepta o da un 400 de validación, nunca un 500',
      async (path, _name, value) => {
        const outcome = await run(
          registration.dto,
          setAt(registration.valid, path, value),
        );
        if (outcome !== null) violatedFields(outcome);
      },
    );
  });

  describe('falla donde tiene que fallar', () => {
    it.each(registration.required)('rechaza %s ausente', async (field) => {
      const { [field]: _omitted, ...rest } = registration.valid;
      const outcome = await run(registration.dto, rest);
      expect(outcome).not.toBeNull();
      expect(violatedFields(outcome!)).toContain(field);
    });

    it.each(registration.required)('rechaza %s en null', async (field) => {
      const outcome = await run(
        registration.dto,
        setAt(registration.valid, field, null),
      );
      expect(outcome).not.toBeNull();
      expect(violatedFields(outcome!)).toContain(field);
    });

    it('rechaza una clave que el DTO no declara, en la raíz', async () => {
      const outcome = await run(registration.dto, {
        ...registration.valid,
        campoQueNoExiste: 'x',
      });
      expect(outcome).not.toBeNull();
      expect(violatedFields(outcome!)).toContain('campoQueNoExiste');
    });

    const nestedCases = registration.nested.length
      ? registration.nested
      : (['(sin objetos anidados)'] as const);

    it.each(nestedCases)(
      'rechaza una clave que el DTO no declara, dentro de %s',
      async (path) => {
        if (registration.nested.length === 0) return;
        const current = path
          .split('.')
          .reduce<unknown>(
            (acc, key) => (acc as Record<string, unknown>)[key],
            registration.valid,
          ) as Record<string, unknown>;
        const outcome = await run(
          registration.dto,
          setAt(registration.valid, path, { ...current, campoQueNoExiste: 1 }),
        );
        expect(outcome).not.toBeNull();
        expect(violatedFields(outcome!)).toContain(`${path}.campoQueNoExiste`);
      },
    );

    it('no contamina Object.prototype con un __proto__ en el cuerpo', async () => {
      await run(
        registration.dto,
        JSON.parse(
          `{"__proto__":{"polluted":"yes"},${JSON.stringify(
            registration.valid,
          ).slice(1)}`,
        ),
      );
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  it.each([
    ['null', null],
    ['texto', 'hola'],
    ['número', 42],
    ['arreglo', []],
    ['undefined', undefined],
  ])('un cuerpo que es %s no revienta', async (_name, body) => {
    const outcome = await run(registration.dto, body);
    if (outcome !== null) violatedFields(outcome);
  });
});

describe('contratos concretos del alta', () => {
  it('farmacia: el NIT del frontend se acepta y uno con símbolos raros se rechaza', async () => {
    const withTax = (taxIdentifier: unknown) =>
      setAt(
        REGISTRATIONS[4].valid,
        'organization.taxIdentifier',
        taxIdentifier,
      );
    expect(
      await run(RegisterOrganizationDto, withTax('1023456028')),
    ).toBeNull();
    const rejected = await run(RegisterOrganizationDto, withTax('10 23;--'));
    expect(violatedFields(rejected!)).toContain('organization.taxIdentifier');
  });

  it('profesional: ownSite.contactPhone (el campo del error en dev) se acepta', async () => {
    expect(
      await run(RegisterPractitionerDto, REGISTRATIONS[1].valid),
    ).toBeNull();
  });

  it('profesional: un teléfono de consultorio con letras se rechaza señalando el campo', async () => {
    const outcome = await run(
      RegisterPractitionerDto,
      setAt(REGISTRATIONS[1].valid, 'ownSite.contactPhone', 'llamar al doctor'),
    );
    expect(violatedFields(outcome!)).toContain('ownSite.contactPhone');
  });

  it('profesional: media coordenada del consultorio se rechaza', async () => {
    const outcome = await run(
      RegisterPractitionerDto,
      setAt(REGISTRATIONS[1].valid, 'ownSite.address', {
        lines: [],
        latitude: -17.78,
      }),
    );
    expect(violatedFields(outcome!)).toContain('ownSite.address.longitude');
  });
});
