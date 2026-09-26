import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/**
 * Cuerpo de `PUT /surveys/templates/:id/questions/order` (CL-60).
 *
 * Se manda **la lista entera** en el orden final, no «subí ésta un lugar»: dos
 * reordenamientos relativos seguidos se pisan. Una lista incompleta es
 * tolerada: las preguntas no nombradas van al final en su orden previo. Un id
 * que no es de la versión en borrador responde 422.
 */
export class ReorderQuestionsDto {
  /**
   * Identificadores de las preguntas, en el orden final.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Preguntas en el orden final (sin repetidos)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  questionIds!: string[];
}
