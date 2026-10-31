import { ApiProperty } from '@nestjs/swagger';

/** Una asignación de unidad o espacio del actor dentro de la sede. */
export class InfraAccessGrantDto {
  @ApiProperty({ enum: ['UNIT', 'SPACE'] }) scope!: 'UNIT' | 'SPACE';
  @ApiProperty() role!: string;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  clinicalUnitId!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  careSpaceId!: string | null;
  @ApiProperty({
    type: [String],
    description:
      'Acciones que esta asignación permite sobre su unidad o espacio',
  })
  actions!: string[];
}

/** Una sede donde el actor tiene algún rol de infraestructura. */
export class InfraAccessSiteDto {
  @ApiProperty({ format: 'uuid' }) siteId!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true, type: String }) timeZone!: string | null;
  @ApiProperty({
    type: [String],
    description:
      'Roles de nivel sede u organización (plataforma, admin, asignaciones TENANT/PRACTICE/SITE)',
  })
  roles!: string[];
  @ApiProperty({
    type: [String],
    description:
      'Roles globales equivalentes (BILLING, OR_MANAGER, ACCOUNTING)',
  })
  globalRoles!: string[];
  @ApiProperty({
    type: [String],
    description: 'Acciones permitidas sobre la sede entera',
  })
  actions!: string[];
  @ApiProperty({ type: [InfraAccessGrantDto] }) grants!: InfraAccessGrantDto[];
}

/** `GET /practice/infrastructure-access/me`. */
export class InfraAccessMeDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ type: [InfraAccessSiteDto] }) sites!: InfraAccessSiteDto[];
}
