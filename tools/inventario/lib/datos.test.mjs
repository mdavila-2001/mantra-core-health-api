import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import { crearAnalizadorDeDatos } from './datos.mjs';

const ARCHIVOS = {
  'src/modules/a/entities/slot.entity.ts': `
@Entity({ schema: 's', tableName: 'slots' })
export class Slot { remaining: number; status: string; }`,
  'src/modules/a/entities/hold.entity.ts': `
@Entity({ schema: 's', tableName: 'holds' })
export class Hold { id: string; }`,
  'src/modules/a/entities/audit.entity.ts': `
@Entity({ schema: 's', tableName: 'audits' })
export class Audit { id: string; }`,

  'src/modules/a/repositories/holds.repository.ts': `
import { Slot } from '../entities/slot.entity';
const ESQUEMA = 's';
const VISTA = 'resumen';
const CALIFICADA = \`"\${ESQUEMA}"."\${VISTA}"\`;
export class HoldsRepository {
  findSlot(em, id: string): Promise<Slot | null> { return em.findOne(Slot, { id }); }
  listSlots(em): Promise<Slot[]> { return em.find(Slot, {}); }
  createHold(em, data): Hold { return em.create(Hold, data); }
  purge(em) { return em.nativeDelete(Hold, {}); }
  cerrar(em) { return em.nativeUpdate(Slot, {}, { status: 'x' }); }
  porQb(em) { return em.createQueryBuilder(Audit).insert({}); }
  estadisticas(em) {
    return em.getConnection().execute('SELECT 1 FROM s.slots a JOIN s.holds b ON 1=1');
  }
  borrarAudits(em) { return em.getConnection().execute('DELETE FROM s.audits'); }
  resumen(em) { return em.getConnection().execute(\`SELECT * FROM \${CALIFICADA}\`); }
  filtrar(em) {
    const donde: FilterQuery<Slot> = {};
    donde.status = 'abierto';
    const parche: Partial<Slot> = {};
    parche.remaining = 0;
    return em.find(Slot, donde);
  }
  ruido() { return 'esto dice FROM s.slots pero es un mensaje'.length; }
}`,

  'src/modules/a/services/ledger.service.ts': `
import { Audit } from '../entities/audit.entity';
export class LedgerService { anotar(em) { return em.create(Audit, {}); } }`,
  'src/modules/b/services/ledger.service.ts': `
export class LedgerService { anotar(em) { return em.create(Otra, {}); } }`,
  'src/modules/b/entities/otra.entity.ts': `
@Entity({ schema: 'b', tableName: 'otras' })
export class Otra {}`,

  'src/modules/a/ports/write.port.ts': `
export interface WritePort { guardar(em): Promise<void>; }
export interface MultiPort { enviar(): Promise<void>; }
export interface SinImplementacion { hacer(): void; }`,
  'src/modules/a/adapters/write.adapter.ts': `
export class WriteAdapter implements WritePort {
  async guardar(em) { await em.nativeUpdate(Slot, {}, {}); }
}`,
  'src/modules/a/adapters/multi.adapters.ts': `
export class MultiUno implements MultiPort { async enviar() { await this.em.create(Hold, {}); } }
export class MultiDos implements MultiPort { async enviar() { await this.em.create(Audit, {}); } }`,

  'src/modules/a/entities/hold-hist.entity.ts': `
@Entity({ schema: 'h', tableName: 'holds_history' })
export class HoldHist {}`,
  'src/modules/a/entities/slot-hist.entity.ts': `
@Entity({ schema: 'h', tableName: 'slots_history' })
export class SlotHist {}`,
  'src/modules/a/repositories/history.repository.ts': `
import { HoldHist } from '../entities/hold-hist.entity';
import { SlotHist } from '../entities/slot-hist.entity';
const REGISTRO = {
  holds: { entity: HoldHist, sourceField: 'holdId' },
  'slots': { entity: SlotHist, sourceField: 'slotId' },
} as const;
export class HistoryRepository {
  async append(em, entity: string, id: string) {
    const binding = REGISTRO[entity];
    const previas = await em.find(binding.entity, {});
    for (const fila of previas) fila.validTo = new Date();
    em.create(binding.entity, {});
  }
}`,
  'src/modules/a/services/cambios.service.ts': `
import { HistoryRepository } from '../repositories/history.repository';
const CLAVE = 'slots';
export class CambiosService {
  constructor(private readonly history: HistoryRepository) {}
  async conLiteral(tx) { await this.history.append(tx, 'holds', 'x'); }
  async conConstante(tx) { await this.history.append(tx, CLAVE, 'x'); }
  async dinamico(tx, quien: string) { await this.history.append(tx, quien, 'x'); }
  async desconocida(tx) { await this.history.append(tx, 'nada', 'x'); }
}`,

  'src/modules/a/constants/queues.ts': `
export const COLA = 'cola-a';
export const EVENTO = 'EventoConstante';`,
  'src/modules/a/constants/index.ts': `export * from './queues';`,
  'src/modules/a/services/eventos.service.ts': `
import { COLA, EVENTO } from '../constants';
export class EventosService {
  constructor(
    private readonly outbox: OutboxService,
    private readonly queues: QueuesService,
  ) {}
  async emitir(tx, x: string) {
    await this.outbox.publishDomainEvent(tx, { eventType: 'Literal', aggregateType: 'a' });
    await this.outbox.publishDomainEvent(tx, { eventType: EVENTO });
    await this.outbox.publishDomainEvent(tx, { eventType: \`\${x}.compensado\` });
    await this.queues.enqueueJob(COLA, {}, null);
    await this.queues.enqueueJob(x, {}, null);
  }
}`,

  'src/modules/a/services/holds.service.ts': `
import { HoldsRepository } from '../repositories/holds.repository';
import { LedgerService } from './ledger.service';
export class HoldsService {
  constructor(
    private readonly repo: HoldsRepository,
    private readonly ledger: LedgerService,
    private readonly writer: WritePort,
    private readonly multi: MultiPort,
    private readonly libre: SinImplementacion,
    private readonly logger: PinoLogger,
  ) {}

  async place(tx, id: string) {
    const slot = await this.repo.findSlot(tx, id);
    slot.remaining -= 1;
    this.repo.createHold(tx, {});
    this.ledger.anotar(tx);
    await this.writer.guardar(tx);
    this.libre.hacer();
    this.logger.info('x');
  }

  async cerrarTodos(tx) {
    const slots = await this.repo.listSlots(tx);
    for (const s of slots) s.status = 'cerrado';
    const [lista] = await tx.findAndCount(Slot, {});
    lista.forEach((x) => (x.remaining = 0));
  }

  async notificar() { await this.multi.enviar(); }
  async ping() { return this.pong(); }
  async pong() { return this.ping(); }
  async soloLee(tx, hold: Hold) { hold.id = 'x'; return tx.find(Audit, {}); }
  async quita(tx, id: string) { const slot = await this.repo.findSlot(tx, id); tx.remove(slot); }
}`,
};

