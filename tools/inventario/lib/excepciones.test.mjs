import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import { leerExcepciones } from './excepciones.mjs';

function indice() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-exc-'));
  const ruta = path.join(root, 'src/common/errors/domain.exception.ts');
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(
    ruta,
    `export class PreconditionFailedException extends HttpException {
  constructor(m: string) { super({ message: m }, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.PRECONDITION_FAILED); }
}
export class SinEstado extends Error {}`,
  );
  return leerExcepciones(buildSourceIndex(root));
}

test('la excepción del proyecto responde 422 aunque su nombre sugiera 412', () => {
  const { resolver } = indice();
  assert.deepEqual(resolver('PreconditionFailedException', '../../../common'), {
    estado: 422,
    codigo: 'PRECONDITION_FAILED',
    origen: 'PROYECTO',
  });
});

test('el mismo nombre importado de @nestjs/common responde 412', () => {
  const { resolver } = indice();
  const r = resolver('PreconditionFailedException', '@nestjs/common');
  assert.equal(r.estado, 412);
  assert.equal(r.origen, 'NEST');
});

test('una clase desconocida o sin estado HTTP no inventa estado', () => {
  const { resolver } = indice();
  assert.deepEqual(resolver('SinEstado', './x'), {
    estado: null,
    codigo: null,
    origen: 'DESCONOCIDO',
  });
  assert.equal(resolver('Inexistente', undefined).estado, null);
});
