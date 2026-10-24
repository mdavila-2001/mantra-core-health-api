// Documentación Markdown de flujos: un archivo por módulo con sus procesos (diagrama),
// máquinas de estado y árbol de decisión de cada operación.
import {
  arbolAMermaid,
  esTrivial,
  etiqueta,
  maquinaAMermaid,
} from './mermaid.mjs';
import { code, md } from './markdown.mjs';

const CABECERA =
  '<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->';
const MAX_NODOS_DIAGRAMA = 90;

function tabla(encabezados, filas) {
  if (!filas.length) return '';
  return [
    `| ${encabezados.join(' | ')} |`,
    `|${encabezados.map(() => '---').join('|')}|`,
    ...filas.map((fila) => `| ${fila.map((celda) => md(celda)).join(' | ')} |`),
  ].join('\n');
}

const mermaid = (texto) => ['```mermaid', texto, '```'].join('\n');

/** Diagrama `flowchart LR` de un grupo de etapas: actor → operación → tablas. */
function diagramaDeEtapas(etapas, { encadenar = false } = {}) {
  const lineas = ['flowchart LR'];
  const actores = new Map();
  const tablas = new Map();
  const ops = new Map();
  let n = 0;
  const idDe = (mapa, clave, prefijo) => {
    if (!mapa.has(clave)) mapa.set(clave, `${prefijo}${(n += 1)}`);
    return mapa.get(clave);
  };
  const declaraciones = [];
  const aristas = [];
  let anterior = null;
  etapas.forEach((etapa, i) => {
    const interior = [];
    for (const op of etapa.operaciones) {
      const o = idDe(ops, `${etapa.codigo}|${op.operacionId}`, 'o');
      interior.push(
        `    ${o}["${etiqueta(`${op.metodo} ${op.ruta}`, 70)}"]:::op`,
      );
      const a = idDe(actores, op.quienActua, 'a');
      aristas.push(`  ${a} --> ${o}`);
      for (const t of op.efectos.tablas.slice(0, 6)) {
        const tn = idDe(tablas, t.tabla, 't');
        aristas.push(`  ${o} -->|"${etiqueta(t.detalle, 12)}"| ${tn}`);
      }
      if (op.efectos.tablas.length > 6) {
        const mas = idDe(tablas, `+${o}`, 't');
        aristas.push(`  ${o} -.-> ${mas}`);
        tablas.set(`+${o}`, mas);
        declaraciones.push(
          `  ${mas}[("+${op.efectos.tablas.length - 6} tablas más")]`,
        );
      }
      for (const ev of op.efectos.eventos) {
        const e = idDe(tablas, `evento:${ev}`, 'e');
        aristas.push(`  ${o} -->|"evento"| ${e}`);
      }
    }
    declaraciones.push(
      `  subgraph s${i}["${etiqueta(`${etapa.codigo} · ${etapa.nombre}`, 80)}"]`,
      ...interior,
      '  end',
    );
    if (encadenar && etapa.tipo === 'PRINCIPAL') {
      const primera = ops.get(
        `${etapa.codigo}|${etapa.operaciones[0]?.operacionId}`,
      );
      if (primera && anterior)
        aristas.push(`  ${anterior} ==>|"luego"| ${primera}`);
      if (primera)
        anterior = ops.get(
          `${etapa.codigo}|${etapa.operaciones.at(-1).operacionId}`,
        );
    }
  });
  for (const [actor, a] of actores)
    lineas.push(`  ${a}(["${etiqueta(actor, 60)}"]):::actor`);
  for (const [tabla, t] of tablas)
    if (!tabla.startsWith('+'))
      lineas.push(
        tabla.startsWith('evento:')
          ? `  ${t}>"${etiqueta(tabla.slice(7), 50)}"]:::evento`
          : `  ${t}[("${etiqueta(tabla, 50)}")]:::tabla`,
      );
  lineas.push(
    ...declaraciones,
    ...aristas,
    '  classDef op fill:#fff,stroke:#446',
    '  classDef actor fill:#eef,stroke:#66a',
    '  classDef tabla fill:#ffd,stroke:#aa3',
    '  classDef evento fill:#efe,stroke:#3a3',
  );
  return {
    texto: lineas.join('\n'),
    nodos: actores.size + tablas.size + ops.size,
  };
}

