import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /community/blocks` (UC-19-14). */
export class CreateBlockDto {
  @ApiProperty({ description: 'Perfil que bloquea', format: 'uuid' })
  @IsUUID()
  blockerProfileId!: string;

  @ApiProperty({ description: 'Perfil bloqueado', format: 'uuid' })
  @IsUUID()
  blockedProfileId!: string;

  @ApiPropertyOptional({ description: 'Razón del bloqueo', enum: ['HARASSMENT', 'SPAM', 'OTHER'] })
  @IsOptional()
  @IsIn(['HARASSMENT', 'SPAM', 'OTHER'])
  reason?: 'HARASSMENT' | 'SPAM' | 'OTHER';
}
