// Documentación Markdown del catálogo de datos: un archivo por schema con su diagrama
// entidad-relación por familias de tablas y la ficha de cada tabla.
import { id as idMermaid, etiqueta } from './mermaid.mjs';
import { code, md } from './markdown.mjs';

const CABECERA =
  '<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->';
const MAX_TABLAS_POR_DIAGRAMA = 40;
const MAX_ATRIBUTOS = 8;

function tabla(encabezados, filas) {
  if (!filas.length) return '';
  return [
    `| ${encabezados.join(' | ')} |`,
    `|${encabezados.map(() => '---').join('|')}|`,
    ...filas.map((f) => `| ${f.map((c) => md(c)).join(' | ')} |`),
  ].join('\n');
}
const mermaid = (texto) => ['```mermaid', texto, '```'].join('\n');
const sinPipes = (t) => String(t ?? '').replace(/\|/g, '¦');

/** Familias de tablas de un schema: componentes conexos por FK internas, troceados a ≤ 40 tablas. */
export function familiasDeTablas(tablas) {
  const nombres = new Set(tablas.map((t) => t.id));
  const vecinos = new Map(tablas.map((t) => [t.id, new Set()]));
  for (const t of tablas)
    for (const r of t.relaciones.salientes) {
      const destino = `${r.hacia.schema}.${r.hacia.tabla}`;
      if (nombres.has(destino) && destino !== t.id) {
        vecinos.get(t.id).add(destino);
        vecinos.get(destino).add(t.id);
      }
    }
  const visto = new Set();
  const componentes = [];
  for (const t of tablas) {
    if (visto.has(t.id)) continue;
    const orden = [];
    const cola = [t.id];
    visto.add(t.id);
    while (cola.length) {
      const actual = cola.shift();
      orden.push(actual);
      for (const v of [...vecinos.get(actual)].sort())
        if (!visto.has(v)) (visto.add(v), cola.push(v));
    }
    componentes.push(orden);
  }
  componentes.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  const familias = [];
  const sueltas = [];
  for (const componente of componentes) {
    if (componente.length === 1) sueltas.push(componente[0]);
    else
      for (let i = 0; i < componente.length; i += MAX_TABLAS_POR_DIAGRAMA)
        familias.push(componente.slice(i, i + MAX_TABLAS_POR_DIAGRAMA));
  }
  return { familias, sueltas };
}

function diagramaER(ids, porId) {
  const lineas = ['erDiagram'];
  const enFamilia = new Set(ids);
  const externas = new Set();
  const nombre = (k) => idMermaid(k);
  for (const k of ids) {
    const t = porId.get(k);
    const atributos = t.columnas
      .filter((c) => c.pk || c.fk.length)
      .slice(0, MAX_ATRIBUTOS);
    lineas.push(`  ${nombre(k)}["${etiqueta(k, 70)}"] {`);
    for (const c of atributos) {
      const marcas = [c.pk ? 'PK' : null, c.fk.length ? 'FK' : null]
        .filter(Boolean)
        .join(', ');
      lineas.push(
        `    ${idMermaid(c.tipo)} ${idMermaid(c.nombre)}${marcas ? ` ${marcas}` : ''}`,
      );
    }
    lineas.push('  }');
  }
  const aristas = [];
  for (const k of ids) {
    const t = porId.get(k);
    for (const r of t.relaciones.salientes) {
      const destino = `${r.hacia.schema}.${r.hacia.tabla}`;
      if (destino === k) continue;
      if (!enFamilia.has(destino)) {
        if (r.hacia.schema !== t.schema) continue; // las FK entre schemas se listan en la ficha, no se dibujan
        externas.add(destino);
      }
      const opcional = t.columnas
        .filter((c) => r.columnas.includes(c.nombre))
        .every((c) => c.nulable);
      aristas.push(
        `  ${nombre(k)} }o--${opcional ? 'o|' : '||'} ${nombre(destino)} : "${etiqueta(r.columnas[0] + (r.columnas.length > 1 ? '+' : ''), 30)}"`,
      );
    }
  }
  for (const e of [...externas].sort())
    lineas.push(`  ${nombre(e)}["${etiqueta(e, 70)}"]`);
  return [...lineas, ...aristas].join('\n');
}