/** Parte las etapas en grupos cuyo diagrama no supere el tope de nodos. */
export function diagramasDeProceso(proceso) {
  const grupos = [];
  let actual = [];
  const peso = (etapa) => etapa.operaciones.length * 3 + 2;
  let acumulado = 0;
  for (const etapa of proceso.etapas) {
    if (actual.length && acumulado + peso(etapa) > MAX_NODOS_DIAGRAMA) {
      grupos.push(actual);
      actual = [];
      acumulado = 0;
    }
    actual.push(etapa);
    acumulado += peso(etapa);
  }
  if (actual.length) grupos.push(actual);
  return grupos
    .filter((g) => g.some((e) => e.operaciones.length))
    .map((g) => ({
      ...diagramaDeEtapas(g, { encadenar: proceso.tipo === 'CRITICO' }),
      etapas: g.map((e) => e.codigo),
    }));
}

function seccionProceso(proceso) {
  const partes = [
    `## ${proceso.tipo === 'CRITICO' ? 'Flujo crítico' : 'Proceso'}: ${md(proceso.nombre)}`,
    '',
    `- **Código:** ${code(proceso.codigo)} · **Agrupación:** ${proceso.agrupacion} · **Operaciones:** ${proceso.operaciones}`,
    `- **Actores:** ${proceso.actores.map(md).join(' · ') || '—'}`,
    `- **Revisión:** ${proceso.revision.estado}`,
    `- **Fuentes:** ${proceso.fuentes.map(code).join(', ') || '—'}`,
    '',
    '### Para qué sirve',
    '',
    proceso.paraQueSirve.texto
      ? `${md(proceso.paraQueSirve.texto)}\n\n_Fuente: ${code(proceso.paraQueSirve.fuente)}_`
      : '_Sin fuente: ni el README del módulo ni el modelo lo describen._',
  ];
  if (proceso.flujoGeneral)
    partes.push(
      '',
      '### Flujo general declarado en el README',
      '',
      '```text',
      proceso.flujoGeneral.texto.replace(/^```\w*\n?|\n?```$/g, ''),
      '```',
      '',
      `_Fuente: ${code(proceso.flujoGeneral.fuente)}_`,
    );
  for (const [titulo, campo] of [
    ['Problema de negocio', null],
    ['Precondiciones', proceso.precondiciones],
    ['Reglas de negocio', proceso.reglas],
    ['Estados y transiciones', proceso.estados],
  ])
    if (campo?.texto)
      partes.push(
        '',
        `### ${titulo}`,
        '',
        `${md(campo.texto)}`,
        '',
        `_Fuente: ${code(campo.fuente)}_`,
      );
  partes.push(
    '',
    '### Etapas y operaciones',
    '',
    tabla(
      ['Etapa', 'Descripción', 'Operación', 'Quién actúa', 'Riesgo', 'Tablas'],
      proceso.etapas.flatMap((etapa) =>
        etapa.operaciones.length
          ? etapa.operaciones.map((op, i) => [
              i === 0 ? code(etapa.codigo) : '',
              i === 0 ? etapa.nombre : '',
              `${op.metodo} ${op.ruta}`,
              op.quienActua,
              op.riesgo,
              String(op.efectos.tablas.length),
            ])
          : [
              [
                code(etapa.codigo),
                etapa.nombre,
                '_sin operación HTTP (lo hace el sistema)_',
                '—',
                '—',
                '—',
              ],
            ],
      ),
    ),
  );
  const diagramas = diagramasDeProceso(proceso);
  diagramas.forEach((d, i) => {
    partes.push(
      '',
      `### Diagrama${diagramas.length > 1 ? ` ${i + 1} de ${diagramas.length}` : ''} — etapas ${d.etapas.slice(0, 3).map(code).join(', ')}${d.etapas.length > 3 ? '…' : ''}`,
      '',
      mermaid(d.texto),
    );
  });
  return partes.join('\n');
}

