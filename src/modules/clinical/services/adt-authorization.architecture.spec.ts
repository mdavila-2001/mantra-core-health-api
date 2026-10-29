import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guardia de arquitectura: la autoridad sobre un paciente hospitalizado sale de su
 * ubicación **autoritativa** (cama activa o sede de espera), nunca de «alguna»
 * ubicación del encuentro. Una reserva o una fila cancelada la puede crear quien
 * sólo tiene alcance sobre una cama, y no por eso gana acceso al paciente.
 */
// Jest corre desde la raíz del repo; `import.meta` y `__dirname` no existen aquí.
const ROOT = join(process.cwd(), 'src', 'modules', 'clinical');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('autorización de la internacion · guardia de arquitectura', () => {
  const files = sources(ROOT).map((path) => ({
    path,
    text: readFileSync(path, 'utf8'),
  }));

  it('ningún código del módulo clinical usa «anyLocation» (ni algo equivalente) para autorizar', () => {
    const offenders = files
      .filter((f) => /\banyLocation\b|\blastLocation\b/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('los servicios de ADT no derivan el alcance de movements() ni de reservations()', () => {
    const offenders = files
      .filter((f) => /services\/(inpatient-|adt-)/.test(f.path))
      .filter((f) =>
        /forSpace\([^)]*(movements|reservations|own|r)\.careSpaceId/.test(
          f.text,
        ),
      )
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('la autoridad sobre el paciente se resuelve con forEncounter en las lecturas y operaciones del ADT', () => {
    const adt = files.find((f) => f.path.endsWith('inpatient-adt.service.ts'))!;
    const read = files.find((f) =>
      f.path.endsWith('inpatient-read.service.ts'),
    )!;
    expect(adt.text).toContain('forEncounter(');
    expect(read.text).toContain('forEncounter(');
  });
});
