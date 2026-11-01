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

  it.each(['productCode', 'pharmacyId', 'catalogProductId', 'price'])(
    'rejects %s: it is not editable or not part of the contract',
    async (key) => {
      const error: unknown = await parse({ [key]: 'x' }).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(BadRequestException);
      expect(
        JSON.stringify((error as BadRequestException).getResponse()),
      ).toContain(`property ${key} should not exist`);
    },
  );

  // P47 §3-5: lo que administra la farmacia ya tiene columna o tabla.
  it('accepts what the pharmacy manages (P47 §3-5)', async () => {
    const body = {
      unitPrice: 12.5,
      category: 'Medicamentos',
      description: 'Para el dolor de cabeza',
      inStock: false,
      status: 'DRAFT',
      minStock: 3,
      imageFileIds: ['11111111-1111-4111-8111-111111111111'],
    };
    await expect(parse(body)).resolves.toMatchObject(body);
    await expect(parse({ stock: 0 })).resolves.toMatchObject({ stock: 0 });
    await expect(parse({ unitPrice: '1250.00' })).resolves.toMatchObject({
      unitPrice: '1250.00',
    });
  });

  it('accepts the medication concept to link, and null to unlink', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    await expect(parse({ medicationConceptId: id })).resolves.toMatchObject({
      medicationConceptId: id,
    });
    await expect(parse({ medicationConceptId: null })).resolves.toMatchObject({
      medicationConceptId: null,
    });
    await expect(
      parse({ medicationConceptId: 'Amoxicilina' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts null to clear the price, the category and the description', async () => {
    const body = { unitPrice: null, category: null, description: null };
    await expect(parse(body)).resolves.toMatchObject(body);
  });

  it.each([
    ['a price with three decimals', { unitPrice: 12.125 }],
    ['a zero price', { unitPrice: 0 }],
    ['a negative price', { unitPrice: -3 }],
    ['a price in exponent notation', { unitPrice: '1e3' }],
    ['a price as text with a comma', { unitPrice: '12,50' }],
    ['a negative stock', { stock: -1 }],
    ['a fractional stock', { stock: 1.5 }],
    ['a stock over the cap', { stock: 1_000_001 }],
    ['a status outside the three', { status: 'IN_REVIEW' }],
    [
      'four images',
      {
        imageFileIds: [1, 2, 3, 4].map(
          (n) => `${n}1111111-1111-4111-8111-111111111111`,
        ),
      },
    ],
    [
      'the same image twice',
      {
        imageFileIds: [
          '11111111-1111-4111-8111-111111111111',
          '11111111-1111-4111-8111-111111111111',
        ],
      },
    ],
    ['an image that is not a uuid', { imageFileIds: ['x'] }],
    ['a category over 60 characters', { category: 'a'.repeat(61) }],
    ['an empty category (cleared with null)', { category: '' }],
  ])('rejects %s', async (_label, body) => {
    await expect(parse(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
