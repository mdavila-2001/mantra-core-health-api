import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /community/moderation/decisions/{decisionId}/appeal` (UC-19-10). */
export class CreateAppealDto {
  /**
   * Perfil que apela.
   *
   * Se comprueba que sea del actor: apelar en nombre de otro dejaría a
   * cualquiera abriendo apelaciones sobre sanciones ajenas —y una decisión sólo
   * admite una apelación abierta a la vez, así que además le quemaría la suya al
   * sancionado.
   */
  @ApiProperty({ description: 'Perfil que apela (sancionado)', format: 'uuid' })
  @IsUUID()
  appellantProfileId!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Motivo de la apelación', maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reasonText!: string;
}

/**
 * Cuerpo de `POST /community/moderation/appeals/{appealId}/resolve` (UC-19-10).
 *
 * La resolución es el paso que faltaba: se podía apelar y no había forma de
 * cerrar la apelación, así que toda apelación quedaba abierta para siempre y el
 * contenido que la apelación re-encoló nunca salía de la cola.
 *
 * ## Por qué no lleva motivo, y eso es un bloqueo declarado
 *
 * `community.moderation_appeals` registra quién resolvió, qué resolvió y cuándo
 * —`reviewed_by_user_id`, `resolution_concept_id`, `resolved_at`— pero **no
 * tiene columna para el motivo de la resolución**. Pedir un motivo que no se
 * puede guardar sería pedirle a un moderador que escriba algo que se descarta.
 *
 * Las dos salidas descartadas y por qué:
 *
 * - Guardarlo como una fila de `moderation_decisions` diría que se tomó una
 *   decisión de moderación nueva sobre el contenido, que no es lo que pasó.
 * - Agregar la columna acá sería agregar esquema dentro del carril, que el
 *   contrato prohíbe (§7).
 *
 * Queda registrado como **bloqueo de esquema** en el reporte del carril: hace
 * falta `moderation_appeals.resolution_rationale_text` para que una apelación
 * resuelta se pueda auditar. Mientras tanto, el motivo no se pide.
 */
@ApiSchema({ name: 'CommunityResolveAppealDto' })
export class ResolveAppealDto {
  /**
   * Qué se resuelve.
   */
  @ApiProperty({
    description: 'Resolución de la apelación',
    enum: ['UPHELD', 'OVERTURNED', 'PARTIAL'],
  })
  @IsIn(['UPHELD', 'OVERTURNED', 'PARTIAL'])
  resolution!: 'UPHELD' | 'OVERTURNED' | 'PARTIAL';
}
