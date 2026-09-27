import { jest } from '@jest/globals';
import {
  type ArgumentMetadata,
  type ArgumentsHost,
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { ErrorCode } from '../errors/error-codes';
import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  type ValidationFailureDetails,
  validationExceptionFactory,
} from './validation-exception.factory';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class LineDto {
  @IsString()
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class ShippingDto {
  @IsString()
  city!: string;
}

class OrderDto {
  @ValidateNested()
  @Type(() => ShippingDto)
  shipping!: ShippingDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineDto)
  lines!: LineDto[];
}

class Level3Dto {
  @IsString()
  c!: string;
}

class Level2Dto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Level3Dto)
  b!: Level3Dto[];
}

class Level1Dto {
  @ValidateNested()
  @Type(() => Level2Dto)
  a!: Level2Dto;
}

/** Mismas opciones que `main.ts`. */
const OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
};

const WITH_FIELDS = new ValidationPipe({
  ...OPTIONS,
  exceptionFactory: validationExceptionFactory,
});
/** El pipe de antes, para comparar `violations` con el texto de Nest. */
const NEST_DEFAULT = new ValidationPipe(OPTIONS);

function meta(metatype: new () => unknown): ArgumentMetadata {
  return { type: 'body', metatype, data: '' };
}

async function rejection(
  pipe: ValidationPipe,
  metatype: new () => unknown,
  value: unknown,
): Promise<Record<string, unknown>> {
  try {
    await pipe.transform(value, meta(metatype));
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).getResponse() as Record<
      string,
      unknown
    >;
  }
  throw new Error('se esperaba un rechazo de validación');
}

async function detailsOf(
  metatype: new () => unknown,
  value: unknown,
): Promise<ValidationFailureDetails> {
  const res = await rejection(WITH_FIELDS, metatype, value);
  return res.details as ValidationFailureDetails;
}

/** Pasa la excepción por el filtro global y devuelve el cuerpo publicado. */
function publish(exception: unknown): Record<string, unknown> {
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
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () =>
        ({ headers: {}, url: '/orders', method: 'POST' }) as Request,
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter(logger, tracing).catch(exception, host);
  expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  return response.json.mock.calls[0][0] as Record<string, unknown>;
}

