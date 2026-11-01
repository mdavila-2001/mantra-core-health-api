import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportServicesDto } from './service-repository.dto';

describe('ImportServicesDto', () => {
  it('acepta los ids md5 de los importadores de terminología (sin bits de versión)', async () => {
    const dto = plainToInstance(ImportServicesDto, {
      practiceId: '1befcfea-44c0-563a-81cd-337ec6acc840',
      // id real de un concepto CUPS cargado por specialty-services/
      items: [
        {
          conceptId: '1037a64e-f8c2-cf63-2eec-fa6e54e1c1cb',
          defaultPrice: '350.00',
        },
      ],
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rechaza lo que no es un uuid y un precio negativo', async () => {
    const dto = plainToInstance(ImportServicesDto, {
      practiceId: '1befcfea-44c0-563a-81cd-337ec6acc840',
      items: [{ conceptId: 'no-es-uuid', defaultPrice: '-1' }],
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
