// Requerimientos transversales de cada operación: qué tiene que cumplir quien la
// llama (autenticación, rol, tenant, cabeceras, cuerpo, límite de tasa).
//
// Los límites globales NO son texto fijo: se leen de `src/main.ts` y
// `src/app.module.ts` al generar. Si el patrón ya no se encuentra, el requerimiento
// dice «no determinado» en vez de seguir afirmando un valor que quizá cambió.
import fs from 'node:fs';
import path from 'node:path';
import { requestBody } from './openapi.mjs';

function leer(root, archivo) {
  try {
    return fs.readFileSync(path.join(root, archivo), 'utf8');
  } catch {
    return null;
  }
}

function lineaDe(texto, patron) {
  const posicion = texto.search(patron);
  return posicion < 0 ? null : texto.slice(0, posicion).split('\n').length;
}

function fuenteEn(archivo, texto, patron) {
  const linea = lineaDe(texto, patron);
  return linea ? `${archivo}:${linea}` : archivo;
}

/**
 * El `ValidationPipe` global: o está escrito en `main.ts`, o `main.ts` lo pide a una
 * fábrica (`app.useGlobalPipes(createGlobalValidationPipe())`) que vive en `src/common` y
 * es la que también usa el harness de integración. Devuelve archivo, texto y la
 * declaración `new ValidationPipe({…})`, o null si no se encuentra.
 */
function pipeDeValidacion(root, main) {
  const enMain = main?.match(/new ValidationPipe\(\{([\s\S]*?)\}\)/);
  if (enMain)
    return { archivo: 'src/main.ts', texto: main, opciones: enMain[1] };
  const fabrica = main?.match(
    /useGlobalPipes\(\s*([A-Za-z_$][\w$]*)\(\s*\)\s*\)/,
  )?.[1];
  if (!fabrica) return null;
  const pendientes = ['src/common'];
  while (pendientes.length) {
    const dir = pendientes.pop();
    let entradas;
    try {
      entradas = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entrada of entradas) {
      const relativa = `${dir}/${entrada.name}`;
      if (entrada.isDirectory()) pendientes.push(relativa);
      else if (
        /\.ts$/.test(entrada.name) &&
        !/\.spec\.ts$/.test(entrada.name)
      ) {
        const texto = leer(root, relativa);
        if (!texto?.includes(`function ${fabrica}`)) continue;
        const opciones = texto.match(
          /new ValidationPipe\(\{([\s\S]*?)\}\)/,
        )?.[1];
        if (opciones) return { archivo: relativa, texto, opciones };
      }
    }
  }
  return null;
}

