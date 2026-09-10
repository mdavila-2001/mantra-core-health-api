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
import {
  createResidenceAddress,
  replaceResidenceAddress,
} from './residence-address';

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
function buildConcepts(
  municipios: Record<string, { code: string; display: string }> = {},
) {
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

/**
 * Quitar el punto del mapa — el tercer estado que faltaba.
 *
 * `undefined` conserva el punto vigente y un par de números lo mueve; las dos
 * cosas ya andaban. Lo que no había forma de hacer era **borrarlo**: la mezcla
 * conserva lo anterior cuando no llega nada, así que una ubicación mal puesta
 * sólo se podía cambiar por otra. Desde que el perfil deja mover el pin, eso
 * dejó de ser aceptable.
 */
describe('replaceResidenceAddress · quitar el punto del mapa', () => {
  const tx = {} as any;

  /** La fila vigente, con su punto puesto. */
  const VIGENTE = {
    id: 'addr-1',
    municipalityConceptId: 'mun-1',
    lines: 'Av. Banzer 3er anillo',
    latitude: '-17.78',
    longitude: '-63.18',
  };

  /** Repositorio con una dirección vigente y captura de lo que se escribe. */
  function conVigente() {
    const escritas: any[] = [];
    return {
      escritas,
      repo: {
        findVigenteByOwnerAndUse: mockFn(async () => VIGENTE),
        closeVigente: mockFn(),
        create: mockFn((_tx: any, data: any) => escritas.push(data)),
      } as any,
    };
  }

  const concepts = () =>
    buildConcepts({
      'mun-1': { code: 'SC-Santa Cruz', display: 'Santa Cruz' },
    });

  it('`null` en las dos QUITA el punto y conserva el resto de la dirección', async () => {
    const { repo, escritas } = conVigente();

    await replaceResidenceAddress(
      repo,
      tx,
      concepts(),
      {
        personId: 'person-1',
        useConceptId: CONCEPTS.ADDR_USE_HOME,
        latitude: null,
        longitude: null,
        actorUserId: 'user-1',
      },
      new Date('2026-09-10T12:00:00.000Z'),
    );

    expect(escritas).toHaveLength(1);
    expect(escritas[0].latitude).toBeUndefined();
    expect(escritas[0].longitude).toBeUndefined();
    // La calle no se toca: quitar el pin no es mudarse.
    expect(escritas[0].lines).toBe('Av. Banzer 3er anillo');
  });

  it('sin coordenadas en el cuerpo, el punto vigente se conserva', async () => {
    // La distinción que hace falta: no mandarlas es «no lo toqué».
    const { repo, escritas } = conVigente();

    await replaceResidenceAddress(
      repo,
      tx,
      concepts(),
      {
        personId: 'person-1',
        useConceptId: CONCEPTS.ADDR_USE_HOME,
        lines: 'Calle Nueva 100',
        actorUserId: 'user-1',
      },
      new Date('2026-09-10T12:00:00.000Z'),
    );

    // La columna es `numeric` y se escribe como texto: lo que importa acá es
    // que el punto sobrevive, no su representación.
    expect(Number(escritas[0].latitude)).toBe(-17.78);
    expect(Number(escritas[0].longitude)).toBe(-63.18);
  });

  it('un par de números mueve el punto', async () => {
    const { repo, escritas } = conVigente();

    await replaceResidenceAddress(
      repo,
      tx,
      concepts(),
      {
        personId: 'person-1',
        useConceptId: CONCEPTS.ADDR_USE_HOME,
        latitude: -16.5,
        longitude: -68.15,
        actorUserId: 'user-1',
      },
      new Date('2026-09-10T12:00:00.000Z'),
    );

    expect(Number(escritas[0].latitude)).toBe(-16.5);
    expect(Number(escritas[0].longitude)).toBe(-68.15);
  });

  it('quitar un punto que ya no estaba no escribe una fila nueva', async () => {
    // `sinCambios` tiene que seguir valiendo: si no, cada PATCH que repite el
    // mismo domicilio abriría una fila más en el historial.
    const escritas: any[] = [];
    const repo = {
      findVigenteByOwnerAndUse: mockFn(async () => ({
        ...VIGENTE,
        latitude: undefined,
        longitude: undefined,
      })),
      closeVigente: mockFn(),
      create: mockFn((_tx: any, data: any) => escritas.push(data)),
    } as any;

    await replaceResidenceAddress(
      repo,
      tx,
      concepts(),
      {
        personId: 'person-1',
        useConceptId: CONCEPTS.ADDR_USE_HOME,
        latitude: null,
        longitude: null,
        actorUserId: 'user-1',
      },
      new Date('2026-09-10T12:00:00.000Z'),
    );

    expect(escritas).toHaveLength(0);
  });
});
