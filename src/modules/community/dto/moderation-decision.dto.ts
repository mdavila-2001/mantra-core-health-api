import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /community/moderation/queue/{queueId}/decision` (UC-19-09). */
export class ModerationDecisionDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión',
    enum: ['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'],
  })
  @IsIn(['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'])
  decision!: 'REMOVED' | 'RESTRICTED' | 'WARNED' | 'DISMISSED';

  /**
   * Motivo de la decisión. **Obligatorio.**
   *
   * Era opcional, y el carril lo pide obligatorio por una razón concreta: una
   * decisión sin motivo escrito deja al sancionado sin nada que leer cuando
   * apela, y al equipo sin nada que auditar cuando alguien pregunta por qué se
   * bajó un contenido. La columna admite nulo —hay filas viejas sin motivo— pero
   * el contrato de entrada ya no.
   */
  @ApiProperty({
    description: 'Motivación de la decisión',
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  rationaleText!: string;

  /**
   * Identificador asociado a subject profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil sancionado (si la decisión emite strike)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  subjectProfileId?: string;

  /**
   * Valor de strike severity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Severidad del strike',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  strikeSeverity?: 'LOW' | 'MEDIUM' | 'HIGH';
}
