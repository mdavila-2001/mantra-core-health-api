import { ValidationPipe } from '@nestjs/common';

import { SearchChatContactsRequestDto } from './read-messaging.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

const metadata = {
  type: 'body',
  metatype: SearchChatContactsRequestDto,
} as const;

describe('SearchChatContactsRequestDto', () => {
  it('recorta espacios y convierte el límite válido', async () => {
    await expect(
      pipe.transform(
        {
          profileId: '33dc46df-4539-4e58-80b5-e03590ee4962',
          q: '  María  ',
          limit: '12',
        },
        metadata,
      ),
    ).resolves.toMatchObject({ q: 'María', limit: 12 });
  });

  it('aplica un límite predeterminado de diez contactos', async () => {
    await expect(
      pipe.transform(
        {
          profileId: '33dc46df-4539-4e58-80b5-e03590ee4962',
          q: 'Contacto',
        },
        metadata,
      ),
    ).resolves.toMatchObject({ limit: 10 });
  });

  it.each([
    ['consulta de un carácter', { q: 'm' }],
    ['perfil inválido', { profileId: 'no-es-uuid', q: 'contacto' }],
    ['consulta demasiado larga', { q: 'x'.repeat(81) }],
    ['límite cero', { q: 'contacto', limit: 0 }],
    ['límite fraccionario', { q: 'contacto', limit: 1.5 }],
    ['campo desconocido', { q: 'contacto', inesperado: true }],
    ['consulta vacía', { q: '   ' }],
    ['límite excesivo', { q: 'maria', limit: '21' }],
    ['consulta no textual', { q: ['maria'] }],
  ])('rechaza %s', async (_case, extra) => {
    await expect(
      pipe.transform(
        {
          profileId: '33dc46df-4539-4e58-80b5-e03590ee4962',
          ...extra,
        },
        metadata,
      ),
    ).rejects.toBeDefined();
  });
});
