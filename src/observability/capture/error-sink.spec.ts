import { NotFoundException } from '@nestjs/common';
import {
  COUNT_ONLY_CODES,
  ErrorSink,
  MAX_EVENTS_PER_MINUTE,
  errorFingerprint,
  scrubMessage,
} from './error-sink';
import { OperationResolver } from './operation-resolver';

const INSTANCE = '11111111-1111-4111-8111-111111111111';
const T0 = new Date('2026-10-31T10:00:10.000Z');

function boom(): Error {
  return new Error(
    'fallo con valor 123456789 y uuid 0b9f6a1e-1111-4222-8333-444455556666',
  );
}

function newSink(secret: string | null = 'x'.repeat(32)) {
  const sink = new ErrorSink(new OperationResolver(), INSTANCE);
  sink.configure({ enabled: true, actorHashSecret: secret });
  return sink;
}

function capture(sink: ErrorSink, overrides: Record<string, unknown> = {}) {
  sink.record({
    status: 500,
    code: 'INTERNAL',
    exception: boom(),
    method: 'GET',
    routeTemplate: '/x/:id',
    requestId: `req-${Math.random()}`,
    at: T0,
    ...overrides,
  });
}

describe('ErrorSink', () => {
  it('apagado no captura nada', () => {
    const sink = new ErrorSink(new OperationResolver(), INSTANCE);
    capture(sink);
    expect(sink.drain()).toEqual({ groups: [], events: [] });
  });

  it('k errores iguales son UN grupo con k eventos de requestId distintos', () => {
    const sink = newSink();
    const exception = boom();
    for (let i = 0; i < 4; i += 1) {
      capture(sink, { exception, requestId: `rid-${i}` });
    }
    const { groups, events } = sink.drain();
    expect(groups).toHaveLength(1);
    expect(events).toHaveLength(4);
    expect(new Set(events.map((e) => e.requestId)).size).toBe(4);
    expect(groups[0]).toMatchObject({
      errorCode: 'INTERNAL',
      exceptionType: 'Error',
      lastRequestId: 'rid-3',
      countOnly: 0,
    });
    expect(events.every((e) => e.instanceId === INSTANCE)).toBe(true);
  });

  it('códigos distintos o rutas distintas son grupos distintos', () => {
    const sink = newSink();
    capture(sink);
    capture(sink, { code: 'NOT_FOUND', status: 404 });
    capture(sink, { routeTemplate: '/y' });
    expect(sink.drain().groups).toHaveLength(3);
  });

  it('la huella es estable entre instancias y sensible a code|reason|tipo|método|ruta|3 marcos', () => {
    const base = {
      code: 'INTERNAL',
      reason: null,
      exceptionType: 'Error',
      method: 'GET',
      routeTemplate: '/x',
      frames: ['src/a.ts:1', 'src/b.ts:2', 'src/c.ts:3'],
    };
    const a = errorFingerprint(base);
    expect(errorFingerprint({ ...base })).toBe(a);
    // El cuarto marco no entra en la huella.
    expect(
      errorFingerprint({ ...base, frames: [...base.frames, 'src/d.ts:4'] }),
    ).toBe(a);
    expect(
      errorFingerprint({ ...base, frames: ['src/z.ts:9', ...base.frames] }),
    ).not.toBe(a);
    expect(errorFingerprint({ ...base, reason: 'R' })).not.toBe(a);
    expect(errorFingerprint({ ...base, method: 'POST' })).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('mismo error desde dos instancias → misma huella', () => {
    const one = newSink();
    const two = newSink();
    const exception = boom();
    capture(one, { exception });
    capture(two, { exception });
    expect(one.drain().groups[0].fingerprint).toBe(
      two.drain().groups[0].fingerprint,
    );
  });

  it('tope de 500 eventos por minuto: lo que sobra sólo se cuenta', () => {
    const sink = newSink();
    const exception = boom();
    for (let i = 0; i < MAX_EVENTS_PER_MINUTE + 25; i += 1) {
      capture(sink, { exception });
    }
    const { groups, events } = sink.drain();
    expect(events).toHaveLength(MAX_EVENTS_PER_MINUTE);
    expect(groups[0].countOnly).toBe(25);
    expect(sink.sampledOutEvents).toBe(25);
    // Otro minuto: el tope se renueva.
    capture(sink, { exception, at: new Date(T0.getTime() + 60_000) });
    expect(sink.drain().events).toHaveLength(1);
  });

  it.each([...COUNT_ONLY_CODES])(
    '%s se agrega sin evento individual',
    (code) => {
      const sink = newSink();
      const exception = boom();
      const status = code === 'RATE_LIMITED' ? 429 : 401;
      capture(sink, { code, status, exception });
      capture(sink, { code, status, exception });
      const { groups, events } = sink.drain();
      expect(events).toHaveLength(0);
      expect(groups).toHaveLength(1);
      expect(groups[0].countOnly).toBe(2);
    },
  );

  describe('privacidad', () => {
    it('actor_hash es un HMAC hex de 64 y no contiene el user_id', () => {
      const sink = newSink();
      const userId = '7bc62907-e69f-4938-bfb1-eb3a5fb2be55';
      capture(sink, { userId });
      const [event] = sink.drain().events;
      expect(event.actorHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(event)).not.toContain(userId);
      expect(sink.actorHashOf(userId)).toBe(event.actorHash);
    });

    it('sin secreto no se guarda actor_hash', () => {
      const sink = newSink(null);
      capture(sink, { userId: '7bc62907-e69f-4938-bfb1-eb3a5fb2be55' });
      expect(sink.drain().events[0].actorHash).toBeNull();
      expect(sink.actorHashAvailable).toBe(false);
    });

    it('el secreto distinto da otro hash', () => {
      const a = newSink('a'.repeat(32));
      const b = newSink('b'.repeat(32));
      expect(a.actorHashOf('u')).not.toBe(b.actorHashOf('u'));
    });

    it('un 5xx NO guarda el mensaje interno sin API_ERROR_DIAGNOSTICS', () => {
      const sink = newSink();
      capture(sink);
      const { groups, events } = sink.drain();
      expect(events[0].messageRedacted).toBeNull();
      expect(groups[0].sampleMessage).toBeNull();
    });

    it('un 5xx con API_ERROR_DIAGNOSTICS guarda el mensaje ya plegado', () => {
      process.env.API_ERROR_DIAGNOSTICS = 'true';
      try {
        const sink = newSink();
        capture(sink);
        const message = sink.drain().events[0].messageRedacted ?? '';
        expect(message).toContain(':n');
        expect(message).toContain(':uuid');
        expect(message).not.toMatch(/123456789|0b9f6a1e/);
      } finally {
        delete process.env.API_ERROR_DIAGNOSTICS;
      }
    });

    it('un 4xx guarda el mensaje del cliente sin UUID ni números largos', () => {
      const sink = newSink();
      capture(sink, {
        status: 404,
        code: 'NOT_FOUND',
        exception: new NotFoundException(),
        routeTemplate: 'UNMATCHED',
        clientMessage:
          'Cannot GET /patients/0b9f6a1e-1111-4222-8333-444455556666/files/987654321',
      });
      const message = sink.drain().events[0].messageRedacted ?? '';
      expect(message).toBe('Cannot GET /patients/:uuid/files/:n');
    });

    it('violations: sólo campo y nombres de restricción, nunca el mensaje', () => {
      const sink = newSink();
      capture(sink, {
        status: 422,
        code: 'VALIDATION_FAILED',
        details: {
          fields: [
            {
              field: 'email',
              constraints: { isEmail: 'ana@secreta.com no es un email' },
            },
          ],
        },
      });
      const [event] = sink.drain().events;
      expect(event.violationsJson).toEqual([
        { field: 'email', constraints: ['isEmail'] },
      ]);
      expect(JSON.stringify(event)).not.toContain('secreta');
    });

    it('descarta un tenant que no sea UUID y acota requestId', () => {
      const sink = newSink();
      capture(sink, {
        actorTenantId: "x'; drop table",
        requestId: 'r'.repeat(500),
      });
      const [event] = sink.drain().events;
      expect(event.actorTenantId).toBeNull();
      expect(event.requestId).toHaveLength(128);
    });

    it('la ruta con UUID se pliega a UNMATCHED', () => {
      const sink = newSink();
      capture(sink, {
        routeTemplate: '/p/0b9f6a1e-1111-4222-8333-444455556666',
      });
      expect(sink.drain().events[0].routeTemplate).toBe('UNMATCHED');
    });
  });

  it('marcos propios: apuntan a src/ con línea, sin ruta absoluta ni columna', () => {
    const sink = newSink();
    const exception = new Error('x');
    exception.stack = [
      'Error: x',
      '    at Foo.bar (/home/u/app/dist/src/modules/a/a.service.js:10:5)',
      '    at node_modules/express/lib/router.js:1:1',
      '    at /home/u/app/src/modules/b/b.ts:22:3',
    ].join('\n');
    capture(sink, { exception });
    expect(sink.drain().events[0].framesJson).toEqual([
      'src/modules/a/a.service.js:10',
      'src/modules/b/b.ts:22',
    ]);
  });

  it('drain vacía el sink', () => {
    const sink = newSink();
    capture(sink);
    sink.drain();
    expect(sink.drain()).toEqual({ groups: [], events: [] });
  });

  it('scrubMessage acota a 500 caracteres', () => {
    expect(scrubMessage('a'.repeat(900)).length).toBeLessThanOrEqual(500);
  });
});