describe('validationExceptionFactory', () => {
  describe('campo simple', () => {
    it('una entrada por campo con todas sus reglas y el texto de siempre en violations', async () => {
      // `password` ausente: la conversión implícita no puede rescatarla, así
      // que incumple las dos reglas a la vez.
      const value = { email: 'no-es-correo' };
      const details = await detailsOf(LoginDto, value);

      expect(details.fields).toEqual([
        {
          field: 'email',
          constraints: { isEmail: 'email must be an email' },
          messages: ['email must be an email'],
        },
        {
          field: 'password',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
            isString: 'password must be a string',
          },
          messages: expect.arrayContaining([
            'password must be longer than or equal to 8 characters',
            'password must be a string',
          ]) as unknown as string[],
        },
      ]);
      // `messages` sigue el orden de `constraints`.
      for (const f of details.fields) {
        expect(f.messages).toEqual(Object.values(f.constraints));
      }

      const nest = await rejection(NEST_DEFAULT, LoginDto, value);
      expect(details.violations).toEqual(nest.message);
    });

    it('una propiedad no declarada sale como campo propio (whitelist)', async () => {
      const details = await detailsOf(LoginDto, {
        email: 'a@b.co',
        password: 'suficiente',
        role: 'ADMIN',
      });

      expect(details.fields).toEqual([
        {
          field: 'role',
          constraints: {
            whitelistValidation: 'property role should not exist',
          },
          messages: ['property role should not exist'],
        },
      ]);
    });

    it('el filtro global publica fields y violations con el mismo code y message de antes', async () => {
      let thrown: unknown;
      try {
        await WITH_FIELDS.transform({ email: 'x' }, meta(LoginDto));
      } catch (error) {
        thrown = error;
      }

      const body = publish(thrown);
      expect(body).toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Error de validación',
      });
      const details = body.details as ValidationFailureDetails;
      expect(details.violations).toContain('email must be an email');
      expect(details.fields.map((f) => f.field)).toEqual(['email', 'password']);
    });
  });

  describe('anidado y arreglos', () => {
    it('arma la ruta completa con punto para objetos y corchetes para índices', async () => {
      const value = {
        // Valores que la conversión implícita no rescata: un campo ausente y
        // un número por debajo del mínimo.
        shipping: {},
        lines: [
          { sku: 'A-1', quantity: 2 },
          { sku: 'B-2', quantity: 0 },
          { quantity: 1 },
        ],
      };
      const details = await detailsOf(OrderDto, value);

      expect(details.fields).toEqual([
        {
          field: 'shipping.city',
          constraints: { isString: 'city must be a string' },
          messages: ['city must be a string'],
        },
        {
          field: 'lines[1].quantity',
          constraints: { min: 'quantity must not be less than 1' },
          messages: ['quantity must not be less than 1'],
        },
        {
          field: 'lines[2].sku',
          constraints: { isString: 'sku must be a string' },
          messages: ['sku must be a string'],
        },
      ]);
    });

    it('violations conserva el texto exacto del ValidationPipe por defecto', async () => {
      const value = {
        shipping: {},
        lines: [{ sku: 'B-2', quantity: 0 }],
      };
      const details = await detailsOf(OrderDto, value);
      const nest = await rejection(NEST_DEFAULT, OrderDto, value);

      expect(details.violations).toEqual(nest.message);
      expect(details.violations).toEqual([
        'shipping.city must be a string',
        'lines.0.quantity must not be less than 1',
      ]);
    });

    it('resuelve rutas de tres niveles con un arreglo en medio (a.b[0].c)', async () => {
      const details = await detailsOf(Level1Dto, {
        a: { b: [{ c: 'ok' }, {}] },
      });

      expect(details.fields.map((f) => f.field)).toEqual(['a.b[1].c']);
      expect(details.violations).toEqual(['a.b.1.c must be a string']);
    });

    it('un propio fallo del padre (no es arreglo) queda en su propia ruta', async () => {
      const details = await detailsOf(OrderDto, {
        shipping: { city: 'La Paz' },
        lines: 'no-es-lista',
      });

      expect(details.fields).toEqual([
        expect.objectContaining({
          field: 'lines',
          constraints: expect.objectContaining({
            isArray: 'lines must be an array',
          }),
        }),
      ]);
    });

    it('infiere el índice aunque class-validator no exponga el valor', () => {
      const exception = validationExceptionFactory([
        {
          property: 'lines',
          children: [
            {
              property: '0',
              children: [
                {
                  property: 'sku',
                  constraints: { isString: 'sku must be a string' },
                  children: [],
                },
              ],
            },
          ],
        },
      ]);
      const res = exception.getResponse() as {
        details: ValidationFailureDetails;
      };

      expect(res.details.fields[0].field).toBe('lines[0].sku');
      expect(res.details.violations).toEqual(['lines.0.sku must be a string']);
    });
  });

  describe('sin errores', () => {
    it('un cuerpo válido pasa el pipe sin invocar la fábrica', async () => {
      const value = {
        shipping: { city: 'Santa Cruz' },
        lines: [{ sku: 'A-1', quantity: 3 }],
      };

      await expect(
        WITH_FIELDS.transform(value, meta(OrderDto)),
      ).resolves.toBeInstanceOf(OrderDto);
    });

    it('sin ValidationError devuelve listas vacías, no undefined', () => {
      const res = validationExceptionFactory([]).getResponse() as {
        message: unknown;
        details: ValidationFailureDetails;
      };

      expect(res.message).toEqual([]);
      expect(res.details).toEqual({ violations: [], fields: [] });
    });

    it('un nodo intermedio sin reglas propias no genera una entrada vacía', () => {
      const exception = validationExceptionFactory([
        {
          property: 'shipping',
          value: { city: 1 },
          children: [
            {
              property: 'city',
              value: 1,
              constraints: { isString: 'city must be a string' },
              children: [],
            },
          ],
        },
      ]);
      const res = exception.getResponse() as {
        details: ValidationFailureDetails;
      };

      expect(res.details.fields.map((f) => f.field)).toEqual(['shipping.city']);
    });
  });
});
