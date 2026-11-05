import { jest } from '@jest/globals';
import {
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { errorSink } from '../../observability/capture/error-sink';
import { AllExceptionsFilter } from './all-exceptions.filter';

function build(overrides: Record<string, unknown> = {}) {
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
  const tracing = {
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    addEvent: jest.fn(),
  } as unknown as TracingService;
  const response = {
    headersSent: false,
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const request = {
    headers: {},
    url: '/patients/0b9f6a1e-1111-4222-8333-444455556666?x=secreto',
    method: 'GET',
    baseUrl: '',
    route: { path: '/patients/:id' },
    id: 'req-abc',
    user: { id: '7bc62907-e69f-4938-bfb1-eb3a5fb2be55' },
    resolvedTenantId: '1befcfea-44c0-563a-81cd-337ec6acc840',
    ...overrides,
  } as unknown as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return {
    filter: new AllExceptionsFilter(logger, tracing),
    host,
    response,
    logger,
  };
}

describe('AllExceptionsFilter → ErrorSink', () => {
  afterEach(() => {
    errorSink.configure({ enabled: false, actorHashSecret: null });
    errorSink.drain();
  });

  it('con la captura apagada no registra nada y la respuesta es la de siempre', () => {
    const { filter, host, response } = build();
    filter.catch(new NotFoundException('nada'), host);
    expect(errorSink.drain().events).toEqual([]);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('registra el evento con requestId, plantilla (no URL), actor_hash y tenant; la respuesta no cambia', () => {
    errorSink.configure({ enabled: true, actorHashSecret: 's'.repeat(32) });
    const { filter, host, response } = build();
    filter.catch(new HttpException('Conflicto', HttpStatus.CONFLICT), host);

    const body = (response.json.mock.calls[0] as [Record<string, unknown>])[0];
    expect(response.status).toHaveBeenCalledWith(409);
    expect(body.correlationId).toBe('req-abc');

    const { events, groups } = errorSink.drain();
    expect(groups).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      requestId: 'req-abc',
      httpStatus: 409,
      errorCode: 'CONFLICT',
      httpMethod: 'GET',
      routeTemplate: '/patients/:id',
      actorTenantId: '1befcfea-44c0-563a-81cd-337ec6acc840',
    });
    expect(events[0].actorHash).toMatch(/^[0-9a-f]{64}$/);
    const serialized = JSON.stringify({ events, groups });
    expect(serialized).not.toContain('0b9f6a1e');
    expect(serialized).not.toContain('secreto');
    expect(serialized).not.toContain('7bc62907');
  });

  it('un 500 se registra con el código previo a la censura y sin cambiar el cuerpo', () => {
    errorSink.configure({ enabled: true, actorHashSecret: null });
    const { filter, host, response } = build();
    filter.catch(new TypeError('x is undefined'), host);
    const body = (response.json.mock.calls[0] as [Record<string, unknown>])[0];
    expect(body).toMatchObject({
      code: 'INTERNAL',
      message: 'Error interno del servidor',
    });
    expect(body.diagnostics).toBeUndefined();
    const { events } = errorSink.drain();
    expect(events[0]).toMatchObject({
      errorCode: 'INTERNAL',
      exceptionType: 'TypeError',
      httpStatus: 500,
    });
    // El mensaje interno de un 5xx no se guarda sin diagnóstico.
    expect(events[0].messageRedacted).toBeNull();
  });

  it('si el sink lanza, la respuesta de error sale igual', () => {
    errorSink.configure({ enabled: true, actorHashSecret: null });
    const spy = jest.spyOn(errorSink, 'record').mockImplementation(() => {
      throw new Error('sink roto');
    });
    const { filter, host, response } = build();
    expect(() => filter.catch(new NotFoundException(), host)).not.toThrow();
    expect(response.json).toHaveBeenCalled();
    spy.mockRestore();
  });
});
