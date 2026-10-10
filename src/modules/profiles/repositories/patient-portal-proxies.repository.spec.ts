import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CONCEPTS } from '../../../common';
import { PROF } from '../profiles.concepts';
import { PatientPortalProxiesRepository } from './patient-portal-proxies.repository';

/**
 * Un `EntityManager` que sólo sabe ejecutar SQL cruda y la recuerda.
 *
 * @returns El doble y la función `execute` para inspeccionar lo que recibió.
 */
function withConnection() {
  const execute = fn().mockResolvedValue([]);
  const em = { getConnection: () => ({ execute }) };
  return { em: em as never, execute };
}

const NOW = new Date('2026-10-01T12:00:00.000Z');

const base = {
  ownerPersonId: 'person-1',
  proxyUserId: 'user-1',
  now: NOW,
  limit: 8,
};

describe('PatientPortalProxiesRepository.searchRepresentableByName', () => {
  const repo = new PatientPortalProxiesRepository();

  it('lleva tantos parámetros como `?` tiene la consulta, en el orden en que ésta los lee', async () => {
    const { em, execute } = withConnection();

    await repo.searchRepresentableByName(em, {
      ...base,
      tokens: ['ana', 'perez'],
    });

    const [sql, params] = execute.mock.calls[0];
    expect((sql.match(/\?/g) ?? []).length).toBe(params.length);
    expect(params).toEqual([
      CONCEPTS.ID_TYPE_NATIONAL,
      CONCEPTS.STATE_ACTIVE,
      'person-1',
      PROF.ACCOUNT_LINK_ACTIVE,
      'user-1',
      PROF.PROXY_PENDING,
      PROF.PROXY_ACTIVE,
      NOW,
      NOW,
      '% ana%',
      '% perez%',
      8,
    ]);
  });

  it('pide una condición de palabra por cada palabra escrita', async () => {
    const { em, execute } = withConnection();

    await repo.searchRepresentableByName(em, {
      ...base,
      tokens: ['ana', 'maria', 'perez'],
    });

    const [sql, params] = execute.mock.calls[0];
    expect(sql.match(/like \? escape/g)).toHaveLength(3);
    expect((sql.match(/\?/g) ?? []).length).toBe(params.length);
  });

  it('una sola palabra también deja la consulta alineada', async () => {
    const { em, execute } = withConnection();

    await repo.searchRepresentableByName(em, { ...base, tokens: ['ana'] });

    const [sql, params] = execute.mock.calls[0];
    expect((sql.match(/\?/g) ?? []).length).toBe(params.length);
    expect(params.at(-1)).toBe(8);
  });

  it('escapa los comodines de LIKE aunque hoy el servicio ya no los deje pasar', async () => {
    const { em, execute } = withConnection();

    await repo.searchRepresentableByName(em, {
      ...base,
      tokens: ['50%', 'a_b', 'c\\d'],
    });

    const params: unknown[] = execute.mock.calls[0][1];
    expect(params).toEqual(
      expect.arrayContaining(['% 50\\%%', '% a\\_b%', '% c\\\\d%']),
    );
  });

  it('sin palabras no consulta: devolver el padrón entero sería enumerarlo', async () => {
    const { em, execute } = withConnection();

    await expect(
      repo.searchRepresentableByName(em, { ...base, tokens: [] }),
    ).resolves.toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it('devuelve las filas tal como las trae la base', async () => {
    const { em, execute } = withConnection();
    const row = { patient_profile_id: 'p-1', display_name: 'Ana Pérez' };
    execute.mockResolvedValue([row]);

    await expect(
      repo.searchRepresentableByName(em, { ...base, tokens: ['ana'] }),
    ).resolves.toEqual([row]);
  });
});
