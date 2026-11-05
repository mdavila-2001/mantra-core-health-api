import { describe, it, expect, jest } from '@jest/globals';
import { SeedCensusService, formatSeedCensus } from './seed-census.service';

function build(count: number) {
  const em = { count: jest.fn(() => Promise.resolve(count)) };
  const service = new SeedCensusService({ em: { fork: () => em } } as never);
  return { service, em };
}

describe('SeedCensusService', () => {
  it('cuenta lo que hay, con las mismas etiquetas en cualquier entorno', async () => {
    const a = await build(5).service.take();
    const b = await build(9).service.take();

    expect(a.map((line) => `${line.step}|${line.label}`)).toEqual(
      b.map((line) => `${line.step}|${line.label}`),
    );
    expect(a.every((line) => line.count === 5)).toBe(true);
    expect(b.every((line) => line.count === 9)).toBe(true);
  });

  it('solo cuenta: no lee contenido de ninguna fila', async () => {
    const { service, em } = build(1);

    await service.take();

    expect(em.count).toHaveBeenCalled();
    expect(Object.keys(em)).toEqual(['count']);
  });

  it('cada paso del censo corresponde a un paso que existe', async () => {
    const lines = await build(0).service.take();

    expect(new Set(lines.map((line) => line.step))).toEqual(
      new Set([
        'padron-organizaciones',
        'aseguradoras-de-bolivia',
        'padron-administradores',
        'padron-de-personas',
        'directorio-de-redes-de-aseguradoras',
      ]),
    );
  });

  it('se imprime una línea por conteo, comparable con diff', () => {
    const text = formatSeedCensus([
      { step: 'padron-organizaciones', label: 'organizaciones', count: 523 },
    ]);

    expect(text).toBe('padron-organizaciones\torganizaciones\t523');
  });
});
