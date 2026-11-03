import { describe, it, expect, jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { HttpSink } from '../capture/http-sink';
import { currentRequestContext } from '../capture/request-context';
import { HttpSliAggregator } from './http-sli.aggregator';
import { createHttpSliMiddleware } from './http-sli.middleware';

type FakeReq = Partial<Request> & { method: string; path: string };

function fakeRes(statusCode: number): Response & EventEmitter {
  const res = new EventEmitter() as Response & EventEmitter;
  res.statusCode = statusCode;
  return res;
}

const AT = new Date('2026-10-31T10:15:30.000Z');

describe('createHttpSliMiddleware con el sink del módulo 70', () => {
  function setup(path = '/admin/ops/slos', prefixes: string[] = []) {
    const sink = new HttpSink();
    sink.setEnabled(true);
    const aggregator = new HttpSliAggregator();
    const middleware = createHttpSliMiddleware(aggregator, {
      now: () => AT,
      sink,
      sinkExcludedPrefixes: prefixes,
    });
    const req: FakeReq = {
      method: 'GET',
      path,
      baseUrl: '',
      route: { path },
    };
    return { sink, aggregator, middleware, req };
  }

  it('alimenta el sink con el código exacto Y mantiene la doble escritura al agregador', () => {
    const { sink, aggregator, middleware, req } = setup();
    const res = fakeRes(422);
    middleware(req as Request, res, jest.fn());
    res.emit('finish');
    expect(sink.drain()).toMatchObject([
      {
        httpMethod: 'GET',
        routeTemplate: '/admin/ops/slos',
        httpStatus: 422,
        requests: 1,
      },
    ]);
    const points = aggregator.drain();
    expect(points).toHaveLength(1);
    expect(points[0].dimensions.codes).toEqual({ '4xx': 1 });
  });

  it('abre el contexto de petición alrededor de next()', () => {
    const { middleware, req } = setup();
    let seen: unknown;
    middleware(req as Request, fakeRes(200), () => {
      seen = currentRequestContext()?.req;
    });
    expect(seen).toBe(req);
  });

  it('sin agregador (http-sli apagado) sólo alimenta el sink', () => {
    const sink = new HttpSink();
    sink.setEnabled(true);
    const middleware = createHttpSliMiddleware(null, { now: () => AT, sink });
    const req: FakeReq = {
      method: 'GET',
      path: '/a',
      baseUrl: '',
      route: { path: '/a' },
    };
    const res = fakeRes(404);
    middleware(req as Request, res, jest.fn());
    res.emit('finish');
    expect(sink.drain()).toHaveLength(1);
  });

  it('una ruta excluida del sink sigue en el agregador pero no en el sink', () => {
    const { sink, aggregator, middleware, req } = setup(
      '/internal/observability/selftest/fail',
      ['/internal/observability/'],
    );
    const res = fakeRes(500);
    middleware(req as Request, res, jest.fn());
    res.emit('finish');
    expect(sink.drain()).toEqual([]);
    expect(aggregator.drain()).toHaveLength(1);
  });

  it('OPTIONS y rutas de salud no entran a ninguno', () => {
    const { sink, aggregator, middleware } = setup();
    for (const [method, path] of [
      ['OPTIONS', '/a'],
      ['GET', '/health'],
    ]) {
      const res = fakeRes(200);
      middleware({ method, path } as Request, res, jest.fn());
      res.emit('finish');
    }
    expect(sink.drain()).toEqual([]);
    expect(aggregator.drain()).toEqual([]);
  });

  it('un sink que lanza no rompe la respuesta ni el agregador', () => {
    const { aggregator, req } = setup();
    const sink = {
      record: () => {
        throw new Error('boom');
      },
    } as unknown as HttpSink;
    const middleware = createHttpSliMiddleware(aggregator, {
      now: () => AT,
      sink,
    });
    const res = fakeRes(200);
    middleware(req as Request, res, jest.fn());
    expect(() => res.emit('finish')).not.toThrow();
    expect(aggregator.drain()).toHaveLength(1);
  });
});
