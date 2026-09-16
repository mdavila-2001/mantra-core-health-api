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

/**
 * Los títulos declarados en el alta (1.6).
 *
 * El arreglo es opcional entero, pero cada elemento que llegue tiene que ser
 * guardable: sin `number` la fila no se puede escribir —la columna es NOT
 * NULL—, así que el rechazo tiene que ocurrir en el borde y no al persistir.
 */
describe('RegisterPractitionerDto · títulos declarados en el alta (1.6)', () => {
  const TIPO = '36c99f5d-9417-51e8-89d2-4f54138bb323';

  it('acepta el alta sin el arreglo', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('acepta un arreglo vacío', async () => {
    expect(
      await propiedadesConError({ ...ALTA_MINIMA, credentials: [] }),
    ).toEqual([]);
  });

  it('acepta un título con su tipo, su número y su institución', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'DIP-001',
            issuingInstitutionText: 'Universidad Mayor de San Andrés',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('rechaza un elemento sin número', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [{ credentialTypeConceptId: TIPO }],
      }),
    ).toEqual(['credentials.0.number']);
  });

  it('señala el elemento exacto que viene mal', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          { credentialTypeConceptId: TIPO, number: 'DIP-001' },
          { credentialTypeConceptId: TIPO },
        ],
      }),
    ).toEqual(['credentials.1.number']);
  });

  it('rechaza un número vacío', async () => {
    // La columna es NOT NULL pero acepta la cadena vacía: sin esto, una
    // credencial sin número entraría por una superficie pública.
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [{ credentialTypeConceptId: TIPO, number: '' }],
      }),
    ).toEqual(['credentials.0.number']);
  });

  it('rechaza un número que es sólo espacios', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [{ credentialTypeConceptId: TIPO, number: '   ' }],
      }),
    ).toEqual(['credentials.0.number']);
  });

  it('acepta el número más largo que la columna admite', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          { credentialTypeConceptId: TIPO, number: 'A'.repeat(100) },
        ],
      }),
    ).toEqual([]);
  });

  it('rechaza un número más largo que la columna', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          { credentialTypeConceptId: TIPO, number: 'A'.repeat(101) },
        ],
      }),
    ).toEqual(['credentials.0.number']);
  });

  it('rechaza un tipo que no es un uuid', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          { credentialTypeConceptId: 'CREDENTIAL_TYPE_DEGREE', number: 'T-1' },
        ],
      }),
    ).toEqual(['credentials.0.credentialTypeConceptId']);
  });

  it('rechaza una institución más larga que la columna', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'T-1',
            issuingInstitutionText: 'A'.repeat(201),
          },
        ],
      }),
    ).toEqual(['credentials.0.issuingInstitutionText']);
  });

  it('rechaza una clave que el elemento no declara', async () => {
    // `forbidNonWhitelisted` también rige adentro del arreglo: la ciudad del
    // lugar de estudio no tiene dónde guardarse y no se acepta en silencio.
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'T-1',
            issuingCityText: 'La Paz',
          },
        ],
      }),
    ).toEqual(['credentials.0.issuingCityText']);
  });
});

/**
 * El departamento emisor del documento (1.4): `ALTA_MINIMA` no trae
 * `nationalId`, así que sirve tal cual para «sin documento, el departamento
 * no hace falta». Con documento pasa a ser obligatorio (PR #390 del front) —
 * mismo catálogo `VS_BO_DEPARTMENT` que en `RegisterPatientDto`, pero acá
 * condicionado a `nationalId` en vez de siempre obligatorio.
 */
describe('RegisterPractitionerDto · departamento emisor del documento (1.4)', () => {
  it('acepta el alta sin documento ni departamento', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('rechaza el documento sin departamento', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        nationalId: '4821993',
      }),
    ).toEqual(['issuerAdministrativeAreaConceptId']);
  });

  it('acepta documento y departamento juntos', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        nationalId: '4821993',
        issuerAdministrativeAreaConceptId:
          '22222222-2222-4222-8222-222222222222',
      }),
    ).toEqual([]);
  });

  it('acepta el departamento sin documento: se ignora', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        issuerAdministrativeAreaConceptId:
          '22222222-2222-4222-8222-222222222222',
      }),
    ).toEqual([]);
  });

  it('un documento en blanco no activa la exigencia del departamento', async () => {
    // El `Matches` del propio `nationalId` ya lo rechaza; lo que se fija acá
    // es que el `ValidateIf` no dispare por una condición mal escrita
    // (`!== undefined` en vez de comprobar la cadena vacía).
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        nationalId: '',
      }),
    ).toEqual(['nationalId']);
  });

  it('rechaza un departamento que no es un uuid', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        nationalId: '4821993',
        issuerAdministrativeAreaConceptId: 'geo:bo:department:SC',
      }),
    ).toEqual(['issuerAdministrativeAreaConceptId']);
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

/**
 * El domicilio del alta (P19): calle y coordenadas, mismo patrón que
 * `RegisterPatientDto.homeLatitude` — el par viaja junto o no viaja.
 */
describe('RegisterPractitionerDto · domicilio (P19)', () => {
  it('acepta los tres campos del domicilio', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        residenceMunicipalityConceptId: '11111111-1111-4111-8111-111111111111',
        homeAddressLines: 'Barrio Equipetrol, Calle 7 Este #12',
        homeLatitude: -17.7689,
        homeLongitude: -63.1956,
      }),
    ).toEqual([]);
  });

  it('acepta el alta sin ningún dato de domicilio', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('rechaza latitud sin longitud', async () => {
    expect(
      await propiedadesConError({ ...ALTA_MINIMA, homeLatitude: -17.7689 }),
    ).toEqual(['homeLongitude']);
  });

  it('rechaza longitud sin latitud', async () => {
    expect(
      await propiedadesConError({ ...ALTA_MINIMA, homeLongitude: -63.1956 }),
    ).toEqual(['homeLatitude']);
  });

  it('rechaza la calle vacía: ausente y vacía no son lo mismo', async () => {
    expect(
      await propiedadesConError({ ...ALTA_MINIMA, homeAddressLines: '' }),
    ).toEqual(['homeAddressLines']);
  });

  it('rechaza una latitud fuera de rango', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        homeLatitude: 91,
        homeLongitude: -63.1956,
      }),
    ).toEqual(['homeLatitude']);
  });

  it('el alta asistida (OmitType) hereda el domicilio', async () => {
    const { password: _password, ...altaSinPassword } = ALTA_MINIMA;
    const dto = plainToInstance(AssistedPractitionerRegistrationDto, {
      ...altaSinPassword,
      reason: 'Alta de plantel',
      homeLatitude: -17.7689,
    });
    const errores = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(rutasConError(errores)).toEqual(['homeLongitude']);
  });
});