function analizador() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-datos-'));
  for (const [ruta, texto] of Object.entries(ARCHIVOS)) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  }
  const index = buildSourceIndex(root);
  return crearAnalizadorDeDatos(index);
}

const SERVICIO = 'src/modules/a/services/holds.service.ts#HoldsService';
const REPO = 'src/modules/a/repositories/holds.repository.ts#HoldsRepository';
const tablas = (resultado) =>
  resultado.efectos
    .map(
      (e) =>
        `${e.objeto ?? e.entidad.split('#')[1]}:${e.detalle}:${e.confianza}`,
    )
    .sort();

test('cada patrón del repositorio produce su efecto con su confianza', () => {
  const a = analizador();
  const de = (metodo) => tablas(a.cierre(REPO, metodo));
  assert.deepEqual(de('findSlot'), ['Slot:LEE:DIRECTA']);
  assert.deepEqual(de('createHold'), ['Hold:CREA:DIRECTA']);
  assert.deepEqual(de('purge'), ['Hold:BORRA:DIRECTA']);
  assert.deepEqual(de('cerrar'), ['Slot:ACTUALIZA:DIRECTA']);
  assert.deepEqual(de('porQb'), ['Audit:CREA:DIRECTA', 'Audit:LEE:DIRECTA']);
});

test('SQL crudo: sólo cuenta con tablas conocidas, resuelve constantes y no se deja engañar por texto', () => {
  const a = analizador();
  const de = (metodo) => tablas(a.cierre(REPO, metodo));
  assert.deepEqual(de('estadisticas'), [
    'Hold:LEE:POR_SQL',
    'Slot:LEE:POR_SQL',
  ]);
  assert.deepEqual(de('borrarAudits'), ['Audit:BORRA:POR_SQL']);
  // el esquema `s` es conocido pero `resumen` no es una entidad: se informa como objeto
  assert.deepEqual(de('resumen'), ['s.resumen:LEE:POR_SQL']);
});

