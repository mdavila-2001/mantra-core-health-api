import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ConsentProvisionInputDto } from './consent-provision.dto';

/** Cuerpo de `PATCH /consent/consents/{id}/provisions` (UC-07-09). */
export class AmendProvisionsDto {
  @ApiProperty({
    description: 'Provisiones nuevas que reemplazan a las vigentes',
    type: [ConsentProvisionInputDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ConsentProvisionInputDto)
  provisions!: ConsentProvisionInputDto[];
}
