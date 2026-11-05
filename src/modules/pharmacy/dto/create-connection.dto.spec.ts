import { BadRequestException, type ArgumentMetadata } from '@nestjs/common';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { CreateConnectionDto } from './create-connection.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateConnectionDto,
};

describe('CreateConnectionDto (UC-24-07)', () => {
  it('acepta el alta sin connectionId', async () => {
    const body = { integrationMode: 'REALTIME', supportsStockQuery: true };
    await expect(
      createGlobalValidationPipe().transform(body, metadata),
    ).resolves.toMatchObject(body);
  });

  it('rechaza con 400 un connectionId en el cuerpo', async () => {
    const body = {
      integrationMode: 'REALTIME',
      connectionId: '6f1c2b8e-3a4d-4e5f-9a0b-1c2d3e4f5a6b',
    };
    await expect(
      createGlobalValidationPipe().transform(body, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
