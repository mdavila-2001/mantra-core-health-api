import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { isSingleEmoji, ReactToMessageDto } from './message-reaction.dto';

describe('ReactToMessageDto', () => {
  const errors = (body: object) =>
    validateSync(plainToInstance(ReactToMessageDto, body)).map(
      (e) => e.property,
    );
  const profileId = '0f8b6c1e-5b8a-4f3e-9d7a-2b1c3d4e5f60';

  it.each(['👍', '❤️', '👍🏽', '👨‍⚕️', '🇧🇴', '1️⃣'])('accepts %s', (emoji) => {
    expect(isSingleEmoji(emoji)).toBe(true);
    expect(errors({ profileId, emoji })).toEqual([]);
  });

  it.each(['hola que tal', ' ', '👍👍', 'a', '\u0000', '<b>👍</b>'])(
    'rejects %j',
    (emoji) => {
      expect(errors({ profileId, emoji })).toEqual(['emoji']);
    },
  );

  it('null removes, but an omitted emoji is an error', () => {
    expect(errors({ profileId, emoji: null })).toEqual([]);
    expect(errors({ profileId })).toEqual(['emoji']);
  });
});