test('límite conocido: un literal con SQL se cuenta como acceso aunque el método no lo ejecute', () => {
  // El análisis es por texto: `ruido` sólo calcula el largo de una cadena que menciona
  // «FROM s.slots» y aun así se informa. Se deja fijado para que el límite sea visible
  // y, si algún día se refina, esta prueba lo diga.
  const a = analizador();
  assert.deepEqual(tablas(a.cierre(REPO, 'ruido')), ['Slot:LEE:POR_SQL']);
});

test('actualización por mutación: tipo de retorno, for…of y desestructurado de findAndCount', () => {
  const a = analizador();
  const place = tablas(a.cierre(SERVICIO, 'place'));
  assert.ok(place.includes('Slot:ACTUALIZA:POR_TIPO'), place.join());
  assert.ok(place.includes('Slot:LEE:DIRECTA'));
  assert.ok(place.includes('Hold:CREA:DIRECTA'));

  const cerrar = tablas(a.cierre(SERVICIO, 'cerrarTodos'));
  assert.ok(cerrar.includes('Slot:ACTUALIZA:POR_TIPO'), cerrar.join());
});

test('parámetros anotados con una entidad también se siguen, y remove cuenta como BORRA', () => {
  const a = analizador();
  assert.ok(
    tablas(a.cierre(SERVICIO, 'soloLee')).includes('Hold:ACTUALIZA:POR_TIPO'),
  );
  assert.ok(
    tablas(a.cierre(SERVICIO, 'quita')).includes('Slot:BORRA:POR_TIPO'),
  );
});

test('nombres de servicio repetidos entre módulos se resuelven por el import', () => {
  const a = analizador();
  const place = a
    .cierre(SERVICIO, 'place')
    .efectos.map((e) => e.entidad.split('#')[1]);
  assert.ok(place.includes('Audit'), 'usó el LedgerService del módulo a');
  assert.ok(!place.includes('Otra'), 'no el del módulo b');
});

test('un puerto se sigue hasta su implementación; con varias se unen todas; sin ninguna se ignora', () => {
  const a = analizador();
  const place = a.cierre(SERVICIO, 'place');
  const adaptador = place.efectos.find((e) =>
    e.via.some((v) => v.startsWith('WriteAdapter')),
  );
  assert.equal(adaptador.detalle, 'ACTUALIZA');

  const multi = tablas(a.cierre(SERVICIO, 'notificar'));
  assert.deepEqual(multi, ['Audit:CREA:DIRECTA', 'Hold:CREA:DIRECTA']);
  assert.equal(place.noResuelto.length, 0);
});

test('una llamada circular termina y se marca parcial', () => {
  const a = analizador();
  const ping = a.cierre(SERVICIO, 'ping');
  assert.equal(ping.parcial, true);
  assert.deepEqual(ping.efectos, []);
});

test('deHandler une, deduplica y ordena por tabla, y trae el camino más corto', () => {
  const a = analizador();
  const handler = {
    source: 'src/modules/a/services/holds.service.ts',
    className: 'HoldsService',
    methodName: 'place',
  };
  const resultado = a.deHandler(handler);
  const claves = resultado.tablas.map(
    (t) => `${t.schema}.${t.tabla}:${t.detalle}:${t.confianza}`,
  );
  assert.deepEqual(claves, [
    's.audits:CREA:DIRECTA',
    's.holds:CREA:DIRECTA',
    's.slots:ACTUALIZA:DIRECTA',
    's.slots:LEE:DIRECTA',
  ]);
  const holds = resultado.tablas.find((t) => t.tabla === 'holds');
  assert.deepEqual(holds.via, [
    'HoldsService.place',
    'HoldsRepository.createHold',
  ]);
  assert.equal(holds.catalogada, true);
  // la actualización por mutación y la nativa son la misma tabla/operación: gana la DIRECTA
  const slotsActualiza = resultado.tablas.filter(
    (t) => t.tabla === 'slots' && t.detalle === 'ACTUALIZA',
  );
  assert.equal(slotsActualiza.length, 1);
  assert.equal(slotsActualiza[0].confianza, 'DIRECTA');
});

