import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  USER_LIFECYCLE_ACTIONS,
  USER_LIFECYCLE_STATES,
  type UserLifecycleAction,
  type UserLifecycleState,
} from '../../domain/user-lifecycle';

/** Tope de eventos por página de la historia de ciclo de vida. */
export const USER_LIFECYCLE_MAX_PAGE_SIZE = 100;
export const USER_LIFECYCLE_DEFAULT_PAGE_SIZE = 20;

/**
 * Recorta espacios: «   » no es un motivo. Lee el valor ORIGINAL del cuerpo (`obj`): la conversión
 * implícita del pipe ya habría vuelto `"7"` un número `7`, y un número no es un motivo.
 */
const trimmed = ({ obj, key }: TransformFnParams): unknown => {
  const original: unknown = (obj as Record<string, unknown>)[key];
  return typeof original === 'string' ? original.trim() : original;
};

/**
 * Cuerpo de `POST /iam/users/:id/suspend|reactivate|deactivate`.
 *
 * El motivo es **obligatorio**: la cuenta de otra persona no cambia de estado sin que quede dicho
 * por qué. Una clave que el contrato no declara responde 400.
 */
export class UserLifecycleReasonDto {
  @ApiProperty({
    maxLength: 500,
    description:
      'Motivo administrativo, obligatorio. Queda en la bitácora de seguridad de la cuenta. No escribir datos clínicos.',
  })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

/** Resultado de una transición de ciclo de vida. */
export class UserLifecycleResultDto {
  @ApiProperty({ format: 'uuid' }) id!: string;

  @ApiProperty({
    enum: USER_LIFECYCLE_STATES,
    description: 'Estado en el que quedó la cuenta',
  })
  state!: UserLifecycleState;

  @ApiProperty({
    description:
      '`false` si la cuenta ya estaba en ese estado: la repetición no escribe nada (idempotente)',
  })
  changed!: boolean;

  @ApiProperty({
    description:
      'Sesiones activas que esta llamada cerró. 0 si no cambió nada o si reactivó',
  })
  revokedSessions!: number;
}

/** Query de la historia de ciclo de vida. */
export class UserLifecycleHistoryQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: USER_LIFECYCLE_MAX_PAGE_SIZE,
    default: USER_LIFECYCLE_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(USER_LIFECYCLE_MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({
    maxLength: 400,
    description: '`nextCursor` de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  cursor?: string;
}

/** Un cambio de ciclo de vida de la cuenta. */
export class UserLifecycleEventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: USER_LIFECYCLE_ACTIONS }) action!: UserLifecycleAction;
  @ApiPropertyOptional({ nullable: true, type: String })
  reason!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  recordedByUserId!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: string;
}

/** Estado de ciclo de vida de una cuenta, con su historia paginada. */
export class UserLifecycleViewDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: USER_LIFECYCLE_STATES }) state!: UserLifecycleState;
  @ApiProperty({ type: [UserLifecycleEventDto] })
  items!: UserLifecycleEventDto[];
  @ApiPropertyOptional({ nullable: true, type: String })
  nextCursor!: string | null;
  @ApiProperty() limit!: number;
}
