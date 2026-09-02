import { jest } from '@jest/globals';

import { PreconditionFailedException } from '../../../common';
import { boDepartmentConceptId } from '../../../common/seed/bo-geography.catalog';
import {
  ADMINISTRATIVE_AREA_VALUE_SET,
  AdministrativeAreaCatalogService,
} from './administrative-area-catalog.service';

/** El proyecto corre jest en ESM: los dobles se arman con este envoltorio. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Santa Cruz y La Paz del catálogo `VS_BO_DEPARTMENT`. */
const SANTA_CRUZ = boDepartmentConceptId('SC');
const LA_PAZ = boDepartmentConceptId('LP');

/**
 * Un concepto real del sistema que NO es un departamento: sirve de
 * contraejemplo, igual que en `medical-specialty-catalog.service.spec.ts`.
 */
const NO_ES_DEPARTAMENTO = '211c3fe3-88de-5d17-8974-ed4744e2fa03';

function build(
  overrides: {
    conjunto?: { id: string } | null;
    miembros?: string[] | null;
  } = {},
) {
  const valueSets = {
    findByInternalCode: mockFn().mockResolvedValue(
      overrides.conjunto === undefined
        ? { id: 'vs-departamentos' }
        : overrides.conjunto,
    ),
    findIncludedConceptIdsByValueSet: mockFn().mockResolvedValue(
      overrides.miembros === undefined
        ? [SANTA_CRUZ, LA_PAZ]
        : overrides.miembros,
    ),
  };
  const service = new AdministrativeAreaCatalogService(valueSets as never);
  return { service, valueSets, em: {} as never };
}

describe('AdministrativeAreaCatalogService', () => {
  it('acepta un concepto que es miembro vigente del catálogo', async () => {
    const d = build();
    await expect(
      d.service.assertIsAdministrativeArea(d.em, SANTA_CRUZ),
    ).resolves.toBeUndefined();
  });

  it('busca el catálogo por su código estable, no por uuid', async () => {
    const d = build();
    await d.service.assertIsAdministrativeArea(d.em, SANTA_CRUZ);
    expect(d.valueSets.findByInternalCode).toHaveBeenCalledWith(
      d.em,
      ADMINISTRATIVE_AREA_VALUE_SET,
    );
  });

  it('rechaza con 422 un concepto que existe pero no es un departamento', async () => {
    const d = build();
    await expect(
      d.service.assertIsAdministrativeArea(d.em, NO_ES_DEPARTAMENTO),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('si el catálogo no está sembrado lo dice, en vez de rechazar toda búsqueda', async () => {
    const d = build({ conjunto: null });
    await expect(
      d.service.assertIsAdministrativeArea(d.em, SANTA_CRUZ),
    ).rejects.toThrow(/no está disponible/);
    expect(d.valueSets.findIncludedConceptIdsByValueSet).not.toHaveBeenCalled();
  });

  it('un catálogo sin versión vigente se trata igual que uno ausente', async () => {
    const d = build({ miembros: null });
    await expect(
      d.service.assertIsAdministrativeArea(d.em, SANTA_CRUZ),
    ).rejects.toThrow(/no está disponible/);
  });

  it('un catálogo vacío rechaza, pero no se confunde con uno ausente', async () => {
    const d = build({ miembros: [] });
    await expect(
      d.service.assertIsAdministrativeArea(d.em, SANTA_CRUZ),
    ).rejects.toThrow(/no pertenece al catálogo/);
  });
});
