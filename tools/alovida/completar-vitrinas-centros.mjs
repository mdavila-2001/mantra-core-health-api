#!/usr/bin/env node
/**
 * completar-vitrinas-centros.mjs — Le pone cara a los centros de salud que ya
 * están en el directorio público: portada, logo, titular y presentación.
 *
 * ## El problema que resuelve
 *
 * `seed-vitrina-publica.mjs` crea las organizaciones y las verifica, y la
 * verificación proyecta su vitrina pública con **el nombre y el slug, nada
 * más** — es todo lo que sabe `DirectoryTenantsService.verify()`. Hasta ahora
 * no había forma de completarla: la vitrina de un profesional se edita por
 * `PUT /community/profiles/me`, que resuelve el sujeto desde la sesión, y el
 * sujeto de una organización es su tenant, que ninguna sesión «es».
 *
 * El resultado se veía entero en el buscador: cuarenta y seis centros de salud
 * sin una foto, sin una línea que dijera qué eran, la mitad repetidos, y todas
 * las tarjetas idénticas. No era un problema de la pantalla — no había nada
 * que pintar. Esta corrida lo llena, usando el endpoint que se agregó para eso
 * (`PUT /admin/tenants/:tenantId/public-profile`).
 *
 * ## Por qué llega por el slug y no listando tenants
 *
 * La vitrina de una organización se proyecta con `slug = organization-<tenantId>`,
 * así que el buscador público ya dice, para cada ficha visible, a qué tenant
 * hay que escribirle. Recorrer `/public/search/organizations` tiene además la
 * propiedad correcta: toca **exactamente lo que se ve** y nada más.
 *
 * ## Las sedes repetidas
 *
 * Cada corrida del seeder de vitrina agrega otra tanda, así que el directorio
 * quedó con ocho «Clínica del Sur». Ocho tarjetas iguales se leen como un
 * defecto de la lista, no como ocho sedes. A cada repetición se le asigna una
 * sede distinta del catálogo —barrio y dirección reales de la ciudad que ya
 * tenía cargada—, que es lo que en realidad son: sucursales de la misma red.
 * No se borra ni se suspende ningún tenant.
 *
 * Las fotos son marcadores de `picsum.photos`, deterministas por nombre de
 * sede: la corrida es repetible y dos sedes distintas no comparten portada.
 *
 * ## Uso
 *
 *   node tools/alovida/completar-vitrinas-centros.mjs
 *   node tools/alovida/completar-vitrinas-centros.mjs --base-url http://localhost:3011
 *   node tools/alovida/completar-vitrinas-centros.mjs --sin-imagenes
 *   node tools/alovida/completar-vitrinas-centros.mjs --rehacer   (pisa las ya completas)
 *
 * No es un mock: escribe por la API real, con sus guards y validaciones.
 */

import { Buffer } from 'node:buffer';

/* ── Argumentos y entorno ───────────────────────────────────────────────── */

function arg(nombre, porOmision) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : porOmision;
}

function flag(nombre) {
  return process.argv.includes(`--${nombre}`);
}

const BASE = arg('base-url', process.env.API_BASE_URL ?? 'http://localhost:3000');
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';
const SIN_IMAGENES = flag('sin-imagenes');
const REHACER = flag('rehacer');

if (process.env.NODE_ENV === 'production' && !flag('force')) {
  console.error(
    'NODE_ENV=production: esta corrida escribe textos y fotos ficticias.\n' +
      'Si de verdad es lo que querés, repetila con --force.',
  );
  process.exit(1);
}

let token = null;
const resumen = { vistas: 0, completadas: 0, salteadas: 0, fallidas: 0, fotos: 0 };

function paso(mensaje) {
  process.stdout.write(`${mensaje}\n`);
}

async function json(metodo, ruta, cuerpo) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  let body = null;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    body = texto;
  }
  return { ok: res.status >= 200 && res.status < 300, status: res.status, body };
}

function slugificar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ── Las fotos ──────────────────────────────────────────────────────────── */

const cacheDescargas = new Map();

async function bajar(url) {
  if (cacheDescargas.has(url)) return cacheDescargas.get(url);
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    // Una respuesta minúscula suele ser una página de error, no una foto.
    if (buf.length < 512) throw new Error('respuesta demasiado corta');
    cacheDescargas.set(url, buf);
    return buf;
  } catch (error) {
    paso(`    ⚠ no se pudo bajar la foto (${error.message})`);
    cacheDescargas.set(url, null);
    return null;
  }
}

