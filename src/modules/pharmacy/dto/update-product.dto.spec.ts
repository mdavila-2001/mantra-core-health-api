import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateProductDto } from './update-product.dto';

/**
 * El cuerpo de `PATCH /pharmacies/{pharmacyId}/products/{productId}` contra el
 * DTO real y las mismas opciones del `ValidationPipe` global de `main.ts`:
 * `whitelist` y `forbidNonWhitelisted`, que son lo que hace que una clave que
 * el modelo no guarda responda 400 en vez de perderse en silencio.
 */
describe('UpdateProductDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: UpdateProductDto,
  };

  function parse(body: unknown): Promise<UpdateProductDto> {
    return pipe.transform(body, metadata) as Promise<UpdateProductDto>;
  }

  it('accepts the five descriptive fields', async () => {
    const body = {
      brandName: 'Amoxil',
      genericName: 'Amoxicilina',
      strengthText: '500 mg',
      packageSizeText: 'Caja x 21',
      requiresPrescription: true,
    };
    await expect(parse(body)).resolves.toMatchObject(body);
  });

  it('accepts null on every field: it is how a value is cleared', async () => {
    const body = {
      brandName: null,
      genericName: null,
      strengthText: null,
      packageSizeText: null,
      requiresPrescription: null,
    };
    await expect(parse(body)).resolves.toMatchObject(body);
  });

  it('accepts an empty body and the limits of each length', async () => {
    await expect(parse({})).resolves.toBeInstanceOf(UpdateProductDto);
    await expect(
      parse({
        brandName: 'a'.repeat(300),
        genericName: 'a'.repeat(300),
        strengthText: 'a'.repeat(200),
        packageSizeText: 'a'.repeat(200),
      }),
    ).resolves.toBeInstanceOf(UpdateProductDto);
  });

  it.each([
    ['an empty string (a value is cleared with null)', { brandName: '' }],
    ['a brand over 300 characters', { brandName: 'a'.repeat(301) }],
    ['a generic name over 300 characters', { genericName: 'a'.repeat(301) }],
    ['a strength over 200 characters', { strengthText: 'a'.repeat(201) }],
    [
      'a package size over 200 characters',
      { packageSizeText: 'a'.repeat(201) },
    ],
    ['a number as a text', { brandName: 42 }],
    ['a text as a boolean', { requiresPrescription: 'yes' }],
  ])('rejects %s', async (_label, body) => {
    await expect(parse(body)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    'productCode',
    'unitPrice',
    'category',
    'description',
    'inStock',
    'status',
    'stock',
    'minStock',
    'imageFileIds',
  ])('rejects %s: the model has no column for it (P47)', async (key) => {
    const error: unknown = await parse({ [key]: 'x' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    expect(
      JSON.stringify((error as BadRequestException).getResponse()),
    ).toContain(`property ${key} should not exist`);
  });
});
