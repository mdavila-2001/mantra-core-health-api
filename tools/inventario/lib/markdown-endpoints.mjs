// Documentación Markdown del inventario de endpoints, un archivo por módulo.
// Es una vista de lectura de los registros del inventario: no calcula nada propio.
import { code, md, slug } from './markdown.mjs';

const CABECERA =
  '<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->';

function tabla(encabezados, filas) {
  if (!filas.length) return '';
  return [
    `| ${encabezados.join(' | ')} |`,
    `|${encabezados.map(() => '---').join('|')}|`,
    ...filas.map((fila) => `| ${fila.map((celda) => md(celda)).join(' | ')} |`),
  ].join('\n');
}

function bloqueJson(valor) {
  return ['```json', JSON.stringify(valor, null, 2), '```'].join('\n');
}

function seccionTablas(e) {
  if (!e.tablas.length)
    return e.sinTablas?.motivo
      ? `No toca tablas relacionales: ${md(e.sinTablas.motivo)}. _(${e.sinTablas.revision}; fuente: ${code(e.sinTablas.fuente)})_`
      : 'No se determinaron tablas para esta operación (**SIN_DETERMINAR**).';
  return tabla(
    ['Tabla', 'Operación', 'Detalle', 'Confianza', 'Camino', 'Fuente'],
    e.tablas.map((t) => [
      code(
        `${t.schema}.${t.tabla}${t.catalogada ? '' : ' (vista u objeto no catalogado)'}`,
      ),
      t.operacion,
      t.detalle,
      t.confianza,
      t.via.join(' → '),
      code(t.fuente),
    ]),
  );
}

function seccionCampos(campos) {
  return tabla(
    [
      'Campo',
      'Tipo',
      'Obligatorio',
      'Restricciones',
      'Decoradores',
      'Descripción',
      'Fuente',
    ],
    campos.map((c) => [
      code(c.campo),
      code(c.tipo),
      c.obligatorio ? 'Sí' : 'No',
      c.restricciones.join('; ') || '—',
      c.decoradores.map(code).join(' ') || '—',
      c.descripcion ?? '—',
      c.fuente ? code(c.fuente) : 'sin fuente',
    ]),
  );
}

function renderEndpoint(e, ordinal) {
  const partes = [
    `## ${ordinal}. ${e.metodo} ${e.ruta}`,
    '',
    `- **Origen:** ${e.origen}${e.origen === 'CONTRATO_AUSENTE' ? ' _(existe en el código pero `openapi.json` no la publica)_' : ''}`,
    `- **Nombre:** ${md(e.nombre ?? '—')}`,
    `- **Bloque:** ${e.bloque ? md(e.bloque.nombre) : '—'}`,
    `- **Riesgo:** ${e.riesgo.nivel} — ${md(e.riesgo.razones.join('; '))}`,
    `- **Revisión:** ${e.revision.estado} · **Datos personales:** ${e.datosPersonales.estado}`,
    `- **Implementación:** ${e.codigo ? `${code(`${e.codigo.controlador}.${e.codigo.handler}`)} — ${code(e.codigo.fuente)}` : 'no localizada'}`,
    '',
    '### Qué es y para qué sirve (negocio)',
    '',
    e.explicacion.negocio.texto ??
      '_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._',
    '',
    e.explicacion.negocio.fuentes.length
      ? `_Fuentes:_ ${e.explicacion.negocio.fuentes.map((f) => `${f.tipo} (${code(f.referencia)})`).join(' · ')}`
      : '',
    '',
    '### Cómo se atiende (sistema)',
    '',
    e.explicacion.sistema.texto,
    '',
    '### Requerimientos',
    '',
    tabla(
      ['Tipo', 'Detalle', 'Fuente'],
      e.requerimientos.map((r) => [r.tipo, r.detalle, code(r.fuente)]),
    ),
    '',
    '### Tablas que afecta',
    '',
    seccionTablas(e),
  ];

  if (e.eventos.length || e.trabajos.length) {
    partes.push('', '### Eventos y trabajos', '');
    partes.push(
      tabla(
        ['Tipo', 'Nombre', 'Fuente'],
        [
          ...e.eventos.map((x) => [
            'Evento de dominio',
            x.tipo ? code(x.tipo) : `calculado: ${code(x.expresion)}`,
            code(x.fuente),
          ]),
          ...e.trabajos.map((x) => [
            'Trabajo encolado',
            x.codigo ? code(x.codigo) : `calculado: ${code(x.expresion)}`,
            code(x.fuente),
          ]),
        ],
      ),
    );
  }
  if (e.noResuelto.length)
    partes.push(
      '',
      '**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):',
      '',
      ...e.noResuelto.map((x) => `- ${code(x.llamada)} — ${code(x.fuente)}`),
    );

  if (e.parametros.length)
    partes.push(
      '',
      '### Parámetros',
      '',
      tabla(
        ['Nombre', 'En', 'Obligatorio', 'Tipo', 'Descripción'],
        e.parametros.map((p) => [
          code(p.nombre ?? '—'),
          p.en,
          p.obligatorio === null ? 'sin dato' : p.obligatorio ? 'Sí' : 'No',
          p.tipo ? code(p.tipo) : '—',
          p.descripcion ?? '—',
        ]),
      ),
    );

  if (e.cuerpo) {
    partes.push(
      '',
      `### Cuerpo — DTO ${e.cuerpo.dto ? code(e.cuerpo.dto) : '(no identificado)'}${e.cuerpo.contentType ? ` · ${code(e.cuerpo.contentType)}` : ''}`,
      '',
      e.cuerpo.campos.length
        ? seccionCampos(e.cuerpo.campos)
        : '_El DTO no declara campos documentables, o no se pudo leer._',
    );
    if (e.cuerpo.payloadMinimo !== null)
      partes.push(
        '',
        '**Payload mínimo** (sólo los obligatorios):',
        '',
        bloqueJson(e.cuerpo.payloadMinimo),
      );
    if (e.cuerpo.payloadCompleto !== null && e.cuerpo.campos.length)
      partes.push(
        '',
        '<details><summary>Payload completo de ejemplo</summary>',
        '',
        bloqueJson(e.cuerpo.payloadCompleto),
        '',
        '</details>',
      );
  } else partes.push('', '### Cuerpo', '', 'La operación no recibe cuerpo.');

  partes.push(
    '',
    `### Respuesta — ${e.respuesta.tipoRetorno ? code(e.respuesta.tipoRetorno) : 'tipo no declarado'}${e.respuesta.dto ? ` · DTO ${code(e.respuesta.dto)}` : ''}${e.httpCode ? ` · HTTP ${code(e.httpCode)}` : ''}`,
    '',
    e.respuesta.campos.length
      ? seccionCampos(e.respuesta.campos)
      : '_No se identificó un DTO de respuesta con campos._',
    '',
    '### Pruebas que la mencionan',
    '',
    e.pruebas.length
      ? tabla(
          ['Tipo', 'Archivo'],
          e.pruebas.map((p) => [p.tipo, code(`${p.archivo}:${p.linea}`)]),
        )
      : '_Ninguna prueba existente menciona esta operación._',
    '',
    '### Flujos',
    '',
    e.flujos.length
      ? e.flujos.map((f) => `- ${f.nombre}`).join('\n')
      : '_Se completa en la fase de flujos._',
    '',
    '---',
    '',
  );
  return partes.join('\n');
}

