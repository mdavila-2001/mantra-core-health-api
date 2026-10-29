import { PlanBackgroundUrlService } from './plan-background-url.service';

const PLAN = '11111111-1111-4111-8111-111111111111';
const VERSION = '22222222-2222-4222-8222-222222222222';

function parse(url: string): { v: string; exp: string; sig: string } {
  const query = new URLSearchParams(url.split('?')[1]);
  return {
    v: query.get('v') as string,
    exp: query.get('exp') as string,
    sig: query.get('sig') as string,
  };
}

describe('PlanBackgroundUrlService', () => {
  const service = new PlanBackgroundUrlService();
  const now = new Date('2026-10-29T12:00:00Z');

  it('firma una ruta de la API que no contiene el id del archivo', () => {
    const { url, expiresAt } = service.sign(PLAN, VERSION, now);
    expect(url.startsWith(`/floor-plans/${PLAN}/background/content?`)).toBe(
      true,
    );
    expect(expiresAt).toBe('2026-10-29T12:05:00.000Z');
  });

  it('acepta la URL recién emitida', () => {
    const { url } = service.sign(PLAN, VERSION, now);
    expect(() => service.verify(PLAN, parse(url), now)).not.toThrow();
  });

  it('rechaza una firma de otro lienzo, otra versión o alterada con 403', () => {
    const { url } = service.sign(PLAN, VERSION, now);
    const query = parse(url);
    expect(() =>
      service.verify('33333333-3333-4333-8333-333333333333', query, now),
    ).toThrow(expect.objectContaining({ status: 403 }));
    expect(() =>
      service.verify(
        PLAN,
        { ...query, v: '44444444-4444-4444-8444-444444444444' },
        now,
      ),
    ).toThrow(expect.objectContaining({ status: 403 }));
    expect(() =>
      service.verify(PLAN, { ...query, sig: '0'.repeat(64) }, now),
    ).toThrow(expect.objectContaining({ status: 403 }));
  });

  it('rechaza con 410 cuando venció', () => {
    const { url } = service.sign(PLAN, VERSION, now);
    const later = new Date(now.getTime() + 6 * 60 * 1000);
    expect(() => service.verify(PLAN, parse(url), later)).toThrow(
      expect.objectContaining({ status: 410 }),
    );
  });
});