function seccionMaquina(m) {
  const partes = [
    `### Máquina de estados ${code(m.constante)}`,
    '',
    `Declarada en ${code(m.fuente)}. Los estados llevan el nombre del identificador del código; no se resuelven al catálogo de conceptos.`,
    '',
    mermaid(maquinaAMermaid(m)),
    '',
  ];
  if (m.operaciones.length)
    partes.push(
      '**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:',
      '',
      tabla(
        ['Operación', 'Estados de destino que nombra', 'A través de'],
        m.operaciones.map((o) => [
          `${o.metodo} ${o.ruta}`,
          o.estados.join(', ') || 'sin destino nombrado',
          o.via.join(' → '),
        ]),
      ),
    );
  else partes.push('_No se detectó ninguna operación que la ejerza._');
  return partes.join('\n');
}

function seccionArbol(e, arbol, ordinal) {
  return [
    `#### ${ordinal}. ${e.metodo} ${e.ruta}`,
    '',
    `${md(e.nombre ?? '')}`,
    '',
    tabla(
      ['HTTP', 'Código', 'Cuándo'],
      arbol.respuestas.map((r) => [
        String(r.estado),
        r.codigo ? code(r.codigo) : '—',
        r.causas.join('; '),
      ]),
    ),
    '',
    mermaid(arbolAMermaid(arbol.nodos)),
    '',
  ].join('\n');
}

export function renderFlujosDeModulo(
  modulo,
  { procesos, maquinas, endpoints, arboles },
) {
  const propios = procesos.filter(
    (p) => p.modulo === modulo || p.modulos?.includes(modulo),
  );
  const deMaquina = maquinas.filter((m) => m.modulo === modulo);
  const conArbol = endpoints.map((e) => ({ e, arbol: arboles.get(e.id) }));
  const con = conArbol.filter((x) => x.arbol && !esTrivial(x.arbol.nodos));
  const sin = conArbol.filter((x) => !x.arbol || esTrivial(x.arbol.nodos));
  const partes = [
    CABECERA,
    '',
    `# Flujos del módulo ${code(modulo)}`,
    '',
    `- **Procesos:** ${propios.length} · **Máquinas de estado:** ${deMaquina.length}`,
    `- **Operaciones:** ${endpoints.length} (${con.length} con decisiones propias, ${sin.length} sin ellas)`,
    `- Inventario de endpoints del módulo: [${modulo}](../endpoints/${modulo}.md)`,
    '',
  ];
  for (const p of propios) partes.push(seccionProceso(p), '');
  if (deMaquina.length) {
    partes.push('## Máquinas de estado', '');
    for (const m of deMaquina) partes.push(seccionMaquina(m), '');
  }
  partes.push(
    '## Árbol de decisión por operación',
    '',
    'Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.',
    '',
  );
  if (con.length) {
    partes.push('### Operaciones con decisiones propias', '');
    con.forEach(({ e, arbol }, i) =>
      partes.push(seccionArbol(e, arbol, i + 1)),
    );
  }
  if (sin.length) {
    partes.push(
      '### Operaciones sin decisiones propias',
      '',
      'Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.',
      '',
    );
    partes.push(
      tabla(
        ['Operación', 'Respuestas posibles', 'Tablas'],
        sin.map(({ e, arbol }) => [
          `${e.metodo} ${e.ruta}`,
          (arbol?.respuestas ?? []).map((r) => r.estado).join(', ') || '—',
          String(e.tablas.length),
        ]),
      ),
    );
  }
  return partes.join('\n');
}

