import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import { crearConstructorDeArboles, estadoDeExito } from './arbol.mjs';
import { crearAnalizadorDeDatos } from './datos.mjs';
import { leerExcepciones } from './excepciones.mjs';

const ARCHIVOS = {
  'src/common/errors/domain.exception.ts': `
export class PreconditionFailedException extends HttpException {
  constructor(m: string) { super({ message: m }, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.PRECONDITION_FAILED); }
}
export class ResourceNotFoundException extends HttpException {
  constructor(m: string) { super({ message: m }, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND); }
}`,
  'src/modules/a/entities/slot.entity.ts': `
@Entity({ schema: 's', tableName: 'slots' })
export class Slot { remaining: number; }`,
  'src/modules/a/entities/hold.entity.ts': `
@Entity({ schema: 's', tableName: 'holds' })
export class Hold { id: string; }`,
  'src/modules/a/repositories/a.repository.ts': `
import { Slot } from '../entities/slot.entity';
import { Hold } from '../entities/hold.entity';
export class ARepository {
  findSlot(em, id: string) { return em.findOne(Slot, { id }); }
  createHold(em, data) { return em.create(Hold, data); }
}`,
  'src/modules/a/services/a.service.ts': `
import { ConflictException } from '@nestjs/common';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common/errors/domain.exception';
import { ARepository } from '../repositories/a.repository';
export class AService {
  constructor(private readonly repo: ARepository, private readonly em: any) {}
  async reservar(id: string, modo: string) {
    return this.em.transactional(async (tx) => {
      const slot = await this.repo.findSlot(tx, id);
      if (!slot) throw new ResourceNotFoundException('Slot no encontrado');
      if (slot.remaining <= 0) {
        throw new ConflictException('Sin cupos ' + 'disponibles');
      } else if (modo === 'x') {
        throw new PreconditionFailedException(modo ? 'Modo x' : 'Modo y');
      }
      switch (modo) {
        case 'a':
          this.repo.createHold(tx, {});
          break;
        default:
          throw new Error('modo desconocido');
      }
      try {
        await this.noop();
      } catch (e) {
        throw e;
      }
      return slot;
    });
  }
  async inofensivo(n: number) {
    if (n > 1) { const x = n + 1; return x; }
    return n;
  }
  noop() { return Promise.resolve(); }
}`,
  'src/modules/a/controllers/a.controller.ts': `
import { AService } from '../services/a.service';
export class AController {
  constructor(private readonly service: AService) {}
  reservar(id: string) { return this.service.reservar(id, 'a'); }
  inofensivo() { return this.service.inofensivo(2); }
}`,
};

function construir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-arbol-'));
  for (const [ruta, texto] of Object.entries(ARCHIVOS)) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  }
  const index = buildSourceIndex(root);
  const datos = crearAnalizadorDeDatos(index);
  const excepciones = leerExcepciones(index);
  const { arbolDeOperacion } = crearConstructorDeArboles({
    index,
    datos,
    excepciones,
  });
  const handler = (nombre) => ({
    ...index.controllerMethods.get(`AController_${nombre}`),
  });
  return { index, arbolDeOperacion, handler, root };
}

const buscar = (nodos, tipo, acumulado = []) => {
  for (const n of nodos) {
    if (n.tipo === tipo) acumulado.push(n);
    for (const k of [
      'entonces',
      'sino',
      'cuerpo',
      'captura',
      'finalmente',
      'hijos',
    ])
      if (n[k]) buscar(n[k], tipo, acumulado);
    for (const c of n.casos ?? []) buscar(c.nodos, tipo, acumulado);
  }
  return acumulado;
};

