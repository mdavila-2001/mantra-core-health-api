import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Datos de qué versión del inventario se está mostrando. */
export class PortalVersionDto {
  @ApiProperty({
    description: 'Huella del inventario: cambia cuando cambia su contenido',
  })
  hash!: string;
  @ApiProperty() operaciones!: number;
  @ApiProperty() procesos!: number;
  @ApiProperty() tablas!: number;
  @ApiProperty() columnas!: number;
  @ApiProperty({
    description:
      'Directorio del que se leyó el inventario, relativo al proceso',
  })
  origen!: string;
}

export class FlujoRefDto {
  @ApiProperty({ example: 'scheduling' }) codigo!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty({
    description: 'Etapa (caso de uso o controlador) dentro del proceso',
  })
  etapa!: string;
  @ApiProperty({
    enum: [
      'CASO_DE_USO_README',
      'AGRUPACION_POR_CONTROLADOR',
      'CURADO_EN_DOCUMENTO',
    ],
  })
  agrupacion!: string;
}

export class OperacionResumenDto {
  @ApiProperty({ example: 'SchedulingController_placeHold' }) id!: string;
  @ApiProperty() metodo!: string;
  @ApiProperty() ruta!: string;
  @ApiProperty() modulo!: string;
  @ApiPropertyOptional({ nullable: true }) nombre!: string | null;
  @ApiProperty({ enum: ['CONTRATO', 'CONTRATO_AUSENTE'] }) origen!: string;
  @ApiProperty({ enum: ['ALTO', 'MEDIO', 'BAJO'] }) riesgo!: string;
  @ApiProperty() publica!: boolean;
  @ApiProperty({ type: [String] }) roles!: string[];
  @ApiProperty({ description: 'Cantidad de tablas que toca' }) tablas!: number;
  @ApiProperty({ type: [FlujoRefDto] }) flujos!: FlujoRefDto[];
  @ApiProperty({
    type: [String],
    description: 'Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…)',
  })
  senales!: string[];
}

export class OperacionesPaginaDto {
  @ApiProperty({ type: [OperacionResumenDto] }) items!: OperacionResumenDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}

export class ParametroDto {
  @ApiPropertyOptional({ nullable: true }) nombre!: string | null;
  @ApiProperty({ description: 'path, query, header o cookie' }) en!: string;
  @ApiPropertyOptional({ nullable: true }) obligatorio!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) tipo!: string | null;
  @ApiPropertyOptional({ nullable: true }) descripcion!: string | null;
}

export class CampoDto {
  @ApiProperty() campo!: string;
  @ApiProperty() tipo!: string;
  @ApiProperty() obligatorio!: boolean;
  @ApiProperty({
    type: [String],
    description: 'Restricciones leídas del DTO (formato, longitud, rango…)',
  })
  restricciones!: string[];
  @ApiPropertyOptional({ nullable: true }) descripcion!: string | null;
  @ApiPropertyOptional({ description: 'Ejemplo sintético' }) ejemplo?: unknown;
  @ApiPropertyOptional({
    nullable: true,
    description: 'archivo:línea del campo',
  })
  fuente!: string | null;
}

export class RequerimientoDto {
  @ApiProperty({ example: 'ROL' }) tipo!: string;
  @ApiProperty() detalle!: string;
  @ApiProperty({ description: 'archivo:línea de donde se leyó' })
  fuente!: string;
}

export class TablaOperacionDto {
  @ApiProperty() schema!: string;
  @ApiProperty() tabla!: string;
  @ApiProperty({ enum: ['LEE', 'ESCRIBE', 'BORRA'] }) operacion!: string;
  @ApiProperty({ description: 'CREA, ACTUALIZA, GUARDA, BORRA o LEE' })
  detalle!: string;
  @ApiProperty({ enum: ['DIRECTA', 'POR_TIPO', 'POR_REGISTRO', 'POR_SQL'] })
  confianza!: string;
  @ApiProperty({
    type: [String],
    description: 'Camino handler → servicio → repositorio',
  })
  via!: string[];
  @ApiProperty() fuente!: string;
  @ApiProperty({
    description:
      '`false` si es una vista u objeto que no es una tabla del catálogo',
  })
  catalogada!: boolean;
}

