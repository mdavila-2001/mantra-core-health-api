import { ApiProperty } from '@nestjs/swagger';

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
