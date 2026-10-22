import { relative } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  BusquedaQueryDto,
  OperacionesQueryDto,
  PaginacionQueryDto,
  ProcesosQueryDto,
  TablasQueryDto,
} from '../dto/portal-query.dto';
import type {
  ArbolDto,
  DerivaCatalogoDto,
  GlosarioPaginaDto,
  GrafoDto,
  HallazgoDetalleDto,
  HallazgoResumenDto,
  LinajeDto,
  LinajeTablaDto,
  MapaPaginaDto,
  OperacionDetalleDto,
  OperacionesPaginaDto,
  OperacionResumenDto,
  PortalVersionDto,
  ProcesoDetalleDto,
  ProcesoResumenDto,
  ProcesosPaginaDto,
  TablaFichaDto,
  TablasPaginaDto,
} from '../dto/portal-response.dto';
import { InventoryRepository } from '../inventory/inventory.repository';
import { coincide, compararClaves, paginar } from '../inventory/paginacion';
import type {
  OperacionRecord,
  ProcesoRecord,
} from '../inventory/inventory.types';

/** Código de un archivo de grafo: `critico:scheduling` → `critico-scheduling.json`. */
const archivoDeGrafo = (codigo: string): string =>
  `${codigo.replace(/[^A-Za-z0-9_.-]/g, '-')}.json`;

const claveDeOperacion = (
  o: Pick<OperacionRecord, 'modulo' | 'ruta' | 'metodo' | 'id'>,
): string => `${o.modulo}|${o.ruta}|${o.metodo}|${o.id}`;

/**
 * Lecturas del inventario para el portal: operaciones, flujos, mapa, hallazgos, catálogo
 * estático, linaje y glosario.
 *
 * Es de **sólo lectura** y no consulta la base de datos: sirve lo que generó el inventario
 * (`tools/inventario/*.mjs`), que ya está versionado con el código. Cada vista elige qué campos
 * salen; no se devuelve el registro crudo.
 */
