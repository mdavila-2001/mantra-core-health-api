import { jest } from '@jest/globals';
import {
  type ArgumentsHost,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { ERROR_DIAGNOSTICS_ENV } from './error-diagnostics';
import { SecretCipherError } from '../errors/secret-cipher.error';
import { AllExceptionsFilter } from './all-exceptions.filter';

/** Marca sintética que hace las veces de un dato clínico o personal. */
const MARK = 'PHI-SINTETICO-ana.perez@example.test-CI-1234567';

function build() {
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const tracing = {
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    addEvent: jest.fn(),
  };
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
  return {
    filter: new AllExceptionsFilter(
      logger as unknown as PinoLogger,
      tracing as unknown as TracingService,
    ),
    host,
    response,
    logger,
    tracing,
  };
}

/** Error del driver `pg` con el valor sensible en `detail`, `message` y `cause`. */
function pgErrorWithMark(sqlstate: string): Error {
  const root = Object.assign(
    new Error(`duplicate key value (${MARK}) violates unique constraint`),
    {
      code: sqlstate,
      table: 'iam.users',
      constraint: 'users_email_unique',
      column: 'email',
      detail: `Key (email)=(${MARK}) already exists.`,
      parameters: [MARK],
    },
  );
  return Object.assign(
    new Error(
      `insert into "users" ("email") values ('${MARK}') - ${root.message}`,
    ),
    { cause: root, detail: root.detail, params: [MARK] },
  );
}

/** Todo lo que el filtro escribió en cualquier nivel del log, serializado. */
function everythingLogged(logger: ReturnType<typeof build>['logger']): string {
  return JSON.stringify([
    ...logger.warn.mock.calls,
    ...logger.error.mock.calls,
  ]);
}

describe('AllExceptionsFilter · el log no recibe datos de fila (ERR-03)', () => {
  const previous = process.env[ERROR_DIAGNOSTICS_ENV];
  afterEach(() => {
    if (previous === undefined) delete process.env[ERROR_DIAGNOSTICS_ENV];
    else process.env[ERROR_DIAGNOSTICS_ENV] = previous;
  });

  it('4xx por SQLSTATE 23505: ni `detail`, ni `message`, ni `cause` llegan al warn ni a la respuesta', () => {
    delete process.env[ERROR_DIAGNOSTICS_ENV];
    const { filter, host, response, logger } = build();

    filter.catch(pgErrorWithMark('23505'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(everythingLogged(logger)).not.toContain(MARK);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(MARK);
    // Lo que sí queda: metadatos de esquema y el SQLSTATE, para diagnosticar.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        integrity: {
          sqlstate: '23505',
          constraint: 'users_email_unique',
          table: 'iam.users',
          column: 'email',
        },
      }),
      expect.any(String),
    );
  });

  it('excepción tipada de MikroORM con el SQL interpolado en `message`: nada al log', () => {
    delete process.env[ERROR_DIAGNOSTICS_ENV];
    const { filter, host, logger, response } = build();

    filter.catch(
      new UniqueConstraintViolationException(pgErrorWithMark('23505')),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(everythingLogged(logger)).not.toContain(MARK);
  });

  it('5xx por SQLSTATE no tratado: `err` no vuelca detail/message/params/cause, sí tipo, SQLSTATE y marcos', () => {
    delete process.env[ERROR_DIAGNOSTICS_ENV];
    const { filter, host, response, logger, tracing } = build();

    filter.catch(pgErrorWithMark('XX000'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(everythingLogged(logger)).not.toContain(MARK);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(MARK);
    // Tampoco al span: OpenTelemetry copia `message` y `stack` de lo que recibe.
    const traced = tracing.recordException.mock.calls[0]?.[0] as Error;
    expect(`${traced.name} ${traced.message} ${traced.stack}`).not.toContain(
      MARK,
    );

    const logged = logger.error.mock.calls[0]?.[0] as {
      err: Record<string, unknown>;
      code: string;
    };
    expect(logged.code).toBe('INTERNAL');
    expect(logged.err).toMatchObject({ type: 'Error', causes: ['Error'] });
    expect(Array.isArray(logged.err.stack)).toBe(true);
    expect(logged.err).not.toHaveProperty('message');
    expect(logged.err).not.toHaveProperty('detail');
  });

  it('5xx genérico con el valor en `message`: ni log ni traza lo reciben', () => {
    delete process.env[ERROR_DIAGNOSTICS_ENV];
    const { filter, host, logger, tracing } = build();

    filter.catch(new TypeError(`no se pudo leer ${MARK}`), host);

    expect(everythingLogged(logger)).not.toContain(MARK);
    const traced = tracing.recordException.mock.calls[0]?.[0] as Error;
    expect(`${traced.name} ${traced.message} ${traced.stack}`).not.toContain(
      MARK,
    );
    expect(traced.name).toBe('TypeError');
  });

  it('con API_ERROR_DIAGNOSTICS=true (datos sintéticos) el mensaje sí se escribe en el log', () => {
    process.env[ERROR_DIAGNOSTICS_ENV] = 'true';
    const { filter, host, logger } = build();

    filter.catch(new TypeError('Cannot read id of undefined'), host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.objectContaining({
          message: 'Cannot read id of undefined',
        }),
      }),
      expect.any(String),
    );
  });

  it('una HttpException 5xx declarada conserva su propio error en la traza (su mensaje es para el cliente)', () => {
    const { filter, host, tracing } = build();
    const exception = new HttpException(
      { code: 'DEPENDENCY_UNAVAILABLE', message: 'Redis no responde' },
      HttpStatus.SERVICE_UNAVAILABLE,
    );

    filter.catch(exception, host);

    expect(tracing.recordException).toHaveBeenCalledWith(exception);
  });
});

