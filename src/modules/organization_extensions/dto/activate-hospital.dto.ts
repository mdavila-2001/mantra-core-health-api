import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /orgext/hospitals/{id}/activate` (UC-22-02). */
export class ActivateHospitalDto {
  /**
   * Identificador asociado a primary practice site.
   */
  @ApiPropertyOptional({
    description: 'Sitio de práctica principal a fijar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  primaryPracticeSiteId?: string;

  /**
   * Identificador asociado a public profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil público a publicar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  publicProfileId?: string;
}
