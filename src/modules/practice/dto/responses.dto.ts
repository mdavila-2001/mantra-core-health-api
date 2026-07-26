import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de creación de una práctica (bootstrap). */
export class PracticeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de un sitio de práctica (UC-14-01). */
export class SiteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() status!: string;
  @ApiProperty() operationalStatus!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una acreditación (UC-14-02/03). */
export class AccreditationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceId!: string;
  @ApiProperty() verificationStatus!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de una unidad clínica (UC-14-04). */
export class ClinicalUnitResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceSiteId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de un espacio de atención (UC-14-05). */
export class CareSpaceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceSiteId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() status!: string;
  @ApiProperty() operationalStatus!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de publicación de un servicio de salud (UC-14-06). */
export class HealthcareServiceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceId!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de upsert de un ajuste de práctica (UC-14-07). */
export class SettingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceId!: string;
  @ApiProperty() settingKey!: string;
  @ApiProperty({ description: 'true si se creó, false si se actualizó' }) created!: boolean;
}

/** Respuesta de asignación de rol (UC-14-08). */
export class RoleAssignmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceId!: string;
  @ApiProperty() practitionerProfileId!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de asignación de apoyo (UC-14-09). */
export class SupportAssignmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practitionerRoleAssignmentId!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de creación de un insumo de inventario (UC-14-10). */
export class InventoryItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() practiceId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() quantityOnHand!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de un movimiento de inventario (UC-14-11). */
export class MovementResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() inventoryItemId!: string;
  @ApiProperty() quantityOnHand!: string;
  @ApiProperty() recordedAt!: Date;
}

/** Resultado genérico de una operación de estado (verify, decommission). */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' }) ok!: boolean;
}
