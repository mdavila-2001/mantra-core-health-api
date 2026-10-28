import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateHealthcareServiceDto } from './create-healthcare-service.dto';

const UUID = '11111111-1111-4111-8111-111111111111';

/**
 * Valida un cuerpo contra el DTO.
 *
 * @param body - Cuerpo recibido.
 * @returns Las propiedades con error.
 */
async function invalidProperties(body: object): Promise<string[]> {
  const errors = await validate(
    plainToInstance(CreateHealthcareServiceDto, body),
  );
  return errors.map((error) => error.property);
}

describe('CreateHealthcareServiceDto', () => {
  const complete = {
    practiceSiteId: UUID,
    serviceConceptId: UUID,
    serviceCatalogId: UUID,
  };

  it('acepta el cuerpo completo del contrato', async () => {
    expect(
      await invalidProperties({
        ...complete,
        specialtyConceptId: UUID,
        appointmentRequired: true,
        referralRequired: false,
      }),
    ).toEqual([]);
  });

  it('rechaza un serviceCatalogId que no es uuid', async () => {
    expect(
      await invalidProperties({ ...complete, serviceCatalogId: 'no-uuid' }),
    ).toEqual(['serviceCatalogId']);
  });

  it('exige practiceSiteId', async () => {
    const { practiceSiteId: _omit, ...body } = complete;
    expect(await invalidProperties(body)).toEqual(['practiceSiteId']);
  });

  it('exige serviceConceptId y serviceCatalogId', async () => {
    expect((await invalidProperties({ practiceSiteId: UUID })).sort()).toEqual([
      'serviceCatalogId',
      'serviceConceptId',
    ]);
  });
});
