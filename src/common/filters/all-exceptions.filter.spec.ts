import { jest } from '@jest/globals';
import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { ErrorCode } from '../errors/error-codes';
import { AllExceptionsFilter } from './all-exceptions.filter';

function build(
  requestId?: string | number,
  requestHeaders: Record<string, unknown> = {},
) {
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
    headers: requestHeaders,
    url: '/resource',
    method: 'POST',
    ...(requestId === undefined ? {} : { id: requestId }),
  } as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { filter: new AllExceptionsFilter(logger, tracing), host, response };
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
