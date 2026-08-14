import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de creación de una práctica (bootstrap). */
export class PracticeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de un sitio de práctica (UC-14-01). */
export class SiteResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty() practiceId!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de operational status mantenido por la instancia.
   */
  @ApiProperty() operationalStatus!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una acreditación (UC-14-02/03). */
export class AccreditationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty() practiceId!: string;
  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty() verificationStatus!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de una unidad clínica (UC-14-04). */
export class ClinicalUnitResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty() practiceSiteId!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de un espacio de atención (UC-14-05). */
export class CareSpaceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty() practiceSiteId!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de operational status mantenido por la instancia.
   */
  @ApiProperty() operationalStatus!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de publicación de un servicio de salud (UC-14-06). */
export class HealthcareServiceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty() practiceId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de upsert de un ajuste de práctica (UC-14-07). */
export class SettingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty() practiceId!: string;
  /**
   * Valor de setting key mantenido por la instancia.
   */
  @ApiProperty() settingKey!: string;
  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se creó, false si se actualizó' })
  created!: boolean;
}

/** Respuesta de asignación de rol (UC-14-08). */
export class RoleAssignmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty() practiceId!: string;
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty() practitionerProfileId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de asignación de apoyo (UC-14-09). */
export class SupportAssignmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practitioner role assignment.
   */
  @ApiProperty() practitionerRoleAssignmentId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de un insumo de inventario (UC-14-10). */
export class InventoryItemResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty() practiceId!: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty() name!: string;
  /**
   * Valor de quantity on hand mantenido por la instancia.
   */
  @ApiProperty() quantityOnHand!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de un movimiento de inventario (UC-14-11). */
export class MovementResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty() id!: string;
  /**
   * Identificador asociado a inventory item.
   */
  @ApiProperty() inventoryItemId!: string;
  /**
   * Valor de quantity on hand mantenido por la instancia.
   */
  @ApiProperty() quantityOnHand!: string;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty() recordedAt!: Date;
}

/** Resultado genérico de una operación de estado (verify, decommission). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' }) ok!: boolean;
}

/**
 * Práctica tal como la devuelve el listado.
 *
 * Lleva `name` además del código porque el listado existe para **elegir** una
 * práctica, y un código sin nombre no permite reconocerla.
 */
export class PracticeSummaryDto {
  /** Identificador de la práctica. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Código único dentro del tenant. */
  @ApiProperty() code!: string;
  /** Nombre legible. */
  @ApiProperty() name!: string;
  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) status!: string;
}

/** Sede tal como la devuelve el listado. */
export class SiteSummaryDto {
  /** Identificador de la sede. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Práctica a la que pertenece. */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /** Código único dentro de la práctica. */
  @ApiProperty() code!: string;
  /** Nombre legible. */
  @ApiProperty() name!: string;
  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) status!: string;
}

/**
 * Sede como lugar donde se atiende, no como fila administrativa.
 *
 * Es {@link SiteSummaryDto} más lo que hace falta para llegar hasta ahí: la
 * dirección y la zona horaria. El listado administrativo no las traía porque
 * responde otra pregunta —«¿qué sedes tiene esta práctica?»— y quien la hacía
 * ya sabía dónde quedaban. Un paciente mirando su turno, no.
 *
 * `addressText` viene compuesto en una línea: `common.addresses` guarda la
 * dirección en piezas, y decidir cómo se juntan es del dato, no de cada
 * pantalla que la muestre.
 */
export class PractitionerSiteDto {
  /** Identificador de la sede. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Práctica a la que pertenece. */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /** Código único dentro de la práctica. */
  @ApiProperty() code!: string;
  /** Nombre legible. */
  @ApiProperty() name!: string;
  /** Zona horaria IANA de la sede, si la declara. */
  @ApiPropertyOptional({ nullable: true, example: 'America/La_Paz' })
  timeZone!: string | null;
  /** Dirección en una línea, o `null` si la sede no tiene ninguna cargada. */
  @ApiPropertyOptional({ nullable: true, example: 'Av. Brasil 1234, La Paz' })
  addressText!: string | null;
  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) status!: string;
}

/** Respuesta de `GET /practitioners/:profileId/sites`. */
export class PractitionerSitesResponseDto {
  /** Las sedes donde atiende, la principal primero. */
  @ApiProperty({ type: [PractitionerSiteDto] })
  items!: PractitionerSiteDto[];

  /** Cantidad devuelta. */
  @ApiProperty()
  count!: number;
}

/**
 * Espacio de atención tal como lo devuelve el listado.
 *
 * Es el que resuelve el `operatingRoomId` que exige programar un caso
 * quirúrgico: sin este listado, ese uuid había que pasarlo por fuera del
 * sistema.
 */
export class CareSpaceSummaryDto {
  /** Identificador del espacio. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Sede a la que pertenece. */
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
  /** Código único dentro de la sede. */
  @ApiProperty() code!: string;
  /** Nombre legible. */
  @ApiProperty() name!: string;
  /** Tipo de espacio (quirófano, consulta, box…). */
  @ApiPropertyOptional({ format: 'uuid' }) spaceTypeConceptId?: string;
  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) status!: string;
}
