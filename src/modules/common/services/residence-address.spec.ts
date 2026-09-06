import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { boDepartmentConceptId } from '../../../common/seed/bo-geography.catalog';
import { createResidenceAddress } from './residence-address';

/** Repositorio de direcciones reducido a lo único que el ayudante usa. */
function buildRepo() {
  const rows: any[] = [];
  return {
    repo: { create: mockFn((_tx: any, data: any) => rows.push(data)) } as any,
    rows,
  };
}

/**
 * Repositorio de conceptos reducido a `findById`, con un único municipio
 * sembrado: el esquema real de `terminology.catalog_concepts` (código
 * `SIGLA-NOMBRE`), no el del catálogo estático retirado.
 */
function buildConcepts(municipios: Record<string, { code: string; display: string }> = {}) {
  return {
    findById: mockFn((_tx: any, id: string) => municipios[id] ?? null),
  } as any;
}

describe('createResidenceAddress', () => {
  const tx = {} as any;

  it('deriva el departamento del municipio, sin recibirlo', async () => {
    const { repo, rows } = buildRepo();
    const sacaba = 'concept-sacaba';
    const concepts = buildConcepts({
      [sacaba]: { code: 'CB-SACABA', display: 'Sacaba' },
    });

    const escribio = await createResidenceAddress(repo, tx, concepts, {
      personId: 'person-1',
      municipalityConceptId: sacaba,
      actorUserId: 'user-1',
    });

    expect(escribio).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ownerId: 'person-1',
      countryConceptId: CONCEPTS.COUNTRY_BO,
      municipalityConceptId: sacaba,
      administrativeAreaConceptId: boDepartmentConceptId('CB'),
      city: 'Sacaba',
      useConceptId: CONCEPTS.ADDR_USE_HOME,
    });
  });

  it('sin municipio no escribe nada: el domicilio es opcional', async () => {
    const { repo, rows } = buildRepo();
    const concepts = buildConcepts();

    const escribio = await createResidenceAddress(repo, tx, concepts, {
      personId: 'person-1',
      actorUserId: 'user-1',
    });

    expect(escribio).toBe(false);
    // Una dirección con país y nada más no es un dato, es una fila.
    expect(rows).toHaveLength(0);
  });

  it('rechaza un uuid que no exista en el catálogo de municipios', async () => {
    const { repo, rows } = buildRepo();
    // Forma de uuid válida —pasa el `@IsUUID` del DTO— pero no está sembrado.
    const concepts = buildConcepts();

    await expect(
      createResidenceAddress(repo, tx, concepts, {
        personId: 'person-1',
        municipalityConceptId: 'concept-inexistente',
        actorUserId: 'user-1',
      }),
      // Sin esta comprobación el `INSERT` reventaría por integridad referencial,
      // con un error que no le dice nada a quien se está registrando.
    ).rejects.toThrow(/no pertenece al catálogo/);
    expect(rows).toHaveLength(0);
  });
});