/** Lee del código los límites que aplican a todas las rutas. */
export function leerGlobales(root = process.cwd()) {
  const main = leer(root, 'src/main.ts');
  const modulo = leer(root, 'src/app.module.ts');

  // `json({ limit, ... })`: otras opciones (p. ej. `verify`, que guarda el
  // cuerpo crudo para firmar webhooks) no cambian el límite.
  const cuerpo = main?.match(/json\(\{\s*limit:\s*'([^']+)'[^}]*\}\)/);
  const tasa = modulo?.match(
    /throttlers:\s*\[\{\s*ttl:\s*([\d_]+)\s*,\s*limit:\s*(\d+)\s*\}\]/,
  );
  const pipe = pipeDeValidacion(root, main);
  const tenant =
    modulo &&
    /provide:\s*APP_INTERCEPTOR,\s*useClass:\s*TenantContextInterceptor/.test(
      modulo,
    );

  return {
    cuerpo: cuerpo
      ? {
          limite: cuerpo[1],
          fuente: fuenteEn('src/main.ts', main, /json\(\{\s*limit/),
        }
      : null,
    tasa: tasa
      ? {
          ttlMs: Number(tasa[1].replaceAll('_', '')),
          limite: Number(tasa[2]),
          fuente: fuenteEn(
            'src/app.module.ts',
            modulo,
            /ThrottlerModule\.forRoot/,
          ),
        }
      : null,
    validacion:
      pipe &&
      /whitelist:\s*true/.test(pipe.opciones) &&
      /forbidNonWhitelisted:\s*true/.test(pipe.opciones)
        ? { fuente: fuenteEn(pipe.archivo, pipe.texto, /new ValidationPipe/) }
        : null,
    tenant: tenant
      ? {
          fuente: fuenteEn(
            'src/app.module.ts',
            modulo,
            /useClass:\s*TenantContextInterceptor/,
          ),
        }
      : null,
  };
}

const sinDeterminar = 'no determinado (no se encontró en el código)';

/**
 * @param {object} options
 * @param {object} options.operation - Operación del contrato.
 * @param {object|undefined} options.handler - Registro del handler (índice AST).
 * @param {ReturnType<typeof leerGlobales>} options.globales
 * @returns {{ tipo: string, detalle: string, fuente: string }[]}
 */
export function requerimientosDe({ operation, handler, globales }) {
  const reqs = [];
  const origen = handler ? `${handler.source}:${handler.line}` : 'contrato';
  const publica = handler
    ? handler.isPublic
    : (operation.security ?? []).length === 0;

  reqs.push(
    publica
      ? {
          tipo: 'AUTENTICACION',
          detalle: 'Ruta pública: no exige token',
          fuente: origen,
        }
      : {
          tipo: 'AUTENTICACION',
          detalle: 'JWT Bearer',
          fuente: 'contrato (security)',
        },
  );

  if (!publica) {
    reqs.push(
      handler?.roles.length
        ? {
            tipo: 'ROL',
            detalle: `Alguno de: ${handler.roles.join(', ')}`,
            fuente: origen,
          }
        : {
            tipo: 'ROL',
            detalle: handler
              ? 'Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio)'
              : 'No determinado: el handler no está en el código',
            fuente: origen,
          },
    );
    if (handler?.requiresVerifiedIdentity)
      reqs.push({
        tipo: 'IDENTIDAD_VERIFICADA',
        detalle:
          'El actor debe tener la identidad verificada (@RequiresVerifiedIdentity)',
        fuente: origen,
      });
    reqs.push(
      handler?.decorators.includes('TenantAgnostic')
        ? {
            tipo: 'TENANT',
            detalle: 'Ruta declarada agnóstica de tenant (@TenantAgnostic)',
            fuente: origen,
          }
        : {
            tipo: 'TENANT',
            detalle: globales.tenant
              ? 'Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece'
              : sinDeterminar,
            fuente: globales.tenant?.fuente ?? 'src/app.module.ts',
          },
    );
  }

  for (const parametro of operation.parameters ?? []) {
    if (parametro.in === 'header')
      reqs.push({
        tipo: 'CABECERA',
        detalle: `${parametro.name} (${parametro.required ? 'obligatoria' : 'opcional'})`,
        fuente: 'contrato (parameters)',
      });
    else if (parametro.in === 'query' && parametro.required)
      reqs.push({
        tipo: 'PARAMETRO_QUERY',
        detalle: `${parametro.name} (obligatorio)`,
        fuente: 'contrato (parameters)',
      });
  }
  if (handler?.uuidParams.length)
    reqs.push({
      tipo: 'PARAMETRO_RUTA',
      detalle: `Deben ser UUID válidos: ${handler.uuidParams.join(', ')}`,
      fuente: origen,
    });

  const cuerpo = requestBody(operation);
  if (cuerpo.schema) {
    const esMultipart = cuerpo.contentType?.startsWith('multipart/');
    reqs.push({
      tipo: 'CUERPO',
      detalle: esMultipart
        ? `${cuerpo.contentType}${cuerpo.required ? ' (obligatorio)' : ''}; el tamaño del archivo lo define la ruta, no el límite global`
        : `${cuerpo.contentType}${cuerpo.required ? ' (obligatorio)' : ''}; máximo ${globales.cuerpo?.limite ?? sinDeterminar}`,
      fuente: esMultipart
        ? 'contrato (requestBody)'
        : (globales.cuerpo?.fuente ?? 'src/main.ts'),
    });
    reqs.push({
      tipo: 'VALIDACION',
      detalle: globales.validacion
        ? 'Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted)'
        : sinDeterminar,
      fuente: globales.validacion?.fuente ?? 'src/main.ts',
    });
  }

  reqs.push(
    handler?.throttle
      ? {
          tipo: 'RATE_LIMIT',
          detalle: `Límite propio: ${handler.throttle}`,
          fuente: origen,
        }
      : {
          tipo: 'RATE_LIMIT',
          detalle: globales.tasa
            ? `${globales.tasa.limite} solicitudes cada ${globales.tasa.ttlMs / 1000} s (límite global)`
            : sinDeterminar,
          fuente: globales.tasa?.fuente ?? 'src/app.module.ts',
        },
  );
  return reqs;
}
