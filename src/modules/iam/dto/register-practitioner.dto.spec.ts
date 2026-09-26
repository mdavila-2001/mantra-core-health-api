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
  nationalId: '4821993',
  issuerAdministrativeAreaConceptId: '22222222-2222-4222-8222-222222222222',
};

describe('RegisterPractitionerDto · CI obligatorio (MED-01)', () => {
  it('rechaza el alta si falta el documento de identidad', async () => {
    const { nationalId: _nationalId, ...sinDocumento } = ALTA_MINIMA;
    expect(await propiedadesConError(sinDocumento)).toContain('nationalId');
  });
});

describe('RegisterPractitionerDto · correo laboral separado (MED-03)', () => {
  it('acepta el correo laboral junto al correo de acceso personal', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        email: 'ana.personal@example.test',
        workEmail: 'ana@hospital.example.test',
      }),
    ).toEqual([]);
  });

  it('rechaza un correo laboral con formato inválido', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workEmail: 'no-es-un-correo',
      }),
    ).toEqual(['workEmail']);
  });
});

describe('RegisterPractitionerDto · especialidad principal y tres adicionales (MED-02)', () => {
  const cuatroEspecialidades = [
    '7218acbc-5098-56ae-980a-9345961ced89',
    'bd0484b1-8959-5ba5-bb65-ca9305eedb30',
    'e0f2c074-572e-521c-a647-0ec85de5ff62',
    '3f29af08-4339-5c4f-90d6-e3831c7f0fbc',
  ];

  it('acepta una especialidad principal y tres adicionales', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        specialtyConceptIds: cuatroEspecialidades,
      }),
    ).toEqual([]);
  });

  it('rechaza una especialidad principal y cuatro adicionales', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        specialtyConceptIds: [
          ...cuatroEspecialidades,
          'c7a25eba-6961-5b97-bfae-bf1e2a33ce19',
        ],
      }),
    ).toEqual(['specialtyConceptIds']);
  });
});

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

  it('acepta el fileId del PDF precargado para asociarlo a ese título', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'TIT-001',
            fileId: '36c99f5d-9417-51e8-89d2-4f54138bb323',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('rechaza un fileId que no es uuid', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'TIT-001',
            fileId: 'documento-subido',
          },
        ],
      }),
    ).toEqual(['credentials.0.fileId']);
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
    // `forbidNonWhitelisted` también rige adentro del arreglo: una clave que el
    // título no declara no se acepta en silencio.
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'T-1',
            issuingStreetText: 'Av. Arce 2000',
          },
        ],
      }),
    ).toEqual(['credentials.0.issuingStreetText']);
  });

  it('acepta la ciudad y el país de emisión del título (ID-10)', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        credentials: [
          {
            credentialTypeConceptId: TIPO,
            number: 'T-1',
            issuingCityText: 'La Paz',
            issuingCountryConceptId: '00000000-0000-4000-8000-000000000001',
          },
        ],
      }),
    ).toEqual([]);
  });
});

/** CI y departamento emisor obligatorios para el alta profesional (MED-01). */
describe('RegisterPractitionerDto · departamento emisor del documento (1.4)', () => {
  it('rechaza el alta si falta el departamento emisor', async () => {
    const {
      issuerAdministrativeAreaConceptId: _issuerAdministrativeAreaConceptId,
      ...sinDepartamento
    } = ALTA_MINIMA;
    expect(await propiedadesConError(sinDepartamento)).toEqual([
      'issuerAdministrativeAreaConceptId',
    ]);
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

  it('rechaza el departamento sin documento', async () => {
    const { nationalId: _nationalId, ...sinDocumento } = ALTA_MINIMA;
    expect(
      await propiedadesConError({
        ...sinDocumento,
      }),
    ).toEqual(['nationalId']);
  });

  it('rechaza el CI en blanco', async () => {
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

/**
 * La dirección laboral y el GPS (MED-03) se guardan aparte del domicilio.
 */
describe('RegisterPractitionerDto · dirección laboral (MED-03)', () => {
  it('acepta la dirección y el par de coordenadas del trabajo', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workAddressLines: 'Hospital Central, Av. Principal 200',
        workLatitude: -17.78,
        workLongitude: -63.18,
      }),
    ).toEqual([]);
  });

  it('acepta el alta sin dirección de trabajo', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('rechaza coordenadas laborales incompletas', async () => {
    expect(
      await propiedadesConError({ ...ALTA_MINIMA, workLatitude: -17.78 }),
    ).toEqual(['workLongitude']);
  });

  it('rechaza coordenadas laborales fuera de rango', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        workLatitude: -91,
        workLongitude: -63.18,
      }),
    ).toEqual(['workLatitude']);
  });
});
