import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guardia de arquitectura (F5d): todo caso de uso del catálogo que ESCRIBE plantillas, franjas,
 * excepciones o turnos tiene que pasar por la guardia de espacio, para que ninguna vía hermana
 * (editar, retirar, reactivar, correr turnos, bloquear…) se salte la autoridad sobre el
 * consultorio que sí exige publicar un horario.
 *
 * - `assertResourceInActiveTenant`: el recurso es del tenant del contexto (404 uniforme).
 * - `assertMayManageBound` (o `attach`, que lo incluye): autoridad sobre el espacio al que el
 *   horario ya está atado, o sobre el nuevo.
 *
 * Un caso de uso que escribe y no figura en la lista de excepciones debe llevar las dos; la lista
 * de excepciones es explícita y cada entrada dice por qué no aplica.
 */
const USE_CASES = join(
  process.cwd(),
  'src',
  'modules',
  'scheduling',
  'application',
  'catalog',
  'use-cases',
);

/** Lo que cuenta como «escribir» agenda: métodos de escritura del repositorio y la edición de turnos. */
const WRITES =
  /catalogRepo\.(create|delete|retire|reactivate|remove|update|close)\w*\(|catalogRepo\.findSlots\w*ForUpdate\(|\b(slot|exception|template)\.\w+\s*=[^=]/;

/** Escriben, pero no horarios, excepciones ni turnos de un espacio. */
const NOT_SPACE_WRITERS: Readonly<Record<string, string>> = {
  'create-resource.use-case.ts':
    'crea el recurso agendable; su espacio lo valida SpaceResourceLinker / EquipmentResourceLinker al ligarlo',
  'create-booking-policy.use-case.ts':
    'la política de reserva no es un horario ni ocupa un espacio',
};

const files = readdirSync(USE_CASES)
  .filter((name) => name.endsWith('.use-case.ts'))
  .map((name) => ({
    name,
    text: readFileSync(join(USE_CASES, name), 'utf8'),
  }));
const writers = files.filter(
  (f) => WRITES.test(f.text) && !(f.name in NOT_SPACE_WRITERS),
);

describe('agenda por espacio · toda vía que escribe pasa por la guardia de espacio', () => {
  it('hay casos de uso que escriben (la guardia no pasa por vacío)', () => {
    expect(writers.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        'create-template.use-case.ts',
        'update-template.use-case.ts',
        'retire-template.use-case.ts',
        'reactivate-template.use-case.ts',
        'generate-slots.use-case.ts',
        'shift-slots.use-case.ts',
        'close-slots.use-case.ts',
        'create-exception.use-case.ts',
        'update-exception.use-case.ts',
        'remove-exception.use-case.ts',
      ]),
    );
  });

  it.each(writers.map((f) => [f.name, f.text]))(
    '%s comprueba el tenant del recurso',
    (_name, text) => {
      expect(text).toContain('careSpaces.assertResourceInActiveTenant(');
    },
  );

  it.each(writers.map((f) => [f.name, f.text]))(
    '%s exige autoridad sobre el espacio antes de escribir',
    (_name, text) => {
      expect(text).toMatch(/careSpaces\.(assertMayManageBound|attach)\(/);
      // La autoridad va antes de la primera escritura.
      const authority = text.search(
        /careSpaces\.(assertMayManageBound|attach)\(/,
      );
      const firstWrite = text.search(WRITES);
      expect(authority).toBeGreaterThan(-1);
      expect(authority).toBeLessThan(firstWrite);
    },
  );

  it('las excepciones a la regla están justificadas y siguen existiendo', () => {
    for (const [name, reason] of Object.entries(NOT_SPACE_WRITERS)) {
      expect(files.map((f) => f.name)).toContain(name);
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('las lecturas que devuelven datos de pacientes también comprueban el tenant', () => {
    const live = files.find(
      (f) => f.name === 'list-template-live-bookings.use-case.ts',
    )!;
    expect(live.text).toContain('careSpaces.assertResourceInActiveTenant(');
  });
});
