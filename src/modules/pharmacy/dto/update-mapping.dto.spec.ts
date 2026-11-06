import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMappingDto } from './update-mapping.dto';

async function errorsOf(body: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(UpdateMappingDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error) => error.property);
}

describe('UpdateMappingDto', () => {
  it('accepts each field on its own', async () => {
    expect(
      await errorsOf({
        pharmacyProductId: '6f1c2b8e-3a4d-4e5f-9a0b-1c2d3e4f5a6b',
      }),
    ).toEqual([]);
    expect(await errorsOf({ externalProductCode: 'ERP-0002' })).toEqual([]);
    expect(await errorsOf({ externalUnitCode: 'BOX' })).toEqual([]);
  });

  it('null clears the unit but is not a product nor a code', async () => {
    expect(await errorsOf({ externalUnitCode: null })).toEqual([]);
    expect(await errorsOf({ pharmacyProductId: null })).toEqual([
      'pharmacyProductId',
    ]);
    expect(await errorsOf({ externalProductCode: null })).toEqual([
      'externalProductCode',
    ]);
  });

  it('rejects an empty code and a product that is not a uuid', async () => {
    expect(await errorsOf({ externalProductCode: '' })).toEqual([
      'externalProductCode',
    ]);
    expect(await errorsOf({ pharmacyProductId: 'pr1' })).toEqual([
      'pharmacyProductId',
    ]);
  });
});
