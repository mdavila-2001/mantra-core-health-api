import {
  deviceCodeDigest,
  deviceConfirmationCode,
  isDeviceConfirmationCodeValid,
  maskEmail,
} from './device-confirmation-code';

const SECRET = 'secreto-de-pruebas';
const USER = 'u1';
const DEVICE = 'd1';
const T0 = new Date('2026-10-30T12:03:00Z');

describe('código de confirmación de dispositivo', () => {
  it('son 8 dígitos y valen para la persona y el dispositivo del código', () => {
    const code = deviceConfirmationCode(SECRET, USER, DEVICE, T0);
    expect(code).toMatch(/^\d{8}$/);
    expect(isDeviceConfirmationCodeValid(SECRET, USER, DEVICE, code, T0)).toBe(
      true,
    );
  });

  it('no sirven para otro dispositivo, otra persona ni otro secreto', () => {
    const code = deviceConfirmationCode(SECRET, USER, DEVICE, T0);
    expect(isDeviceConfirmationCodeValid(SECRET, USER, 'd2', code, T0)).toBe(
      false,
    );
    expect(isDeviceConfirmationCodeValid(SECRET, 'u2', DEVICE, code, T0)).toBe(
      false,
    );
    expect(isDeviceConfirmationCodeValid('otro', USER, DEVICE, code, T0)).toBe(
      false,
    );
  });

  it('vale en su ventana y en la siguiente, y caduca después', () => {
    const code = deviceConfirmationCode(SECRET, USER, DEVICE, T0);
    const plus = (min: number) => new Date(T0.getTime() + min * 60_000);
    expect(
      isDeviceConfirmationCodeValid(SECRET, USER, DEVICE, code, plus(9)),
    ).toBe(true);
    expect(
      isDeviceConfirmationCodeValid(SECRET, USER, DEVICE, code, plus(15)),
    ).toBe(true);
    expect(
      isDeviceConfirmationCodeValid(SECRET, USER, DEVICE, code, plus(25)),
    ).toBe(false);
  });

  it('un código con otra longitud o forma no vale ni lanza', () => {
    expect(isDeviceConfirmationCodeValid(SECRET, USER, DEVICE, '123', T0)).toBe(
      false,
    );
    expect(isDeviceConfirmationCodeValid(SECRET, USER, DEVICE, '', T0)).toBe(
      false,
    );
  });

  it('la huella de uso no contiene el código y depende de la persona y del dispositivo', () => {
    const digest = deviceCodeDigest(USER, DEVICE, '12345678');
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toContain('12345678');
    expect(deviceCodeDigest(USER, 'd2', '12345678')).not.toBe(digest);
  });

  it('maskEmail deja reconocer la dirección sin mostrarla', () => {
    expect(maskEmail('ana.perez@clinica.com.bo')).toBe('a***@c***.com.bo');
    expect(maskEmail('x@y.io')).toBe('x***@y***.io');
  });
});
