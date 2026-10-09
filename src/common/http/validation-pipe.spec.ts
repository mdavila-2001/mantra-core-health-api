import { BadRequestException, type ArgumentMetadata } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ErrorCode } from '../errors/error-codes';
import {
  UNKNOWN_PROPERTY_CONSTRAINT,
  createGlobalValidationPipe,
} from './validation-pipe';

class LineDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}

class OrderDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineDto)
  items!: LineDto[];
}

const metadata: ArgumentMetadata = { type: 'body', metatype: OrderDto };

/** Devuelve el cuerpo de la excepción del 400, o falla si el pipe aceptó. */
async function rejection(body: unknown): Promise<Record<string, unknown>> {
  try {
    await createGlobalValidationPipe().transform(body, metadata);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).getResponse() as Record<
      string,
      unknown
    >;
  }
  throw new Error('El pipe aceptó un cuerpo inválido');
}

describe('createGlobalValidationPipe', () => {
  it('acepta un cuerpo válido sin tocarlo', async () => {
    const body = { email: 'a@b.test', name: 'Ana', items: [{ quantity: 2 }] };
    await expect(
      createGlobalValidationPipe().transform(body, metadata),
    ).resolves.toMatchObject(body);
  });

  it('declara el código estable y el mensaje del contrato', async () => {
    const response = await rejection({ email: 'x', name: 'Ana', items: [] });
    expect(response).toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Error de validación',
    });
  });

  it('devuelve cada campo con su ruta completa y el nombre de la restricción', async () => {
    const response = await rejection({
      email: 'no-es-correo',
      name: '',
      items: [{ quantity: 3 }, { quantity: 0 }],
    });
    const details = response.details as { fields: unknown[] };

    expect(details.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', constraints: ['isEmail'] }),
        expect.objectContaining({ field: 'name', constraints: ['isNotEmpty'] }),
        // El anidado es el caso que la heurística del front no podía resolver.
        expect.objectContaining({
          field: 'items.1.quantity',
          constraints: ['min'],
        }),
      ]),
    );
  });

  it('nombra la propiedad que el DTO no declara: así se ve un contrato desalineado', async () => {
    const response = await rejection({
      email: 'a@b.test',
      name: 'Ana',
      items: [],
      patientName: 'sobra',
    });
    const details = response.details as { fields: unknown[] };

    expect(details.fields).toEqual([
      expect.objectContaining({
        field: 'patientName',
        constraints: [UNKNOWN_PROPERTY_CONSTRAINT],
      }),
    ]);
  });

  it('conserva `details.violations` con las mismas frases que daba Nest', async () => {
    const response = await rejection({
      email: 'a@b.test',
      name: 'Ana',
      items: [{ quantity: 0 }],
    });
    const details = response.details as { violations: string[] };

    // Nest antepone la ruta del padre al mensaje de un campo anidado.
    expect(details.violations).toEqual([
      'items.0.quantity must not be less than 1',
    ]);
  });
});