export class RespuestaPosibleDto {
  @ApiProperty() estado!: number;
  @ApiPropertyOptional({ nullable: true }) codigo!: string | null;
  @ApiProperty({ type: [String] }) causas!: string[];
}

export class PruebaDto {
  @ApiProperty({ enum: ['CONTROLADOR', 'INTEGRACION'] }) tipo!: string;
  @ApiProperty() archivo!: string;
  @ApiProperty() linea!: number;
}

export class ExplicacionNegocioDto {
  @ApiPropertyOptional({ nullable: true }) texto!: string | null;
  @ApiProperty({
    description: '`AUTO_DETECTADA` hasta que una persona la revise',
  })
  estado!: string;
  @ApiProperty({ description: 'Fuentes con las que se compuso el texto' })
  fuentes!: { tipo: string; referencia: string }[];
}

export class CuerpoDto {
  @ApiPropertyOptional({ nullable: true }) dto!: string | null;
  @ApiPropertyOptional({ nullable: true }) contentType!: string | null;
  @ApiPropertyOptional({ nullable: true }) obligatorio!: boolean | null;
  @ApiProperty({ type: [CampoDto] }) campos!: CampoDto[];
  @ApiProperty({
    description:
      'Sólo los campos obligatorios, con valores de ejemplo sintéticos',
  })
  payloadMinimo!: unknown;
}

export class RespuestaContratoDto {
  @ApiPropertyOptional({ nullable: true }) tipoRetorno!: string | null;
  @ApiPropertyOptional({ nullable: true }) dto!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Código de éxito declarado con @HttpCode',
  })
  httpCode!: string | null;
  @ApiProperty({ type: [CampoDto] }) campos!: CampoDto[];
}

/** Ficha de una operación, organizada en las pestañas del portal. */
export class OperacionDetalleDto extends OperacionResumenDto {
  @ApiPropertyOptional({ nullable: true }) bloque!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'archivo:línea del handler',
  })
  codigo!: string | null;
  @ApiProperty({ type: ExplicacionNegocioDto }) negocio!: ExplicacionNegocioDto;
  @ApiProperty({
    description: 'Cómo la atiende el sistema (controlador, servicio, tablas)',
  })
  sistema!: string;
  @ApiProperty({
    type: [String],
    description: 'Por qué tiene ese nivel de riesgo',
  })
  razonesDeRiesgo!: string[];
  @ApiProperty({ type: [RequerimientoDto] })
  requerimientos!: RequerimientoDto[];
  @ApiProperty({ type: [ParametroDto] }) parametros!: ParametroDto[];
  @ApiPropertyOptional({ type: CuerpoDto, nullable: true })
  cuerpo!: CuerpoDto | null;
  @ApiProperty({ type: RespuestaContratoDto }) respuesta!: RespuestaContratoDto;
  @ApiProperty({ type: [RespuestaPosibleDto] })
  respuestasPosibles!: RespuestaPosibleDto[];
  @ApiProperty({ type: [TablaOperacionDto] }) datos!: TablaOperacionDto[];
  @ApiProperty({ type: [String] }) eventos!: string[];
  @ApiProperty({ type: [String] }) trabajos!: string[];
  @ApiProperty({
    type: [String],
    description:
      'Llamadas cuyo destino depende de un dato en ejecución: no se siguieron',
  })
  noResuelto!: string[];
  @ApiPropertyOptional({
    nullable: true,
    description: 'Por qué no toca tablas, si está curado a mano',
  })
  sinTablas!: string | null;
  @ApiProperty({
    type: [PruebaDto],
    description:
      'Pruebas que mencionan la operación (búsqueda textual, no cobertura)',
  })
  pruebas!: PruebaDto[];
  @ApiProperty({
    description: '`AUTO_DETECTADA` hasta que una persona la revise',
  })
  revision!: string;
  @ApiProperty({
    description:
      'Siempre `SIN_FUENTE` mientras no exista una clasificación de datos personales',
  })
  datosPersonales!: string;
}