describe('AllExceptionsFilter · reason en la respuesta (ERR-01 / CEH-02)', () => {
  it('promueve `details.reason` declarado a `reason` de primer nivel sin tocar `details`', () => {
    const { filter, host, response } = build();

    filter.catch(
      new ForbiddenException({
        message: 'Falta elegir organización',
        details: { reason: 'TENANT_REQUIRED' },
      }),
      host,
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'FORBIDDEN',
        reason: 'TENANT_REQUIRED',
        details: { reason: 'TENANT_REQUIRED' },
      }),
    );
  });

  it('el `reason` de primer nivel gana sobre `details.reason`', () => {
    const { filter, host, response } = build();

    filter.catch(
      new ForbiddenException({
        message: 'x',
        reason: 'PRIMERO',
        details: { reason: 'SEGUNDO' },
      }),
      host,
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'PRIMERO' }),
    );
  });

  it('no inventa un reason desde el texto cuando la excepción no lo declara', () => {
    const { filter, host, response } = build();

    filter.catch(new ForbiddenException('Rol insuficiente'), host);

    const body = response.json.mock.calls[0]?.[0] as { reason?: string };
    expect(body.reason).toBeUndefined();
  });

  it('secreto cifrado ilegible → 500 INTERNAL con reason SECRET_CIPHER_INVALID y sin detalle', () => {
    const { filter, host, response, logger } = build();

    filter.catch(new SecretCipherError(), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL',
        message: 'Error interno del servidor',
        reason: 'SECRET_CIPHER_INVALID',
        details: undefined,
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'SECRET_CIPHER_INVALID',
        err: expect.objectContaining({ type: 'SecretCipherError' }),
      }),
      'Unhandled exception',
    );
  });

  it('un `reason` ajeno a la lista cerrada no sobrevive en un 500', () => {
    const { filter, host, response } = build();
    const error = Object.assign(new Error('boom'), { reason: 'ALGO_INTERNO' });

    filter.catch(error, host);

    const body = response.json.mock.calls[0]?.[0] as { reason?: string };
    expect(body.reason).toBeUndefined();
  });
});
