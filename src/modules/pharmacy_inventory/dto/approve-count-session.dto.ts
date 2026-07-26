import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

/** Conteo capturado para una línea de la sesión. */
export class CountResultDto {
  @ApiProperty({ format: 'uuid', description: 'Línea de conteo' })
  @IsUUID()
  lineId!: string;

  @ApiProperty({ description: 'Cantidad efectivamente contada', minimum: 0 })
  @IsNumber()
  @Min(0)
  countedQuantity!: number;
}

/** Cuerpo de `POST /pharmacy/count-sessions/:id/approve` (UC-25-07). */
export class ApproveCountSessionDto {
  @ApiProperty({ type: [CountResultDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CountResultDto)
  counts!: CountResultDto[];
}
