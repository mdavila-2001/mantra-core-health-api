import { jest } from '@jest/globals';
import { type ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  CheckConstraintViolationException,
  ConnectionException,
  DeadlockException,
  ForeignKeyConstraintViolationException,
  NotNullConstraintViolationException,
} from '@mikro-orm/core';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { ErrorCode } from '../errors/error-codes';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * Cobertura del mapeo de fallos de base de datos.
 *
 * Hasta esta versión, `integrityViolation` estaba escrito en el filtro pero
 * `normalize` **nunca lo llamaba**: era código muerto. El efecto práctico es que
 * todo error del driver —incluida una clave foránea inexistente, que es un
 * error del cliente y perfectamente accionable— llegaba como `500 INTERNAL`,
 * indistinguible de una caída real del servidor. Estas pruebas fijan el
 * comportamiento correcto para que no pueda volver a quedarse desconectado.
 */

function build() {
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
    url: '/resource',
    method: 'POST',
  } as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { filter: new AllExceptionsFilter(logger, tracing), host, response };
}

/** Error tal como lo entrega el driver `pg` en una consulta SQL cruda. */
function pgError(sqlstate: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error('error de postgres'), {
    code: sqlstate,
    ...extra,
  });
}

function bodyOf(response: { json: { mock: { calls: unknown[][] } } }) {
  return response.json.mock.calls[0]?.[0] as {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

describe('AllExceptionsFilter · excepciones tipadas de MikroORM', () => {
  it('clave foránea inexistente → 422, no 500', () => {
    const { filter, host, response } = build();

    filter.catch(
      new ForeignKeyConstraintViolationException(
        pgError('23503', { table: 'appointments', constraint: 'fk_patient' }),
      ),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(bodyOf(response).code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it.each([
    ['NOT NULL', new NotNullConstraintViolationException(pgError('23502'))],
    ['CHECK', new CheckConstraintViolationException(pgError('23514'))],
  ])('violación %s → 422', (_name, exception) => {
    const { filter, host, response } = build();

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(bodyOf(response).code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it('interbloqueo → 409 CONCURRENCY_CONFLICT: la acción correcta es reintentar', () => {
    // Devolverlo como 500 le decía al cliente exactamente lo contrario de lo
    // que debía hacer.
    const { filter, host, response } = build();

    filter.catch(new DeadlockException(pgError('40P01')), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(bodyOf(response).code).toBe(ErrorCode.CONCURRENCY_CONFLICT);
  });

  it('base inaccesible → 503 DEPENDENCY_UNAVAILABLE, y el cuerpo NO se oculta', () => {
    // Un 500 opaco impide el reintento y el failover; un 503 con código estable
    // los habilita.
    const { filter, host, response } = build();

    filter.catch(new ConnectionException(pgError('ECONNREFUSED')), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(bodyOf(response).code).toBe(ErrorCode.DEPENDENCY_UNAVAILABLE);
    expect(bodyOf(response).message).not.toBe('Error interno del servidor');
  });
});

describe('AllExceptionsFilter · SQLSTATE del SQL crudo', () => {
  it.each([
    ['23503', HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED],
    ['23505', HttpStatus.CONFLICT, ErrorCode.CONFLICT],
    ['23502', HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED],
    ['22P02', HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED],
    ['40001', HttpStatus.CONFLICT, ErrorCode.CONCURRENCY_CONFLICT],
    ['40P01', HttpStatus.CONFLICT, ErrorCode.CONCURRENCY_CONFLICT],
    ['55P03', HttpStatus.CONFLICT, ErrorCode.CONCURRENCY_CONFLICT],
    ['57014', HttpStatus.GATEWAY_TIMEOUT, ErrorCode.TIMEOUT],
    ['53300', HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.DEPENDENCY_UNAVAILABLE],
    ['57P03', HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.DEPENDENCY_UNAVAILABLE],
  ])('SQLSTATE %s → %s / %s', (sqlstate, status, code) => {
    const { filter, host, response } = build();

    filter.catch(pgError(sqlstate), host);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(bodyOf(response).code).toBe(code);
  });

  it('adjunta tabla y restricción para que el cliente sepa qué corregir', () => {
    const { filter, host, response } = build();

    filter.catch(
      pgError('23505', {
        table: 'iam.users',
        constraint: 'users_email_unique',
        column: 'email',
      }),
      host,
    );

    expect(bodyOf(response).details).toMatchObject({
      table: 'iam.users',
      constraint: 'users_email_unique',
      column: 'email',
    });
  });

  it('encuentra el SQLSTATE anidado bajo `cause`', () => {
    const { filter, host, response } = build();
    const wrapped = Object.assign(new Error('el ORM lo reenvolvió'), {
      cause: pgError('23503'),
    });

    filter.catch(wrapped, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it('no confunde un código de red de Node con un SQLSTATE', () => {
    // `ECONNRESET` viaja en el mismo campo `code`; tratarlo como SQLSTATE
    // produciría un mapeo inventado.
    const { filter, host, response } = build();

    filter.catch(pgError('ECONNRESET'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(bodyOf(response).code).toBe(ErrorCode.INTERNAL);
  });

  it('un SQLSTATE no tratado sigue siendo 500: los fallos reales no se disfrazan', () => {
    const { filter, host, response } = build();

    filter.catch(pgError('XX000'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(bodyOf(response).code).toBe(ErrorCode.INTERNAL);
    expect(bodyOf(response).details).toBeUndefined();
  });

  it('no se cuelga con una cadena de causas cíclica', () => {
    // Dentro del filtro de errores no hay a quién informar de un cuelgue: es el
    // único sitio del que ya no se puede reportar nada.
    const { filter, host, response } = build();
    const a: { cause?: unknown } = {};
    const b = { cause: a };
    a.cause = b;

    filter.catch(a, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});