@Injectable()
export class PortalInventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  version(): PortalVersionDto {
    return {
      ...this.inventory.version(),
      origen: relative(process.cwd(), this.inventory.directory()) || '.',
    };
  }

  // ---- operaciones -------------------------------------------------------------------------

  private resumen(
    o: OperacionRecord,
    senales: Map<string, string[]>,
  ): OperacionResumenDto {
    return {
      id: o.id,
      metodo: o.metodo,
      ruta: o.ruta,
      modulo: o.modulo,
      nombre: o.nombre,
      origen: o.origen,
      riesgo: o.riesgo.nivel,
      publica: o.autenticacion.publica,
      roles: o.autenticacion.roles,
      tablas: o.tablas.length,
      flujos: o.flujos.map((f) => ({
        codigo: f.codigo,
        nombre: f.nombre,
        etapa: f.etapa,
        agrupacion: f.agrupacion,
      })),
      senales: senales.get(o.id) ?? [],
    };
  }

  private senales(): Map<string, string[]> {
    return new Map(this.inventory.mapa().map((f) => [f.id, f.señales]));
  }

  listarOperaciones(query: OperacionesQueryDto): OperacionesPaginaDto {
    const senales = this.senales();
    const filtradas = this.inventory
      .operaciones()
      .filter(
        (o) =>
          (!query.modulo || o.modulo === query.modulo) &&
          (!query.riesgo || o.riesgo.nivel === query.riesgo) &&
          (!query.metodo || o.metodo === query.metodo) &&
          (!query.origen || o.origen === query.origen) &&
          (!query.senal || (senales.get(o.id) ?? []).includes(query.senal)) &&
          (!query.flujo || o.flujos.some((f) => f.codigo === query.flujo)) &&
          coincide(query.q, o.ruta, o.nombre, o.codigo?.controlador, o.id),
      )
      .sort((a, b) => compararClaves(claveDeOperacion(a), claveDeOperacion(b)));
    const pagina = paginar(filtradas, claveDeOperacion, query);
    return {
      ...pagina,
      items: pagina.items.map((o) => this.resumen(o, senales)),
    };
  }

  private operacion(id: string): OperacionRecord {
    const encontrada = this.inventory.operaciones().find((o) => o.id === id);
    if (!encontrada)
      throw new NotFoundException('Operación no encontrada en el inventario');
    return encontrada;
  }

  detalleDeOperacion(id: string): OperacionDetalleDto {
    const o = this.operacion(id);
    return {
      ...this.resumen(o, this.senales()),
      bloque: o.bloque?.nombre ?? null,
      codigo: o.codigo?.fuente ?? null,
      negocio: o.explicacion.negocio,
      sistema: o.explicacion.sistema.texto,
      razonesDeRiesgo: o.riesgo.razones,
      requerimientos: o.requerimientos,
      parametros: o.parametros,
      cuerpo: o.cuerpo
        ? {
            dto: o.cuerpo.dto,
            contentType: o.cuerpo.contentType,
            obligatorio: o.cuerpo.obligatorio,
            campos: o.cuerpo.campos,
            payloadMinimo: o.cuerpo.payloadMinimo,
          }
        : null,
      respuesta: {
        tipoRetorno: o.respuesta.tipoRetorno,
        dto: o.respuesta.dto,
        httpCode: o.httpCode,
        campos: o.respuesta.campos,
      },
      respuestasPosibles: o.respuestasPosibles,
      datos: o.tablas.map((t) => ({
        schema: t.schema,
        tabla: t.tabla,
        operacion: t.operacion,
        detalle: t.detalle,
        confianza: t.confianza,
        via: t.via,
        fuente: t.fuente,
        catalogada: t.catalogada,
      })),
      eventos: o.eventos.map((e) => e.tipo ?? `calculado: ${e.expresion}`),
      trabajos: o.trabajos.map((t) => t.codigo ?? `calculado: ${t.expresion}`),
      noResuelto: o.noResuelto.map((n) => `${n.llamada} (${n.fuente})`),
      sinTablas: o.sinTablas?.motivo ?? null,
      pruebas: o.pruebas,
      revision: o.revision.estado,
      datosPersonales: o.datosPersonales.estado,
    };
  }

  arbolDeOperacion(id: string): ArbolDto {
    this.operacion(id);
    const arbol = this.inventory.arboles().get(id);
    if (!arbol)
      throw new NotFoundException('La operación no tiene árbol de decisión');
    return {
      id: arbol.id,
      nodos: arbol.nodos,
      respuestas: arbol.respuestas,
      truncado: arbol.truncado,
    };
  }

  // ---- procesos ----------------------------------------------------------------------------

  private resumenDeProceso(p: ProcesoRecord): ProcesoResumenDto {
    return {
      codigo: p.codigo,
      tipo: p.tipo,
      nombre: p.nombre,
      modulo: p.modulo,
      bloque: p.bloque,
      agrupacion: p.agrupacion,
      actores: p.actores,
      operaciones: p.operaciones,
      etapas: p.etapas.length,
      maquinas: p.maquinas,
      revision: p.revision.estado,
    };
  }

  listarProcesos(query: ProcesosQueryDto): ProcesosPaginaDto {
    const filtrados = this.inventory
      .procesos()
      .filter(
        (p) =>
          (!query.tipo || p.tipo === query.tipo) &&
          (!query.modulo ||
            p.modulo === query.modulo ||
            p.modulos?.includes(query.modulo)) &&
          (!query.agrupacion || p.agrupacion === query.agrupacion) &&
          coincide(query.q, p.nombre, p.codigo, p.paraQueSirve.texto),
      )
      .sort((a, b) => compararClaves(a.codigo, b.codigo));
    const pagina = paginar(filtrados, (p) => p.codigo, query);
    return {
      ...pagina,
      items: pagina.items.map((p) => this.resumenDeProceso(p)),
    };
  }

  private proceso(codigo: string): ProcesoRecord {
    const encontrado = this.inventory
      .procesos()
      .find((p) => p.codigo === codigo);
    if (!encontrado)
      throw new NotFoundException('Proceso no encontrado en el inventario');
    return encontrado;
  }

  detalleDeProceso(codigo: string): ProcesoDetalleDto {
    const p = this.proceso(codigo);
    const maquinas = this.inventory
      .maquinas()
      .filter((m) => p.maquinas.includes(m.codigo));
    return {
      ...this.resumenDeProceso(p),
      paraQueSirve: p.paraQueSirve.texto,
      paraQueSirveFuente: p.paraQueSirve.fuente,
      flujoGeneral: p.flujoGeneral?.texto ?? null,
      detalleDeEtapas: p.etapas.map((e) => ({
        codigo: e.codigo,
        nombre: e.nombre,
        fuente: e.fuente,
        agrupacion: e.agrupacion,
        operaciones: e.operaciones,
      })),
      maquinasDeEstado: maquinas.map((m) => ({
        codigo: m.codigo,
        fuente: m.fuente,
        estados: m.estados,
        transiciones: m.transiciones,
        iniciales: m.iniciales,
        terminales: m.terminales,
        operaciones: m.operaciones,
      })),
      fuentes: p.fuentes,
    };
  }

  grafoDeProceso(codigo: string): GrafoDto {
    this.proceso(codigo);
    const g = this.inventory.grafo(archivoDeGrafo(codigo));
    return {
      proceso: g.proceso,
      nombre: g.nombre,
      roles: g.roles,
      nodos: g.nodos,
      aristas: g.aristas,
    };
  }

  // ---- mapa y hallazgos --------------------------------------------------------------------

  mapa(query: OperacionesQueryDto): MapaPaginaDto {
    const filtradas = this.inventory
      .mapa()
      .filter(
        (f) =>
          (!query.modulo || f.modulo === query.modulo) &&
          (!query.riesgo || f.riesgo === query.riesgo) &&
          (!query.metodo || f.metodo === query.metodo) &&
          (!query.senal || f.señales.includes(query.senal)) &&
          (!query.flujo || f.flujos.some((x) => x.codigo === query.flujo)) &&
          coincide(query.q, f.ruta, f.modulo, f.autorizacion),
      )
      .sort((a, b) => compararClaves(claveDeOperacion(a), claveDeOperacion(b)));
    const pagina = paginar(filtradas, claveDeOperacion, query);
    return {
      ...pagina,
      items: pagina.items.map((f) => ({
        id: f.id,
        metodo: f.metodo,
        ruta: f.ruta,
        flujos: f.flujos.map((x) => ({
          ...x,
          agrupacion: 'CASO_DE_USO_README',
        })),
        modulo: f.modulo,
        riesgo: f.riesgo,
        autorizacion: f.autorizacion,
        llamadaPor: f.llamadaPor,
        senales: f.señales,
      })),
    };
  }

  hallazgos(): HallazgoResumenDto[] {
    return this.inventory
      .hallazgos()
      .map(({ id, severidad, titulo, queHacer, cuenta }) => ({
        id,
        severidad,
        titulo,
        queHacer,
        cuenta,
      }));
  }

  detalleDeHallazgo(id: string, query: PaginacionQueryDto): HallazgoDetalleDto {
    const h = this.inventory.hallazgos().find((x) => x.id === id);
    if (!h) throw new NotFoundException('Hallazgo no encontrado');
    const items = h.items.map((item, i) => ({
      item,
      clave: String(i).padStart(6, '0'),
    }));
    const pagina = paginar(items, (x) => x.clave, query);
    return {
      id: h.id,
      severidad: h.severidad,
      titulo: h.titulo,
      queHacer: h.queHacer,
      cuenta: h.cuenta,
      items: pagina.items.map((x) => x.item),
      nextCursor: pagina.nextCursor,
      limit: pagina.limit,
    };
  }

  // ---- catálogo estático -------------------------------------------------------------------

  listarTablas(query: TablasQueryDto): TablasPaginaDto {
    const filtradas = this.inventory
      .catalogoIndice()
      .tablas.filter(
        (t) =>
          (!query.schema || t.schema === query.schema) &&
          (!query.orm || t.orm === query.orm) &&
          (query.appendOnly === undefined ||
            t.appendOnly === query.appendOnly) &&
          coincide(query.q, t.id, t.dominio),
      )
      .sort((a, b) => compararClaves(a.id, b.id));
    return paginar(filtradas, (t) => t.id, query);
  }

  fichaDeTabla(schema: string, tabla: string): TablaFichaDto {
    const enIndice = this.inventory
      .catalogoIndice()
      .tablas.some((t) => t.schema === schema && t.tabla === tabla);
    if (!enIndice)
      throw new NotFoundException('Tabla no encontrada en el catálogo');
    const t = this.inventory
      .tablasDeSchema(schema)
      .find((x) => x.tabla === tabla);
    if (!t) throw new NotFoundException('Tabla no encontrada en el catálogo');
    return {
      id: t.id,
      schema: t.schema,
      tabla: t.tabla,
      dominio: t.dominio?.dominio ?? null,
      diagrama: t.diagrama,
      ddl: t.ddl,
      proposito: t.proposito.texto,
      propositoEstado: t.proposito.estado,
      propositoFuente: t.proposito.fuente,
      entidadOrm: t.entidadOrm?.clase ?? null,
      gobierno: t.gobierno,
      columnas: t.columnas,
      relaciones: t.relaciones,
      indices: t.indices,
      restricciones: t.restricciones,
      operaciones: t.operaciones,
      deriva: t.deriva,
      revision: t.revision.estado,
    };
  }

  derivaDelCatalogo(): DerivaCatalogoDto {
    const { resumen, deriva } = this.inventory.catalogoIndice();
    return { resumen, deriva };
  }

  // ---- linaje y glosario -------------------------------------------------------------------

  linaje(): LinajeDto {
    const l = this.inventory.linaje();
    const tablasPorDominio = new Map<string, number>();
    const dominioDeTabla = new Map<string, string>();
    for (const a of l.aristas)
      if (a.tipo === 'PERTENECE') dominioDeTabla.set(a.de, a.a);
    for (const d of dominioDeTabla.values())
      tablasPorDominio.set(d, (tablasPorDominio.get(d) ?? 0) + 1);
    return {
      metricas: l.metricas,
      dominios: l.nodos
        .filter((n) => n.tipo === 'DOMINIO')
        .map((n) => ({
          id: n.id,
          etiqueta: n.etiqueta,
          tablas: tablasPorDominio.get(n.id) ?? 0,
        })),
    };
  }

  linajeDeTabla(schema: string, tabla: string): LinajeTablaDto {
    const id = `${schema}.${tabla}`;
    const l = this.inventory.linaje();
    if (!l.nodos.some((n) => n.id === `tabla:${id}`))
      throw new NotFoundException('Tabla no encontrada en el linaje');
    const nodo = `tabla:${id}`;
    const etiqueta = new Map(l.nodos.map((n) => [n.id, n.etiqueta]));
    const operaciones = l.aristas
      .filter(
        (a) => a.a === nodo && ['LEE', 'ESCRIBE', 'BORRA'].includes(a.tipo),
      )
      .map((a) => ({
        operacion: etiqueta.get(a.de) ?? a.de,
        id: a.de.replace(/^op:/, ''),
        efecto: a.tipo,
      }))
      .sort((a, b) => a.operacion.localeCompare(b.operacion, 'en'));
    const tablaDe = (n: string): string => (etiqueta.get(n) ?? n).toString();
    return {
      id,
      operaciones,
      referencia: l.aristas
        .filter((a) => a.tipo === 'REFERENCIA' && a.de === nodo)
        .map((a) => tablaDe(a.a))
        .sort(),
      referenciadaPor: l.aristas
        .filter((a) => a.tipo === 'REFERENCIA' && a.a === nodo)
        .map((a) => tablaDe(a.de))
        .sort(),
    };
  }

  glosario(query: BusquedaQueryDto): GlosarioPaginaDto {
    const filtrados = this.inventory
      .glosario()
      .filter((g) => coincide(query.q, g.termino, g.definicion))
      .map((g) => ({ ...g, clave: `${g.termino.toLowerCase()}|${g.fuente}` }))
      .sort((a, b) => compararClaves(a.clave, b.clave));
    const pagina = paginar(filtrados, (g) => g.clave, query);
    return {
      ...pagina,
      items: pagina.items.map(
        ({ termino, definicion, fuente, tablasRelacionadas }) => ({
          termino,
          definicion,
          fuente,
          tablasRelacionadas,
        }),
      ),
    };
  }
}
