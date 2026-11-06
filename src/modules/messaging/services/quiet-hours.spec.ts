import {
  availableAfterSilence,
  inQuietHours,
  readSilenceHours,
} from './quiet-hours';
import { FALLBACK_IN_APP_SUBJECT, inboxText } from './in-app-text';

const NIGHT = { start: '22:00', end: '07:00' };

describe('quiet hours', () => {
  it('handles windows that cross midnight', () => {
    expect(inQuietHours(NIGHT, new Date('2026-11-06T23:30:00Z'))).toBe(true);
    expect(inQuietHours(NIGHT, new Date('2026-11-06T06:59:00Z'))).toBe(true);
    expect(inQuietHours(NIGHT, new Date('2026-11-06T07:00:00Z'))).toBe(false);
    expect(inQuietHours(NIGHT, new Date('2026-11-06T12:00:00Z'))).toBe(false);
  });

  it('ignores malformed windows', () => {
    expect(inQuietHours({ start: 'x', end: '07:00' }, new Date())).toBe(false);
    expect(inQuietHours(null, new Date())).toBe(false);
    expect(readSilenceHours({ start: 1, end: '07:00' })).toBeNull();
    expect(readSilenceHours(NIGHT)).toEqual(NIGHT);
  });

  it('defers to the end of the window: same day after midnight, next day before it', () => {
    expect(
      availableAfterSilence(
        NIGHT,
        new Date('2026-11-06T03:00:00Z'),
      ).toISOString(),
    ).toBe('2026-11-06T07:00:00.000Z');
    expect(
      availableAfterSilence(
        NIGHT,
        new Date('2026-11-06T23:00:00Z'),
      ).toISOString(),
    ).toBe('2026-11-07T07:00:00.000Z');
  });

  it('returns the very same instant outside the window', () => {
    const now = new Date('2026-11-06T12:00:00Z');
    expect(availableAfterSilence(NIGHT, now)).toBe(now);
    expect(availableAfterSilence(undefined, now)).toBe(now);
  });
});

describe('inboxText', () => {
  it('prefers the explicit text of the inline delivery', () => {
    expect(
      inboxText(
        { subject: 'A', bodyText: 'B' },
        { subject: 'X', bodyText: 'Y' },
      ),
    ).toEqual({ subject: 'A', bodyText: 'B' });
  });

  it('derives subject/body from the payload for the worker delivery (community groups)', () => {
    expect(
      inboxText({}, { subject: 'Hay algo nuevo en G', bodyText: 'Entre' }),
    ).toEqual({ subject: 'Hay algo nuevo en G', bodyText: 'Entre' });
  });

  it('accounting `{text}` becomes the body under a generic subject', () => {
    expect(
      inboxText({}, { text: 'Registró un gasto', transactionId: 't' }),
    ).toEqual({
      subject: FALLBACK_IN_APP_SUBJECT,
      bodyText: 'Registró un gasto',
    });
  });

  it('never leaves an empty subject', () => {
    expect(inboxText({ subject: '  ' }, null).subject).toBe(
      FALLBACK_IN_APP_SUBJECT,
    );
  });
});
