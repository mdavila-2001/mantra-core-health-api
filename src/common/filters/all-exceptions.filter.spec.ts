import { jest } from '@jest/globals';
import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { ErrorCode } from '../errors/error-codes';
import {
  BulkheadFullError,
  CircuitOpenError,
  OperationTimeoutError,
} from '../resilience/resilience.errors';
import {
  AllExceptionsFilter,
  retryAfterSeconds,
} from './all-exceptions.filter';

function build(
  requestId?: string | number,
  requestHeaders: Record<string, unknown> = {},
  url = '/resource',
) {
  const logs = {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const logger = logs as unknown as PinoLogger;
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
    headers: requestHeaders,
    url,
    method: 'POST',
    ...(requestId === undefined ? {} : { id: requestId }),
  } as Request;
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
    logs,
  };
}

describe('AllExceptionsFilter HTTP infrastructure errors', () => {
  it.each([
    [HttpStatus.PAYLOAD_TOO_LARGE, ErrorCode.PAYLOAD_TOO_LARGE],
    [HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMITED],
  ])('maps HTTP %s to the stable code %s', (status, code) => {
    const { filter, host, response } = build();

    filter.catch(new HttpException('Rejected', status), host);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code, message: 'Rejected' }),
    );
  });

  it('preserva el 503 de readiness declarado y sanitizado', () => {
    const { filter, host, response } = build();
    filter.catch(
      new HttpException(
        {
          code: ErrorCode.DEPENDENCY_UNAVAILABLE,
          message: 'Dependencia no disponible',
          details: { checks: { redis: { status: 'down' } } },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
      host,
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.DEPENDENCY_UNAVAILABLE,
        message: 'Dependencia no disponible',
      }),
    );
  });

  it('mapea el cuerpo demasiado grande de body-parser a 413, no a 500', () => {
    // `express.json({ limit: '1mb' })` lanza un error que NO es HttpException:
    // sin tratarlo, un cliente que sube de más recibe INTERNAL y no puede
    // distinguir su propio error de una caída del servidor.
    const { filter, host, response } = build();
    const error = Object.assign(new Error('request entity too large'), {
      status: 413,
      type: 'entity.too.large',
    });

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(413);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }),
    );
  });

  it('mapea el JSON mal formado de body-parser a 400', () => {
    const { filter, host, response } = build();
    const error = Object.assign(new SyntaxError('Unexpected token }'), {
      status: 400,
      type: 'entity.parse.failed',
    });

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }),
    );
  });

  it('no deja que un 5xx ajeno suplante al INTERNAL propio', () => {
    const { filter, host, response } = build();
    const error = Object.assign(new Error('upstream roto'), { status: 502 });

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL' }),
    );
  });
});

describe('AllExceptionsFilter correlationId', () => {
  /** Lo que efectivamente se serializó al cliente. */
  function bodyOf(response: { json: { mock: { calls: unknown[][] } } }) {
    return response.json.mock.calls[0]?.[0] as { correlationId?: unknown };
  }

  it('normaliza a texto el id numérico que asigna pino-http', () => {
    // El generador por defecto de pino numera las peticiones, así que `req.id`
    // llega como número. El contrato publicado promete `string`: sin esta
    // normalización el cuerpo salía con un número y el tipo era una mentira.
    const { filter, host, response } = build(9451);

    filter.catch(new HttpException('Rechazado', HttpStatus.BAD_REQUEST), host);

    expect(bodyOf(response).correlationId).toBe('9451');
  });

  it('deja intacto el id de texto que manda el cliente', () => {
    const { filter, host, response } = build(undefined, {
      'x-request-id': 'trace-abc-123',
    });

    filter.catch(new HttpException('Rechazado', HttpStatus.BAD_REQUEST), host);

    expect(bodyOf(response).correlationId).toBe('trace-abc-123');
  });

  it('con `x-request-id` repetido toma el primero en vez de descartarlo', () => {
    // Express entrega las cabeceras repetidas como array. Un correlationId
    // aproximado sirve para encontrar la línea de log; ninguno, no.
    const { filter, host, response } = build(undefined, {
      'x-request-id': ['primero', 'segundo'],
    });

    filter.catch(new HttpException('Rechazado', HttpStatus.BAD_REQUEST), host);

    expect(bodyOf(response).correlationId).toBe('primero');
  });

  it('sin identificador queda `undefined`, no la cadena "undefined"', () => {
    const { filter, host, response } = build();

    filter.catch(new HttpException('Rechazado', HttpStatus.BAD_REQUEST), host);

    expect(bodyOf(response).correlationId).toBeUndefined();
  });

  it('`req.id` gana sobre la cabecera: es el que quedó en el log del servidor', () => {
    const { filter, host, response } = build(77, {
      'x-request-id': 'del-cliente',
    });

    filter.catch(new HttpException('Rechazado', HttpStatus.BAD_REQUEST), host);

    expect(bodyOf(response).correlationId).toBe('77');
  });
});

