import {
  DEFAULT_REPLAY_WINDOW_SECONDS,
  isWithinReplayWindow,
  parseWebhookTimestamp,
} from './webhook-timestamp';

describe('parseWebhookTimestamp', () => {
  it('interpreta segundos desde la época', () => {
    expect(parseWebhookTimestamp('1700000000')?.toISOString()).toBe(
      '2023-11-14T22:13:20.000Z',
    );
  });

  it('interpreta ISO-8601 con zona', () => {
    expect(parseWebhookTimestamp('2023-11-14T22:13:20Z')?.getTime()).toBe(
      1_700_000_000_000,
    );
    expect(
      parseWebhookTimestamp('2023-11-14T17:13:20.000-05:00')?.getTime(),
    ).toBe(1_700_000_000_000);
  });

  it.each([
    undefined,
    null,
    '',
    'ayer',
    '1e9',
    '-5',
    '12345678901',
    '2023-11-14',
  ])('rechaza %p', (raw) => {
    expect(parseWebhookTimestamp(raw)).toBeNull();
  });
});

describe('isWithinReplayWindow', () => {
  const now = new Date('2026-10-24T12:00:00Z');

  it('acepta lo que cae dentro de la ventana, hacia atrás y hacia adelante', () => {
    expect(isWithinReplayWindow(new Date(now.getTime() - 299_000), now)).toBe(
      true,
    );
    expect(isWithinReplayWindow(new Date(now.getTime() + 299_000), now)).toBe(
      true,
    );
  });

  it('rechaza lo vencido y lo adelantado más allá de la ventana', () => {
    const limit = DEFAULT_REPLAY_WINDOW_SECONDS * 1000;
    expect(isWithinReplayWindow(new Date(now.getTime() - limit - 1), now)).toBe(
      false,
    );
    expect(isWithinReplayWindow(new Date(now.getTime() + limit + 1), now)).toBe(
      false,
    );
  });

  it('respeta una ventana propia', () => {
    expect(
      isWithinReplayWindow(new Date(now.getTime() - 30_000), now, 10),
    ).toBe(false);
  });
});
