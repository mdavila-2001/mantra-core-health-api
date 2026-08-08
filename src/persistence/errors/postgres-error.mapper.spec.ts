import { mapPostgresError } from './postgres-error.mapper';
import {
  ConcurrencyConflictError,
  ConnectionUnavailableError,
  DeadlockDetectedError,
  DuplicateEntityError,
  ForeignKeyConflictError,
  InsufficientPrivilegeError,
  PersistenceError,
  QueryTimeoutError,
  RequiredFieldError,
} from './persistence.errors';

/** Error del driver `pg` tal y como llega. */
function driverError(code: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error('error del motor'), { code, ...extra });
}

describe('mapPostgresError', () => {
  describe('traducción de SQLSTATE', () => {
    it.each([
      ['23505', DuplicateEntityError],
      ['23503', ForeignKeyConflictError],
      ['23502', RequiredFieldError],
      ['40001', ConcurrencyConflictError],
      ['40P01', DeadlockDetectedError],
      ['42501', InsufficientPrivilegeError],
      ['57014', QueryTimeoutError],
    ])('traduce %s', (code, expected) => {
      expect(mapPostgresError(driverError(code))).toBeInstanceOf(expected);
    });

    it('un interbloqueo sigue siendo un conflicto de concurrencia', () => {
      // La jerarquía importa: un `catch (ConcurrencyConflictError)` que
      // reintenta debe capturar también el interbloqueo.
      expect(mapPostgresError(driverError('40P01'))).toBeInstanceOf(
        ConcurrencyConflictError,
      );
    });

    it.each(['08006', '08001', '53300', '57P01'])(
      'trata %s como conexión no disponible',
      (code) => {
        expect(mapPostgresError(driverError(code))).toBeInstanceOf(
          ConnectionUnavailableError,
        );
      },
    );

    it.each(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'])(
      'trata el error de socket %s como conexión no disponible',
      (code) => {
        expect(mapPostgresError(driverError(code))).toBeInstanceOf(
          ConnectionUnavailableError,
        );
      },
    );

    it('un SQLSTATE desconocido cae en el error genérico sin perder el código', () => {
      const mapped = mapPostgresError(driverError('XX000'));
      expect(mapped.constructor).toBe(PersistenceError);
      expect(mapped.context.code).toBe('XX000');
    });
  });

  describe('errores envueltos por MikroORM', () => {
    it('encuentra el SQLSTATE dentro de la causa', () => {
      const wrapped = Object.assign(new Error('DriverException'), {
        cause: driverError('23505'),
      });
      expect(mapPostgresError(wrapped)).toBeInstanceOf(DuplicateEntityError);
    });

    it('lo encuentra también bajo `previous`', () => {
      const wrapped = Object.assign(new Error('DriverException'), {
        previous: driverError('23503'),
      });
      expect(mapPostgresError(wrapped)).toBeInstanceOf(ForeignKeyConflictError);
    });

    it('no entra en bucle si la causa se referencia a sí misma', () => {
      const circular: Record<string, unknown> = { message: 'x' };
      circular.cause = circular;
      expect(() => mapPostgresError(circular)).not.toThrow();
    });
  });

  describe('sanitización', () => {
    it('no propaga el DETAIL de PostgreSQL en el mensaje', () => {
      // El DETAIL de una violación de unicidad contiene los valores en
      // conflicto: en `users_email_key` eso es un correo, es decir, un dato
      // personal que no debe acabar en un log ni en una respuesta HTTP.
      const error = driverError('23505', {
        detail: 'Key (email)=(paciente@ejemplo.com) already exists.',
        message: 'duplicate key value violates unique constraint',
      });

      const mapped = mapPostgresError(error);

      expect(mapped.message).not.toContain('paciente@ejemplo.com');
      expect(mapped.message).toBe(
        'Ya existe un registro con esos valores únicos.',
      );
    });

    it('conserva la restricción, que es diagnóstico y no dato', () => {
      const mapped = mapPostgresError(
        driverError('23505', { constraint: 'users_email_key' }),
      );
      expect(mapped.context.constraint).toBe('users_email_key');
    });

    it('conserva la causa técnica para la observabilidad interna', () => {
      const original = driverError('23505');
      expect(mapPostgresError(original).cause).toBe(original);
    });

    it('adjunta el contexto de la conexión sin la contraseña', () => {
      const mapped = mapPostgresError(driverError('42501'), {
        connectionName: 'postgres-read',
        operation: 'waitlist.findDueReminders',
      });
      expect(mapped.context).toMatchObject({
        connectionName: 'postgres-read',
        engine: 'postgresql',
        operation: 'waitlist.findDueReminders',
      });
    });
  });

  describe('idempotencia', () => {
    it('un error ya normalizado se devuelve tal cual', () => {
      // Permite que un adaptador envuelva a otro sin degradar el tipo a algo
      // más genérico en cada salto.
      const already = new DuplicateEntityError('ya normalizado');
      expect(mapPostgresError(already)).toBe(already);
    });
  });

  describe('jerarquía', () => {
    it('todo error normalizado es un PersistenceError', () => {
      expect(mapPostgresError(driverError('23505'))).toBeInstanceOf(
        PersistenceError,
      );
    });

    it('el nombre del error coincide con su clase', () => {
      expect(mapPostgresError(driverError('42501')).name).toBe(
        'InsufficientPrivilegeError',
      );
    });
  });
});
