// Mapa de operaciones (como `/flows` de Atlas) y hallazgos que salen de cruzar flujos,
// riesgo, pruebas y consumidores. Cada hallazgo dice qué hacer; ninguno corrige nada.
import { normalizarRuta } from './documentos.mjs';
import { esTrivial } from './mermaid.mjs';

const ESCRIBE = (e) =>
  e.tablas.some((t) => t.operacion === 'ESCRIBE' || t.operacion === 'BORRA');

function autorizacion(e) {
  if (e.autenticacion.publica) return 'Pública';
  if (e.autenticacion.roles.length) return e.autenticacion.roles.join(' · ');
  return 'Sesión sin roles';
}

/**
 * @param {object} deps
 * @param {object[]} deps.endpoints
 * @param {Map<string, {nodos: object[]}>} deps.arboles
 * @param {object[]} deps.procesos
 * @param {object[]} deps.maquinas
 * @param {{disponible: boolean, fuente: string, operaciones: {cliente: string, clave: string, metodo: string, ruta: string, archivo: string}[]}} deps.front
 */
export function construirMapa({
  endpoints,
  arboles,
  procesos,
  maquinas,
  front,
}) {
  const consumidores = new Map();
  for (const o of front.operaciones)
    consumidores.set(o.clave, [
      ...(consumidores.get(o.clave) ?? []),
      o.cliente,
    ]);

  const filas = endpoints.map((e) => {
    const clave = `${e.metodo} ${normalizarRuta(e.ruta)}`;
    const llamadaPor = front.disponible
      ? [...new Set(consumidores.get(clave) ?? [])].sort()
      : null;
    const conMaquina = maquinas
      .filter((m) => m.operaciones.some((o) => o.operacionId === e.id))
      .map((m) => m.codigo);
    const señales = [];
    if (e.origen === 'CONTRATO_AUSENTE') señales.push('CONTRATO_AUSENTE');
    if (e.autenticacion.publica) señales.push('PUBLICA');
    if (e.riesgo.razones.some((r) => r.includes('no declara roles')))
      señales.push('ESCRIBE_SIN_ROLES');
    if (ESCRIBE(e)) señales.push('ESCRIBE');
    if (!e.tablas.length) señales.push('SIN_TABLAS');
    if (!e.pruebas.length) señales.push('SIN_PRUEBAS');
    else if (!e.pruebas.some((p) => p.tipo === 'INTEGRACION'))
      señales.push('SIN_INTEGRACION');
    if (e.eventos.length) señales.push('EVENTO');
    if (e.trabajos.length) señales.push('ENCOLA_TRABAJO');
    if (conMaquina.length) señales.push('MAQUINA_DE_ESTADOS');
    if (llamadaPor && !llamadaPor.length) señales.push('SIN_CONSUMIDOR_FRONT');
    if (!esTrivial(arboles.get(e.id)?.nodos ?? []))
      señales.push('CON_DECISIONES');
    return {
      id: e.id,
      metodo: e.metodo,
      ruta: e.ruta,
      flujos: e.flujos.map((f) => ({
        codigo: f.codigo,
        nombre: f.nombre,
        etapa: f.etapa,
      })),
      modulo: e.modulo,
      riesgo: e.riesgo.nivel,
      autorizacion: autorizacion(e),
      llamadaPor,
      señales,
    };
  });

  const hallazgos = [];
  const agregar = (h) => hallazgos.push({ ...h, cuenta: h.items.length });
  const item = (e, detalle) => ({
    operacion: e.id,
    metodo: e.metodo,
    ruta: e.ruta,
    modulo: e.modulo,
    detalle,
    fuente: e.codigo?.fuente ?? null,
  });

  agregar({
    id: 'FLU-01',
    severidad: 'ALTA',
    titulo: 'Operaciones sin proceso asignado',
    queHacer:
      'Asignarlas a un caso de uso en el README del módulo. Con cero filas no hay nada que hacer.',
    items: endpoints
      .filter((e) => !e.flujos.length)
      .map((e) => item(e, 'ningún proceso la incluye')),
  });
  agregar({
    id: 'FLU-02',
    severidad: 'ALTA',
    titulo: 'Escritura autenticada sin @Roles en el controlador',
    queHacer:
      'Confirmar que la regla de acceso vive en el servicio o declarar los roles en el controlador. Hoy la API no las distingue de una sesión cualquiera.',
    items: filas
      .filter((f) => f.señales.includes('ESCRIBE_SIN_ROLES'))
      .map((f) => ({
        operacion: f.id,
        metodo: f.metodo,
        ruta: f.ruta,
        modulo: f.modulo,
        detalle: 'escribe y el controlador no declara roles',
        fuente: endpoints.find((e) => e.id === f.id).codigo?.fuente ?? null,
      })),
  });
  agregar({
    id: 'FLU-03',
    severidad: 'ALTA',
    titulo: 'Ruta pública que escribe en la base',
    queHacer:
      'Verificar que la autenticación alternativa (firma, token de un solo uso) esté en el handler. Una ruta pública que escribe es la superficie más expuesta.',
    items: endpoints
      .filter((e) => e.autenticacion.publica && ESCRIBE(e))
      .map((e) =>
        item(
          e,
          e.tablas
            .filter((t) => t.operacion !== 'LEE')
            .map((t) => `${t.detalle} ${t.schema}.${t.tabla}`)
            .join(', '),
        ),
      ),
  });
  agregar({
    id: 'FLU-04',
    severidad: 'MEDIA',
    titulo: 'Operación de riesgo ALTO sin ninguna prueba de integración',
    queHacer:
      'Escribir la prueba de integración contra PostgreSQL real (regla 80.2.4). Las sin prueba alguna van primero.',
    items: endpoints
      .filter(
        (e) =>
          e.riesgo.nivel === 'ALTO' &&
          !e.pruebas.some((p) => p.tipo === 'INTEGRACION'),
      )
      .map((e) =>
        item(
          e,
          e.pruebas.length
            ? 'sólo prueba de controlador'
            : 'ninguna prueba la menciona',
        ),
      ),
  });
  agregar({
    id: 'FLU-05',
    severidad: 'MEDIA',
    titulo:
      'Proceso con operaciones de riesgo ALTO y ninguna prueba de integración',
    queHacer:
      'Priorizar estos procesos al escribir pruebas: un fallo aquí rompe un flujo completo, no una operación.',
    items: procesos
      .filter((p) => p.tipo === 'MODULO')
      .map((p) => {
        const ops = new Set(
          p.etapas.flatMap((et) => et.operaciones.map((o) => o.operacionId)),
        );
        const deRiesgo = endpoints.filter(
          (e) => ops.has(e.id) && e.riesgo.nivel === 'ALTO',
        );
        const conIntegracion = endpoints.some(
          (e) =>
            ops.has(e.id) && e.pruebas.some((t) => t.tipo === 'INTEGRACION'),
        );
        return deRiesgo.length && !conIntegracion
          ? {
              proceso: p.codigo,
              nombre: p.nombre,
              detalle: `${deRiesgo.length} operaciones de riesgo ALTO, 0 pruebas de integración en el proceso`,
              fuente: p.fuentes[0] ?? null,
            }
          : null;
      })
      .filter(Boolean),
  });
  if (front.disponible) {
    const claves = new Set(
      endpoints.map((e) => `${e.metodo} ${normalizarRuta(e.ruta)}`),
    );
    agregar({
      id: 'FLU-06',
      severidad: 'ALTA',
      titulo: 'Operaciones que el frontend llama y la API no tiene',
      queHacer:
        'Cada fila es una pantalla que hoy falla (404) o depende de un mock. Decidir: implementar en la API, o retirar del cliente. No se corrige aquí.',
      items: front.operaciones
        .filter((o) => !claves.has(o.clave))
        .map((o) => ({
          operacion: null,
          metodo: o.metodo,
          ruta: o.ruta,
          modulo: null,
          detalle: `cliente ${o.cliente}`,
          fuente: o.archivo,
        })),
    });
    agregar({
      id: 'FLU-07',
      severidad: 'INFO',
      titulo: 'Operaciones de la API que ningún cliente del frontend llama',
      queHacer:
        'Informativo: pueden ser internas (workers), de otros consumidores (móvil, integraciones) o deuda. Confirmar con el responsable antes de retirar nada.',
      items: filas
        .filter((f) => f.señales.includes('SIN_CONSUMIDOR_FRONT'))
        .map((f) => ({
          operacion: f.id,
          metodo: f.metodo,
          ruta: f.ruta,
          modulo: f.modulo,
          detalle: 'ningún cliente del frontend la declara',
          fuente: null,
        })),
    });
  }
  agregar({
    id: 'FLU-08',
    severidad: 'MEDIA',
    titulo:
      'Operaciones que existen en el código y el contrato OpenAPI no publica',
    queHacer:
      'Regenerar el contrato o decidir si deben dejar de existir. Los clientes generados no las ven.',
    items: endpoints
      .filter((e) => e.origen === 'CONTRATO_AUSENTE')
      .map((e) => item(e, 'handler sin operación en openapi.json')),
  });
  agregar({
    id: 'FLU-09',
    severidad: 'BAJA',
    titulo: 'Máquinas de estado sin ninguna operación que las ejerza',
    queHacer:
      'Revisar si la máquina se usa desde un worker o si es código muerto.',
    items: maquinas
      .filter((m) => !m.operaciones.length)
      .map((m) => ({
        operacion: null,
        metodo: null,
        ruta: null,
        modulo: m.modulo,
        detalle: m.codigo,
        fuente: m.fuente,
      })),
  });
  agregar({
    id: 'FLU-10',
    severidad: 'BAJA',
    titulo:
      'Operaciones que pueden terminar en un 500 por una excepción sin tipar',
    queHacer:
      'Cambiar el `new Error(...)` por una excepción del proyecto con estado y código estables (regla 96.4.4). El cliente hoy recibe INTERNAL sin poder distinguir la causa.',
    items: endpoints
      .map((e) => {
        const sinTipar = [];
        (function rec(ns) {
          for (const n of ns) {
            if (n.tipo === 'ERROR' && n.sinTipar)
              sinTipar.push(
                `${n.excepcion}${n.mensaje ? `: ${n.mensaje}` : ''} (${n.f})`,
              );
            for (const k of [
              'entonces',
              'sino',
              'cuerpo',
              'captura',
              'finalmente',
              'hijos',
            ])
              if (n[k]) rec(n[k]);
            for (const c of n.casos ?? []) rec(c.nodos);
          }
        })(arboles.get(e.id)?.nodos ?? []);
        return sinTipar.length
          ? item(e, sinTipar.slice(0, 3).join(' | '))
          : null;
      })
      .filter(Boolean),
  });

  return { filas, hallazgos, frontDisponible: front.disponible };
}
