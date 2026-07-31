import { jest } from '@jest/globals';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ErrorCode } from '../errors/error-codes';

/**
 * Captura lo que el filtro escribe en la respuesta.
 *
 * `catch` no devuelve nada: su efecto es el `status().json()` sobre el Response de
 * Express, así que el doble guarda ambos para poder aseverarlos.
 */
function capturar(): {
  host: any;
  leer: () => { status: number; body: any };
} {
  let status = 0;
  let body: any;
  const response = {
    status: (s: number) => {
      status = s;
      return response;
    },
    json: (b: unknown) => {
      body = b;
      return response;
    },
  };
  const request = { url: '/probe', method: 'POST', headers: {}, id: 'corr-1' };
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    },
    leer: () => ({ status, body }),
  };
}

const logger = {
  setContext: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
} as any;

/** Error del driver `pg`: el SQLSTATE viaja en `code`. */
function errorPg(code: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error('driver'), {
    code,
    table: 'invoices',
    column: 'transaction_id',
    constraint: 'fk_invoices_transaction_id',
    detail: 'Key (transaction_id)=(x) is not present in table "journal_transactions".',
    ...extra,
  });
}

describe('AllExceptionsFilter · violaciones de integridad', () => {
  const filtro = () => new AllExceptionsFilter(logger);

  it('una FK colgada (23503) es 422, no 500', () => {
    const { host, leer } = capturar();
    filtro().catch(errorPg('23503'), host);

    const { status, body } = leer();
    expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(body.code).toBe(ErrorCode.VALIDATION_FAILED);
    // El dato accionable no se pierde: qué columna y contra qué tabla.
    expect(body.details).toMatchObject({
      table: 'invoices',
      column: 'transaction_id',
    });
  });

  it('una clave única repetida (23505) es 409', () => {
    const { host, leer } = capturar();
    filtro().catch(errorPg('23505'), host);
    expect(leer().status).toBe(HttpStatus.CONFLICT);
    expect(leer().body.code).toBe(ErrorCode.CONFLICT);
  });

  it('un NOT NULL sin valor (23502) es 422', () => {
    const { host, leer } = capturar();
    filtro().catch(errorPg('23502'), host);
    expect(leer().status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('un valor fuera de un enum (22P02) es 422', () => {
    const { host, leer } = capturar();
    filtro().catch(errorPg('22P02'), host);
    expect(leer().status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('un SQLSTATE no mapeado sigue siendo 500 y no filtra detalle', () => {
    const { host, leer } = capturar();
    filtro().catch(errorPg('08006'), host); // fallo de conexión: culpa del servidor

    const { status, body } = leer();
    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.code).toBe(ErrorCode.INTERNAL);
    expect(body.message).toBe('Error interno del servidor');
  });

  it('no toca las HttpException de Nest', () => {
    const { host, leer } = capturar();
    filtro().catch(new NotFoundException('no está'), host);
    expect(leer().status).toBe(HttpStatus.NOT_FOUND);
  });
});
