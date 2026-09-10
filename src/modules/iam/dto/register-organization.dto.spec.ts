import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

import { RegisterOrganizationDto } from './register-organization.dto';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';

/**
 * El alta mínima que el DTO exige, para no repetirla en cada caso.
 *
 * Sin `diagnosticUnit`: es el bloque de la subtarea 1.5, opcional para
 * cualquier tipo (la exclusividad con `tenantType` la comprueba el servicio,
 * no el DTO).
 */
const ALTA_MINIMA = {
  organization: {
    code: 'CENTRO_IMAGEN_Z',
    legalName: 'Centro de Imagen Z S.R.L.',
    tenantType: 'DIAGNOSTIC_CENTER',
  },
  owner: {
    email: 'ana@ejemplo.test',
    password: 'secreto12',
    name: 'Ana',
    lastName: 'Paz',
  },
};

/**
 * Aplana el árbol de `ValidationError` a rutas `a.b.c`, igual que hace el
 * `ValidationPipe` de Nest (`prependConstraintsWithParentProp`) para las
 * propiedades anidadas.
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
 * `forbidNonWhitelisted` reproduce el `ValidationPipe` real de `main.ts`: sin
 * ella, una clave desconocida se ignora en silencio.
 *
 * @param alta - El cuerpo del alta, tal como llegaría del cliente.
 * @returns Las rutas con error.
 */
async function propiedadesConError(
  alta: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(RegisterOrganizationDto, alta);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return rutasConError(errores);
}

describe('RegisterOrganizationDto · alta mínima', () => {
  it('acepta el alta mínima con DIAGNOSTIC_CENTER, sin el bloque diagnosticUnit', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('acepta DIAGNOSTIC_CENTER entre los tipos válidos', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        organization: { ...ALTA_MINIMA.organization, tenantType: 'HOSPITAL' },
      }),
    ).toEqual([]);
  });
});

/**
 * El bloque `diagnosticUnit` (subtarea 1.5): el DTO sólo comprueba forma
 * (uuid, longitudes, anidamiento); que sólo corresponda a DIAGNOSTIC_CENTER y
 * que las modalidades pertenezcan a la lista cerrada del módulo 23 lo
 * comprueba `TenantTypeProfileService`, no este DTO.
 */
describe('RegisterOrganizationDto · diagnosticUnit (1.5)', () => {
  it('acepta el bloque completo', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        organization: {
          ...ALTA_MINIMA.organization,
          diagnosticUnit: {
            code: 'CENTRO_IMAGEN_Z_CENTRAL',
            name: 'Sede central',
            modalityConceptIds: [DUNIT.MODALITY_XRAY, DUNIT.MODALITY_MRI],
            walkInAvailable: true,
            homeCollectionAvailable: false,
            primarySite: {
              name: 'Sede central',
              timeZone: 'America/La_Paz',
              address: {
                lines: ['Av. San Martín 123'],
                municipalityConceptId: '33333333-3333-4333-8333-333333333333',
                latitude: -17.78,
                longitude: -63.18,
              },
            },
          },
        },
      }),
    ).toEqual([]);
  });

  it('rechaza una modalidad que no es un uuid', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        organization: {
          ...ALTA_MINIMA.organization,
          diagnosticUnit: {
            modalityConceptIds: ['no-es-un-uuid'],
          },
        },
      }),
    ).toEqual(['organization.diagnosticUnit.modalityConceptIds']);
  });

  it('rechaza una clave desconocida dentro de diagnosticUnit', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        organization: {
          ...ALTA_MINIMA.organization,
          diagnosticUnit: { codigoQueNoExiste: 'X' },
        },
      }),
    ).toContain('organization.diagnosticUnit.codigoQueNoExiste');
  });

  it('el par de coordenadas de la sede primaria es ambas o ninguna', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        organization: {
          ...ALTA_MINIMA.organization,
          diagnosticUnit: {
            primarySite: {
              address: { lines: [], latitude: -17.78 },
            },
          },
        },
      }),
    ).toEqual(['organization.diagnosticUnit.primarySite.address.longitude']);
  });
});
