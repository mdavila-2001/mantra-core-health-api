import {
  FINGERPRINT_PREFIX,
  describeClient,
  deviceFingerprintOf,
} from './device-fingerprint';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const CHROME_WIN_NEXT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.89 Safari/537.36';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const FIREFOX_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0';

describe('huella de dispositivo', () => {
  describe('describeClient', () => {
    it.each([
      [CHROME_WIN, 'Chrome en Windows', 'desktop'],
      [EDGE_WIN, 'Edge en Windows', 'desktop'],
      [SAFARI_IPHONE, 'Safari en iOS', 'mobile'],
      [CHROME_ANDROID, 'Chrome en Android', 'mobile'],
      [FIREFOX_LINUX, 'Firefox en Linux', 'desktop'],
    ])('%s', (ua, label, deviceClass) => {
      const client = describeClient(ua);
      expect(client.label).toBe(label);
      expect(client.deviceClass).toBe(deviceClass);
    });

    it('un User-Agent desconocido no inventa nada', () => {
      expect(describeClient('curl/8.0').label).toBe(
        'Navegador en sistema desconocido',
      );
    });
  });

  describe('deviceFingerprintOf', () => {
    const fp = (secret: string, user: string, ua: string): string =>
      deviceFingerprintOf(secret, user, describeClient(ua));

    it('es estable: otra versión del mismo navegador es el mismo equipo', () => {
      expect(fp('s', 'u1', CHROME_WIN)).toBe(fp('s', 'u1', CHROME_WIN_NEXT));
    });

    it('cambia con el navegador, el sistema, la persona y el secreto del servidor', () => {
      const base = fp('s', 'u1', CHROME_WIN);
      expect(fp('s', 'u1', EDGE_WIN)).not.toBe(base);
      expect(fp('s', 'u1', FIREFOX_LINUX)).not.toBe(base);
      expect(fp('s', 'u2', CHROME_WIN)).not.toBe(base);
      expect(fp('otro', 'u1', CHROME_WIN)).not.toBe(base);
    });

    it('lleva su prefijo y no contiene el User-Agent ni la persona en claro', () => {
      const value = fp('s', 'u1', CHROME_WIN);
      expect(value.startsWith(FINGERPRINT_PREFIX)).toBe(true);
      expect(value).not.toContain('Chrome');
      expect(value).not.toContain('u1');
      expect(value).toMatch(/^srv1:[0-9a-f]{64}$/);
    });
  });
});