export function renderIndiceDeFlujos(modulos, resumen) {
  return [
    CABECERA,
    '',
    '# Inventario de flujos',
    '',
    `**${resumen.procesos} procesos** (${resumen.criticos} críticos curados en \`docs/business/critical-workflows.md\` y ${resumen.deModulo} de módulo), **${resumen.maquinas} máquinas de estado** y **${resumen.operaciones} árboles de decisión**.`,
    '',
    `- Operaciones con decisiones propias: ${resumen.conDecisiones} · sin ellas: ${resumen.sinDecisiones}`,
    `- Operaciones sin proceso asignado: ${resumen.sinFlujo}`,
    `- Procesos por agrupación: ${Object.entries(resumen.porAgrupacion)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')}`,
    '',
    'Método y límites: [README del inventario](../README.md). Los procesos de módulo se construyen del README de cada módulo (tabla UC → ruta); lo que el README no asigna a un caso de uso se agrupa por controlador y se marca `AGRUPACION_POR_CONTROLADOR`.',
    '',
    tabla(
      ['Módulo', 'Procesos', 'Operaciones', 'Máquinas', 'Documento'],
      modulos.map((m) => [
        code(m.modulo),
        String(m.procesos),
        String(m.operaciones),
        String(m.maquinas),
        `[${m.modulo}.md](${m.modulo}.md)`,
      ]),
    ),
    '',
  ].join('\n');
}

export function renderMapa(mapa) {
  const { filas, frontDisponible } = mapa;
  return [
    CABECERA,
    '',
    '# Mapa de operaciones',
    '',
    `${filas.length} operaciones: ruta, proceso, módulo, riesgo, autorización, quién la llama y señales. Equivale a la vista \`/flows\` de AtlasAdminPortal.`,
    '',
    frontDisponible
      ? '«Quién la llama» sale del inventario de clientes del frontend (`docs/reports/generated/api-inventory.md`). Una operación sin cliente puede ser interna, móvil o deuda: la columna informa, no concluye.'
      : '_El repo del frontend no estaba disponible al generar: «Quién la llama» queda **sin dato** (defina FRONT_ROOT)._',
    '',
    'Las señales se calculan de los datos del inventario: [hallazgos](hallazgos.md) explica cada una y qué hacer.',
    '',
    tabla(
      [
        'Ruta',
        'Proceso',
        'Módulo',
        'Riesgo',
        'Autorización',
        'Quién la llama',
        'Señales',
      ],
      filas.map((f) => [
        `${f.metodo} ${code(f.ruta)}`,
        f.flujos.map((x) => `${x.nombre} (${x.etapa})`).join('; '),
        f.modulo,
        f.riesgo,
        f.autorizacion,
        f.llamadaPor === null ? 'sin dato' : f.llamadaPor.join(', ') || '—',
        f.señales.join(' · ') || '—',
      ]),
    ),
    '',
  ].join('\n');
}

export function renderHallazgos(mapa) {
  const partes = [
    CABECERA,
    '',
    '# Hallazgos de flujos',
    '',
    'Cada hallazgo sale de cruzar los datos del inventario. Ninguno corrige código: dicen qué hay y qué hacer.',
    '',
    tabla(
      ['ID', 'Severidad', 'Hallazgo', 'Cuenta'],
      mapa.hallazgos.map((h) => [
        `[${h.id}](#${h.id.toLowerCase()})`,
        h.severidad,
        h.titulo,
        String(h.cuenta),
      ]),
    ),
    '',
  ];
  if (!mapa.frontDisponible)
    partes.push(
      '_FLU-06 y FLU-07 no se calcularon: el repo del frontend no estaba disponible (defina FRONT_ROOT)._',
      '',
    );
  for (const h of mapa.hallazgos) {
    partes.push(
      `## ${h.id}`,
      '',
      `**${md(h.titulo)}** — severidad ${h.severidad} — ${h.cuenta} caso(s).`,
      '',
      `**Qué hacer:** ${md(h.queHacer)}`,
      '',
    );
    if (!h.items.length) {
      partes.push('_Ninguno._', '');
      continue;
    }
    const filas = h.items
      .slice(0, 200)
      .map((i) => [
        i.proceso ?? (i.metodo ? `${i.metodo} ${i.ruta}` : i.detalle),
        i.modulo ?? '—',
        i.proceso ? i.detalle : i.metodo ? i.detalle : '—',
        i.fuente ? code(i.fuente) : '—',
      ]);
    partes.push(tabla(['Dónde', 'Módulo', 'Detalle', 'Fuente'], filas));
    if (h.items.length > 200)
      partes.push(
        '',
        `_Se muestran 200 de ${h.items.length}; la lista completa está en \`inventario/flujos/hallazgos.json\`._`,
      );
    partes.push('');
  }
  return partes.join('\n');
}
