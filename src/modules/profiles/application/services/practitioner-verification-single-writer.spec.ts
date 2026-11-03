import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from '@jest/globals';

/**
 * Prueba arquitectónica (D-01): el estado de verificación del profesional
 * (`PRACT_VERIF_*`) y el sello público los escribe UN solo servicio, el
 * proyector. Cualquier otro archivo que asigne VERIFIED, REJECTED o
 * SUSPENDED/EXPIRED a la ficha reabre el hueco por donde un solo administrador
 * verificaba a un médico sin cuatro ojos.
 */
const SRC = join(process.cwd(), 'src');
const PROJECTOR = `modules${sep}profiles${sep}application${sep}services${sep}practitioner-verification-projector.service.ts`;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.ts$/.test(name) && !/\.(spec|testing|d)\.ts$/.test(name)
      ? [path]
      : [];
  });
}

describe('un solo escritor del estado de verificación del profesional', () => {
  const files = sources(SRC).map((path) => ({
    rel: relative(SRC, path),
    text: readFileSync(path, 'utf8'),
  }));

  const WRITES =
    /verificationStatusConceptId\s*(?:=(?!=)|:)\s*PROF\.PRACT_VERIF_(\w+)/g;

  it('sólo el proyector asigna un estado distinto de PENDING', () => {
    const offenders: string[] = [];
    for (const { rel, text } of files) {
      if (rel === PROJECTOR) continue;
      for (const match of text.matchAll(WRITES)) {
        // PENDING es el estado inicial del alta; no concede nada.
        if (match[1] !== 'PENDING') offenders.push(`${rel}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('el proyector sí existe y asigna VERIFIED (la regla no es vacua)', () => {
    const projector = files.find((f) => f.rel === PROJECTOR);
    expect(projector).toBeDefined();
    expect(projector!.text).toMatch(
      /verificationStatusConceptId\s*=\s*PROF\.PRACT_VERIF_VERIFIED/,
    );
  });

  it('ningún servicio llama a ensurePractitionerRole fuera del proyector', () => {
    const offenders = files
      .filter(
        (f) => f.rel !== PROJECTOR && /\.ensurePractitionerRole\(/.test(f.text),
      )
      .map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
});
