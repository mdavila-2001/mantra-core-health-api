import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { CosignVersionDto, SignVersionDto } from './notes.dto';

/**
 * Los cuerpos de `POST /charts/notes/:noteId/versions/:versionId/sign` y
 * `…/cosign` contra el DTO real y las mismas opciones del `ValidationPipe`
 * global de `main.ts`. Informe B, C5: la pantalla firma con `{}` y el DTO
 * exigía `signerProfileId`, así que firmar daba 400 siempre. El firmante lo
 * deriva el servidor de la sesión (`ChartNotesService.resolveSigner`).
 */
describe('SignVersionDto / CosignVersionDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  function parse<T>(metatype: new () => T, body: unknown): Promise<T> {
    const metadata: ArgumentMetadata = { type: 'body', metatype };
    return pipe.transform(body, metadata) as Promise<T>;
  }

  it.each([
    ['sign', SignVersionDto],
    ['cosign', CosignVersionDto],
  ] as const)(
    '%s: acepta el cuerpo vacío que manda la pantalla',
    async (_, dto) => {
      await expect(parse(dto, {})).resolves.toBeInstanceOf(dto);
    },
  );

  it.each([
    ['sign', SignVersionDto],
    ['cosign', CosignVersionDto],
  ] as const)('%s: sigue aceptando un perfil declarado', async (_, dto) => {
    const signerProfileId = '0b1f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a69';
    await expect(parse(dto, { signerProfileId })).resolves.toMatchObject({
      signerProfileId,
    });
  });

  it('rechaza un perfil que no es uuid', async () => {
    await expect(
      parse(SignVersionDto, { signerProfileId: 'no-es-uuid' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza una clave que el DTO no declara', async () => {
    await expect(parse(SignVersionDto, { reason: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
