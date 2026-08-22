import type { EntityManager } from '@mikro-orm/postgresql';
import { HealthPractitionerProfiles, Persons } from '../entities';
import { composePersonDisplayName } from '../person-name';

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
 * ## El salto
 *
 * El nombre no está en el perfil profesional: `health_practitioner_profiles.profile_id`
 * referencia **directamente** a `profiles.persons(id)` —lo dice la FK y lo
 * repiten los dos caminos de alta—, y es la persona la que guarda cómo se
 * llama. La versión anterior pasaba por `person_profiles` suponiendo PK
 * compartida con `persons`; medido contra la base: 0 de 14 filas la comparten,
 * así que ese salto no resolvía un solo nombre — ni siquiera para los
 * profesionales sembrados.
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

  const practitioners = await em.find(
    HealthPractitionerProfiles,
    { profileId: { $in: [...profileIds] } },
    { fields: ['profileId'] },
  );
  if (practitioners.length === 0) return new Map();

  const personas = await em.find(Persons, {
    id: { $in: practitioners.map((row) => row.profileId) },
  });

  const resultado = new Map<string, string>();
  for (const persona of personas) {
    const nombre = nombreDe(persona);
    if (nombre !== undefined) resultado.set(persona.id, nombre);
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
  return composePersonDisplayName(persona);
}
