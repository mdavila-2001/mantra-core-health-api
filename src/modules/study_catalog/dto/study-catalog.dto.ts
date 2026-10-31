import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StudyFamily } from '../study-catalog.logic';
import { STUDY_FAMILIES } from '../study-catalog.logic';

/** Muestra que el catálogo sugiere para un análisis (no preselecciona nada). */
export class SpecimenHintDto {
  /** Nombre de la muestra, en castellano. */
  @ApiProperty() text!: string;
  /** Código del catálogo (`SANGRE_EDTA`). */
  @ApiProperty() code!: string;
  /** HL7 v2 tabla 0487, si la muestra tiene equivalente. */
  @ApiPropertyOptional({ nullable: true }) hl7Code!: string | null;
  /** SNOMED CT, si la muestra tiene equivalente. */
  @ApiPropertyOptional({ nullable: true }) snomedCode!: string | null;
  /** Origen del dato, para mostrarlo. */
  @ApiProperty() source!: string;
}

/** Procedencia del renglón del catálogo. */
export class StudyProvenanceDto {
  /** Archivo versionado del que sale (`laboratorio.json` | `imagenologia.json`), o `null` en un estudio local. */
  @ApiPropertyOptional({ nullable: true }) source!: string | null;
  /** Versión del catálogo (fecha). */
  @ApiPropertyOptional({ nullable: true }) version!: string | null;
  /** Fuentes que respaldan el renglón (ids de `fuentes` del catálogo). */
  @ApiProperty({ type: [String] }) sourceIds!: string[];
}

/** Sección del laboratorio a la que pertenece un análisis. */
export class StudySectionDto {
  /** Código de la sección (`HEMATO`). */
  @ApiProperty() code!: string;
  /** Nombre en castellano (`Hematología`). */
  @ApiProperty() name!: string;
}

/** Un estudio del catálogo en la lista. */
export class StudyCatalogItemDto {
  /** Concepto del estudio: es el `codeConceptId` que se manda al pedirlo. */
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  /** Código del catálogo (`HEMOGRAMA`, `RX_TORAX_PA`). */
  @ApiProperty() code!: string;
  /** Código local anterior (`LAB_HEMOGRAMA`) cuando el estudio ya existía. */
  @ApiPropertyOptional({ nullable: true }) legacyCode!: string | null;
  /** Sistema de codificación del concepto. */
  @ApiProperty() codeSystem!: string;
  /** Nombre en castellano. */
  @ApiProperty() display!: string;
  /** Familia del estudio. */
  @ApiProperty({ enum: STUDY_FAMILIES }) family!: StudyFamily;
  /** Si el estudio se pide con componentes marcables. */
  @ApiProperty() componentsSelectable!: boolean;
  /** Cuántos componentes directos tiene. */
  @ApiProperty() componentCount!: number;
  /** Muestra sugerida (laboratorio). */
  @ApiPropertyOptional({ type: SpecimenHintDto, nullable: true })
  specimenHint!: SpecimenHintDto | null;
  /** Modalidad del estudio (imagen). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  modalityConceptId!: string | null;
  /** Región por defecto del estudio (imagen). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  bodySiteConceptId!: string | null;
  /** De dónde sale el renglón. */
  @ApiProperty({ type: StudyProvenanceDto }) provenance!: StudyProvenanceDto;
  /** Sección de laboratorio; `null` en imagen y en estudios sin sección sembrada. */
  @ApiPropertyOptional({ type: StudySectionDto, nullable: true })
  section!: StudySectionDto | null;
  /** Nombres de los componentes directos del panel (máx. 60, en su orden); `[]` si no tiene. */
  @ApiProperty({ type: [String] }) componentNames!: string[];
  /** Código de la región por defecto del estudio (`TORAX`); `null` fuera de imagen. */
  @ApiPropertyOptional({ nullable: true }) regionCode!: string | null;
  /** Si el estudio exige lateralidad; `null` fuera de imagen. */
  @ApiPropertyOptional({ nullable: true }) requiresLaterality!: boolean | null;
}

/** Página del catálogo. */
export class StudyCatalogPageDto {
  /** Estudios de la página. */
  @ApiProperty({ type: [StudyCatalogItemDto] }) items!: StudyCatalogItemDto[];
  /** Cuántos devolvió esta página. */
  @ApiProperty() count!: number;
  /** Tope pedido. */
  @ApiProperty() limit!: number;
  /** Cursor de la página siguiente, o `null` si es la última. */
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
}

/** Componente de un análisis (nodo de un árbol: un panel puede anidar otros). */
export class StudyComponentDto {
  /** Concepto del componente: es lo que va en `componentConceptIds`. */
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  /** Código del componente dentro del catálogo (`HEMOGRAMA.HB`). */
  @ApiProperty() code!: string;
  /** Nombre en castellano. */
  @ApiProperty() display!: string;
  /** Posición dentro del panel. */
  @ApiProperty() ordinal!: number;
  /** Viene marcado por defecto. */
  @ApiProperty() selectedByDefault!: boolean;
  /** Unidades de ejemplo (UCUM). */
  @ApiProperty({ type: [String] }) exampleUnits!: string[];
  /** Si agrupa otros componentes. */
  @ApiProperty() isPanel!: boolean;
  /** Código LOINC del componente, si está verificado. */
  @ApiPropertyOptional({ nullable: true }) loincCode!: string | null;
  /** Nombre LOINC (inglés) del componente. */
  @ApiPropertyOptional({ nullable: true }) loincName!: string | null;
  /** Componentes anidados; vacío si no los hay. */
  @ApiProperty({ type: () => [StudyComponentDto] })
  children!: StudyComponentDto[];
}