export class ArbolDto {
  @ApiProperty() id!: string;
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Nodos del árbol: ACCESO, SI, SEGUN, BUCLE, INTENTAR, TRANSACCION, LLAMADA, ERROR, EFECTO, EVENTO, TRABAJO, RESPUESTA',
  })
  nodos!: unknown[];
  @ApiProperty({ type: [RespuestaPosibleDto] })
  respuestas!: RespuestaPosibleDto[];
  @ApiProperty({ description: '`true` si el árbol se cortó por tope de nodos' })
  truncado!: boolean;
}

export class ProcesoResumenDto {
  @ApiProperty() codigo!: string;
  @ApiProperty({ enum: ['MODULO', 'CRITICO'] }) tipo!: string;
  @ApiProperty() nombre!: string;
  @ApiPropertyOptional({ nullable: true }) modulo!: string | null;
  @ApiPropertyOptional({ nullable: true }) bloque!: string | null;
  @ApiProperty() agrupacion!: string;
  @ApiProperty({ type: [String] }) actores!: string[];
  @ApiProperty() operaciones!: number;
  @ApiProperty() etapas!: number;
  @ApiProperty({ type: [String] }) maquinas!: string[];
  @ApiProperty() revision!: string;
}

export class ProcesosPaginaDto {
  @ApiProperty({ type: [ProcesoResumenDto] }) items!: ProcesoResumenDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}

export class EtapaDto {
  @ApiProperty() codigo!: string;
  @ApiProperty() nombre!: string;
  @ApiPropertyOptional({ nullable: true }) fuente!: string | null;
  @ApiPropertyOptional() agrupacion?: string;
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Operaciones de la etapa con quién actúa y qué efectos tiene',
  })
  operaciones!: unknown[];
}

export class MaquinaDto {
  @ApiProperty() codigo!: string;
  @ApiProperty() fuente!: string;
  @ApiProperty({ type: [String] }) estados!: string[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  transiciones!: unknown[];
  @ApiProperty({ type: [String] }) iniciales!: string[];
  @ApiProperty({ type: [String] }) terminales!: string[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Operaciones que la ejercen (POR_REFERENCIA)',
  })
  operaciones!: unknown[];
}

export class ProcesoDetalleDto extends ProcesoResumenDto {
  @ApiPropertyOptional({ nullable: true }) paraQueSirve!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'archivo:línea de donde sale «para qué sirve»',
  })
  paraQueSirveFuente!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Diagrama declarado en el README del módulo, tal cual',
  })
  flujoGeneral!: string | null;
  @ApiProperty({ type: [EtapaDto] }) detalleDeEtapas!: EtapaDto[];
  @ApiProperty({ type: [MaquinaDto] }) maquinasDeEstado!: MaquinaDto[];
  @ApiProperty({ type: [String] }) fuentes!: string[];
}

export class GrafoDto {
  @ApiProperty() proceso!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty({ type: [String] }) roles!: string[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  nodos!: unknown[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  aristas!: unknown[];
}

export class MapaFilaDto {
  @ApiProperty() id!: string;
  @ApiProperty() metodo!: string;
  @ApiProperty() ruta!: string;
  @ApiProperty({ type: [FlujoRefDto] }) flujos!: {
    codigo: string;
    nombre: string;
    etapa: string;
  }[];
  @ApiProperty() modulo!: string;
  @ApiProperty({ enum: ['ALTO', 'MEDIO', 'BAJO'] }) riesgo!: string;
  @ApiProperty({ description: 'Pública, los roles o «Sesión sin roles»' })
  autorizacion!: string;
  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: '`null` si no se pudo cruzar con el frontend',
  })
  llamadaPor!: string[] | null;
  @ApiProperty({ type: [String] }) senales!: string[];
}

export class MapaPaginaDto {
  @ApiProperty({ type: [MapaFilaDto] }) items!: MapaFilaDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}

export class HallazgoResumenDto {
  @ApiProperty({ example: 'FLU-02' }) id!: string;
  @ApiProperty({ enum: ['ALTA', 'MEDIA', 'BAJA', 'INFO'] }) severidad!: string;
  @ApiProperty() titulo!: string;
  @ApiProperty() queHacer!: string;
  @ApiProperty() cuenta!: number;
}