function fichaDeTabla(t) {
  const partes = [
    `### ${t.tabla}`,
    '',
    `#### Vista general`,
    '',
    t.proposito.texto ? md(t.proposito.texto) : '_Sin propósito registrado._',
    '',
    `- **Estado del propósito:** ${t.proposito.estado}${t.proposito.fuente ? ` · fuente: ${code(t.proposito.fuente)}` : ''}`,
    `- **Dominio:** ${t.dominio ? md(t.dominio.dominio) : 'sin dato'} · **Diagrama:** ${code(t.diagrama)} · **DDL:** ${code(t.ddl)}`,
    `- **Entidad del ORM:** ${t.entidadOrm ? `${code(t.entidadOrm.clase)} — ${code(t.entidadOrm.archivo)}` : '**sin entidad** (deriva)'}`,
    `- **Resumen:** ${t.columnas.length} columnas · ${t.indices.length} índices · ${t.relaciones.salientes.length} FK salientes · ${t.relaciones.entrantes.length} entrantes · ${t.operaciones.length} operaciones`,
    '',
    '#### Columnas',
    '',
    tabla(
      ['#', 'Columna', 'Tipo', 'Rol estructural', 'Descripción', 'ORM'],
      t.columnas.map((c) => [
        String(c.ordinal),
        code(c.nombre),
        code(c.tipo + (c.defecto ? ` = ${c.defecto}` : '')),
        sinPipes(c.rol.join('; ')),
        c.descripcion.texto
          ? `${sinPipes(c.descripcion.texto)} _(${c.descripcion.tipo}, ${code(c.descripcion.fuente)})_`
          : '_sin dato_',
        c.orm.estado === 'COINCIDE'
          ? 'coincide'
          : `**${c.orm.estado}**${c.orm.detalle ? ` — ${sinPipes(c.orm.detalle.join('; '))}` : ''}`,
      ]),
    ),
  ];
  if (t.relaciones.salientes.length || t.relaciones.entrantes.length)
    partes.push(
      '',
      '#### Relaciones',
      '',
      tabla(
        ['Sentido', 'Columnas', 'Tabla', 'Restricción'],
        [
          ...t.relaciones.salientes.map((r) => [
            'hacia',
            r.columnas.join(', '),
            `${r.hacia.schema}.${r.hacia.tabla} (${r.hacia.columnas.join(', ')})`,
            r.constraint,
          ]),
          ...t.relaciones.entrantes.map((r) => [
            'desde',
            r.columnas.join(', '),
            `${r.desde.schema}.${r.desde.tabla} (${r.desde.columnas.join(', ')})`,
            r.constraint,
          ]),
        ].map((f) => f.map(sinPipes)),
      ),
    );
  if (t.indices.length)
    partes.push(
      '',
      '#### Índices',
      '',
      tabla(
        ['Índice', 'Único', 'Columnas', 'Para qué'],
        t.indices.map((i) => [
          code(i.nombre),
          i.unico ? 'sí' : 'no',
          sinPipes(
            i.columnas.map((c) => c.columna ?? `(${c.expresion})`).join(', '),
          ) + (i.predicado ? ` donde ${sinPipes(i.predicado)}` : ''),
          i.paraQue[0].estado
            ? '_sin uso detectado estáticamente_'
            : i.paraQue
                .map((p) => `${sinPipes(p.texto)} _(${p.tipo})_`)
                .join('; '),
        ]),
      ),
    );
  const restricciones = t.restricciones.filter(
    (r) =>
      r.tipo === 'CHECK' || r.tipo === 'EXCLUDE' || r.tipo === 'UNIQUE INDEX',
  );
  if (restricciones.length)
    partes.push(
      '',
      '#### Restricciones',
      '',
      tabla(
        ['Restricción', 'Tipo', 'Definición'],
        restricciones.map((r) => [
          code(r.nombre),
          r.tipo,
          sinPipes(r.definicion),
        ]),
      ),
    );
  partes.push(
    '',
    '#### Operaciones que la tocan',
    '',
    t.operaciones.length
      ? tabla(
          ['Operación', 'Efecto', 'Confianza'],
          t.operaciones.map((o) => [
            `${o.metodo} ${o.ruta}`,
            o.detalle,
            o.confianza,
          ]),
        )
      : '_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._',
    '',
    '#### Gobierno',
    '',
    tabla(
      ['Atributo', 'Valor', 'Fuente'],
      [
        [
          'Append-only',
          t.gobierno.appendOnly.valor ? 'sí (declarado)' : 'no declarado',
          (t.gobierno.appendOnly.fuentes ?? []).map(code).join(', ') || '—',
        ],
        ['Datos personales', 'sin fuente', '—'],
        ['Financiera', 'sin fuente', '—'],
        ['Crítica para auditoría', 'sin fuente', '—'],
        ['Retención', 'sin fuente', '—'],
        ['Responsable', 'sin fuente', '—'],
        ['Revisión', t.revision.estado, '—'],
      ],
    ),
    '',
    '---',
    '',
  );
  return partes.join('\n');
}