/**
 * Sube unos bytes y devuelve el id del archivo.
 *
 * `sensitivity: NORMAL` no es decorativo: es la condición para que
 * `GET /public/media/:id` pueda servir la foto a alguien sin sesión, que es
 * todo el punto de una portada pública.
 */
async function subir(buffer, nombre) {
  if (!buffer) return null;
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/jpeg' }), nombre);
  form.append('category', 'IMAGE');
  form.append('sensitivity', 'NORMAL');
  try {
    const res = await fetch(`${BASE}/common/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!(res.status >= 200 && res.status < 300)) {
      paso(`    ⚠ la subida de ${nombre} devolvió ${res.status}`);
      return null;
    }
    const body = await res.json();
    resumen.fotos += 1;
    return body?.id ?? null;
  } catch (error) {
    paso(`    ⚠ no se pudo subir ${nombre} (${error.message})`);
    return null;
  }
}

/** Foto determinista por semilla: la misma sede cae siempre en la misma foto. */
async function foto(semilla, ancho, alto, nombre) {
  if (SIN_IMAGENES) return null;
  const url = `https://picsum.photos/seed/${encodeURIComponent(semilla)}/${ancho}/${alto}`;
  return subir(await bajar(url), nombre);
}

/* ── El catálogo ────────────────────────────────────────────────────────────
 *
 * Un texto por organización, escrito como lo escribiría quien la administra.
 * Importa más de lo que parece: con «lorem ipsum» no se puede juzgar si el
 * ancho de lectura, el recorte de la tarjeta o la jerarquía tipográfica
 * funcionan, que es justamente para lo que se mira una pantalla sembrada.
 *
 * `sedes` distingue las repeticiones: la primera «Clínica del Sur» es la casa
 * matriz y las siguientes toman la sede que sigue en la lista.                */

const CATALOGO = {
  'Clínica del Sur': {
    titular: 'Clínica general con emergencias las 24 horas',
    tema: 'hospital building',
    presentacion:
      'Abrimos en 1998 en Obrajes con seis consultorios y una sala de partos. Hoy atendemos consulta externa, internación, cirugía programada y emergencias las 24 horas, con laboratorio e imagenología en el mismo edificio.\n\nNuestro compromiso: ninguna urgencia se rechaza por falta de cobertura. La atención se estabiliza primero y se administra después.',
    sedes: [
      'Obrajes',
      'Calacoto',
      'San Miguel',
      'Sopocachi',
      'Miraflores',
      'Achumani',
      'Irpavi',
      'Los Pinos',
    ],
  },
  'Hospital Santa María': {
    titular: 'Hospital de tercer nivel · terapia intensiva y maternidad',
    tema: 'hospital corridor',
    presentacion:
      'Somos un hospital de tercer nivel con 180 camas, terapia intensiva de adultos y neonatal, y un bloque quirúrgico de seis quirófanos.\n\nRecibimos derivaciones de toda la zona norte de Santa Cruz. La maternidad y la guardia funcionan sin interrupción todos los días del año.',
    sedes: [
      'Cuarto Anillo',
      'Equipetrol',
      'Plan Tres Mil',
      'Villa 1ro de Mayo',
      'Urubó',
      'Radial 26',
      'Los Lotes',
      'El Bajío',
    ],
  },
  'Centro Médico Sopocachi': {
    titular: 'Consulta externa en 14 especialidades, con turno el mismo día',
    tema: 'medical clinic waiting room',
    presentacion:
      'Un centro de consulta externa pensado para resolver en una sola visita: la consulta, el laboratorio y la ecografía están en el mismo piso, y el resultado se entrega el mismo día en los estudios de rutina.\n\nNo tenemos internación. Cuando algo requiere hospitalización, derivamos con el informe completo y coordinamos el traslado.',
    sedes: [
      'Sopocachi',
      'San Pedro',
      'Miraflores',
      'Villa Fátima',
      'El Prado',
      'Alto Obrajes',
      'Cota Cota',
      'Següencoma',
    ],
  },
  'Laboratorio Bioclínico Andino': {
    titular: 'Laboratorio clínico · resultados en línea en 24 horas',
    tema: 'laboratory microscope',
    presentacion:
      'Análisis clínicos, microbiología y pruebas hormonales, con toma de muestra sin turno de 06:30 a 11:00 y resultados en línea en 24 horas para la mayoría de los estudios.\n\nTrabajamos con derivación de médicos de toda la ciudad y con las principales aseguradoras del país.',
    sedes: [
      'Av. Arce',
      'Sopocachi',
      'Miraflores',
      'Calacoto',
      'San Miguel',
      'Obrajes',
      'El Prado',
      'Villa Fátima',
    ],
  },
  'Laboratorio Central Cochabamba': {
    titular: 'Laboratorio de referencia · toma de muestra a domicilio',
    tema: 'laboratory samples',
    presentacion:
      'Laboratorio de referencia en el valle, con toma de muestra a domicilio en la mancha urbana de Cochabamba y entrega digital de resultados.\n\nHacemos las pruebas de rutina, el perfil metabólico completo y los estudios de coagulación; lo que no procesamos acá se deriva a la red y se avisa el plazo real, no el optimista.',
    sedes: ['Av. Ayacucho', 'Cala Cala', 'Queru Queru', 'Sacaba', 'Tiquipaya', 'El Prado'],
  },
  'Farmacia Chuquiago': {
    titular: 'Farmacia de turno · atención las 24 horas',
    tema: 'pharmacy shelves',
    presentacion:
      'Farmacia de barrio con turno nocturno rotativo y entrega a domicilio en la zona sur. Tenemos el listado de medicamentos esenciales completo y receta electrónica.',
    sedes: ['6 de Agosto', 'San Pedro', 'Miraflores', 'Villa Fátima', 'Obrajes'],
  },
  'Farmacia Vida Plena': {
    titular: 'Farmacia con delivery en el día',
    tema: 'pharmacy counter',
    presentacion:
      'Medicamentos, insumos y control de presión sin costo. Delivery en el día dentro del cuarto anillo y convenio con las principales aseguradoras.',
    sedes: ['Cristo Redentor', 'Equipetrol', 'Plan Tres Mil', 'Radial 17', 'El Trompillo'],
  },
};

/**
 * Copia genérica, por si aparece una organización que el catálogo no nombra.
 *
 * Deliberadamente sobria y **verdadera para cualquier prestador**: es preferible
 * una línea honesta y corta a inventarle especialidades a un centro del que no
 * sabemos nada.
 */
function generico(nombre) {
  const esFarmacia = /farmacia|farmacorp/i.test(nombre);
  const esLaboratorio = /laboratorio|bioclínic|bioclinic/i.test(nombre);
  if (esFarmacia)
    return {
      titular: 'Farmacia',
      tema: 'pharmacy',
      presentacion:
        'Dispensación de medicamentos con receta y venta libre. Los horarios y el turno se publican en esta ficha.',
      sedes: [],
    };
  if (esLaboratorio)
    return {
      titular: 'Laboratorio de análisis clínicos',
      tema: 'laboratory',
      presentacion:
        'Toma de muestra y análisis clínicos. Los estudios disponibles y los plazos de entrega se publican en esta ficha.',
      sedes: [],
    };
  return {
    titular: 'Centro de salud',
    tema: 'clinic',
    presentacion:
      'Atención médica ambulatoria. Las especialidades, los horarios y los convenios se publican en esta ficha.',
    sedes: [],
  };
}

/* ── La corrida ─────────────────────────────────────────────────────────── */

async function entrarComoAdmin() {
  paso('· Entrando como administrador de arranque…');
  const { ok, body } = await json('POST', '/iam/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!ok || !body?.accessToken) {
    throw new Error(
      `No se pudo entrar como ${ADMIN_EMAIL} en ${BASE}. ¿Está levantada la API con BOOTSTRAP_ADMIN_*?`,
    );
  }
  token = body.accessToken;
}

/** Todas las fichas visibles del vertical, siguiendo el cursor hasta el final. */
async function fichasPublicas() {
  const todas = [];
  let cursor = null;
  do {
    const ruta = `/public/search/organizations?limit=50${
      cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
    }`;
    const { ok, body, status } = await json('GET', ruta);
    if (!ok) throw new Error(`El buscador público respondió ${status}`);
    todas.push(...(body?.items ?? []));
    cursor = body?.nextCursor ?? null;
  } while (cursor);
  return todas;
}

/**
 * El tenant al que pertenece una ficha.
 *
 * La verificación proyecta la vitrina con `slug = organization-<tenantId>`; si
 * eso cambiara, esto devuelve `null` y la corrida saltea la ficha en vez de
 * escribirle a un uuid inventado.
 */
function tenantDe(slug) {
  const m = /^organization-([0-9a-f-]{36})$/i.exec(slug);
  return m ? m[1] : null;
}

/**
 * El tenant de una ficha cuyo slug **no** lo lleva.
 *
 * `seed-farmacias-marketplace.mjs` publica sus vitrinas con un slug legible
 * (`farmacia-sopocachi`) en vez del `organization-<uuid>` que escribe la
 * verificación, así que para esas ocho el slug no dice a quién escribirle.
 * Se resuelven por nombre contra `/admin/tenants`, que es la única otra vía, y
 * **sólo con coincidencia exacta**: un `LIKE` que devuelve la organización
 * equivocada le escribiría la presentación de una clínica a otra.
 *
 * Devuelve `null` si no hay exactamente una candidata, y quien llama saltea la
 * ficha en vez de adivinar.
 */
async function tenantPorNombre(nombre) {
  const { ok, body } = await json(
    'GET',
    `/admin/tenants?q=${encodeURIComponent(nombre)}&limit=10`,
  );
  if (!ok) return null;
  const exactas = (body?.items ?? []).filter(
    (t) => t.tradeName === nombre || t.legalName === nombre,
  );
  return exactas.length === 1 ? exactas[0].id : null;
}

/**
 * Le escribe a la sede su propia dirección.
 *
 * ## Por qué hace falta
 *
 * Las ocho «Clínica del Sur» comparten la dirección que sembró
 * `seed-vitrina-publica.mjs`, porque se sembró una vez por organización y no
 * por sede. En una grilla eso se ve peor que un hueco: ocho tarjetas con foto
 * distinta, nombre distinto y **la misma calle** se leen como un error de
 * carga, y el mapa dibuja los ocho pines uno encima de otro.
 *
 * Escribe una fila nueva en vez de editar la vieja: `locationsByOwner` toma la
 * más reciente por sujeto (`DISTINCT ON ... ORDER BY valid_from DESC`), así que
 * la nueva gana sin borrar el histórico, que es lo que una dirección es —algo
 * que cambia con el tiempo, no algo que se pisa—.
 *
 * Idempotente: si la dirección vigente ya nombra la sede, no escribe nada.
 */
async function direccionDeSede(ficha, tenantId, sede, indice) {
  if (!sede) return;
  // La sede a secas, sin arrastrar la calle de la casa matriz. Pegarlas daba
  // «Calle Rosendo Gutiérrez 574, Sopocachi — sede Alto Obrajes»: dos barrios
  // distintos en una misma dirección, que es una contradicción, no un dato. La
  // calle de cada sucursal no la sabemos, y el barrio sí: eso es lo que se
  // escribe, y es lo que un directorio de lugares muestra junto a la ciudad.
  const linea = `Sede ${sede}`;
  if (ficha.address === linea) return;

  // El punto se corre unos cientos de metros por sede, determinístico por
  // índice: sin esto el mapa apila todos los pines en la misma coordenada y
  // deja de distinguir una sede de otra, que es justo para lo que se mira.
  const base = ficha.location;
  const punto = base
    ? {
        latitude: Number((base.lat + (((indice * 7) % 11) - 5) * 0.004).toFixed(6)),
        longitude: Number((base.lng + (((indice * 5) % 9) - 4) * 0.004).toFixed(6)),
      }
    : {};

  const { ok, status } = await json('POST', '/common/addresses', {
    ownerType: 'TENANT',
    ownerId: tenantId,
    lines: [linea],
    city: ficha.city ?? undefined,
    ...punto,
  });
  if (!ok) paso(`    ⚠ la dirección de la sede ${sede} devolvió ${status}`);
}

async function completar(ficha, sedeAsignada) {
  const base = CATALOGO[ficha.displayName] ?? generico(ficha.displayName);
  const tenantId = tenantDe(ficha.slug) ?? (await tenantPorNombre(ficha.displayName));
  if (!tenantId) {
    paso(`  ⚠ ${ficha.displayName}: no se pudo resolver su organización, se saltea`);
    resumen.salteadas += 1;
    return;
  }

  // El nombre con la sede sólo cuando hay más de una: «Clínica del Sur —
  // Obrajes» a secas, con una sola sede, agrega ruido y no distingue nada.
  const nombre = sedeAsignada
    ? `${ficha.displayName} — ${sedeAsignada}`
    : ficha.displayName;
  const semilla = slugificar(`${base.tema} ${nombre}`);

  const [coverFileId, avatarFileId] = await Promise.all([
    foto(semilla, 1200, 675, `portada-${slugificar(nombre)}.jpg`),
    foto(`${semilla}-logo`, 400, 400, `logo-${slugificar(nombre)}.jpg`),
  ]);

  const cuerpo = {
    displayName: nombre,
    headline: base.titular,
    biography: base.presentacion,
  };
  // Omitidos conservan lo que haya: si la foto no se pudo subir, es mejor
  // dejar la que estuviera que borrarla con un `null`.
  if (coverFileId) cuerpo.coverFileId = coverFileId;
  if (avatarFileId) cuerpo.avatarFileId = avatarFileId;

  await direccionDeSede(ficha, tenantId, sedeAsignada, ficha.indiceDeSede ?? 0);

  const { ok, status, body } = await json(
    'PUT',
    `/admin/tenants/${tenantId}/public-profile`,
    cuerpo,
  );
  if (ok) {
    resumen.completadas += 1;
    paso(`  ✓ ${nombre}`);
  } else {
    resumen.fallidas += 1;
    paso(`  ✗ ${nombre} — ${status} ${JSON.stringify(body).slice(0, 200)}`);
  }
}

async function main() {
  paso(`\nCompletando las vitrinas de los centros de salud en ${BASE}\n`);
  await entrarComoAdmin();

  const fichas = await fichasPublicas();
  resumen.vistas = fichas.length;
  paso(`· ${fichas.length} fichas visibles en el directorio público\n`);

  // Las repeticiones se numeran por nombre para repartir las sedes. El orden
  // es el que devuelve el buscador —alfabético y estable—, así que dos
  // corridas asignan las mismas sedes a las mismas fichas.
  const vistasPorNombre = new Map();

  for (const ficha of fichas) {
    const nombreBase = ficha.displayName.split(' — ')[0];
    const indice = vistasPorNombre.get(nombreBase) ?? 0;
    vistasPorNombre.set(nombreBase, indice + 1);

    const catalogo = CATALOGO[nombreBase] ?? generico(nombreBase);
    const sedes = catalogo.sedes ?? [];
    // La primera es la casa matriz y se queda con el nombre pelado.
    const sede = indice === 0 ? null : (sedes[indice % sedes.length] ?? null);
    const conIndice = { ...ficha, displayName: nombreBase, indiceDeSede: indice };

    // Ya completa: no se vuelven a subir las fotos ni a reescribir los textos.
    // La dirección de la sede sí se comprueba igual, porque es idempotente y
    // porque una ficha puede estar completa de texto y seguir compartiendo la
    // calle con sus siete hermanas —que es como quedó la primera corrida—.
    //
    // Acá la sede se lee **del nombre ya publicado** y no del contador: el
    // contador reparte sedes por orden de aparición, y una vez que los nombres
    // llevan la sede el orden alfabético cambia. Confiar en el contador ponía
    // «sede San Pedro» en la dirección de la ficha llamada «Alto Obrajes»: dos
    // sedes distintas en la misma tarjeta, que es peor que una sola repetida.
    if (!REHACER && ficha.coverUrl && ficha.headline) {
      const tenantId = tenantDe(ficha.slug) ?? (await tenantPorNombre(ficha.displayName));
      const sedePublicada = ficha.displayName.includes(' — ')
        ? ficha.displayName.split(' — ').slice(1).join(' — ')
        : null;
      if (tenantId) {
        await direccionDeSede(conIndice, tenantId, sedePublicada, indice);
      }
      resumen.salteadas += 1;
      continue;
    }

    await completar(conIndice, sede);
  }

  paso(
    `\nListo: ${resumen.completadas} completadas, ${resumen.salteadas} salteadas, ` +
      `${resumen.fallidas} fallidas, ${resumen.fotos} fotos subidas.\n`,
  );
  if (resumen.fallidas > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exit(1);
});
