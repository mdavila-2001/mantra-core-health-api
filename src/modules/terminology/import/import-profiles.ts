import type { ImportProfile } from './row-contract';

/**
 * Largo máximo de un código y de un rótulo de concepto.
 *
 * Es el que ya declaraba el importador por línea antes de que existieran los
 * perfiles. Vive acá porque a partir de ahora el largo es una propiedad de la
 * columna y no del servicio: cada perfil declara los suyos y el validador los
 * lee del perfil, sin saber qué se está cargando.
 */
const MAX_SHORT_TEXT_LENGTH = 255;

/**
 * Prefijo reservado para datos de ejemplo.
 *
 * La plantilla que se descarga trae una fila de muestra, y esa fila termina
 * pegada en archivos reales cuando alguien la completa sin borrarla. El prefijo
 * la hace reconocible de un vistazo y la deja fuera de cualquier catálogo que
 * se tome en serio.
 */
const SYNTHETIC_PREFIX = 'ZZ-';

/**
 * Qué columnas se esperan para cargar conceptos.
 *
 * Los alias existen porque las planillas reales llegan con los encabezados en
 * castellano, escritos por quien arma el catálogo y no por quien programó el
 * importador. Rechazar «Código» por no decir `code` sería pedirle a esa persona
 * que hable el idioma de la base.
 */
const CONCEPTS: ImportProfile = {
  id: 'conceptos',
  columnas: [
    {
      nombre: 'code',
      alias: ['código', 'codigo', 'clave'],
      obligatoria: true,
      maxLargo: MAX_SHORT_TEXT_LENGTH,
    },
    {
      nombre: 'display',
      alias: ['nombre', 'término', 'termino', 'etiqueta'],
      obligatoria: true,
      maxLargo: MAX_SHORT_TEXT_LENGTH,
    },
    {
      nombre: 'definition',
      alias: ['definición', 'definicion', 'descripción', 'descripcion'],
      obligatoria: false,
    },
  ],
  ejemplo: {
    code: `${SYNTHETIC_PREFIX}000`,
    display: 'Ejemplo sintético',
    definition: 'Fila de ejemplo de la plantilla',
  },
};

/**
 * Los perfiles de importación disponibles, por identificador.
 *
 * Es una lista cerrada a propósito: un perfil desconocido es un error del
 * contrato y no algo que se resuelva adivinando columnas.
 */
export const IMPORT_PROFILES: Record<ImportProfile['id'], ImportProfile> = {
  conceptos: CONCEPTS,
  // El perfil de designaciones se suma cuando se confirme que su entidad, su
  // DTO y su repositorio existen; hasta entonces declararlo sería prometer una
  // carga que no tiene dónde escribir.
} as Record<ImportProfile['id'], ImportProfile>;

/**
 * Normaliza un encabezado para compararlo con el nombre y los alias.
 *
 * Recorta los espacios laterales y baja a minúsculas. **Las tildes se
 * conservan**: son parte del alias, no ruido, y quitarlas obligaría a decidir
 * si «definicion» y «definición» son la misma columna cuando el perfil ya
 * declara las dos.
 *
 * @param header - El texto tal como vino en el archivo.
 * @returns El texto comparable.
 */
export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

/**
 * Resuelve a qué columna del perfil corresponde un encabezado del archivo.
 *
 * @param profile - El perfil con el que se está cargando.
 * @param header - El encabezado leído del archivo.
 * @returns El nombre canónico de la columna, o `undefined` si no se reconoce.
 */
export function resolverColumn(
  profile: ImportProfile,
  header: string,
): string | undefined {
  const searched = normalizeHeader(header);
  const column = profile.columnas.find(
    (candidate) =>
      normalizeHeader(candidate.nombre) === searched ||
      candidate.alias.some((alias) => normalizeHeader(alias) === searched),
  );
  return column?.nombre;
}
