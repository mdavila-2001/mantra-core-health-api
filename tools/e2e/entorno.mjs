/**
 * El guard de ambiente y el cliente HTTP que comparten el sembrador y sus
 * verificaciones.
 *
 * ## Por qué el guard vive acá y no dentro de cada script
 *
 * Porque un guard que hay que acordarse de llamar no es un guard. Importar este
 * módulo **ya no alcanza** para sembrar: hay que llamar a `exigirAmbienteE2E()`,
 * y los dos scripts lo hacen en su primera línea. Lo que sí se gana con tenerlo
 * en un solo lugar es que la regla se lea una vez y no diverja entre archivos:
 * el día que alguien agregue un tercer script, la misma función lo protege.
 *
 * ## Qué se protege, exactamente
 *
 * Que estos scripts no puedan correr contra la base de nadie más. Siembran
 * identidades con contraseña conocida, y una identidad con contraseña conocida
 * en una base real es una cuenta de acceso, no un dato de prueba.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '../..');

/**
 * Nombres de base que delatan un entorno que no es de pruebas.
 *
 * La lista es corta a propósito: la defensa fuerte es la de abajo —el nombre
 * **tiene** que contener `e2e` o `test`—, y ésta sólo agrega un mensaje claro
 * para el error más probable, que es copiar el `.env` de desarrollo.
 */
const NOMBRES_PROHIBIDOS = ['prod', 'produccion', 'production', 'live'];

/**
 * Lee `.env.e2e` sin depender de `dotenv`.
 *
 * El formato es el mínimo que el archivo usa: `CLAVE=valor`, comentarios con
 * `#` y líneas vacías. No interpreta comillas ni expansión de variables — si el
 * archivo empieza a necesitarlas, es señal de que dejó de ser un archivo de
 * entorno local y hay que discutirlo, no de que falte un parser.
 *
 * @returns Las variables leídas del archivo.
 */
export function leerEnvE2E() {
  const ruta = resolve(REPO, '.env.e2e');
  let crudo;
  try {
    crudo = readFileSync(ruta, 'utf8');
  } catch {
    throw new Error(
      `No existe ${ruta}. Copiá el ejemplo del paquete de carriles y completá los valores locales.`,
    );
  }

  const vars = {};
  for (const linea of crudo.split('\n')) {
    const limpia = linea.trim();
    if (limpia === '' || limpia.startsWith('#')) continue;
    const corte = limpia.indexOf('=');
    if (corte === -1) continue;
    vars[limpia.slice(0, corte)] = limpia.slice(corte + 1);
  }
  return vars;
}

/**
 * Aborta salvo que el entorno se declare de pruebas **y lo parezca**.
 *
 * Las tres condiciones son acumulativas y ninguna sobra:
 *
 * - `APP_ENV=e2e` es la declaración de intención.
 * - `ALLOW_E2E_SEED=true` es el segundo interruptor, para que la declaración no
 *   alcance por sí sola: un `.env` copiado trae la primera pero raramente las
 *   dos.
 * - El nombre de la base **tiene que contener `e2e` o `test`**. Es la única de
 *   las tres que no depende de lo que alguien escribió sobre el entorno, sino
 *   de a dónde apunta de verdad la conexión. Las otras dos describen una
 *   intención; ésta describe un destino.
 *
 * @param vars - Las variables ya leídas.
 * @returns Las mismas variables, una vez validadas.
 */
export function exigirAmbienteE2E(vars) {
  const problemas = [];

  if (vars.APP_ENV !== 'e2e') {
    problemas.push(`APP_ENV debe ser "e2e" y es "${vars.APP_ENV ?? '(ausente)'}"`);
  }
  if (vars.ALLOW_E2E_SEED !== 'true') {
    problemas.push('ALLOW_E2E_SEED debe ser "true"');
  }

  const base = (vars.DB_NAME ?? '').toLowerCase();
  if (base === '') {
    problemas.push('DB_NAME es obligatorio');
  } else if (!base.includes('e2e') && !base.includes('test')) {
    problemas.push(
      `DB_NAME="${vars.DB_NAME}" no contiene "e2e" ni "test": esta base no parece de pruebas`,
    );
  } else if (NOMBRES_PROHIBIDOS.some((p) => base.includes(p))) {
    problemas.push(`DB_NAME="${vars.DB_NAME}" tiene pinta de base productiva`);
  }

  if (problemas.length > 0) {
    console.error('\n  Los seeds E2E se niegan a correr en este entorno:\n');
    for (const p of problemas) console.error(`    · ${p}`);
    console.error('');
    process.exit(2);
  }

  return vars;
}

/** Los claims de un JWT, sin verificar la firma: acá sólo se leen datos propios. */
export function claims(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

/**
 * Un cliente de la API que **cuenta** lo que sale bien y lo que sale mal.
 *
 * Cada llamada declara qué status espera. Un status inesperado no lanza: se
 * registra y la corrida sigue, para que el resumen final diga todo lo que está
 * roto en vez del primer problema. Quien necesite cortar mira `.ok`.
 */
export function crearCliente(baseUrl) {
  const fallos = [];
  let ok = 0;

  async function llamar(nombre, method, path, opciones = {}) {
    const { body, token, espera = [200, 201] } = opciones;
    let res;
    let texto = '';
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      texto = await res.text();
    } catch (error) {
      fallos.push(`${nombre}: la petición no llegó (${error.message})`);
      console.log(`  FALLA  ---  ${method} ${path} — ${nombre}`);
      return { status: 0, body: null, ok: false };
    }

    let parsed = null;
    try {
      parsed = texto ? JSON.parse(texto) : null;
    } catch {
      parsed = texto;
    }

    const bien = espera.includes(res.status);
    if (bien) ok++;
    else {
      fallos.push(`${nombre}: esperaba ${espera.join('|')} y llegó ${res.status}`);
    }
    console.log(`  ${bien ? ' ok ' : 'FALLA'}  ${res.status}  ${method} ${path} — ${nombre}`);
    if (!bien) console.log('          ', JSON.stringify(parsed)?.slice(0, 300));
    return { status: res.status, body: parsed, ok: bien };
  }

  return {
    llamar,
    get fallos() {
      return fallos;
    },
    get exitos() {
      return ok;
    },
  };
}

/** La raíz del repositorio, para escribir el manifiesto donde corresponde. */
export const RAIZ_REPO = REPO;