export function renderModulo(modulo, endpoints) {
  const porRiesgo = (nivel) =>
    endpoints.filter((e) => e.riesgo.nivel === nivel).length;
  const tablas = new Set(
    endpoints.flatMap((e) => e.tablas.map((t) => `${t.schema}.${t.tabla}`)),
  );
  const bloque = endpoints.find((e) => e.bloque)?.bloque;
  return [
    CABECERA,
    '',
    `# Endpoints del módulo ${code(modulo)}`,
    '',
    `- **Bloque:** ${bloque ? `${md(bloque.nombre)} (${code(bloque.fuente)})` : '—'}`,
    `- **Operaciones:** ${endpoints.length} (${endpoints.filter((e) => e.origen === 'CONTRATO').length} en el contrato, ${endpoints.filter((e) => e.origen === 'CONTRATO_AUSENTE').length} sólo en el código)`,
    `- **Riesgo:** ALTO ${porRiesgo('ALTO')} · MEDIO ${porRiesgo('MEDIO')} · BAJO ${porRiesgo('BAJO')}`,
    `- **Tablas distintas que tocan:** ${tablas.size}`,
    `- **Respuestas de error y detalle contractual:** ${code(`openapi/endpoints/${slug(modulo)}.md`)} (generado aparte por \`yarn docs:endpoints:generate\`)`,
    '',
    '## Índice',
    '',
    tabla(
      ['#', 'Método', 'Ruta', 'Nombre', 'Riesgo', 'Tablas', 'Acceso'],
      endpoints.map((e, i) => [
        String(i + 1),
        e.metodo,
        code(e.ruta),
        e.nombre ?? '—',
        e.riesgo.nivel,
        String(e.tablas.length),
        e.autenticacion.publica
          ? 'pública'
          : e.autenticacion.roles.join(', ') || 'sesión (sin roles)',
      ]),
    ),
    '',
    '---',
    '',
    ...endpoints.map((e, i) => renderEndpoint(e, i + 1)),
  ].join('\n');
}

export function renderIndice(modulos, resumen) {
  return [
    CABECERA,
    '',
    '# Inventario de endpoints',
    '',
    `Se inventarían **${resumen.total} operaciones HTTP** en **${modulos.length} módulos**: ${resumen.porOrigen.CONTRATO ?? 0} publicadas en el contrato OpenAPI y ${resumen.porOrigen.CONTRATO_AUSENTE ?? 0} que existen sólo en el código.`,
    '',
    `- Con al menos una tabla identificada: ${resumen.conTablas}`,
    `- Riesgo ALTO ${resumen.porRiesgo.ALTO ?? 0} · MEDIO ${resumen.porRiesgo.MEDIO ?? 0} · BAJO ${resumen.porRiesgo.BAJO ?? 0}`,
    `- Mencionadas por al menos una prueba: ${resumen.conPruebas}`,
    '',
    'Cómo se obtiene cada dato, qué significa su `confianza` y qué no se afirma: [README del inventario](../README.md).',
    '',
    tabla(
      ['Módulo', 'Operaciones', 'Riesgo alto', 'Documento'],
      modulos.map((m) => [
        code(m.modulo),
        String(m.operaciones),
        String(m.riesgoAlto),
        `[${m.modulo}.md](${m.modulo}.md)`,
      ]),
    ),
    '',
  ].join('\n');
}
