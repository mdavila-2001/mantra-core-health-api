import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `PATCH /sites/{siteId}/care-spaces/{id}`: cambia el espacio padre. */
export class MoveCareSpaceDto {
  /**
   * Nuevo espacio padre (misma sede). `null` lo cuelga directamente de la sede.
   */
  @ApiPropertyOptional({
    description:
      'Nuevo espacio padre (misma sede); null lo deja en la raíz de la sede',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string | null;
}