export function renderEsquema(schema, tablas) {
  const porId = new Map(tablas.map((t) => [t.id, t]));
  const { familias, sueltas } = familiasDeTablas(tablas);
  const columnas = tablas.flatMap((t) => t.columnas);
  const conDescripcion = columnas.filter((c) => c.descripcion.texto).length;
  const partes = [
    CABECERA,
    '',
    `# Catálogo del schema ${code(schema)}`,
    '',
    `- **Tablas:** ${tablas.length} · **Columnas:** ${columnas.length} (${conDescripcion} con descripción: ${((100 * conDescripcion) / Math.max(columnas.length, 1)).toFixed(1)} %) · **Índices:** ${tablas.reduce((n, t) => n + t.indices.length, 0)}`,
    `- **Dominio:** ${tablas[0].dominio ? md(tablas[0].dominio.dominio) : 'sin dato'}`,
    `- Método y límites del catálogo: [README del inventario](../README.md)`,
    '',
    '## Tablas',
    '',
    tabla(
      ['Tabla', 'Propósito', 'Columnas', 'Índices', 'Operaciones', 'ORM'],
      tablas.map((t) => [
        `[${t.tabla}](#${t.tabla.replaceAll('_', '_')})`,
        t.proposito.texto ?? 'sin propósito',
        String(t.columnas.length),
        String(t.indices.length),
        String(t.operaciones.length),
        t.deriva.orm.estado,
      ]),
    ),
  ];
  if (familias.length) {
    partes.push(
      '',
      '## Diagrama entidad-relación',
      '',
      'Las tablas se agrupan en familias por sus claves foráneas dentro del schema (máximo 40 por diagrama). Las FK hacia otros schemas se listan en la ficha de cada tabla.',
    );
    familias.forEach((ids, i) =>
      partes.push(
        '',
        `### Familia ${i + 1} de ${familias.length} — ${ids.length} tablas`,
        '',
        mermaid(diagramaER(ids, porId)),
      ),
    );
  }
  if (sueltas.length)
    partes.push(
      '',
      '### Tablas sin relaciones dentro del schema',
      '',
      sueltas.map((k) => code(k)).join(' · '),
    );
  partes.push('', '## Fichas', '');
  for (const t of tablas) partes.push(fichaDeTabla(t));
  return partes.join('\n');
}

