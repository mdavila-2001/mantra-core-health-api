import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePostDto, POST_BODY_MAX_LENGTH } from './post.dto';

/**
 * El tope del cuerpo de una publicación, contra el DTO real.
 *
 * La pantalla de artículos médicos del front promete 20 000 caracteres; con el
 * tope viejo (5 000) el servidor rechazaba con 400 un artículo largo y quien lo
 * escribía lo perdía. Las dos puntas del límite, y que la validación siga
 * existiendo.
 */
describe('CreatePostDto.bodyText', () => {
  async function erroresDe(bodyText: string): Promise<string[]> {
    const dto = plainToInstance(CreatePostDto, { bodyText });
    return (await validate(dto)).map((e) => e.property);
  }

  it('el tope es 20 000 caracteres', () => {
    expect(POST_BODY_MAX_LENGTH).toBe(20000);
  });

  it('acepta un artículo de exactamente 20 000 caracteres (más que el tope viejo de 5 000)', async () => {
    expect(await erroresDe('a'.repeat(POST_BODY_MAX_LENGTH))).toEqual([]);
    expect(await erroresDe('a'.repeat(5001))).toEqual([]);
  });

  it('rechaza 20 001 caracteres y el cuerpo vacío', async () => {
    expect(await erroresDe('a'.repeat(POST_BODY_MAX_LENGTH + 1))).toEqual([
      'bodyText',
    ]);
    expect(await erroresDe('')).toEqual(['bodyText']);
  });
});
