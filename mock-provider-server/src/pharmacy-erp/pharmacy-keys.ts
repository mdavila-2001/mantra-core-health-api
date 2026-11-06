import { readFileSync } from 'node:fs';

/**
 * Claves de las farmacias simuladas: código de farmacia → clave.
 *
 * Una farmacia de verdad le da a la plataforma una clave propia; el simulador
 * hace lo mismo, así que cambiar la clave en el formulario de la plataforma
 * deja de funcionar (401) igual que con un tercero real.
 *
 * Se leen de dos lugares, y el segundo pisa al primero por código:
 *   - `PHARMACY_ERP_PHARMACY_KEYS_FILE`: ruta a un JSON `{ "<código>": "<clave>" }`
 *     (la semilla del simulador; ver `pharmacy-keys.example.json`);
 *   - `PHARMACY_ERP_PHARMACY_KEYS`: `CODIGO=clave;OTRO=clave2`.
 *
 * Vacías por defecto: sin claves, ninguna farmacia autentica en los formatos
 * por farmacia, que es lo que haría un tercero que todavía no dio de alta a nadie.
 */
export type PharmacyKeys = Readonly<Record<string, string>>;

export function parsePharmacyKeys(
  inline: string | undefined,
  filePath: string | undefined,
  readFile: (path: string) => string = (path) => readFileSync(path, 'utf8'),
): PharmacyKeys {
  const keys: Record<string, string> = {};
  const file = filePath?.trim() ?? '';
  if (file !== '') {
    const parsed: unknown = JSON.parse(readFile(file));
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        'PHARMACY_ERP_PHARMACY_KEYS_FILE debe ser un objeto { código: clave }',
      );
    }
    for (const [code, key] of Object.entries(parsed)) {
      addKey(keys, code, key);
    }
  }
  for (const pair of (inline ?? '').split(';')) {
    if (pair.trim() === '') continue;
    const at = pair.indexOf('=');
    if (at <= 0) {
      throw new Error(
        'PHARMACY_ERP_PHARMACY_KEYS espera CODIGO=clave;OTRO=clave',
      );
    }
    addKey(keys, pair.slice(0, at), pair.slice(at + 1));
  }
  return keys;
}

function addKey(
  keys: Record<string, string>,
  rawCode: string,
  rawKey: unknown,
): void {
  const code = rawCode.trim();
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (code === '' || key === '') {
    throw new Error(`Clave de farmacia vacía o inválida para «${rawCode}»`);
  }
  keys[code] = key;
}
