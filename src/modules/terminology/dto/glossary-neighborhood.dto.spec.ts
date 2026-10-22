import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { GlossaryNeighborhoodQueryDto } from './glossary-neighborhood.dto';

/**
 * La query de `glossary-neighborhood` contra el DTO real y las mismas opciones
 * del `ValidationPipe` global de `main.ts`. Fija además qué responde la API ante
 * un pedido inválido: **400** (`VALIDATION_FAILED` en el filtro de excepciones),
 * no el 422 que sirve la maqueta del front.
 */
describe('GlossaryNeighborhoodQueryDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const metadata: ArgumentMetadata = {
    type: 'query',
    metatype: GlossaryNeighborhoodQueryDto,
  };

  function parse(query: Record<string, string>) {
    return pipe.transform(
      query,
      metadata,
    ) as Promise<GlossaryNeighborhoodQueryDto>;
  }

  it('accepts an empty query: every field has a default in the controller', async () => {
    await expect(parse({})).resolves.toMatchObject({});
  });

  it('converts the numeric query strings and uppercases the language', async () => {
    await expect(parse({ lang: 'es', perGroup: '12' })).resolves.toMatchObject({
      lang: 'ES',
      perGroup: 12,
    });
  });

  it('accepts one group page with type, direction, offset and limit', async () => {
    await expect(
      parse({
        type: 'SYMPTOM',
        direction: 'incoming',
        offset: '0',
        limit: '200',
      }),
    ).resolves.toMatchObject({
      type: 'SYMPTOM',
      direction: 'incoming',
      offset: 0,
      limit: 200,
    });
  });

  it.each(['1', '50'])('accepts perGroup=%s (the bounds)', async (perGroup) => {
    await expect(parse({ perGroup })).resolves.toBeDefined();
  });

  it.each([
    ['perGroup=0', { perGroup: '0' }],
    ['perGroup=51', { perGroup: '51' }],
    ['perGroup=abc', { perGroup: 'abc' }],
    ['perGroup=1.5', { perGroup: '1.5' }],
    ['limit=0', { type: 'SYMPTOM', direction: 'incoming', limit: '0' }],
    ['limit=201', { type: 'SYMPTOM', direction: 'incoming', limit: '201' }],
    ['offset=-1', { type: 'SYMPTOM', direction: 'incoming', offset: '-1' }],
    ['an unknown type', { type: 'CAUSES', direction: 'incoming' }],
    ['an unknown direction', { type: 'SYMPTOM', direction: 'sideways' }],
    ['type without direction', { type: 'SYMPTOM' }],
    ['direction without type', { direction: 'incoming' }],
    ['an unsupported language', { lang: 'pt' }],
    ['a parameter the contract does not declare', { depth: '2' }],
  ])('rejects %s with 400', async (_name, query) => {
    await expect(parse(query)).rejects.toBeInstanceOf(BadRequestException);
  });
});