export class HallazgoDetalleDto extends HallazgoResumenDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  items!: Record<string, unknown>[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class TablaResumenDto {
  @ApiProperty({ example: 'scheduling.slot_holds' }) id!: string;
  @ApiProperty() schema!: string;
  @ApiProperty() tabla!: string;
  @ApiPropertyOptional({ nullable: true }) dominio!: string | null;
  @ApiProperty() columnas!: number;
  @ApiProperty() indices!: number;
  @ApiProperty() operaciones!: number;
  @ApiProperty({ enum: ['COINCIDE', 'DIVERGE', 'SIN_ENTIDAD'] }) orm!: string;
  @ApiProperty() appendOnly!: boolean;
}

export class TablasPaginaDto {
  @ApiProperty({ type: [TablaResumenDto] }) items!: TablaResumenDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}

/** Ficha de una tabla: vista general, columnas, relaciones, índices, operaciones y gobierno. */
export class TablaFichaDto {
  @ApiProperty() id!: string;
  @ApiProperty() schema!: string;
  @ApiProperty() tabla!: string;
  @ApiPropertyOptional({ nullable: true }) dominio!: string | null;
  @ApiProperty({ description: 'Diagrama del modelo del que sale' })
  diagrama!: string;
  @ApiProperty({ description: 'DDL del que sale' }) ddl!: string;
  @ApiPropertyOptional({ nullable: true }) proposito!: string | null;
  @ApiProperty({
    description:
      'Estado de la revisión del propósito (hoy `DOMAIN_CURATED_DRAFT`)',
  })
  propositoEstado!: string;
  @ApiPropertyOptional({ nullable: true }) propositoFuente!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Clase de la entidad del ORM',
  })
  entidadOrm!: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true })
  gobierno!: Record<string, unknown>;
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Columnas con rol estructural y descripción (con fuente o «sin dato»)',
  })
  columnas!: Record<string, unknown>[];
  @ApiProperty({ type: 'object', additionalProperties: true }) relaciones!: {
    salientes: unknown[];
    entrantes: unknown[];
  };
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Índices con su «para qué»',
  })
  indices!: Record<string, unknown>[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  restricciones!: Record<string, unknown>[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Operaciones HTTP que la tocan',
  })
  operaciones!: Record<string, unknown>[];
  @ApiProperty({ type: 'object', additionalProperties: true }) deriva!: Record<
    string,
    unknown
  >;
  @ApiProperty() revision!: string;
}

export class DerivaCatalogoDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Cifras del catálogo',
  })
  resumen!: Record<string, unknown>;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Entidades sin tabla, tablas sin entidad, columnas ausentes, nulabilidad, schemas sin catálogo de la API',
  })
  deriva!: Record<string, unknown>;
}

export class LinajeDominioDto {
  @ApiProperty() id!: string;
  @ApiProperty() etiqueta!: string;
  @ApiProperty() tablas!: number;
}

export class LinajeDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Dominios, rutas, tablas, aristas, operación→tabla, tabla→tabla; las tablas con datos personales son `SIN_FUENTE`',
  })
  metricas!: Record<string, number | string>;
  @ApiProperty({ type: [LinajeDominioDto] }) dominios!: LinajeDominioDto[];
}

export class LinajeTablaDto {
  @ApiProperty() id!: string;
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Operaciones que la leen o la escriben',
  })
  operaciones!: Record<string, unknown>[];
  @ApiProperty({
    type: [String],
    description: 'Tablas a las que ésta referencia',
  })
  referencia!: string[];
  @ApiProperty({ type: [String], description: 'Tablas que la referencian' })
  referenciadaPor!: string[];
}

export class GlosarioTerminoDto {
  @ApiProperty() termino!: string;
  @ApiProperty() definicion!: string;
  @ApiProperty({ description: 'repo:archivo:línea' }) fuente!: string;
  @ApiProperty({ type: [String] }) tablasRelacionadas!: string[];
}

export class GlosarioPaginaDto {
  @ApiProperty({ type: [GlosarioTerminoDto] }) items!: GlosarioTerminoDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
