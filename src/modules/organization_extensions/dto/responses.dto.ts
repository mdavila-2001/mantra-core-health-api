import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de un hospital especializado (UC-22-01/02). */
export class HospitalResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una línea de servicio hospitalaria (UC-22-03). */
export class ServiceLineResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a hospital.
   */
  @ApiProperty({ format: 'uuid' }) hospitalId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una licencia de instalación (UC-22-05/06). */
export class FacilityLicenseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /**
   * Valor de license number mantenido por la instancia.
   */
  @ApiProperty() licenseNumber!: string;
  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de verificación (concepto)',
  })
  verificationStatus!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una afiliación entre organizaciones (UC-22-07). */
export class AffiliationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a primary tenant.
   */
  @ApiProperty({ format: 'uuid' }) primaryTenantId!: string;
  /**
   * Identificador asociado a participating tenant.
   */
  @ApiProperty({ format: 'uuid' }) participatingTenantId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una frontera de datos (UC-22-08). */
export class DataBoundaryResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiProperty() effectiveFrom!: Date;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Resultado escueto de una operación de estado (activate/verify/retire/terminate). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'Operación completada' }) ok!: boolean;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Nuevo estado (concepto)',
    required: false,
  })
  status?: string;
}
