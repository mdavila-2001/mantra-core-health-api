import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
export const fx = (name) => JSON.parse(readFileSync(join(FX, name), 'utf8'));

/** Marcador SINTÉTICO (no es contenido médico) que se inyecta como «sección 4.2» para comprobar que nunca sale. */
export const POSOLOGY_MARKER = 'MARCADOR-SINTETICO-4.2-NO-DEBE-SALIR';

/** Respuesta sintética de la API con una sección 4.2 de relleno (solo para probar la lista blanca). */
export const fakePosologyResponse = () => [
  { seccion: '4.2', titulo: 'Posología y forma de administración', contenido: `<p>${POSOLOGY_MARKER} Tomar 500 mg cada 8 horas.</p>`, orden: 1 },
];
