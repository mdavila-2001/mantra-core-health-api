import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiagnosticConceptDto } from './directory-read.dto';

/**
 * Unidad tal como la ve quien la administra — no quien la elige.
 *
 * Lleva el estado y la verificación **como datos**, no como filtro: el
 * directorio público sólo muestra lo publicado, y por eso una unidad en
 * borrador desaparecía de todas las pantallas y no había manera de terminar de
 * configurarla.
 */
export class DiagnosticUnitAdminItemDto {
  /** Identificador de la unidad. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código único dentro del tenant. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Tipo de laboratorio o unidad de imagen. */
  @ApiProperty({ type: DiagnosticConceptDto }) type!: DiagnosticConceptDto;

  /** Estado de ciclo de vida (activa, retirada). */
  @ApiProperty({ type: DiagnosticConceptDto }) status!: DiagnosticConceptDto;

  /** Estado de verificación (pendiente, verificada). */
  @ApiProperty({ type: DiagnosticConceptDto })
  verificationStatus!: DiagnosticConceptDto;

  /**
   * Si la unidad aparece hoy en el directorio público.
   *
   * Se calcula en el servidor con la misma regla que aplica el directorio
   * —activa **y** verificada—, para que la consola no tenga que reimplementarla
   * y arriesgarse a decir «publicada» sobre algo que el paciente no ve.
   */
  @ApiProperty() publiclyListed!: boolean;

  /** Sedes registradas. */
  @ApiProperty() siteCount!: number;

  /** Estudios del catálogo, en cualquier estado. */
  @ApiProperty() studyCount!: number;

  /** Equipos instalados. */
  @ApiProperty() equipmentCount!: number;

  /** Si acepta órdenes de profesionales externos. */
  @ApiPropertyOptional({ nullable: true })
  acceptsExternalOrders!: boolean | null;

  /** Si atiende por demanda espontánea. */
  @ApiPropertyOptional({ nullable: true }) walkInAvailable!: boolean | null;

  /** Si toma muestras a domicilio. */
  @ApiPropertyOptional({ nullable: true })
  homeCollectionAvailable!: boolean | null;
}

/** Colección administrativa: todas las unidades del tenant. */
export class DiagnosticUnitAdminListDto {
  /** Las unidades, publicadas o no. */
  @ApiProperty({ type: DiagnosticUnitAdminItemDto, isArray: true })
  items!: DiagnosticUnitAdminItemDto[];

  /** Cantidad devuelta. */
  @ApiProperty() count!: number;
}

/** Sede del laboratorio, con el nombre que le da la sede de `practice`. */
export class DiagnosticUnitAdminSiteDto {
  /** Identificador de la sede del laboratorio. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede de `practice` de la que toma nombre y dirección. */
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;

  /** Código legible. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Rol de la sede: principal, punto de toma de muestras… */
  @ApiProperty({ type: DiagnosticConceptDto }) role!: DiagnosticConceptDto;

  /** Prefijo de los números de accesión que emite. */
  @ApiPropertyOptional({ nullable: true }) accessionPrefix!: string | null;

  /** Si toma muestras. */
  @ApiPropertyOptional({ nullable: true })
  sampleCollectionAvailable!: boolean | null;

  /** Si hace estudios de imagen. */
  @ApiPropertyOptional({ nullable: true }) imagingAvailable!: boolean | null;

  /** Estado de ciclo de vida. */
  @ApiProperty({ type: DiagnosticConceptDto }) status!: DiagnosticConceptDto;
}

/** Equipo instalado, con su ventana de calibración. */
export class DiagnosticUnitAdminEquipmentDto {
  /** Identificador del equipo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede donde está instalado. */
  @ApiProperty({ format: 'uuid' }) siteId!: string;

  /** Tipo de equipo. */
  @ApiProperty({ type: DiagnosticConceptDto }) type!: DiagnosticConceptDto;

  /** Fabricante declarado. */
  @ApiPropertyOptional({ nullable: true }) manufacturer!: string | null;

  /** Modelo declarado. */
  @ApiPropertyOptional({ nullable: true }) model!: string | null;

