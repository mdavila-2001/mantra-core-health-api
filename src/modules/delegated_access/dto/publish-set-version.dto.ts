import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { PermissionSetItemDto } from './permission-set-item.dto';

/** Cuerpo de `POST /delegated-permission-sets/{id}/versions` (UC-29-02). */
export class PublishSetVersionDto {
  @ApiProperty({ description: 'Ítems de permiso de la nueva versión', type: [PermissionSetItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PermissionSetItemDto)
  items!: PermissionSetItemDto[];
}
