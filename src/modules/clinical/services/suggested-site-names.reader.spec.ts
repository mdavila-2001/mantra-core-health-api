import { jest } from '@jest/globals';
import { PracticeSites } from '../../practice/entities';
import { SuggestedSiteNamesReader } from './suggested-site-names.reader';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('SuggestedSiteNamesReader', () => {
  const reader = new SuggestedSiteNamesReader();

  it('resuelve los nombres de un lote en una sola consulta', async () => {
    const find = mockFn().mockResolvedValue([
      { id: 's1', name: 'Centro Norte' },
      { id: 's2', name: 'Centro Sur' },
    ]);

    const names = await reader.namesFor({ find } as any, ['s1', 's2', 's1']);

    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith(
      PracticeSites,
      { id: { $in: ['s1', 's2'] } },
      expect.anything(),
    );
    expect(names.get('s1')).toBe('Centro Norte');
    expect(names.get('s2')).toBe('Centro Sur');
  });

  it('sin sedes (o solo nulas) no consulta', async () => {
    const find = mockFn();

    const names = await reader.namesFor({ find } as any, [null, undefined]);

    expect(names.size).toBe(0);
    expect(find).not.toHaveBeenCalled();
  });

  it('una sede inexistente no figura en el mapa', async () => {
    const find = mockFn().mockResolvedValue([]);

    const names = await reader.namesFor({ find } as any, ['s9']);

    expect(names.has('s9')).toBe(false);
  });
});
