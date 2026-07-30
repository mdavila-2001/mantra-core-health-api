import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases/{id}/assertions` (UC-27-10). */
export class IssueAssertionDto {
  /**
   * Identificador asociado a issuer identity authority.
   */
  @ApiProperty({
    description: 'Autoridad emisora de la aserción',
    format: 'uuid',
  })
  @IsUUID()
  issuerIdentityAuthorityId!: string;

  /**
   * Identificador asociado a assertion type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: tipo de aserción (por defecto identidad)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assertionTypeConceptId?: string;

  /**
   * Identificador asociado a assurance level concept.
   */
  @ApiPropertyOptional({
    description:
      'Concepto: nivel de aseguramiento alcanzado (por defecto el solicitado del caso)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assuranceLevelConceptId?: string;

  /**
   * Valor de expires in hours mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigencia de la aserción en horas (por defecto 8760 = 1 año)',
    default: 8760,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}
