import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/**
 * Cuerpo de `PUT /forms/assignments/order` (CL-61).
 *
 * Se manda **la lista entera** de asignaciones propias del target en el orden
 * final, no «subí ésta un lugar»: dos reordenamientos relativos seguidos se
 * pisan. Una lista incompleta es tolerada: las no nombradas van al final en su
 * orden previo. Un id que no es una asignación propia de ese target → 422.
 */
export class ReorderAssignmentsDto {
  /**
   * El formulario cuyos campos se reordenan.
   */
  @ApiProperty({ description: 'Recurso destino (concept id)', format: 'uuid' })
  @IsUUID()
  targetResourceConceptId!: string;

  /**
   * Las asignaciones propias, en el orden final.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Asignaciones propias en el orden final (sin repetidos)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  assignmentIds!: string[];
}
