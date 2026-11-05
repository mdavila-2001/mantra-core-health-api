import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ServiceUnavailableException } from '@nestjs/common';
import { INVENTARIO_DIR_ENV } from '../../data_catalog.constants';
import { InventoryRepository } from './inventory.repository';

function inventarioMinimo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'inventario-repo-'));
  mkdirSync(join(dir, 'endpoints'), { recursive: true });
  mkdirSync(join(dir, 'catalogo'), { recursive: true });
  mkdirSync(join(dir, 'flujos'), { recursive: true });
  writeFileSync(
    join(dir, 'endpoints', 'indice.json'),
    JSON.stringify({ resumen: { total: 1 }, endpoints: [] }),
  );
  writeFileSync(
    join(dir, 'endpoints', 'a.json'),
    JSON.stringify([{ id: 'A_x', ruta: '/a', metodo: 'GET', modulo: 'a' }]),
  );
  writeFileSync(
    join(dir, 'catalogo', 'indice.json'),
    JSON.stringify({
      resumen: { tablas: 2, columnas: 5 },
      deriva: {},
      tablas: [],
    }),
  );
  writeFileSync(join(dir, 'flujos', 'hallazgos.json'), '[]');
  writeFileSync(join(dir, 'flujos', 'procesos.json'), '[{"codigo":"a"}]');
  return dir;
}

describe('InventoryRepository', () => {
  let dir: string;
  let repo: InventoryRepository;
  const previo = process.env[INVENTARIO_DIR_ENV];

  beforeEach(() => {
    dir = inventarioMinimo();
    process.env[INVENTARIO_DIR_ENV] = dir;
    repo = new InventoryRepository();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (previo === undefined) delete process.env[INVENTARIO_DIR_ENV];
    else process.env[INVENTARIO_DIR_ENV] = previo;
  });

  it('lee las operaciones de todos los módulos, sin el índice', () => {
    expect(repo.operaciones().map((o) => o.id)).toEqual(['A_x']);
  });

  it('sin el inventario responde 503 con el archivo que falta, no 500', () => {
    process.env[INVENTARIO_DIR_ENV] = join(dir, 'no-existe');
    repo.reset();
    expect(repo.isAvailable()).toBe(false);
    expect(() => repo.procesos()).toThrow(ServiceUnavailableException);
    expect(() => repo.procesos()).toThrow(/falta flujos\/procesos\.json/);
    expect(() => repo.operaciones()).toThrow(/falta el directorio endpoints/);
  });

  it('un JSON dañado es un 503 que dice cómo regenerarlo', () => {
    writeFileSync(join(dir, 'flujos', 'procesos.json'), '{no es json');
    expect(() => repo.procesos()).toThrow(ServiceUnavailableException);
    expect(() => repo.procesos()).toThrow(/dañado/);
  });

  it('lee una vez y guarda: un cambio en disco no se ve hasta `reset`', () => {
    expect(repo.procesos()).toHaveLength(1);
    writeFileSync(
      join(dir, 'flujos', 'procesos.json'),
      '[{"codigo":"a"},{"codigo":"b"}]',
    );
    expect(repo.procesos()).toHaveLength(1);
    repo.reset();
    expect(repo.procesos()).toHaveLength(2);
  });

  it('la huella de versión cambia cuando cambia el contenido de los índices', () => {
    const antes = repo.version();
    expect(antes).toMatchObject({
      operaciones: 1,
      procesos: 1,
      tablas: 2,
      columnas: 5,
    });
    writeFileSync(join(dir, 'flujos', 'hallazgos.json'), '[{"id":"FLU-01"}]');
    repo.reset();
    expect(repo.version().hash).not.toBe(antes.hash);
  });

  it('el directorio por defecto es `inventario` bajo el directorio de trabajo', () => {
    delete process.env[INVENTARIO_DIR_ENV];
    expect(repo.directory()).toBe(join(process.cwd(), 'inventario'));
  });
});