/** Opción de un vocabulario cerrado (muestra, modalidad, contraste, lateralidad). */
export class StudyOptionDto {
  /** Concepto de la opción. */
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  /** Código de la opción. */
  @ApiProperty() code!: string;
  /** Rótulo en castellano. */
  @ApiProperty() display!: string;
  /** Opción que el estudio fija o sugiere. */
  @ApiProperty() isDefault!: boolean;
}

/** Región del cuerpo elegible para un estudio de imagen. */
export class AllowedBodySiteDto {
  /** Concepto de la región: es el `bodySiteConceptId` de la orden. */
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  /** Código de la región (`MANO`). */
  @ApiProperty() code!: string;
  /** Nombre en castellano. */
  @ApiProperty() display!: string;
  /** Región contenedora dentro del catálogo (`null` en la raíz). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentConceptId!: string | null;
  /** Clase de región del catálogo (`region`, `grupo`, `vascular`, `combinada`). */
  @ApiPropertyOptional({ nullable: true }) regionType!: string | null;
  /** Si la región admite lado izquierdo/derecho. */
  @ApiProperty() admitsLaterality!: boolean;
  /** Es la región por defecto del estudio. */
  @ApiProperty() isDefault!: boolean;
}

/** Aviso de uso de contenido de terceros que la pantalla debe mostrar. */
export class AttributionDto {
  /** Nombre de la fuente. */
  @ApiProperty() source!: string;
  /** Sitio de la fuente. */
  @ApiProperty() url!: string;
  /** Licencia. */
  @ApiProperty() license!: string;
  /** Texto del aviso. */
  @ApiProperty() text!: string;
}

/** Datos propios de un análisis de laboratorio. */
export class LabStudyDetailDto {
  /** Sección del laboratorio (`HEMATO`). */
  @ApiPropertyOptional({ nullable: true }) section!: string | null;
  /** Ayuno requerido, si el catálogo lo dice. */
  @ApiPropertyOptional({ nullable: true }) fasting!: boolean | null;
  /** Horas de entrega, si el catálogo lo dice. */
  @ApiPropertyOptional({ nullable: true }) turnaroundHours!: number | null;
  /** Código LOINC del análisis, si está verificado. */
  @ApiPropertyOptional({ nullable: true }) loincCode!: string | null;
  /** Nombre LOINC (inglés). */
  @ApiPropertyOptional({ nullable: true }) loincName!: string | null;
}

/** Datos propios de un estudio de imagen. */
export class ImagingStudyDetailDto {
  /** Proyecciones o cortes del estudio. */
  @ApiProperty({ type: [String] }) projections!: string[];
  /** Contraste del estudio (`sin` | `con` | `sin_y_con`). */
  @ApiProperty() contrast!: string;
  /** Vía de administración del contraste, texto del catálogo. */
  @ApiPropertyOptional({ nullable: true }) contrastRoute!: string | null;
  /** Preparación del paciente. */
  @ApiPropertyOptional({ nullable: true }) preparation!: string | null;
  /** El estudio exige lateralidad. */
  @ApiProperty() requiresLaterality!: boolean;
  /** Código LOINC, si está verificado. */
  @ApiPropertyOptional({ nullable: true }) loincCode!: string | null;
  /** Identificador RadLex Playbook. */
  @ApiPropertyOptional({ nullable: true }) radlexRpid!: string | null;
}

/** Detalle de un estudio del catálogo. */
export class StudyCatalogDetailDto extends StudyCatalogItemDto {
  /** Componentes (árbol). Vacío si el estudio no se desglosa. */
  @ApiProperty({ type: [StudyComponentDto] }) components!: StudyComponentDto[];
  /** Muestra que el catálogo propone convertida en concepto de `specimen-type`, si hay equivalencia. */
  @ApiPropertyOptional({ type: StudyOptionDto, nullable: true })
  suggestedSpecimen!: StudyOptionDto | null;
  /** Tipos de muestra elegibles (value set `specimen-type`); vacío si el estudio no lleva muestra. */
  @ApiProperty({ type: [StudyOptionDto] })
  allowedSpecimenTypes!: StudyOptionDto[];
  /** Modalidades elegibles; el estudio fija una. */
  @ApiProperty({ type: [StudyOptionDto] })
  allowedModalities!: StudyOptionDto[];
  /** Regiones elegibles: la del estudio y las que contiene. */
  @ApiProperty({ type: [AllowedBodySiteDto] })
  allowedBodySites!: AllowedBodySiteDto[];
  /** Opciones de lateralidad (vocabulario `condition-laterality`); vacío si el estudio no es de imagen. */
  @ApiProperty({ type: [StudyOptionDto] })
  lateralityOptions!: StudyOptionDto[];
  /** Opciones de contraste (`imaging-contrast`); vacío si el estudio no es de imagen. */
  @ApiProperty({ type: [StudyOptionDto] })
  contrastOptions!: StudyOptionDto[];
  /** Datos de laboratorio, si es un análisis. */
  @ApiPropertyOptional({ type: LabStudyDetailDto, nullable: true })
  lab!: LabStudyDetailDto | null;
  /** Datos de imagen, si es un estudio de imagen. */
  @ApiPropertyOptional({ type: ImagingStudyDetailDto, nullable: true })
  imaging!: ImagingStudyDetailDto | null;
  /** Avisos de licencia que deben mostrarse junto al estudio. */
  @ApiProperty({ type: [AttributionDto] }) attribution!: AttributionDto[];
}
