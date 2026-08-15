import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthPractitionerProfiles,
  PersonProfiles,
  Persons,
} from '../entities';

/**
 * Nombre legible de un lote de perfiles profesionales.
 *
 * ## Por qué es una función y no un servicio inyectable
 *
 * La necesitan módulos que **no importan** `ProfilesModule` —`practice` para su
 * plantilla (C13) y `diagnostic_units` para el personal del laboratorio
 * (C16)—, y hacerlos importarlo para resolver un nombre abriría dependencias
 * entre módulos que hoy no existen, con riesgo de ciclo. Una función pura sobre
 * el `EntityManager` que el llamador ya tiene resuelve lo mismo sin tocar el
 * grafo de inyección, y evita que cada módulo escriba su propia versión de los
 * dos saltos.
 *
 * ## Los dos saltos
 *
 * El nombre no está en el perfil profesional: `health_practitioner_profiles`
 * comparte PK con `person_profiles`, que apunta a la persona, y es
 * `profiles.persons` la que guarda cómo se llama.
 *
 * @param em - Contexto de persistencia o transacción activa.
 * @param profileIds - Perfiles profesionales consultados.
 * @returns `profileId` → nombre, **sin** las entradas que no lo tienen: la
 *   ausencia es un estado real que quien consume debe poder distinguir.
 */
export async function findPractitionerNames(
  em: EntityManager,
  profileIds: readonly string[],
): Promise<Map<string, string>> {
  if (profileIds.length === 0) return new Map();

  const practitioners = await em.find(HealthPractitionerProfiles, {
    profileId: { $in: [...profileIds] },
  });
  if (practitioners.length === 0) return new Map();

  const perfiles = await em.find(PersonProfiles, {
    id: { $in: practitioners.map((row) => row.profileId) },
  });
  if (perfiles.length === 0) return new Map();

  const personas = await em.find(Persons, {
    id: { $in: perfiles.map((row) => row.personId) },
  });
  const nombrePorPersona = new Map(
    personas.map((persona) => [persona.id, nombreDe(persona)]),
  );

  const resultado = new Map<string, string>();
  for (const perfil of perfiles) {
    const nombre = nombrePorPersona.get(perfil.personId);
    if (nombre !== undefined) resultado.set(perfil.id, nombre);
  }
  return resultado;
}

/**
 * El nombre declarado para mostrar, o el compuesto a partir de sus piezas.
 *
 * Devuelve `undefined` —y no una cadena vacía— cuando no hay ninguna pieza:
 * quien lo consume decide qué decir en ese caso, y una cadena vacía se
 * confundiría con un nombre en blanco.
 */
function nombreDe(persona: Persons): string | undefined {
  if (persona.displayName !== undefined && persona.displayName !== '') {
    return persona.displayName;
  }
  const compuesto = [persona.name, persona.lastName, persona.motherLastName]
    .filter((parte): parte is string => parte !== undefined && parte !== '')
    .join(' ');
  return compuesto === '' ? undefined : compuesto;
}
