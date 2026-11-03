// Procesos de negocio (flujos) del API y su cruce con las operaciones.
//
// Un «proceso» agrupa operaciones bajo la intención de negocio que el propio
// repositorio declara:
//   - de MÓDULO: uno por módulo, con una etapa por caso de uso (UC) de su README.
//     Las operaciones que el README no menciona se agrupan por controlador y se
//     marcan `AGRUPACION_POR_CONTROLADOR`: no se inventa un caso de uso;
//   - CRITICO: los flujos de punta a punta de `docs/business/critical-workflows.md`,
//     con sus pasos en el orden del documento.
// Nada de esto es una opinión: cada etapa cita el archivo y línea de donde sale.
import fs from 'node:fs';
import path from 'node:path';
import { normalizarRuta } from './documentos.mjs';

const VERBO_RUTA = /`(GET|POST|PUT|PATCH|DELETE)\s+(\/[^`\s]*)`/g;
const RUTA_RELATIVA = /`\.\.\.(\/[^`\s]+)`/g;

const leer = (archivo) => {
  try {
    return fs.readFileSync(archivo, 'utf8');
  } catch {
    return null;
  }
};

/** Título, descripción y «Flujo general» del README de cada módulo. */
export function leerReadmes(root = process.cwd()) {
  const resultado = new Map();
  const base = path.join(root, 'src', 'modules');
  for (const modulo of fs.readdirSync(base)) {
    const archivo = `src/modules/${modulo}/README.md`;
    const texto = leer(path.join(root, archivo));
    if (!texto) continue;
    const lineas = texto.split('\n');
    const h1 = lineas.findIndex((l) => /^# /.test(l));
    const titulo = h1 >= 0 ? lineas[h1].replace(/^#\s+/, '').trim() : null;
    // primer párrafo tras el H1
    let descripcion = null;
    if (h1 >= 0) {
      const parrafo = [];
      let i = h1 + 1;
      while (i < lineas.length && !lineas[i].trim()) i += 1;
      const inicio = i;
      while (
        i < lineas.length &&
        lineas[i].trim() &&
        !/^(#|\||```|>)/.test(lineas[i])
      ) {
        parrafo.push(lineas[i].trim());
        i += 1;
      }
      if (parrafo.length)
        descripcion = {
          texto: parrafo.join(' '),
          fuente: `${archivo}:${inicio + 1}`,
        };
    }
    const iFlujo = lineas.findIndex((l) => /^##\s+Flujo general\b/i.test(l));
    let flujoGeneral = null;
    if (iFlujo >= 0) {
      let fin = lineas.findIndex((l, i) => i > iFlujo && /^##\s/.test(l));
      if (fin < 0) fin = lineas.length;
      const cuerpo = lineas
        .slice(iFlujo + 1, fin)
        .join('\n')
        .trim();
      if (cuerpo)
        flujoGeneral = { texto: cuerpo, fuente: `${archivo}:${iFlujo + 1}` };
    }
    resultado.set(modulo, { archivo, titulo, descripcion, flujoGeneral });
  }
  return resultado;
}

/**
 * Procesos críticos documentados a mano. Cada `## N. Título (`modulo`)` es un proceso;
 * «Flujo principal» (lista numerada) y «Flujos alternativos» (viñetas) son sus etapas.
 */
export function leerFlujosCriticos(root = process.cwd()) {
  const archivo = 'docs/business/critical-workflows.md';
  const texto = leer(path.join(root, archivo));
  if (!texto) return [];
  const lineas = texto.split('\n');
  const inicios = lineas
    .map((l, i) => (/^##\s+\d+\.\s/.test(l) ? i : -1))
    .filter((i) => i >= 0);
  return inicios.map((inicio, k) => {
    const fin = inicios[k + 1] ?? lineas.length;
    const bloque = lineas.slice(inicio, fin);
    const titulo = bloque[0].replace(/^##\s+\d+\.\s+/, '').trim();
    const modulos = [...titulo.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
    const campo = (nombre) => {
      const i = bloque.findIndex((l) => l.startsWith(`**${nombre}:**`));
      if (i < 0) return null;
      const partes = [bloque[i].replace(`**${nombre}:**`, '').trim()];
      for (
        let j = i + 1;
        j < bloque.length &&
        bloque[j].trim() &&
        !/^\*\*/.test(bloque[j]) &&
        !/^(\d+\.|-)\s/.test(bloque[j]);
        j += 1
      )
        partes.push(bloque[j].trim());
      return {
        texto: partes.join(' ').trim(),
        fuente: `${archivo}:${inicio + i + 1}`,
      };
    };
    const lista = (nombre, patron) => {
      const i = bloque.findIndex((l) => l.startsWith(`**${nombre}:**`));
      if (i < 0) return [];
      const items = [];
      for (let j = i + 1; j < bloque.length; j += 1) {
        if (/^\*\*/.test(bloque[j])) break;
        if (patron.test(bloque[j]))
          items.push({
            texto: bloque[j].replace(patron, '').trim(),
            linea: inicio + j + 1,
          });
        else if (items.length && bloque[j].trim() && /^\s+/.test(bloque[j]))
          items.at(-1).texto += ` ${bloque[j].trim()}`;
      }
      return items.map((item) => ({
        ...item,
        fuente: `${archivo}:${item.linea}`,
      }));
    };
    return {
      titulo: titulo.replace(/\s*\(`.*$/, '').trim(),
      modulos,
      fuente: `${archivo}:${inicio + 1}`,
      problema: campo('Problema de negocio'),
      actor: campo('Actor principal'),
      precondiciones: campo('Precondiciones'),
      reglas: campo('Reglas de negocio'),
      estados: campo('Estados y transiciones'),
      principal: lista('Flujo principal', /^\d+\.\s+/),
      alternativos: lista('Flujos alternativos', /^-\s+/),
    };
  });
}

/** Referencias `METODO /ruta` de un texto, y `.../sufijo` relativas a la última ruta completa. */
export function referenciasDe(texto) {
  const referencias = [];
  const marcas = [];
  for (const m of texto.matchAll(VERBO_RUTA))
    marcas.push({ pos: m.index, metodo: m[1], ruta: m[2], relativa: false });
  for (const m of texto.matchAll(RUTA_RELATIVA))
    marcas.push({ pos: m.index, ruta: m[1], relativa: true });
  marcas.sort((a, b) => a.pos - b.pos);
  let anterior = null;
  for (const marca of marcas) {
    if (marca.relativa)
      referencias.push({
        base: anterior,
        sufijo: normalizarRuta(marca.ruta),
        relativa: true,
      });
    else {
      referencias.push({
        metodo: marca.metodo,
        ruta: normalizarRuta(marca.ruta),
        relativa: false,
      });
      anterior = normalizarRuta(marca.ruta);
    }
  }
  return referencias;
}

const natural = (a, b) => a.localeCompare(b, 'en', { numeric: true });

function quienActua(e) {
  if (e.autenticacion.publica) return 'Público (sin sesión)';
  if (e.autenticacion.roles.length) return e.autenticacion.roles.join(' · ');
  return 'Cualquier sesión válida';
}

function pasoDe(e) {
  return {
    operacionId: e.id,
    metodo: e.metodo,
    ruta: e.ruta,
    quienActua: quienActua(e),
    queHace: e.nombre,
    riesgo: e.riesgo.nivel,
    efectos: {
      tablas: e.tablas.map((t) => ({
        tabla: `${t.schema}.${t.tabla}`,
        operacion: t.operacion,
        detalle: t.detalle,
      })),
      eventos: e.eventos.map((x) => x.tipo ?? `~${x.expresion}`),
      trabajos: e.trabajos.map((x) => x.codigo ?? `~${x.expresion}`),
    },
  };
}

/**
 * @param {object} deps
 * @param {object[]} deps.endpoints - Registros del inventario de endpoints.
 * @param {Map<string, any>} deps.readmes - `leerReadmes`.
 * @param {ReturnType<typeof leerFlujosCriticos>} deps.criticos
 * @param {{codigo: string, modulo: string|null, fuente: string, estados: string[], transiciones: any[]}[]} deps.maquinas
 * @param {Map<string, Map<string, {estados: Set<string>, via: string[]}>>} deps.disparadores - máquina → handler → estados
 * @param {Map<string, {texto: string, fuente: string}>} [deps.propositos] - propósito del módulo según el modelo (por carpeta)
 */
export function construirProcesos({
  endpoints,
  readmes,
  criticos,
  maquinas,
  disparadores,
  propositos = new Map(),
}) {
  const porModulo = new Map();
  for (const e of endpoints)
    porModulo.set(e.modulo, [...(porModulo.get(e.modulo) ?? []), e]);

  const procesos = [];
  for (const [modulo, ops] of [...porModulo].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const readme = readmes.get(modulo);
    const etapas = new Map();
    const agregar = (codigo, datos, e) => {
      if (!etapas.has(codigo))
        etapas.set(codigo, { codigo, ...datos, operaciones: [] });
      etapas.get(codigo).operaciones.push(pasoDe(e));
    };
    for (const e of ops) {
      if (e.casosDeUso.length)
        for (const uc of e.casosDeUso)
          agregar(
            uc.id,
            {
              nombre: uc.descripcion,
              fuente: uc.fuente,
              agrupacion: 'CASO_DE_USO_README',
            },
            e,
          );
      else {
        const controlador = e.codigo?.controlador ?? 'sin controlador';
        agregar(
          `ctrl:${controlador}`,
          {
            nombre: `Operaciones de ${controlador} que el README no asigna a un caso de uso`,
            fuente: e.codigo?.fuente ?? null,
            agrupacion: 'AGRUPACION_POR_CONTROLADOR',
          },
          e,
        );
      }
    }
    const lista = [...etapas.values()].sort(
      (a, b) =>
        (a.agrupacion === b.agrupacion
          ? 0
          : a.agrupacion === 'CASO_DE_USO_README'
            ? -1
            : 1) || natural(a.codigo, b.codigo),
    );
    const actores = [
      ...new Set(
        ops.flatMap((e) =>
          e.autenticacion.publica
            ? ['Público (sin sesión)']
            : e.autenticacion.roles.length
              ? e.autenticacion.roles
              : ['Cualquier sesión válida'],
        ),
      ),
    ].sort();
    const deMaquina = maquinas
      .filter((m) => m.modulo === modulo)
      .map((m) => m.codigo);
    const conUc = lista.filter(
      (x) => x.agrupacion === 'CASO_DE_USO_README',
    ).length;
    procesos.push({
      codigo: modulo,
      tipo: 'MODULO',
      nombre: readme?.titulo ?? modulo,
      modulo,
      bloque: ops.find((e) => e.bloque)?.bloque?.nombre ?? null,
      agrupacion: !conUc
        ? 'AGRUPACION_POR_CONTROLADOR'
        : conUc === lista.length
          ? 'CASO_DE_USO_README'
          : 'MIXTO',
      actores,
      paraQueSirve: readme?.descripcion ??
        propositos.get(modulo) ?? {
          texto: null,
          fuente: null,
          estado: 'SIN_FUENTE',
        },
      flujoGeneral: readme?.flujoGeneral ?? null,
      etapas: lista,
      operaciones: ops.length,
      maquinas: deMaquina,
      fuentes: [readme?.archivo].filter(Boolean),
      revision: { estado: 'AUTO_DETECTADA' },
    });
  }

  // procesos críticos: pasos en el orden del documento
  const porRuta = new Map();
  for (const e of endpoints)
    porRuta.set(`${e.metodo} ${normalizarRuta(e.ruta)}`, e);
  const sinResolver = [];
  for (const critico of criticos) {
    const resolver = (referencias, texto, fuente) => {
      const encontrados = [];
      for (const r of referencias) {
        let e = null;
        if (!r.relativa) e = porRuta.get(`${r.metodo} ${r.ruta}`);
        else if (r.base) {
          const candidatas = endpoints.filter(
            (x) =>
              normalizarRuta(x.ruta).startsWith(r.base) &&
              normalizarRuta(x.ruta).endsWith(r.sufijo),
          );
          e = candidatas.length === 1 ? candidatas[0] : null;
        }
        if (e) encontrados.push(e);
        else
          sinResolver.push({
            proceso: critico.titulo,
            referencia: r.relativa ? `...${r.sufijo}` : `${r.metodo} ${r.ruta}`,
            fuente,
          });
      }
      return encontrados;
    };
    const etapasCriticas = [];
    for (const [tipo, items] of [
      ['PRINCIPAL', critico.principal],
      ['ALTERNATIVO', critico.alternativos],
    ])
      items.forEach((item, i) => {
        const ops = resolver(
          referenciasDe(item.texto),
          item.texto,
          item.fuente,
        );
        etapasCriticas.push({
          codigo: `${tipo === 'PRINCIPAL' ? 'P' : 'A'}${i + 1}`,
          tipo,
          nombre: item.texto,
          fuente: item.fuente,
          operaciones: ops.map(pasoDe),
        });
      });
    const operaciones = new Set(
      etapasCriticas.flatMap((x) => x.operaciones.map((o) => o.operacionId)),
    );
    procesos.push({
      codigo: `critico:${critico.modulos[0] ?? 'general'}`,
      tipo: 'CRITICO',
      nombre: critico.titulo,
      modulo: critico.modulos[0] ?? null,
      modulos: critico.modulos,
      bloque: null,
      agrupacion: 'CURADO_EN_DOCUMENTO',
      actores: critico.actor ? [critico.actor.texto] : [],
      paraQueSirve: critico.problema ?? {
        texto: null,
        fuente: null,
        estado: 'SIN_FUENTE',
      },
      precondiciones: critico.precondiciones,
      reglas: critico.reglas,
      estados: critico.estados,
      etapas: etapasCriticas,
      operaciones: operaciones.size,
      maquinas: maquinas
        .filter((m) => critico.modulos.includes(m.modulo))
        .map((m) => m.codigo),
      fuentes: [critico.fuente],
      revision: { estado: 'CURADO_EN_DOCUMENTO' },
    });
  }

  // ida y vuelta: cada operación sabe en qué procesos y etapas está
  const flujosPorOperacion = new Map();
  for (const proceso of procesos)
    for (const etapa of proceso.etapas)
      for (const op of etapa.operaciones) {
        const lista = flujosPorOperacion.get(op.operacionId) ?? [];
        if (
          !lista.some(
            (f) => f.codigo === proceso.codigo && f.etapa === etapa.codigo,
          )
        )
          lista.push({
            codigo: proceso.codigo,
            tipo: proceso.tipo,
            nombre: proceso.nombre,
            etapa: etapa.codigo,
            etapaNombre: etapa.nombre,
            agrupacion: etapa.agrupacion ?? 'CURADO_EN_DOCUMENTO',
          });
        flujosPorOperacion.set(op.operacionId, lista);
      }

  // máquinas de estado con las operaciones que las ejercen
  const maquinasConOperaciones = maquinas.map((m) => {
    const mapa = disparadores.get(m.codigo) ?? new Map();
    const operaciones = [];
    for (const e of endpoints) {
      const clave = e.codigo
        ? `${e.codigo.controlador}_${e.codigo.handler}`
        : null;
      const d = clave && mapa.get(clave);
      if (d)
        operaciones.push({
          operacionId: e.id,
          metodo: e.metodo,
          ruta: e.ruta,
          estados: [...d.estados].sort(),
          via: d.via,
          confianza: 'POR_REFERENCIA',
        });
    }
    return { ...m, operaciones };
  });

  return {
    procesos,
    maquinas: maquinasConOperaciones,
    flujosPorOperacion,
    sinResolver,
  };
}
