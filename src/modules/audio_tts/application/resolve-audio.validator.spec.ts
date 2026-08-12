import { parseResolveAudioRequest } from './resolve-audio.validator';
import { AUDIO_ERROR } from '../domain/audio.errors';

/**
 * Este validador cubre el camino que la `ValidationPipe` global no ve: otros
 * módulos llaman `AudioAssetResolver.resolve()` por inyección, no por HTTP.
 */
describe('parseResolveAudioRequest', () => {
  it('acepta una solicitud mínima', () => {
    expect(
      parseResolveAudioRequest({ templateCode: 'onboarding.welcome.named' }),
    ).toEqual({ templateCode: 'onboarding.welcome.named' });
  });

  it('conserva solo los campos reconocidos', () => {
    // Igual que `whitelist: true` en la tubería HTTP.
    expect(
      parseResolveAudioRequest({
        templateCode: 'a.b',
        variables: { name: 'María' },
        actorId: 'actor-1',
        language: 'es-419',
        correlationId: 'corr-1',
        sobrante: 'x',
      }),
    ).toEqual({
      templateCode: 'a.b',
      variables: { name: 'María' },
      actorId: 'actor-1',
      language: 'es-419',
      correlationId: 'corr-1',
    });
  });

  it.each([
    ['', 'requerido'],
    ['MAYUSCULAS', 'formato'],
    ['.empieza-con-punto', 'formato'],
    ['con espacio', 'formato'],
  ])('rechaza el código de plantilla %p', (templateCode) => {
    expect(() => parseResolveAudioRequest({ templateCode })).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.requestInvalid }),
    );
  });

  it('rechaza un código de plantilla más largo que su columna', () => {
    // Sin esto llegaría hasta una columna varchar(160) y el fallo sería un error
    // crudo de PostgreSQL en mitad de un onboarding.
    expect(() =>
      parseResolveAudioRequest({ templateCode: `a.${'b'.repeat(200)}` }),
    ).toThrow(/templateCode/);
  });

  it('rechaza una entrada que no es un objeto', () => {
    for (const input of [null, undefined, 'texto', 42, []]) {
      expect(() => parseResolveAudioRequest(input)).toThrow(
        expect.objectContaining({ audioCode: AUDIO_ERROR.requestInvalid }),
      );
    }
  });

  it('descarta un objeto de variables vacío', () => {
    expect(
      parseResolveAudioRequest({ templateCode: 'a', variables: {} }),
    ).toEqual({
      templateCode: 'a',
    });
  });

  it('rechaza nombres de variable inválidos y valores no textuales', () => {
    expect(() =>
      parseResolveAudioRequest({
        templateCode: 'a',
        variables: { 'no válido': 'x' },
      }),
    ).toThrow(/nombre inválido/);
    expect(() =>
      parseResolveAudioRequest({
        templateCode: 'a',
        variables: { name: 42 } as any,
      }),
    ).toThrow(/debe ser una cadena/);
  });

  it('rechaza más de 16 variables y valores demasiado largos', () => {
    const many = Object.fromEntries(
      Array.from({ length: 17 }, (_, i) => [`v${i}`, 'x']),
    );
    expect(() =>
      parseResolveAudioRequest({ templateCode: 'a', variables: many }),
    ).toThrow(/máximo 16/);
    expect(() =>
      parseResolveAudioRequest({
        templateCode: 'a',
        variables: { name: 'x'.repeat(201) },
      }),
    ).toThrow(/máximo 200/);
  });

  it('rechaza una etiqueta de idioma mal formada', () => {
    expect(() =>
      parseResolveAudioRequest({ templateCode: 'a', language: 'castellano!' }),
    ).toThrow(/idioma/);
    expect(
      parseResolveAudioRequest({ templateCode: 'a', language: 'pt-BR' }),
    ).toMatchObject({ language: 'pt-BR' });
  });

  it('trata la cadena vacía como campo ausente', () => {
    expect(
      parseResolveAudioRequest({
        templateCode: 'a',
        actorId: '',
        correlationId: '',
      }),
    ).toEqual({ templateCode: 'a' });
  });

  it('acumula todos los problemas en un solo error', () => {
    let message = '';
    try {
      parseResolveAudioRequest({ templateCode: 'MAL', language: '???' });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/templateCode/);
    expect(message).toMatch(/language/);
  });
});
