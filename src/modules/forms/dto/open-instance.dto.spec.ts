import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { OpenInstanceDto } from './open-instance.dto';

/**
 * El cuerpo de `POST /forms/instances` contra el DTO real y las mismas opciones
 * del `ValidationPipe` global de `main.ts`.
 */
describe('OpenInstanceDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const metadata: ArgumentMetadata = { type: 'body', metatype: OpenInstanceDto };
  const resourceId = '0b6f1f0e-4c1d-4c8a-9a51-2f6f2c0b7c11';

  function parse(body: unknown): Promise<OpenInstanceDto> {
    return pipe.transform(body, metadata) as Promise<OpenInstanceDto>;
  }

  it('acepta el recurso con una versión de schema explícita', async () => {
    await expect(parse({ resourceId, schemaVersion: 2 })).resolves.toMatchObject({
      resourceId,
      schemaVersion: 2,
    });
  });

  it('rechaza definitionSetVersionId con 400 en vez de ignorarlo con un 201', async () => {
    await expect(
      parse({
        resourceId,
        definitionSetVersionId: '5d3c2b1a-0f9e-4d8c-8b7a-6e5f4d3c2b1a',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