  /** Número de serie, dato de inventario que el directorio no publica. */
  @ApiPropertyOptional({ nullable: true }) serialNumber!: string | null;

  /** Modalidad que atiende, si la declara. */
  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  modality!: DiagnosticConceptDto | null;

  /** Estado operativo. */
  @ApiProperty({ type: DiagnosticConceptDto })
  operationalStatus!: DiagnosticConceptDto;

  /** Última calibración registrada. */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  lastCalibrationAt!: string | null;

  /** Próxima calibración comprometida. */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  nextCalibrationDueAt!: string | null;

  /**
   * Días hasta la próxima calibración; negativo si ya se pasó.
   *
   * Se calcula en el servidor por el mismo motivo que el vencimiento de la
   * documentación legal: la alerta tiene que dar igual en toda pantalla, y el
   * reloj del navegador no es una base confiable.
   */
  @ApiPropertyOptional({ nullable: true })
  daysToCalibration!: number | null;
}

/** Precio vigente o histórico de un estudio dentro de un cronograma. */
export class DiagnosticUnitAdminPriceDto {
  /** Identificador del precio. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Cronograma al que pertenece. */
  @ApiProperty({ format: 'uuid' }) scheduleId!: string;

  /** Código del cronograma, para no obligar a cruzarlo a mano. */
  @ApiProperty() scheduleCode!: string;

  /** Si el cronograma se publica al paciente. */
  @ApiProperty() schedulePublic!: boolean;

  /** Número de versión dentro del cronograma. */
  @ApiProperty() versionNumber!: number;

  /** Importe base. */
  @ApiProperty({ example: '120.00' }) baseAmount!: string;

  /** Importe a cargo del paciente, si difiere del base. */
  @ApiPropertyOptional({ nullable: true }) patientAmount!: string | null;

  /** Importe a cargo de la aseguradora, si lo hay. */
  @ApiPropertyOptional({ nullable: true }) insurerAmount!: string | null;

  /** Moneda del cronograma. */
  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  currency!: DiagnosticConceptDto | null;

  /** Inicio de vigencia. */
  @ApiProperty({ format: 'date-time' }) effectiveFrom!: string;

  /** Fin de vigencia; `null` mientras siga vigente. */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  effectiveTo!: string | null;

  /** Estado del precio (vigente, reemplazado, retirado). */
  @ApiProperty({ type: DiagnosticConceptDto }) status!: DiagnosticConceptDto;
}

/** Estudio del catálogo, en cualquier estado, con sus precios. */
export class DiagnosticUnitAdminStudyDto {
  /** Identificador de la oferta. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código del estudio dentro de la unidad. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Descripción publicada, si la tiene. */
  @ApiPropertyOptional({ nullable: true }) description!: string | null;

  /** Sede que lo presta, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /** Modalidad, si la declara. */
  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  modality!: DiagnosticConceptDto | null;

  /** Tipo de muestra que requiere, si lo declara. */
  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  specimenType!: DiagnosticConceptDto | null;

  /** Preparación previa que el paciente debe seguir. */
  @ApiPropertyOptional({ nullable: true })
  preparationInstructions!: string | null;

  /** Duración estimada de la toma. */
  @ApiPropertyOptional({ nullable: true })
  expectedDurationMinutes!: number | null;

  /** Tiempo estimado de entrega del resultado. */
  @ApiPropertyOptional({ nullable: true })
  expectedTurnaroundMinutes!: number | null;

  /** Si exige orden médica. */
  @ApiPropertyOptional({ nullable: true }) requiresMedicalOrder!:
    boolean | null;

  /** Si exige autorización previa de la aseguradora. */
  @ApiPropertyOptional({ nullable: true })
  requiresPriorAuthorization!: boolean | null;

  /** Si admite toma de muestra a domicilio. */
  @ApiPropertyOptional({ nullable: true })
  homeCollectionEligible!: boolean | null;

  /** Estado de la oferta (borrador, activa, retirada). */
  @ApiProperty({ type: DiagnosticConceptDto }) status!: DiagnosticConceptDto;

