import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Concepto de terminología reducido a lo que una pantalla necesita.
 *
 * El `code` viaja además del `display` porque es lo estable: las variantes de
 * badge y las reglas de presentación se atan al código, nunca a la etiqueta,
 * que es texto traducible.
 */
export class PracticeConceptDto {
  /** Código estable del concepto. */
  @ApiProperty() code!: string;

  /** Etiqueta legible. */
  @ApiProperty() display!: string;
}

/** Práctica —la organización médica— tal como abre la consola. */
export class OrganizationHeaderDto {
  /** Identificador de la práctica. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código único dentro del tenant. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Tipo de organización: hospital, clínica, centro médico, consultorio… */
  @ApiProperty({ type: PracticeConceptDto }) type!: PracticeConceptDto;

  /** Estado de la práctica. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;

  /** Zona horaria IANA declarada, si la tiene. */
  @ApiPropertyOptional({ nullable: true, example: 'America/La_Paz' })
  timeZone!: string | null;

  /** Moneda de la práctica, si la declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  currency!: PracticeConceptDto | null;
}

/** Sede, con el recuento de lo que cuelga de ella. */
export class OrganizationSiteDto {
  /** Identificador de la sede. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código único dentro de la práctica. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Tipo de sede. */
  @ApiProperty({ type: PracticeConceptDto }) type!: PracticeConceptDto;

  /** Tipo físico del emplazamiento, si lo declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  physicalType!: PracticeConceptDto | null;

  /** Estado operativo (planificada, abierta, cerrada), si lo declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  operationalStatus!: PracticeConceptDto | null;

  /** Estado de ciclo de vida. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;

  /** Zona horaria IANA de la sede, si la declara. */
  @ApiPropertyOptional({ nullable: true }) timeZone!: string | null;

  /** Sucursal de `directory` con la que se corresponde, si la hay. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  branchId!: string | null;

  /** Áreas registradas en la sede. */
  @ApiProperty() clinicalUnitCount!: number;

  /** Espacios de atención registrados en la sede. */
  @ApiProperty() careSpaceCount!: number;
}

/** Área, departamento o sección de una sede. */
export class OrganizationClinicalUnitDto {
  /** Identificador del área. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede a la que pertenece. */
  @ApiProperty({ format: 'uuid' }) siteId!: string;

  /** Área padre, cuando es una sub-área. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentUnitId!: string | null;

  /** Código único dentro de la sede. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Tipo de unidad. */
  @ApiProperty({ type: PracticeConceptDto }) type!: PracticeConceptDto;

  /** Especialidad del área, si la declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  specialty!: PracticeConceptDto | null;

  /** Modalidad de servicio, si la declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  serviceMode!: PracticeConceptDto | null;

  /** Estado de ciclo de vida. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;
}

/** Espacio físico: quirófano, consultorio, box, sala. */
export class OrganizationCareSpaceDto {
  /** Identificador del espacio. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede a la que pertenece. */
  @ApiProperty({ format: 'uuid' }) siteId!: string;

  /** Área a la que pertenece, si cuelga de una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clinicalUnitId!: string | null;

  /** Espacio contenedor, cuando es una subdivisión. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentSpaceId!: string | null;

  /** Código único dentro de la sede. */
  @ApiProperty() code!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Tipo de espacio. */
  @ApiProperty({ type: PracticeConceptDto }) type!: PracticeConceptDto;

  /** Capacidad declarada, si la tiene. */
  @ApiPropertyOptional({ nullable: true }) capacity!: number | null;

  /** Disponibilidad operativa (disponible, en limpieza, fuera de servicio…). */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  operationalStatus!: PracticeConceptDto | null;

  /** Estado de ciclo de vida. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;
}

/** Servicio de salud publicado por la organización. */
export class OrganizationHealthcareServiceDto {
  /** Identificador del servicio. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede donde se presta, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /** Área que lo presta, si cuelga de una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clinicalUnitId!: string | null;

  /** Servicio del catálogo. */
  @ApiProperty({ type: PracticeConceptDto }) service!: PracticeConceptDto;

  /** Especialidad asociada, si la declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  specialty!: PracticeConceptDto | null;

  /** Si exige derivación previa. */
  @ApiPropertyOptional({ nullable: true }) referralRequired!: boolean | null;

  /** Si exige turno previo. */
  @ApiPropertyOptional({ nullable: true }) appointmentRequired!: boolean | null;

  /** Si admite atención remota. */
  @ApiPropertyOptional({ nullable: true }) telehealthAvailable!: boolean | null;

  /** Estado de ciclo de vida. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;
}

/** Integrante de la plantilla profesional, con su vínculo vigente. */
export class OrganizationStaffMemberDto {
  /** Identificador de la asignación. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Perfil profesional asignado. */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;

  /**
   * Nombre del profesional, o `null` si el perfil no lo tiene registrado.
   *
   * `null` es un estado real —un perfil creado sin persona detrás— y quien lo
   * reciba tiene que decirlo, nunca sustituirlo por un uuid.
   */
  @ApiPropertyOptional({ nullable: true }) practitionerName!: string | null;

  /** Sede del vínculo, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /** Área del vínculo, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clinicalUnitId!: string | null;

  /** Servicio del vínculo, si está acotado a uno. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  healthcareServiceId!: string | null;

  /** Rol clínico asignado. */
  @ApiProperty({ type: PracticeConceptDto }) role!: PracticeConceptDto;

