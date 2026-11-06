import { jest } from '@jest/globals';
import { HttpMapLinkResolver } from './http-map-link-resolver';

const SHORT = 'https://maps.app.goo.gl/uwjxPfc6SYBhtQ3e7';
const LONG = 'https://www.google.com/maps/@-16.5,-68.15,15z';

describe('HttpMapLinkResolver', () => {
  const realFetch = globalThis.fetch;
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('follows a short link and reads the coordinates of its destination', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { location: LONG } }),
    );

    await expect(new HttpMapLinkResolver().resolve(SHORT)).resolves.toEqual({
      latitude: -16.5,
      longitude: -68.15,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
  });

  it('never requests a host outside the short-link allowlist', async () => {
    const resolver = new HttpMapLinkResolver();

    await expect(
      resolver.resolve('https://169.254.169.254/latest/meta-data'),
    ).resolves.toBeUndefined();
    await expect(
      resolver.resolve('http://maps.app.goo.gl/abc'),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not request a redirect target that leaves the allowlist', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://localhost:5432/internal' },
      }),
    );

    await expect(
      new HttpMapLinkResolver().resolve(SHORT),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up on a network failure instead of throwing', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));

    await expect(
      new HttpMapLinkResolver().resolve(SHORT),
    ).resolves.toBeUndefined();
  });
});
