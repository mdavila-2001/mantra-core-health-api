import { describe, expect, it } from '@jest/globals';
import { describeBuild, loadBuildInfo } from './build-info';

describe('loadBuildInfo', () => {
  it('toma el commit y el momento de construcción del entorno', () => {
    const info = loadBuildInfo(
      {
        GIT_COMMIT: '57d283ea4d9228b8f243d70fe3fe43589930f434',
        BUILD_TIME: '2026-08-15T18:00:00Z',
        NODE_ENV: 'production',
      },
      '1.2.3',
    );

    expect(info).toEqual({
      version: '1.2.3',
      commit: '57d283ea4d9228b8f243d70fe3fe43589930f434',
      builtAt: '2026-08-15T18:00:00Z',
      nodeEnv: 'production',
    });
  });

  it('acepta SOURCE_COMMIT, que es lo que inyectan algunos registries', () => {
    expect(loadBuildInfo({ SOURCE_COMMIT: 'abc123' }, '0.0.0').commit).toBe(
      'abc123',
    );
  });

  it('prefiere GIT_COMMIT si vienen los dos', () => {
    const info = loadBuildInfo(
      { GIT_COMMIT: 'elbueno', SOURCE_COMMIT: 'elotro' },
      '0.0.0',
    );
    expect(info.commit).toBe('elbueno');
  });

  it('dice "desconocido" en vez de inventar un valor', () => {
    // Fuera de Docker no hay commit, y eso es información: lo que no puede
    // pasar es que el arranque afirme una versión que no es la que corre.
    const info = loadBuildInfo({}, '0.0.0');
    expect(info.commit).toBe('desconocido');
    expect(info.builtAt).toBe('desconocido');
    expect(info.nodeEnv).toBe('desconocido');
  });
});

describe('describeBuild', () => {
  it('acorta el commit como lo hace git log --oneline', () => {
    const linea = describeBuild({
      version: '1.2.3',
      commit: '57d283ea4d9228b8f243d70fe3fe43589930f434',
      builtAt: '2026-08-15T18:00:00Z',
      nodeEnv: 'production',
    });

    // Acortado para poder compararlo de un vistazo contra la salida de git.
    expect(linea).toContain('commit 57d283ea');
    expect(linea).not.toContain('4d9228b8');
    expect(linea).toContain('v1.2.3');
    expect(linea).toContain('entorno production');
  });

  it('no acorta el marcador de dato ausente', () => {
    const linea = describeBuild({
      version: 'desconocido',
      commit: 'desconocido',
      builtAt: 'desconocido',
      nodeEnv: 'development',
    });
    expect(linea).toContain('commit desconocido');
  });
});