export function renderIndiceCatalogo(esquemas, resumen) {
  return [
    CABECERA,
    '',
    '# Catálogo de datos',
    '',
    `**${resumen.tablas} tablas** en **${resumen.esquemas} schemas**, con ${resumen.columnas} columnas, ${resumen.indices} índices y ${resumen.relaciones} claves foráneas, leídas del DDL canónico del modelo.`,
    '',
    `- Columnas con descripción: ${resumen.columnasConDescripcion} (${((100 * resumen.columnasConDescripcion) / resumen.columnas).toFixed(1)} %). Por fuente: ${Object.entries(
      resumen.descripcionPorFuente,
    )
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')}. El resto dice «sin dato»: no se infiere por el nombre.`,
    `- Índices con «para qué»: ${resumen.indicesConParaQue} de ${resumen.indices}. El resto dice «sin uso detectado estáticamente».`,
    `- Tablas con entidad del ORM: ${resumen.tablasConEntidad} de ${resumen.tablas}. Deriva: [deriva.md](deriva.md).`,
    `- Tablas que alguna operación HTTP toca: ${resumen.tablasConOperaciones}. Tablas append-only declaradas en un README: ${resumen.tablasAppendOnlyDeclaradas}.`,
    '',
    'Otras vistas: [glosario](glosario.md).',
    '',
    tabla(
      ['Schema', 'Tablas', 'Columnas', 'Documento'],
      esquemas.map((e) => [
        code(e.schema),
        String(e.tablas),
        String(e.columnas),
        `[${e.schema}.md](${e.schema}.md)`,
      ]),
    ),
    '',
  ].join('\n');
}