describe('AllExceptionsFilter sin query string en `path`', () => {
  const URL_CON_PHI = '/profiles/patients?q=Ana%20Quispe&nationalId=4455667';

  it('correcto — el cuerpo de un 4xx y su línea de warn llevan la ruta sola', () => {
    const { filter, host, response, logs } = build(1, {}, URL_CON_PHI);

    filter.catch(new HttpException('Rechazado', HttpStatus.BAD_REQUEST), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/profiles/patients' }),
    );
    expect(logs.warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/profiles/patients' }),
      'Rechazado',
    );
    expect(JSON.stringify(logs.warn.mock.calls)).not.toMatch(/Quispe|4455667/);
  });

  it('límite — un 5xx opaco tampoco la registra en la línea de error', () => {
    const { filter, host, response, logs } = build(1, {}, URL_CON_PHI);

    filter.catch(new Error('boom'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/profiles/patients' }),
    );
    expect(logs.error).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/profiles/patients' }),
      'Unhandled exception',
    );
  });

  it('inválido — una ruta sin query sale tal cual', () => {
    const { filter, host, response } = build(1, {}, '/iam/users');

    filter.catch(new HttpException('Rechazado', HttpStatus.NOT_FOUND), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/iam/users' }),
    );
  });
});

describe('AllExceptionsFilter Retry-After en los 5xx reintentables', () => {
  function retryAfterOf(response: { setHeader: jest.Mock }) {
    return response.setHeader.mock.calls.find(
      ([name]) => name === 'Retry-After',
    )?.[1];
  }

  it('correcto — el cortacircuitos abierto dice cuándo vuelve a probar', () => {
    const { filter, host, response } = build();

    filter.catch(new CircuitOpenError('pagos', 12_300), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    // 12,3 s → 13: nunca antes de que el circuito admita el sondeo.
    expect(retryAfterOf(response)).toBe('13');
  });

  it.each([
    [
      'TIMEOUT',
      new OperationTimeoutError('pagos', 3000),
      HttpStatus.GATEWAY_TIMEOUT,
      '5',
    ],
    [
      'CONCURRENCY_LIMIT',
      new BulkheadFullError('pagos', 4, 8),
      HttpStatus.SERVICE_UNAVAILABLE,
      '1',
    ],
    [
      'DEPENDENCY_UNAVAILABLE',
      new HttpException(
        {
          code: ErrorCode.DEPENDENCY_UNAVAILABLE,
          message: 'Dependencia no disponible',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
      HttpStatus.SERVICE_UNAVAILABLE,
      '5',
    ],
  ])(
    'correcto — %s sin plazo propio usa el valor por código',
    (_code, exception, status, esperado) => {
      const { filter, host, response } = build();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(status);
      expect(retryAfterOf(response)).toBe(esperado);
    },
  );

  it('límite — un plazo de 0 ms no invita a reintentar en el acto', () => {
    const { filter, host, response } = build();

    filter.catch(new CircuitOpenError('pagos', 0), host);

    expect(retryAfterOf(response)).toBe('1');
  });

  it('inválido — ni un 500 opaco ni un 4xx llevan Retry-After', () => {
    const opaco = build();
    opaco.filter.catch(new Error('boom'), opaco.host);
    expect(retryAfterOf(opaco.response)).toBeUndefined();

    const negocio = build();
    negocio.filter.catch(
      new HttpException('Rechazado', HttpStatus.CONFLICT),
      negocio.host,
    );
    expect(retryAfterOf(negocio.response)).toBeUndefined();
  });

  it('retryAfterSeconds ignora un retryAfterMs que no es un número utilizable', () => {
    expect(
      retryAfterSeconds(ErrorCode.CIRCUIT_OPEN, { retryAfterMs: 'pronto' }),
    ).toBe(30);
    expect(
      retryAfterSeconds(ErrorCode.CIRCUIT_OPEN, { retryAfterMs: -5 }),
    ).toBe(30);
    expect(
      retryAfterSeconds(ErrorCode.CIRCUIT_OPEN, { retryAfterMs: Infinity }),
    ).toBe(30);
    expect(retryAfterSeconds(ErrorCode.CONFLICT, undefined)).toBeUndefined();
  });
});