test('contra el código real: el kill-test toca slot_holds y bookable_slots', () => {
  const index = buildSourceIndex(process.cwd());
  const a = crearAnalizadorDeDatos(index);
  const handler = [...index.controllerMethods.values()].find(
    (h) =>
      h.httpVerb === 'POST' && h.routePath === 'scheduling/slots/:id/holds',
  );
  assert.ok(
    handler,
    'no se encontró el handler de POST /scheduling/slots/:id/holds',
  );
  const t = a
    .deHandler(handler)
    .tablas.map((x) => `${x.schema}.${x.tabla}:${x.detalle}`);
  assert.ok(t.includes('scheduling.slot_holds:CREA'), t.join());
  assert.ok(t.includes('scheduling.bookable_slots:ACTUALIZA'), t.join());
  assert.ok(t.includes('scheduling.bookable_slots:LEE'), t.join());
});

test('eventos y trabajos: literal, constante importada (también por barril) y dinámicos', () => {
  const a = analizador();
  const r = a.cierre(
    'src/modules/a/services/eventos.service.ts#EventosService',
    'emitir',
  );
  assert.deepEqual(
    r.eventos.map((e) => e.tipo ?? `~${e.expresion}`),
    ['Literal', 'EventoConstante', '~`${x}.compensado`'],
  );
  assert.deepEqual(
    r.trabajos.map((t) => t.codigo ?? `~${t.expresion}`),
    ['cola-a', '~x'],
  );
  assert.ok(r.eventos.every((e) => /eventos\.service\.ts:\d+$/.test(e.fuente)));
});

test('deHandler deduplica eventos y trabajos y los trae en el resultado', () => {
  const a = analizador();
  const r = a.deHandler({
    source: 'src/modules/a/services/eventos.service.ts',
    className: 'EventosService',
    methodName: 'emitir',
  });
  assert.equal(r.eventos.length, 3);
  assert.equal(r.trabajos.length, 2);
});

test('despacho por registro: la entidad sale del literal o de la constante que se pasa', () => {
  const a = analizador();
  const CAMBIOS = 'src/modules/a/services/cambios.service.ts#CambiosService';
  const claves = (metodo) =>
    a
      .cierre(CAMBIOS, metodo)
      .efectos.map(
        (e) => `${e.entidad.split('#')[1]}:${e.detalle}:${e.confianza}`,
      )
      .sort();
  assert.deepEqual(claves('conLiteral'), [
    'HoldHist:ACTUALIZA:POR_REGISTRO',
    'HoldHist:CREA:POR_REGISTRO',
    'HoldHist:LEE:POR_REGISTRO',
  ]);
  assert.deepEqual(claves('conConstante'), [
    'SlotHist:ACTUALIZA:POR_REGISTRO',
    'SlotHist:CREA:POR_REGISTRO',
    'SlotHist:LEE:POR_REGISTRO',
  ]);
});

test('despacho por registro: un argumento dinámico o una clave que no existe se informan, no se inventan', () => {
  const a = analizador();
  const CAMBIOS = 'src/modules/a/services/cambios.service.ts#CambiosService';
  for (const metodo of ['dinamico', 'desconocida']) {
    const r = a.cierre(CAMBIOS, metodo);
    assert.deepEqual(r.efectos, [], metodo);
    assert.equal(r.noResuelto.length, 1, metodo);
    assert.match(r.noResuelto[0].llamada, /entidad según argumento no literal/);
  }
});

test('una variable FilterQuery<E> o Partial<E> no es una instancia: asignarle campos no actualiza nada', () => {
  const a = analizador();
  assert.deepEqual(tablas(a.cierre(REPO, 'filtrar')), ['Slot:LEE:DIRECTA']);
});