test('el árbol conserva ramas, errores con su estado y efectos en orden', () => {
  const { arbolDeOperacion, handler } = construir();
  const { nodos, respuestas } = arbolDeOperacion(handler('reservar'), [], {
    httpCode: null,
    metodo: 'POST',
  });

  const errores = buscar(nodos, 'ERROR');
  const porNombre = Object.fromEntries(errores.map((e) => [e.excepcion, e]));
  assert.equal(porNombre.ResourceNotFoundException.estado, 404);
  assert.equal(porNombre.ResourceNotFoundException.codigo, 'NOT_FOUND');
  // la del proyecto responde 422; la de Nest con el mismo patrón de nombre no se confunde
  assert.equal(porNombre.PreconditionFailedException.estado, 422);
  assert.equal(porNombre.ConflictException.estado, 409);
  // concatenación de literales resuelta
  assert.equal(porNombre.ConflictException.mensaje, 'Sin cupos disponibles');
  // condicional: se muestran ambas ramas
  assert.equal(
    porNombre.PreconditionFailedException.mensaje,
    'Modo x / Modo y',
  );
  // Error genérico: el filtro global lo responde como 500 opaco
  assert.equal(porNombre.Error.estado, 500);
  assert.equal(porNombre.Error.codigo, 'INTERNAL');

  const tablas = buscar(nodos, 'EFECTO').map(
    (e) => `${e.tabla}:${e.operacion}/${e.detalle}`,
  );
  assert.deepEqual(tablas, ['s.slots:LEE/LEE', 's.holds:ESCRIBE/CREA']);
  assert.ok(
    buscar(nodos, 'TRANSACCION').length === 1,
    'el callback de transactional se muestra como transacción',
  );
  assert.ok(buscar(nodos, 'SEGUN').length === 1);

  const estados = respuestas.map((r) => r.estado);
  assert.deepEqual(estados, [201, 404, 409, 422, 500]);
  assert.equal(nodos.at(-1).tipo, 'RESPUESTA');
  assert.equal(nodos.at(-1).estado, 201);
});

test('relanzar el error capturado no inventa un estado de respuesta', () => {
  const { arbolDeOperacion, handler } = construir();
  const { nodos, respuestas } = arbolDeOperacion(handler('reservar'), [], {
    httpCode: null,
    metodo: 'POST',
  });
  const relanzados = buscar(nodos, 'ERROR').filter((e) => e.estado === null);
  assert.equal(relanzados.length, 1);
  assert.ok(respuestas.every((r) => r.estado !== null));
});

test('una condición sin errores, efectos ni llamadas se poda', () => {
  const { arbolDeOperacion, handler } = construir();
  const { nodos } = arbolDeOperacion(handler('inofensivo'), [], {
    httpCode: null,
    metodo: 'GET',
  });
  assert.equal(buscar(nodos, 'SI').length, 0);
  assert.deepEqual(
    nodos.map((n) => n.tipo),
    ['RESPUESTA'],
  );
});

test('los requerimientos de acceso son los primeros nodos y aportan su estado de fallo', () => {
  const { arbolDeOperacion, handler } = construir();
  const requerimientos = [
    {
      tipo: 'AUTENTICACION',
      detalle: 'JWT Bearer',
      fuente: 'contrato (security)',
    },
    { tipo: 'ROL', detalle: 'Alguno de: X', fuente: 'a.ts:1' },
  ];
  const { nodos, respuestas } = arbolDeOperacion(
    handler('inofensivo'),
    requerimientos,
    { httpCode: null, metodo: 'GET' },
  );
  assert.deepEqual(
    nodos.slice(0, 2).map((n) => n.falla.estado),
    [401, 403],
  );
  assert.deepEqual(
    respuestas.map((r) => r.estado),
    [200, 401, 403],
  );
});

test('el estado de éxito sale de @HttpCode y, si falta, del verbo', () => {
  assert.equal(estadoDeExito(null, 'POST'), 201);
  assert.equal(estadoDeExito(null, 'GET'), 200);
  assert.equal(estadoDeExito('HttpStatus.NO_CONTENT', 'DELETE'), 204);
  assert.equal(estadoDeExito('202', 'POST'), 202);
});
