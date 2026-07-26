import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /community/moderation/decisions/{decisionId}/appeal` (UC-19-10). */
export class CreateAppealDto {
  @ApiProperty({ description: 'Perfil que apela (sancionado)', format: 'uuid' })
  @IsUUID()
  appellantProfileId!: string;

  @ApiProperty({ description: 'Motivo de la apelación', maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reasonText!: string;
}
