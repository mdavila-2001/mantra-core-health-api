import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de un hospital especializado (UC-22-01/02). */
export class HospitalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una línea de servicio hospitalaria (UC-22-03). */
export class ServiceLineResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) hospitalId!: string;
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una licencia de instalación (UC-22-05/06). */
export class FacilityLicenseResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() licenseNumber!: string;
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de verificación (concepto)',
  })
  verificationStatus!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una afiliación entre organizaciones (UC-22-07). */
export class AffiliationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) primaryTenantId!: string;
  @ApiProperty({ format: 'uuid' }) participatingTenantId!: string;
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de una frontera de datos (UC-22-08). */
export class DataBoundaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid', description: 'Estado (concepto)' })
  status!: string;
  @ApiProperty() effectiveFrom!: Date;
  @ApiProperty() createdAt!: Date;
}

/** Resultado escueto de una operación de estado (activate/verify/retire/terminate). */
export class StatusResultDto {
  @ApiProperty({ description: 'Operación completada' }) ok!: boolean;
  @ApiProperty({
    format: 'uuid',
    description: 'Nuevo estado (concepto)',
    required: false,
  })
  status?: string;
}
