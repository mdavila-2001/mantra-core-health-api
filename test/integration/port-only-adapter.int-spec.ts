import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PortOnlyNoticeAdapter,
  type Emisor,
} from '../lab/port-only-notice.adapter';
import type { AgendaNotice } from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * H4 (carril de Pablo) · la corrección de las dependencias residuales,
 * probada contra el contrato en sus tres niveles.
 *
 * La prueba de ausencia de Itzan dejó `messaging` y `community` como
 * dependencias residuales de `scheduling`, y ambas entran por los adaptadores
 * concretos, no por el puerto. La corrección es un adaptador que dependa sólo
 * del puerto. Acá se demuestra que esa corrección funciona —y qué forma
 * tiene— sin tocar `scheduling.module.ts`, que es archivo reservado de Itzan.
 */
describe('H4 · adaptador que sólo depende del puerto (corrección de la residual)', () => {
  const base: Omit<AgendaNotice, 'kind'> = {
    recipient: { patientProfileId: '00000000-0000-0000-0000-000000000001' },
    subject: 'Aviso',
    bodyText: 'cuerpo',
    relatedResourceType: 'scheduling.bookings',
  };

  const emisorOk: Emisor = async () => ({ entregado: true, id: 'req-1' });

  // ------------------------------------------------- 0. la corrección en sí
  it('H4.S2.M1 — el adaptador NO importa nada de messaging ni de community', () => {
    // Es la corrección medida sobre el artefacto, no una afirmación: si
    // alguien agrega el import que hoy acopla, este test lo caza.
    // Ruta desde la raíz del repo: la suite corre como ESM, donde `__dirname`
    // no existe.
    const fuente = readFileSync(
      join(process.cwd(), 'test', 'lab', 'port-only-notice.adapter.ts'),
      'utf8',
    );
    const imports = fuente
      .split('\n')
      .filter((l) => /^\s*import\b/.test(l) || /from '/.test(l));

    expect(imports.some((l) => l.includes('modules/messaging'))).toBe(false);
    expect(imports.some((l) => l.includes('modules/community'))).toBe(false);
    // Lo único que importa del producto es el contrato, y sólo como tipo.
    expect(fuente).toContain(
      "from '../../src/modules/scheduling/ports/agenda-notice.port'",
    );
  });

  // ---------------------------------------------------------- 1. ACEPTADO
  describe('nivel ACEPTADO', () => {
    it('entrega y devuelve la forma declarada del resultado', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      const r = await adapter.emit({ ...base, kind: 'SLOT_RELEASED' });
      expect(r).toEqual({ delivered: true, notificationRequestId: 'req-1' });
    });

    it('emitMany procesa el lote completo', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      const rs = await adapter.emitMany([
        { ...base, kind: 'SLOT_RELEASED' },
        { ...base, kind: 'PRACTITIONER_DELAY' },
      ]);
      expect(rs).toHaveLength(2);
      expect(rs.every((r) => r.delivered)).toBe(true);
    });
  });

  // ------------------------------------------------------------ 2. LÍMITE
  describe('nivel LÍMITE', () => {
    it('el emisor que no entrega devuelve delivered:false con su motivo, no una excepción', async () => {
      const adapter = new PortOnlyNoticeAdapter(async () => ({
        entregado: false,
        motivo: 'sin_cuenta_de_portal',
      }));
      const r = await adapter.emit({ ...base, kind: 'APPOINTMENT_REMINDER' });
      expect(r.delivered).toBe(false);
      expect(r.skippedReason).toBe('sin_cuenta_de_portal');
    });

    it('acepta destinatario por cuenta en vez de por perfil', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      const r = await adapter.emit({
        ...base,
        kind: 'BOOKING_STATE_CHANGED',
        recipient: { userId: '00000000-0000-0000-0000-0000000000u1' },
      });
      expect(r.delivered).toBe(true);
    });

    it('un lote vacío no rompe', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      expect(await adapter.emitMany([])).toEqual([]);
    });
  });

  // ---------------------------------------------------------- 3. INVÁLIDO
  describe('nivel INVÁLIDO', () => {
    it('recipient sin destinatario se rechaza sin lanzar', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      const r = await adapter.emit({
        ...base,
        kind: 'SLOT_RELEASED',
        recipient: {},
      });
      expect(r).toEqual({
        delivered: false,
        skippedReason: 'recipient_sin_destinatario',
      });
    });

    it('recipient con los DOS campos se rechaza: la regla del comentario, hecha cumplir', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      const r = await adapter.emit({
        ...base,
        kind: 'SLOT_RELEASED',
        recipient: {
          patientProfileId: '00000000-0000-0000-0000-000000000001',
          userId: '00000000-0000-0000-0000-0000000000u1',
        },
      });
      expect(r.skippedReason).toBe('recipient_ambiguo');
    });

    it('un kind fuera de los cuatro se rechaza sin lanzar', async () => {
      const adapter = new PortOnlyNoticeAdapter(emisorOk);
      const r = await adapter.emit({
        ...base,
        kind: 'NO_EXISTE' as AgendaNotice['kind'],
      });
      expect(r.skippedReason).toBe('kind_fuera_del_contrato');
    });

    it('si el emisor LANZA, emit igual no lanza — la promesa dura del puerto', async () => {
      const adapter = new PortOnlyNoticeAdapter(async () => {
        throw new Error('el canal se cayó');
      });

      let excepcion: unknown = null;
      let r;
      try {
        r = await adapter.emit({ ...base, kind: 'SLOT_RELEASED' });
      } catch (err) {
        excepcion = err;
      }

      expect(excepcion).toBeNull();
      expect(r).toEqual({ delivered: false, skippedReason: 'emisor_fallo' });
    });

    it('H4.S2.M2 — un elemento que falla no cancela el resto del lote', async () => {
      let llamadas = 0;
      const adapter = new PortOnlyNoticeAdapter(async () => {
        llamadas += 1;
        if (llamadas === 2) throw new Error('falla del medio');
        return { entregado: true, id: `req-${llamadas}` };
      });

      const rs = await adapter.emitMany([
        { ...base, kind: 'SLOT_RELEASED' },
        { ...base, kind: 'PRACTITIONER_DELAY' },
        { ...base, kind: 'APPOINTMENT_REMINDER' },
      ]);

      expect(rs.map((r) => r.delivered)).toEqual([true, false, true]);
      expect(rs[1].skippedReason).toBe('emisor_fallo');
    });
  });
});
