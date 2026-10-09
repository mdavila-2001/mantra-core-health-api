import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { CreateClearingDto } from './subledger.dto';

/**
 * El cuerpo de `POST /accounting/clearing-documents` contra el DTO real y las
 * mismas opciones del `ValidationPipe` global de `main.ts`. Informe B, C9: el
 * cliente no tiene de dónde sacar el `tenantId` de la práctica, así que el
 * servidor lo deriva (`SubledgerService.resolveClearingTenant`).
 */
describe('CreateClearingDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateClearingDto,
  };

  function parse(body: unknown): Promise<CreateClearingDto> {
    return pipe.transform(body, metadata) as Promise<CreateClearingDto>;
  }

  const completo = {
    practiceId: '0b1f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a69',
    bankAccountId: '1c2f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a70',
    clearingDate: '2026-10-09',
    items: [
      {
        openItemId: '2d3f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a71',
        clearedAmount: '150.00',
      },
    ],
  };

  it('acepta el cuerpo sin tenantId', async () => {
    await expect(parse(completo)).resolves.toBeInstanceOf(CreateClearingDto);
  });

  it('sigue aceptando un tenantId declarado', async () => {
    const tenantId = '3e4f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a72';
    await expect(parse({ ...completo, tenantId })).resolves.toMatchObject({
      tenantId,
    });
  });

  it('rechaza el cuerpo mínimo que mandaba el front (`openItemIds`)', async () => {
    await expect(
      parse({ openItemIds: ['2d3f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a71'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['practiceId', 'bankAccountId', 'clearingDate', 'items'] as const)(
    'sigue exigiendo %s',
    async (clave) => {
      const { [clave]: _omitida, ...resto } = completo;
      await expect(parse(resto)).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
