import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /admin/tenants/{tenantId}/verification` (UC-04-02). */
export class VerifyTenantDto {
  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del país confirmado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la jurisdicción confirmada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}
