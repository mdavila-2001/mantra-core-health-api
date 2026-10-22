import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

/** Archivo ya subido; null quita el logo, campo omitido es inválido. */
export class SetOrganizationLogoDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  fileId!: string | null;
}
