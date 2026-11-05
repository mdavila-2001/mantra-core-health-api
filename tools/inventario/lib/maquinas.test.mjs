import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import { crearAnalizadorDeDatos } from './datos.mjs';
import { disparadoresDe, leerMaquinas } from './maquinas.mjs';

const ARCHIVOS = {
  'src/modules/m/state/machine.ts': `
export const ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  [S.NUEVA]: [S.PAGADA, S.CANCELADA],
  [S.PAGADA]: [S.ENVIADA, S.CANCELADA],
  [S.ENVIADA]: [],
  [S.CANCELADA]: [],
};
export function esValida(de: string, a: string) { return (ORDER_TRANSITIONS[de] ?? []).includes(a); }
export const TIPOS_PERMITIDOS = ['A', 'B'] as const;
export const SOLO_UNO_TRANSITIONS = { X: ['Y'] };`,
  'src/modules/m/services/orders.service.ts': `
import { esValida } from '../state/machine';
export class OrdersService {
  private assertTransition(de: string, a: string) { if (!esValida(de, a)) throw new Error('x'); }
  pagar(de: string) { this.assertTransition(de, S.PAGADA); return 1; }
  cancelar(de: string) { this.assertTransition(de, S.CANCELADA); return 2; }
  sinMaquina() { return 3; }
}`,
  'src/modules/m/controllers/orders.controller.ts': `
import { OrdersService } from '../services/orders.service';
export class OrdersController {
  constructor(private readonly service: OrdersService) {}
  pagar() { return this.service.pagar('x'); }
  cancelar() { return this.service.cancelar('x'); }
  listar() { return this.service.sinMaquina(); }
}`,
};

function construir(archivos = ARCHIVOS) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-maq-'));
  for (const [ruta, texto] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  }
  const index = buildSourceIndex(root);
  return { index, datos: crearAnalizadorDeDatos(index) };
}

test('lee estados, aristas, iniciales y terminales de la tabla', () => {
  const { index } = construir();
  const maquinas = leerMaquinas(index);
  assert.equal(
    maquinas.length,
    1,
    'la lista plana y la tabla de un solo estado no son máquinas',
  );
  const [m] = maquinas;
  assert.equal(m.constante, 'ORDER_TRANSITIONS');
  assert.deepEqual(m.estados.sort(), [
    'CANCELADA',
    'ENVIADA',
    'NUEVA',
    'PAGADA',
  ]);
  assert.equal(m.transiciones.length, 4);
  assert.deepEqual(m.iniciales, ['NUEVA']);
  assert.deepEqual(m.terminales.sort(), ['CANCELADA', 'ENVIADA']);
  assert.equal(m.modulo, 'm');
});

test('relaciona cada handler con los estados de destino que su método nombra', () => {
  const { index, datos } = construir();
  const [m] = leerMaquinas(index);
  const d = disparadoresDe(m, index, datos);
  const por = Object.fromEntries([...d].map(([k, v]) => [k, [...v.estados]]));
  assert.deepEqual(por.OrdersController_pagar, ['PAGADA']);
  assert.deepEqual(por.OrdersController_cancelar, ['CANCELADA']);
  assert.equal(
    'OrdersController_listar' in por,
    false,
    'un handler que no consulta la tabla no figura',
  );
});

test('un caso de uso que valida por un colaborador inyectado también ejerce la máquina', () => {
  // Como la cita: el caso de uso no valida él mismo, le pide la guarda a otra clase
  // (`this.transiciones.assertTransition(…)`) y es él quien nombra el estado de destino.
  const { index, datos } = construir({
    'src/modules/m/state/machine.ts':
      ARCHIVOS['src/modules/m/state/machine.ts'],
    'src/modules/m/support/recorder.ts': `
import { esValida } from '../state/machine';
export class OrderTransitionRecorder {
  assertTransition(de: string, a: string) { if (!esValida(de, a)) throw new Error('x'); }
}`,
    'src/modules/m/use-cases/pagar.use-case.ts': `
import { OrderTransitionRecorder } from '../support/recorder';
export class PagarUseCase {
  constructor(private readonly transiciones: OrderTransitionRecorder) {}
  execute(de: string) { this.transiciones.assertTransition(de, S.PAGADA); return 1; }
  listar() { return 2; }
}`,
    'src/modules/m/controllers/orders.controller.ts': `
import { PagarUseCase } from '../use-cases/pagar.use-case';
export class OrdersController {
  constructor(private readonly pagarUseCase: PagarUseCase) {}
  pagar() { return this.pagarUseCase.execute('x'); }
  listar() { return this.pagarUseCase.listar(); }
}`,
  });
  const [m] = leerMaquinas(index);
  const d = disparadoresDe(m, index, datos);
  const por = Object.fromEntries([...d].map(([k, v]) => [k, [...v.estados]]));
  assert.deepEqual(por.OrdersController_pagar, ['PAGADA']);
  assert.equal(
    'OrdersController_listar' in por,
    false,
    'el que no pasa por la guarda no figura',
  );
});