export function renderDeriva(
  resumen,
  deriva,
  tablas,
  esquemasSinCatalogoDeApi,
  derivaBd = null,
) {
  const sinEntidad = tablas.filter((t) => !t.entidadOrm);
  const ausentes = tablas.flatMap((t) =>
    t.columnas
      .filter((c) => c.orm.estado === 'AUSENTE_EN_ORM')
      .map((c) => [
        `${t.id}.${c.nombre}`,
        c.tipo,
        c.nulable ? 'opcional' : 'obligatoria',
      ]),
  );
  const nulabilidad = tablas.flatMap((t) =>
    t.columnas
      .filter((c) => c.orm.estado === 'NULABILIDAD_DIVERGE')
      .map((c) => [`${t.id}.${c.nombre}`, (c.orm.detalle ?? []).join('; ')]),
  );
  return [
    CABECERA,
    '',
    '# Deriva entre el modelo, el ORM y la base',
    '',
    'Tres vistas del mismo esquema: el **DDL canónico del modelo** (fuente de verdad), las **entidades del ORM** y la **base desplegada**. Una diferencia no dice cuál tiene razón: dice que hay que mirarla (regla 97.2).',
    '',
    tabla(
      ['Concepto', 'Cantidad'],
      [
        ['Tablas en el DDL del modelo', String(resumen.tablas)],
        [
          'Entidades del ORM',
          String(resumen.tablasConEntidad + deriva.entidadesSinTabla.length),
        ],
        ['Tablas del DDL con entidad', String(resumen.tablasConEntidad)],
        ['Tablas del DDL **sin** entidad', String(sinEntidad.length)],
        [
          'Entidades del ORM **sin** tabla en el DDL',
          String(deriva.entidadesSinTabla.length),
        ],
        [
          'Columnas del DDL ausentes en su entidad',
          String(deriva.columnasAusentesEnOrm),
        ],
        ['Columnas con nulabilidad divergente', String(deriva.nulabilidad)],
        ['Columnas con tipo divergente', String(deriva.tipos)],
        [
          'Columnas de la entidad que el DDL no tiene',
          String(deriva.columnasDeMasEnOrm),
        ],
      ],
    ),
    '',
    '## Entidades del ORM sin tabla en el DDL',
    '',
    deriva.entidadesSinTabla.length
      ? tabla(
          ['Tabla que declara', 'Clase', 'Dónde la declara el modelo'],
          deriva.entidadesSinTabla.map((e) => [
            code(e.tabla),
            e.clase,
            e.ddl.tipo === 'NOSQL'
              ? `almacén no relacional: ${code(e.ddl.fuente)}`
              : e.ddl.tipo === 'PARCHE'
                ? `sólo en un parche: ${code(e.ddl.fuente)}`
                : '**en ninguna fuente de DDL del modelo**',
          ]),
        )
      : '_Ninguna._',
    '',
    '## Tablas del DDL sin entidad en el ORM',
    '',
    sinEntidad.length
      ? tabla(
          ['Tabla', 'Diagrama'],
          sinEntidad.map((t) => [code(t.id), code(t.diagrama)]),
        )
      : '_Ninguna._',
    '',
    '## Columnas del DDL ausentes en la entidad',
    '',
    ausentes.length
      ? tabla(['Columna', 'Tipo', 'En el modelo'], ausentes)
      : '_Ninguna._',
    '',
    '## Nulabilidad divergente',
    '',
    nulabilidad.length
      ? tabla(['Columna', 'Diferencia'], nulabilidad)
      : '_Ninguna._',
    '',
    '## Base desplegada',
    '',
    ...(derivaBd
      ? [
          `Se construyó una base descartable con ${md(derivaBd.fuente.aplicado)} (${md(derivaBd.fuente.servidor)}) y se comparó con el catálogo mediante \`tools/inventario/deriva-bd.mjs\`.`,
          '',
          tabla(
            ['Concepto', 'Cantidad'],
            [
              [
                'Tablas del catálogo / en la base',
                `${derivaBd.resumen.tablasDelCatalogo} / ${derivaBd.resumen.tablasEnBase}`,
              ],
              [
                'Tablas que coinciden por completo',
                String(derivaBd.resumen.tablasCoinciden),
              ],
              [
                'Tablas ausentes en la base',
                String(derivaBd.resumen.tablasAusentes),
              ],
              [
                'Columnas ausentes / de más',
                `${derivaBd.resumen.columnasAusentes} / ${derivaBd.resumen.columnasDeMas}`,
              ],
              ['Nulabilidad divergente', String(derivaBd.resumen.nulabilidad)],
              ['Tipo divergente', String(derivaBd.resumen.tipos)],
              [
                'Índices ausentes / de más',
                `${derivaBd.resumen.indicesAusentes} / ${derivaBd.resumen.indicesDeMas}`,
              ],
              ['FK ausentes', String(derivaBd.resumen.fkAusentes)],
            ],
          ),
          '',
          '**Alcance:** la base se construyó con el DDL canónico, no es una base de producción: demuestra que el modelo y su DDL son coherentes entre sí, no que un despliegue real esté al día. Los parches de `SQL/patches` no se aplicaron.',
        ]
      : [
          '_No se comparó con ninguna base: falta `inventario/catalogo/deriva-bd.json` (ver `tools/inventario/deriva-bd.mjs`)._',
        ]),
    '',
    '## Schemas del DDL que el catálogo de la API no declara',
    '',
    esquemasSinCatalogoDeApi.length
      ? esquemasSinCatalogoDeApi.map(code).join(' · ')
      : '_Ninguno._',
    '',
  ].join('\n');
}

export function renderGlosario(terminos) {
  return [
    CABECERA,
    '',
    '# Glosario',
    '',
    `${terminos.length} términos de los glosarios de la API y del frontend, con su fuente. Un término que figura en los dos se muestra dos veces: no se unifican definiciones. Los enlaces relativos de las definiciones se quitaron (apuntaban a otro árbol de documentos); queda su texto.`,
    '',
    tabla(
      ['Término', 'Definición', 'Tablas relacionadas', 'Fuente'],
      terminos.map((t) => [
        t.termino,
        sinPipes(t.definicion),
        t.tablasRelacionadas.map(code).join(', ') || '—',
        code(t.fuente),
      ]),
    ),
    '',
  ].join('\n');
}
