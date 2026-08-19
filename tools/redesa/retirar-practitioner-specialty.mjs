#!/usr/bin/env node
/**
 * Retira de una base ya sembrada la enumeración dinámica `practitioner-specialty`.
 *
 * ## Por qué hace falta un script
 *
 * La entrada salió de `DYNAMIC_ENUM_CATALOG`, pero el sembrador es **aditivo**:
 * compara por id determinista e inserta lo que falta, nunca borra. En una base que
 * ya la tiene, quitarla del código no cambia nada — el amarre sigue ACTIVO sobre
 * `profiles.practitioner_specialties.specialty_concept_id` y pedir el catálogo por
 * campo destino sigue devolviendo su única opción, que es exactamente F-19.
 *
 * Se retira por el caso de uso que existe para esto (UC-45-11) y no borrando filas
 * a mano: el retiro es gobernado —deja la definición en `ENUM_DEF_RETIRED`, sus
 * amarres deshabilitados y registro de quién y por qué—, y tocar la base por fuera
 * está prohibido.
 *
 * ## Qué NO hace
 *
 * El retiro es un borrado lógico: el conjunto de valores, su versión y su miembro
 * siguen existiendo en `terminology`, igual que el concepto `SPECIALTY_GENERAL`.
 * Quedan inertes —ningún código los consulta— y desaparecen solos cuando la base se
 * reconstruye desde cero.
 *
 * ## Uso
 *
 *   node tools/redesa/retirar-practitioner-specialty.mjs [--base-url http://localhost:3000]
 *
 * Es idempotente: si la enumeración ya no responde, sale sin hacer nada.
 */
import 'dotenv/config';

const CODIGO_ENUMERACION = 'practitioner-specialty';
const CAMPO_DESTINO = 'profiles.practitioner_specialties.specialty_concept_id';
const MOTIVO =
  'Duplicado de VS_MEDICAL_SPECIALTY: la columna la gobierna terminología (F-19).';

const args = process.argv.slice(2);
const indiceBaseUrl = args.indexOf('--base-url');
const BASE =
  indiceBaseUrl === -1
    ? (process.env.API_BASE_URL ?? 'http://localhost:3000')
    : args[indiceBaseUrl + 1];
const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@mantracore.health';
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

/** Una llamada a la API, con la respuesta ya leída para poder mostrarla. */
async function llamar(metodo, ruta, { token, body } = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const texto = await respuesta.text();
  let cuerpo = texto;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    // Una respuesta que no es JSON se muestra tal cual: suele ser el error útil.
  }
  return { status: respuesta.status, cuerpo };
}

/**
 * Devuelve el código de salida en vez de cortar con `process.exit`.
 *
 * Salir a mano en medio de una llamada aborta el socket que `fetch` todavía tiene
 * abierto, y en Windows eso revienta con un `Assertion failed` de libuv **después**
 * de haber impreso que todo salió bien: el mensaje diría «listo» y el código de
 * salida sería 127. Dejando terminar al proceso, el código dicho es el código real.
 */
async function main() {
  const sesion = await llamar('POST', '/iam/auth/login', {
    body: { email: EMAIL, password: PASSWORD },
  });
  if (sesion.status !== 200 && sesion.status !== 201) {
    console.error(
      `No se pudo iniciar sesión como ${EMAIL} (HTTP ${sesion.status}). ` +
        `Revisá BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD del .env.\n` +
        JSON.stringify(sesion.cuerpo),
    );
    return 1;
  }
  const token = sesion.cuerpo?.accessToken;

  const antes = await llamar(
    'GET',
    `/system-context/dynamic-enums?target=${encodeURIComponent(CAMPO_DESTINO)}`,
    { token },
  );
  if (antes.status === 404) {
    console.log(
      `Nada que retirar: ${CAMPO_DESTINO} ya no tiene enumeración dinámica (HTTP 404).`,
    );
    return 0;
  }
  if (antes.status !== 200) {
    console.error(
      `No se pudo leer la enumeración del campo (HTTP ${antes.status}).\n` +
        JSON.stringify(antes.cuerpo),
    );
    return 1;
  }

  // Se comprueba el código antes de retirar: si algún día el campo lo gobierna
  // otra enumeración, retirarla por venir de este script sería romper algo ajeno.
  if (antes.cuerpo.code !== CODIGO_ENUMERACION) {
    console.error(
      `El campo lo gobierna «${antes.cuerpo.code}», no «${CODIGO_ENUMERACION}». ` +
        `No se retira nada: revisá a mano qué pasó.`,
    );
    return 1;
  }

  const definitionId = antes.cuerpo.definitionId;
  console.log(
    `Encontrada: ${antes.cuerpo.code} (${definitionId}) con ` +
      `${antes.cuerpo.options.length} opción(es) sobre ${CAMPO_DESTINO}.`,
  );

  const retiro = await llamar(
    'POST',
    `/system-context/dynamic-enums/definitions/${definitionId}/retire`,
    { token, body: { reason: MOTIVO } },
  );
  console.log(
    `Retiro: HTTP ${retiro.status} · ${JSON.stringify(retiro.cuerpo)}`,
  );
  if (retiro.status !== 200) {
    console.error('El retiro falló.');
    return 1;
  }

  const despues = await llamar(
    'GET',
    `/system-context/dynamic-enums?target=${encodeURIComponent(CAMPO_DESTINO)}`,
    { token },
  );
  if (despues.status !== 404) {
    console.error(
      `El campo todavía responde con HTTP ${despues.status} — el retiro no surtió efecto.\n` +
        JSON.stringify(despues.cuerpo),
    );
    return 1;
  }
  console.log(
    `Listo: ${CAMPO_DESTINO} ya no tiene enumeración dinámica (HTTP 404).`,
  );
  return 0;
}

process.exitCode = await main();
