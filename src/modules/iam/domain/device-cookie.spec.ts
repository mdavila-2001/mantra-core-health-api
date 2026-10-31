import { readDeviceCookie, signDeviceCookie } from './device-cookie';

const SECRET = 'secreto-de-pruebas';
const USER = 'a3b9a6a1-0f64-4a0a-9b6e-111111111111';
const OTHER = 'b4c0b7b2-1a75-4b1b-8c7f-222222222222';
const DEVICE = 'c5d1c8c3-2b86-4c2c-9d80-333333333333';

describe('cookie de dispositivo firmada', () => {
  it('ida y vuelta: la firma de la persona devuelve su dispositivo', () => {
    const value = signDeviceCookie(SECRET, USER, DEVICE);
    expect(readDeviceCookie(SECRET, USER, value)).toBe(DEVICE);
  });

  it('una cookie copiada a otra cuenta no vale', () => {
    const value = signDeviceCookie(SECRET, USER, DEVICE);
    expect(readDeviceCookie(SECRET, OTHER, value)).toBeUndefined();
  });

  it('con otro secreto del servidor no vale', () => {
    const value = signDeviceCookie(SECRET, USER, DEVICE);
    expect(readDeviceCookie('otro-secreto', USER, value)).toBeUndefined();
  });

  it('cambiar el dispositivo o la firma la invalida', () => {
    const value = signDeviceCookie(SECRET, USER, DEVICE);
    const [, mac] = value.split('.');
    expect(readDeviceCookie(SECRET, USER, `${OTHER}.${mac}`)).toBeUndefined();
    expect(
      readDeviceCookie(SECRET, USER, `${DEVICE}.${mac.slice(0, -2)}AA`),
    ).toBeUndefined();
  });

  it('lo que no tiene forma de cookie se ignora sin lanzar', () => {
    for (const value of [
      undefined,
      '',
      'sin-punto',
      'no-uuid.firma',
      'x'.repeat(500),
    ]) {
      expect(readDeviceCookie(SECRET, USER, value)).toBeUndefined();
    }
  });
});