  /** Especialidad con la que ejerce en este vínculo, si la declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  specialty!: PracticeConceptDto | null;

  /** Si es el vínculo principal del profesional. */
  @ApiPropertyOptional({ nullable: true }) isPrimary!: boolean | null;

  /** Inicio de la vinculación. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validFrom!: string | null;

  /** Fin de la vinculación; `null` mientras siga abierta. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validTo!: string | null;

  /** Estado de la asignación. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;
}

/** Documento legal o acreditación de la organización. */
export class OrganizationLegalDocumentDto {
  /** Identificador del documento. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Sede a la que corresponde, si está acotado a una. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /** Tipo de acreditación o documento. */
  @ApiProperty({ type: PracticeConceptDto }) type!: PracticeConceptDto;

  /** Número o matrícula del documento. */
  @ApiPropertyOptional({ nullable: true }) number!: string | null;

  /** Entidad emisora, tal como se registró. */
  @ApiPropertyOptional({ nullable: true }) issuerName!: string | null;

  /** Archivo de respaldo, si se adjuntó. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  evidenceFileId!: string | null;

  /** Inicio de vigencia. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validFrom!: string | null;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validTo!: string | null;

  /**
   * Días que faltan para el vencimiento; negativo si ya venció.
   *
   * Se calcula en el servidor a propósito: la alerta por vencimiento que pide
   * la especificación tiene que dar el mismo resultado en toda pantalla y en
   * todo informe, y el reloj del navegador no es una base confiable para eso.
   * `null` cuando el documento no declara vencimiento.
   */
  @ApiPropertyOptional({ nullable: true }) daysToExpiry!: number | null;

  /** Estado de verificación del documento. */
  @ApiProperty({ type: PracticeConceptDto })
  verificationStatus!: PracticeConceptDto;
}

/** Insumo o equipamiento del inventario de la práctica. */
export class OrganizationInventoryItemDto {
  /** Identificador del insumo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Nombre legible. */
  @ApiProperty() name!: string;

  /** Lote, si se registró. */
  @ApiPropertyOptional({ nullable: true }) lotNumber!: string | null;

  /** Fecha de vencimiento del lote, si la tiene. */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  expiryDate!: string | null;

  /** Existencias actuales, como decimal exacto. */
  @ApiProperty({ example: '12.000' }) quantityOnHand!: string;

  /** Unidad de medida, si la declara. */
  @ApiPropertyOptional({ type: PracticeConceptDto, nullable: true })
  unit!: PracticeConceptDto | null;

  /** Punto de reposición configurado, si lo tiene. */
  @ApiPropertyOptional({ nullable: true }) reorderLevel!: string | null;

  /**
   * Si las existencias cayeron al punto de reposición o por debajo.
   *
   * `false` cuando no hay punto configurado: sin umbral no hay faltante que
   * declarar, y decir `true` ahí sería una alarma inventada.
   */
  @ApiProperty() belowReorderLevel!: boolean;

  /** Estado del insumo. */
  @ApiProperty({ type: PracticeConceptDto }) status!: PracticeConceptDto;
}

/**
 * Todo lo que la consola de organización médica necesita, en una lectura.
 *
 * Es una sola respuesta y no siete endpoints porque las siete listas son del
 * **mismo registro** y se muestran juntas: pedirlas por separado obligaría a la
 * pantalla a encadenar siete peticiones para pintar una ficha, y a manejar
 * siete estados de carga para un único ámbito. Es el mismo criterio con el que
 * `GET /diagnostic-units/:id` devuelve sedes, equipos, estudios y
 * acreditaciones juntos.
 *
 * Nada se filtra por estado: la consola administra también lo retirado y lo
 * vencido, que es justamente lo que hay que poder ver para corregirlo.
 */
export class MedicalOrganizationConsoleDto {
  /** La organización. */
  @ApiProperty({ type: OrganizationHeaderDto })
  organization!: OrganizationHeaderDto;

  /** Sus sedes. */
  @ApiProperty({ type: OrganizationSiteDto, isArray: true })
  sites!: OrganizationSiteDto[];

  /** Sus áreas y sub-áreas. */
  @ApiProperty({ type: OrganizationClinicalUnitDto, isArray: true })
  clinicalUnits!: OrganizationClinicalUnitDto[];

  /** Su infraestructura: quirófanos, consultorios y demás espacios. */
  @ApiProperty({ type: OrganizationCareSpaceDto, isArray: true })
  careSpaces!: OrganizationCareSpaceDto[];

  /** Los servicios que ofrece. */
  @ApiProperty({ type: OrganizationHealthcareServiceDto, isArray: true })
  healthcareServices!: OrganizationHealthcareServiceDto[];

  /** Su plantilla profesional. */
  @ApiProperty({ type: OrganizationStaffMemberDto, isArray: true })
  staff!: OrganizationStaffMemberDto[];

  /** Su documentación legal y acreditaciones. */
  @ApiProperty({ type: OrganizationLegalDocumentDto, isArray: true })
  legalDocuments!: OrganizationLegalDocumentDto[];

  /** Su inventario de insumos y equipamiento. */
  @ApiProperty({ type: OrganizationInventoryItemDto, isArray: true })
  inventory!: OrganizationInventoryItemDto[];
}
