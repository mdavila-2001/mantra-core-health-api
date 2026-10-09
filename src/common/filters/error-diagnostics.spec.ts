import { jest } from '@jest/globals';
import { BadRequestException, type ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  ERROR_DIAGNOSTICS_ENV,
  describeForDiagnostics,
  violationsForLog,
} from './error-diagnostics';

const original = process.env[ERROR_DIAGNOSTICS_ENV];
afterEach(() => {
  if (original === undefined) delete process.env[ERROR_DIAGNOSTICS_ENV];
  else process.env[ERROR_DIAGNOSTICS_ENV] = original;
});

function build(user?: { id: string }) {
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
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
    url: '/scheduling/appointments',
    method: 'POST',
    id: 'req-1',
    ...(user ? { user } : {}),
  } as unknown as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  const filter = new AllExceptionsFilter(
    logger as unknown as PinoLogger,
    tracing,
  );
  const body = () => response.json.mock.calls[0][0] as Record<string, unknown>;
  return { filter, host, logger, body };
}

/** Un 400 con la forma que produce `createGlobalValidationPipe`. */
function validation400() {
  return new BadRequestException({
    code: 'VALIDATION_FAILED',
    message: 'Error de validación',
    details: {
      violations: ['email must be an email'],
      fields: [
        {
          field: 'email',
          constraints: ['isEmail'],
          messages: ['email must be an email'],
        },
      ],
    },
  });
}

describe('violationsForLog', () => {
  it('deja la ruta y la restricción, nunca el mensaje', () => {
    expect(
      violationsForLog({
        fields: [
          {
            field: 'a.b',
            constraints: ['isUUID'],
            messages: ['valor 123 inválido'],
          },
        ],
      }),
    ).toEqual({ violations: [{ field: 'a.b', constraints: ['isUUID'] }] });
  });

  it('sin `fields` no agrega nada', () => {
    expect(violationsForLog({ violations: ['x'] })).toEqual({});
    expect(violationsForLog(undefined)).toEqual({});
  });
});

describe('describeForDiagnostics', () => {
  it('toma la clase, el mensaje y los marcos propios del stack', () => {
    const error = new TypeError(
      "Cannot read properties of undefined (reading 'id')",
    );
    error.stack = [
      `TypeError: ${error.message}`,
      '    at AppointmentsService.book (/app/dist/src/modules/scheduling/services/appointments.service.js:120:31)',
      '    at /app/node_modules/@nestjs/core/router/router-execution-context.js:46:28',
      '    at AppointmentsController.create (/Users/x/repo/src/modules/scheduling/controllers/appointments.controller.ts:88:12)',
    ].join('\n');

    expect(describeForDiagnostics(error)).toEqual({
      exception: 'TypeError',
      message: "Cannot read properties of undefined (reading 'id')",
      where: [
        'dist/src/modules/scheduling/services/appointments.service.js:120:31',
        'src/modules/scheduling/controllers/appointments.controller.ts:88:12',
      ],
    });
  });

  it('incluye restricción, tabla y columna pero nunca el `detail` con el valor', () => {
    const diagnostics = describeForDiagnostics(new Error('fk'), {
      constraint: 'fk_appointments_patient_id',
      table: 'appointments',
      column: 'patient_id',
      detail: 'Key (patient_id)=(9f2c…) is not present',
    });
    expect(diagnostics).toMatchObject({
      constraint: 'fk_appointments_patient_id',
      table: 'appointments',
      column: 'patient_id',
    });
    expect(JSON.stringify(diagnostics)).not.toContain('is not present');
  });
});

describe('AllExceptionsFilter — trazabilidad', () => {
  it('el log del 400 dice qué campo falló y quién lo pidió', () => {
    const { filter, host, logger } = build({ id: 'user-7' });

    filter.catch(validation400(), host);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'req-1',
        userId: 'user-7',
        violations: [{ field: 'email', constraints: ['isEmail'] }],
      }),
      'Error de validación',
    );
  });

  it('el 400 entrega `details.fields` al cliente', () => {
    const { filter, host, body } = build();

    filter.catch(validation400(), host);

    expect(body().details).toMatchObject({
      fields: [expect.objectContaining({ field: 'email' })],
    });
  });

  it('sin el interruptor no hay diagnóstico y el 500 sigue opaco', () => {
    delete process.env[ERROR_DIAGNOSTICS_ENV];
    const { filter, host, body } = build();

    filter.catch(new TypeError('secreto interno'), host);

    expect(body()).toMatchObject({
      code: 'INTERNAL',
      message: 'Error interno del servidor',
    });
    expect(body()).not.toHaveProperty('diagnostics');
    expect(JSON.stringify(body())).not.toContain('secreto interno');
  });

  it('con el interruptor el 500 conserva el mensaje público y agrega el diagnóstico', () => {
    process.env[ERROR_DIAGNOSTICS_ENV] = 'true';
    const { filter, host, body } = build();

    filter.catch(new TypeError('relation "x" does not exist'), host);

    expect(body()).toMatchObject({
      code: 'INTERNAL',
      message: 'Error interno del servidor',
      diagnostics: {
        exception: 'TypeError',
        message: 'relation "x" does not exist',
      },
    });
  });

  it('cualquier valor distinto de "true" deja el diagnóstico apagado', () => {
    process.env[ERROR_DIAGNOSTICS_ENV] = '1';
    const { filter, host, body } = build();

    filter.catch(new Error('x'), host);

    expect(body()).not.toHaveProperty('diagnostics');
  });
});
