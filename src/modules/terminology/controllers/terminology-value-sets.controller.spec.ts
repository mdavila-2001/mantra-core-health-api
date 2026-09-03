import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyValueSetsController } from './terminology-value-sets.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyValueSetsController', () => {
  it('createValueSet delega en el servicio', async () => {
    const service = { createValueSet: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    const dto = { internalCode: 'vs', name: 'n', canonicalUrl: 'c' };
    const expected = { id: 'vs-1', versionId: 'vsv-1', rulesCount: 0 };
    service.createValueSet.mockResolvedValue(expected);

    const result = await controller.createValueSet(dto, user);

    expect(service.createValueSet).toHaveBeenCalledWith(dto, user);
    expect(result).toBe(expected);
  });

  it('readExpansion aplica el tope por defecto cuando el cliente no pide uno', async () => {
    const service = { readExpansion: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    service.readExpansion.mockResolvedValue({ items: [] });

    await controller.readExpansion('vs-1');

    expect(service.readExpansion).toHaveBeenCalledWith('vs-1', {
      valueSetVersionId: undefined,
      cursor: undefined,
      limit: 50,
      // Siempre presente: el opt-in se resuelve en el controlador, así el
      // servicio recibe un booleano y no una cadena que interpretar.
      includeProperties: false,
    });
  });

  it('readExpansion propaga versión, cursor y tope tal como llegan', async () => {
    const service = { readExpansion: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    service.readExpansion.mockResolvedValue({ items: [] });

    await controller.readExpansion('vs-1', 'vsv-2', 'cursor-opaco', 10);

    expect(service.readExpansion).toHaveBeenCalledWith('vs-1', {
      valueSetVersionId: 'vsv-2',
      cursor: 'cursor-opaco',
      limit: 10,
      includeProperties: false,
    });
  });

  it('readExpansion sólo pide propiedades cuando el cliente escribe `true`', async () => {
    const service = { readExpansion: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    service.readExpansion.mockResolvedValue({ items: [] });

    await controller.readExpansion('vs-1', undefined, undefined, 10, 'true');
    expect(service.readExpansion.mock.calls[0][1].includeProperties).toBe(true);

    // Cualquier otra cosa es `false`, no un error: el parámetro es opcional y
    // hacer fallar la petición que lo manda mal rompería a quien hoy no lo
    // manda en absoluto.
    await controller.readExpansion('vs-1', undefined, undefined, 10, '1');
    expect(service.readExpansion.mock.calls[1][1].includeProperties).toBe(
      false,
    );
  });
});

describe('TerminologyValueSetsController.searchValueSets', () => {
  it('aplica el tope por defecto cuando el cliente no pide uno', async () => {
    const service = { searchValueSets: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    service.searchValueSets.mockResolvedValue({ items: [] });

    await controller.searchValueSets();

    expect(service.searchValueSets).toHaveBeenCalledWith({
      code: undefined,
      query: undefined,
      cursor: undefined,
      limit: 50,
    });
  });

  it('propaga código, texto, cursor y tope tal como llegan', async () => {
    const service = { searchValueSets: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    service.searchValueSets.mockResolvedValue({ items: [] });

    await controller.searchValueSets(
      'administrative-gender',
      'género',
      'cursor-opaco',
      10,
    );

    expect(service.searchValueSets).toHaveBeenCalledWith({
      code: 'administrative-gender',
      query: 'género',
      cursor: 'cursor-opaco',
      limit: 10,
    });
  });
});
