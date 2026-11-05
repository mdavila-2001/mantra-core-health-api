import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateServiceCatalogItemDto } from './service-catalog.dto';

/**
 * El código de un servicio importado del arancel es el del concepto
 * (`procedure:bo:…`), que llega a 71 caracteres. El alta tiene que aceptarlo:
 * con el tope anterior de 60, 4237 de las 4408 importaciones daban 400.
 */
describe('CreateServiceCatalogItemDto · code', () => {
  const base = {
    practiceId: '7a1f0c2e-3b4d-4e5f-8a9b-0c1d2e3f4a5b',
    name: 'Bloqueo anestésico',
    defaultPrice: '100.00',
  };

  async function errorsFor(code: string): Promise<string[]> {
    const errors = await validate(
      plainToInstance(CreateServiceCatalogItemDto, { ...base, code }) as object,
    );
    return errors.map((error) => error.property);
  }

  it('acepta el código más largo del arancel (71 caracteres)', async () => {
    const code =
      'procedure:bo:BO_ARM_ANESTESIOLOGIA_REANIMACION_Y_DOLOR_ANEXO_CER_D95F61';
    expect(code).toHaveLength(71);
    expect(await errorsFor(code)).toEqual([]);
  });

  it('sigue rechazando un código desmedido', async () => {
    expect(await errorsFor('x'.repeat(121))).toEqual(['code']);
  });
});
