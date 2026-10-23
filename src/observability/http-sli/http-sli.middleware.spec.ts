import { describe, it, expect, jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { HttpSliAggregator, UNMATCHED_ROUTE } from './http-sli.aggregator';
import {
  createHttpSliMiddleware,
  routeTemplateOf,
} from './http-sli.middleware';

type FakeReq = Partial<Request> & { method: string; path: string };

function fakeRes(statusCode = 200): Response & EventEmitter {
  const res = new EventEmitter() as Response & EventEmitter;
  res.statusCode = statusCode;
  return res;
}

function run(
  req: FakeReq,
  res: Response & EventEmitter,
  aggregator = new HttpSliAggregator(),
  ticks: bigint[] = [0n, 25_000_000n],
) {
  let call = 0;
  const middleware = createHttpSliMiddleware(aggregator, {
    now: () => new Date('2026-10-17T10:15:30.000Z'),
    hrtime: () => ticks[Math.min(call++, ticks.length - 1)],
  });
  const next = jest.fn();
  middleware(req as Request, res, next);
  res.emit('finish');
  return { aggregator, next };
}

describe('createHttpSliMiddleware', () => {
  it('registra la plantilla de ruta y nunca la dirección real con el identificador', () => {
    const req: FakeReq = {
      method: 'GET',
      path: '/patients/550e8400-e29b-41d4-a716-446655440000',
      baseUrl: '',
      route: { path: '/patients/:id' },
    };

    const { aggregator } = run(req, fakeRes(200));
    const points = aggregator.drain();

    expect(points).toHaveLength(1);
    expect(points[0].seriesId).toBe('http|GET|/patients/:id');
    expect(JSON.stringify(points)).not.toContain('550e8400');
  });

  it('un 403 de guard se registra con su estado y con la plantilla (la ruta ya estaba resuelta)', () => {
    const req: FakeReq = {
      method: 'POST',
      path: '/admin/ops/traffic',
      baseUrl: '',
      route: { path: '/admin/ops/traffic' },
    };

    const { aggregator } = run(req, fakeRes(403));
    const [point] = aggregator.drain();

    expect(point.dimensions.codes).toEqual({ '4xx': 1 });
    expect(point.seriesId).toBe('http|POST|/admin/ops/traffic');
  });

  it('sin ruta resuelta (404) se agrupa como UNMATCHED, jamás con su dirección', () => {
    const req: FakeReq = {
      method: 'GET',
      path: '/no-existe/12345678',
      baseUrl: '',
    };

    const { aggregator } = run(req, fakeRes(404));
    const [point] = aggregator.drain();

    expect(point.dimensions.route).toBe(UNMATCHED_ROUTE);
    expect(JSON.stringify(point)).not.toContain('12345678');
  });

  it('une baseUrl y la ruta del router', () => {
    const req: FakeReq = {
      method: 'GET',
      path: '/api/x',
      baseUrl: '/api',
      route: { path: '/x' },
    };

    expect(routeTemplateOf(req as Request)).toBe('/api/x');
  });

  it('una ruta que no es texto (expresión regular) se trata como UNMATCHED', () => {
    const req: FakeReq = {
      method: 'GET',
      path: '/x',
      baseUrl: '',
      route: { path: /^\/x\/\d+$/ },
    };

    expect(routeTemplateOf(req as Request)).toBe(UNMATCHED_ROUTE);
  });

  it.each(['/health', '/health?x=1', '/docs', '/docs-json', '/metrics'])(
    'no mide %s: es infraestructura, no negocio',
    (path) => {
      const { aggregator, next } = run(
        { method: 'GET', path, baseUrl: '', route: { path } },
        fakeRes(200),
      );

      expect(aggregator.pendingGroups).toBe(0);
      expect(next).toHaveBeenCalledTimes(1);
    },
  );

  it('no mide los preflight OPTIONS', () => {
    const { aggregator } = run(
      { method: 'OPTIONS', path: '/x', baseUrl: '', route: { path: '/x' } },
      fakeRes(204),
    );

    expect(aggregator.pendingGroups).toBe(0);
  });

  it('mide la duración con el cronómetro, en milisegundos', () => {
    const req: FakeReq = {
      method: 'GET',
      path: '/x',
      baseUrl: '',
      route: { path: '/x' },
    };

    const { aggregator } = run(req, fakeRes(200), new HttpSliAggregator(), [
      1_000_000n,
      13_000_000n,
    ]);
    const [point] = aggregator.drain();

    expect(point.dimensions.latency.sumMs).toBe(12);
    expect(point.dimensions.latency.buckets.le10).toBe(0);
    expect(point.dimensions.latency.buckets.le25).toBe(1);
  });

  it('no mide hasta que la respuesta termina, y deja pasar la petición siempre', () => {
    const aggregator = new HttpSliAggregator();
    const middleware = createHttpSliMiddleware(aggregator);
    const res = fakeRes(200);
    const next = jest.fn();

    middleware(
      {
        method: 'GET',
        path: '/x',
        baseUrl: '',
        route: { path: '/x' },
      } as Request,
      res,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(aggregator.pendingGroups).toBe(0);
  });

  it('un fallo al medir no se propaga: la respuesta ya salió', () => {
    const aggregator = new HttpSliAggregator();
    jest.spyOn(aggregator, 'record').mockImplementation(() => {
      throw new Error('boom');
    });
    const res = fakeRes(200);
    const middleware = createHttpSliMiddleware(aggregator);
    middleware(
      {
        method: 'GET',
        path: '/x',
        baseUrl: '',
        route: { path: '/x' },
      } as Request,
      res,
      jest.fn(),
    );

    expect(() => res.emit('finish')).not.toThrow();
  });
});