  /** Sus precios, el más reciente primero. */
  @ApiProperty({ type: DiagnosticUnitAdminPriceDto, isArray: true })
  prices!: DiagnosticUnitAdminPriceDto[];
}

/** Acreditación o documento legal del laboratorio. */
export class DiagnosticUnitAdminAccreditationDto {
  /** Identificador del documento. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede a la que corresponde, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /** Tipo de acreditación. */
  @ApiProperty({ type: DiagnosticConceptDto }) type!: DiagnosticConceptDto;

  /** Número o matrícula. */
  @ApiPropertyOptional({ nullable: true }) number!: string | null;

  /** Archivo de respaldo, si se adjuntó. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  evidenceFileId!: string | null;

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validFrom!: string | null;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validTo!: string | null;

  /** Días hasta el vencimiento; negativo si ya venció. */
  @ApiPropertyOptional({ nullable: true }) daysToExpiry!: number | null;

  /** Estado de verificación. */
  @ApiProperty({ type: DiagnosticConceptDto })
  verificationStatus!: DiagnosticConceptDto;
}

/** Integrante del personal del laboratorio. */
export class DiagnosticUnitAdminStaffDto {
  /** Identificador de la asignación en la unidad. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Asignación de rol en `practice` que la respalda. */
  @ApiProperty({ format: 'uuid' }) practitionerRoleAssignmentId!: string;

  /** Perfil profesional, cuando la asignación de rol se pudo resolver. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practitionerProfileId!: string | null;

  /** Nombre del profesional, o `null` si el perfil no lo tiene registrado. */
  @ApiPropertyOptional({ nullable: true }) practitionerName!: string | null;

  /** Sede del laboratorio donde trabaja, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /** Rol dentro del laboratorio. */
  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  assignmentRole!: DiagnosticConceptDto | null;

  /** Especialidad con la que ejerce, si la declara. */
  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  specialty!: DiagnosticConceptDto | null;

  /**
   * Si puede validar resultados.
   *
   * Es el permiso que separa a un bioquímico de un técnico de toma de muestras,
   * y la especificación lo exige explícito: un resultado validado no se puede
   * modificar después, sólo corregir por adenda.
   */
  @ApiPropertyOptional({ nullable: true }) mayValidateResults!: boolean | null;

  /** Si puede firmar informes. */
  @ApiPropertyOptional({ nullable: true }) maySignReports!: boolean | null;

  /** Inicio de la vinculación. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validFrom!: string | null;

  /** Fin de la vinculación; `null` mientras siga abierta. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validTo!: string | null;

  /** Estado de la asignación. */
  @ApiProperty({ type: DiagnosticConceptDto }) status!: DiagnosticConceptDto;
}

/**
 * La consola de administración de un laboratorio: todo lo suyo, en una lectura.
 *
 * Mismo criterio que `GET /practices/:id/organization` (C13) y que el detalle
 * público del propio módulo: las listas cuelgan del mismo identificador, se
 * miran juntas y no significan nada por separado.
 */
export class DiagnosticUnitAdminDetailDto extends DiagnosticUnitAdminItemDto {
  /** Sus sedes. */
  @ApiProperty({ type: DiagnosticUnitAdminSiteDto, isArray: true })
  sites!: DiagnosticUnitAdminSiteDto[];

  /** Su equipamiento. */
  @ApiProperty({ type: DiagnosticUnitAdminEquipmentDto, isArray: true })
  equipment!: DiagnosticUnitAdminEquipmentDto[];

  /** Su catálogo de estudios, con precios. */
  @ApiProperty({ type: DiagnosticUnitAdminStudyDto, isArray: true })
  studies!: DiagnosticUnitAdminStudyDto[];

  /** Su documentación legal y acreditaciones. */
  @ApiProperty({ type: DiagnosticUnitAdminAccreditationDto, isArray: true })
  accreditations!: DiagnosticUnitAdminAccreditationDto[];

  /** Su personal. */
  @ApiProperty({ type: DiagnosticUnitAdminStaffDto, isArray: true })
  staff!: DiagnosticUnitAdminStaffDto[];
}
