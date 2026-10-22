import { jest } from '@jest/globals';
import { Body, Controller, type INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import type { TracingService } from '../../observability';
import { createGlobalValidationPipe } from '../http/validation-pipe';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ERROR_DIAGNOSTICS_ENV } from './error-diagnostics';

class LineDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}

class BookingDto {
  @IsUUID()
  patientId!: string;

  @ValidateNested({ each: true })
  @Type(() => LineDto)
  lines!: LineDto[];
}

@Controller('bookings')
class BookingsController {
  @Post()
  create(@Body() body: BookingDto): BookingDto {
    return body;
  }

  /** Un servicio que revienta: el 500 típico de un `undefined.id`. */
  @Post('broken')
  broken(): never {
    const missing = undefined as unknown as { id: string };
    throw new TypeError(`Cannot read id of ${String(missing)}`);
  }
}

/**
 * El camino entero de un formulario que falla, por HTTP y con Express de
 * verdad: `ValidationPipe` global → `AllExceptionsFilter` → cuerpo JSON. Es lo
 * que recibe el front. La base no interviene: lo que se prueba es la plomería
 * de errores, no un caso de uso.
 */
describe('Trazabilidad de errores por HTTP', () => {
  let app: INestApplication;
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const original = process.env[ERROR_DIAGNOSTICS_ENV];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingsController],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(
        logger as unknown as PinoLogger,
        {
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          addEvent: jest.fn(),
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (original === undefined) delete process.env[ERROR_DIAGNOSTICS_ENV];
    else process.env[ERROR_DIAGNOSTICS_ENV] = original;
  });

  it('un campo de más y uno anidado inválido llegan nombrados al cliente y al log', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings')
      .set('x-request-id', 'trace-me')
      .send({
        patientId: '9f2c4e1a-0000-4000-8000-000000000001',
        lines: [{ quantity: 0 }],
        patientName: 'Ana',
      })
      .expect(400);

    expect(res.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      message: 'Error de validación',
      details: {
        fields: expect.arrayContaining([
          expect.objectContaining({
            field: 'patientName',
            constraints: ['whitelistValidation'],
          }),
          expect.objectContaining({
            field: 'lines.0.quantity',
            constraints: ['min'],
          }),
        ]),
      },
    });
    expect(res.body).not.toHaveProperty('diagnostics');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        violations: expect.arrayContaining([
          { field: 'patientName', constraints: ['whitelistValidation'] },
        ]),
      }),
      'Error de validación',
    );
  });

  it('el 500 sin interruptor no filtra nada interno', async () => {
    delete process.env[ERROR_DIAGNOSTICS_ENV];

    const res = await request(app.getHttpServer())
      .post('/bookings/broken')
      .expect(500);

    expect(res.body).toMatchObject({
      code: 'INTERNAL',
      message: 'Error interno del servidor',
    });
    expect(JSON.stringify(res.body)).not.toContain('Cannot read');
  });

  it('el 500 con interruptor dice qué excepción fue y en qué línea propia', async () => {
    process.env[ERROR_DIAGNOSTICS_ENV] = 'true';

    const res = await request(app.getHttpServer())
      .post('/bookings/broken')
      .expect(500);

    expect(res.body.message).toBe('Error interno del servidor');
    expect(res.body.diagnostics).toMatchObject({
      exception: 'TypeError',
      message: 'Cannot read id of undefined',
    });
    expect(res.body.diagnostics.where[0]).toMatch(
      /^src\/common\/filters\/error-traceability\.http\.spec\.ts:\d+:\d+$/,
    );
  });
});
