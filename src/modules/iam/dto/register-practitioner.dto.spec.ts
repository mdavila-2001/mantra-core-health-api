import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

import {
  AssistedPractitionerRegistrationDto,
  RegisterPractitionerDto,
} from './register-practitioner.dto';

/**
 * El alta mínima que el DTO exige, para no repetirla en cada caso.
 *
 * `displayName` evita la complejidad de `name`/`lastName` (obligatorios sólo
 * si `displayName` falta): estas pruebas afirman `ownSite`, no el resto del
 * alta.
 */
const ALTA_MINIMA = {
  email: 'ana@ejemplo.test',
  password: 'secreto12',
  displayName: 'Ana Rojas',
  licenseNumber: 'MP-1234',
};

/**
 * Aplana el árbol de `ValidationError` a rutas `a.b.c`, igual que hace el
 * `ValidationPipe` de Nest (`prependConstraintsWithParentProp`) para las
 * propiedades anidadas. `validate()` de `class-validator`, a diferencia del
 * pipe, no aplana solo — cada nivel de `@ValidateNested()` cuelga sus propios
 * errores en `children`.
 *
 * @param errores - Los errores devueltos por `validate()`.
 * @param prefijo - La ruta acumulada hasta este nivel.
 * @returns Las rutas de las propiedades con error, ordenadas y sin repetidos.
 */
function rutasConError(
  errores: readonly ValidationError[],
  prefijo = '',
): string[] {
  const rutas: string[] = [];
  for (const error of errores) {
    const ruta = prefijo ? `${prefijo}.${error.property}` : error.property;
    if (error.constraints) rutas.push(ruta);
    if (error.children && error.children.length > 0) {
      rutas.push(...rutasConError(error.children, ruta));
    }
  }
  return [...new Set(rutas)].sort();
}

/**
 * Valida un alta y devuelve las rutas de las propiedades que quedaron mal.
 *
 * `forbidNonWhitelisted` se declara acá porque es la regla que reproduce el
 * `ValidationPipe` real de `main.ts`: sin ella, una clave desconocida se
 * ignora en silencio en vez de rechazar el alta entera.
 *
 * @param alta - El cuerpo del alta, tal como llegaría del cliente.
 * @returns Las rutas con error (`ownSite.name`, `ownSite.address.longitude`…).
 */
async function propiedadesConError(
  alta: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(RegisterPractitionerDto, alta);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return rutasConError(errores);
}

/**
 * El empleador (1.3): mismo par catálogo/texto libre que ya tenía
 * `occupationConceptId`/`occupationFreeText`, con la misma regla de forma
 * (uuid o texto de hasta 200 caracteres) — la exclusión mutua la aplica el
 * servicio, no el DTO.
 */
describe('RegisterPractitionerDto · ocupación y empresa (1.3)', () => {
  it('acepta un empleador del catálogo', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workEmployerConceptId: '36c99f5d-9417-51e8-89d2-4f54138bb323',
      }),
    ).toEqual([]);
  });

  it('acepta un empleador en texto libre', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workEmployerFreeText: 'Consultores Médicos Asociados S.R.L.',
      }),
    ).toEqual([]);
  });

  it('rechaza un empleador que no es un uuid', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workEmployerConceptId: 'employer:bo:BANCO_UNION',
      }),
    ).toEqual(['workEmployerConceptId']);
  });

  it('rechaza un empleador en texto libre demasiado largo', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workEmployerFreeText: 'A'.repeat(201),
      }),
    ).toEqual(['workEmployerFreeText']);
  });
});

describe('RegisterPractitionerDto · ownSite (P20)', () => {
  it('acepta el alta sin ownSite: el campo es opcional', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('acepta un ownSite mínimo, sólo con nombre', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        ownSite: { name: 'Consultorio' },
      }),
    ).toEqual([]);
  });

  it('rechaza un nombre de consultorio demasiado corto', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        ownSite: { name: 'X' },
      }),
    ).toEqual(['ownSite.name']);
  });

  it('acepta address.lines vacío: la sede se puede ubicar sólo por municipio o GPS', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        ownSite: {
          name: 'Consultorio',
          address: {
            lines: [],
            municipalityConceptId: '11111111-1111-4111-8111-111111111111',
          },
        },
      }),
    ).toEqual([]);
  });

  it('rechaza latitud sin longitud: el par es ambos o ninguno', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        ownSite: {
          name: 'Consultorio',
          address: { lines: [], latitude: -16.5 },
        },
      }),
    ).toEqual(['ownSite.address.longitude']);
  });

  it('rechaza una propiedad desconocida dentro de ownSite: whitelist anidado', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        ownSite: { name: 'Consultorio', foo: 1 },
      }),
    ).toEqual(['ownSite.foo']);
  });

  it('el alta asistida (OmitType) hereda ownSite', async () => {
    const { password: _password, ...altaSinPassword } = ALTA_MINIMA;
    const dto = plainToInstance(AssistedPractitionerRegistrationDto, {
      ...altaSinPassword,
      reason: 'Alta de plantel',
      ownSite: { name: 'X' },
    });
    const errores = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(rutasConError(errores)).toEqual(['ownSite.name']);
  });
});
