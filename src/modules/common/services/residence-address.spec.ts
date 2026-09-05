import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import {
  boDepartmentConceptId,
  boMunicipalityConceptId,
} from '../../../common/seed/bo-geography.catalog';
import { createResidenceAddress } from './residence-address';

/** Repositorio de direcciones reducido a lo único que el ayudante usa. */
function buildRepo() {
  const rows: any[] = [];
  return {
    repo: { create: mockFn((_tx: any, data: any) => rows.push(data)) } as any,
    rows,
  };
}

describe('createResidenceAddress', () => {
  const tx = {} as any;

  it('deriva el departamento del municipio, sin recibirlo', () => {
    const { repo, rows } = buildRepo();

    // Sacaba es de Cochabamba: su código del INE empieza en 03.
    const sacaba = boMunicipalityConceptId('031001');
    const escribio = createResidenceAddress(repo, tx, {
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

  it('sin municipio no escribe nada: el domicilio es opcional', () => {
    const { repo, rows } = buildRepo();

    const escribio = createResidenceAddress(repo, tx, {
      personId: 'person-1',
      actorUserId: 'user-1',
    });

    expect(escribio).toBe(false);
    // Una dirección con país y nada más no es un dato, es una fila.
    expect(rows).toHaveLength(0);
  });

  it('rechaza un uuid que no sea de un municipio del catálogo', () => {
    const { repo, rows } = buildRepo();

    // Forma de uuid válida —pasa el `@IsUUID` del DTO— pero es un departamento.
    expect(
      () =>
        createResidenceAddress(repo, tx, {
          personId: 'person-1',
          municipalityConceptId: boDepartmentConceptId('SC'),
          actorUserId: 'user-1',
        }),
      // Sin esta comprobación el `INSERT` reventaría por integridad referencial,
      // con un error que no le dice nada a quien se está registrando.
    ).toThrow(/no pertenece al catálogo/);
    expect(rows).toHaveLength(0);
  });
});
