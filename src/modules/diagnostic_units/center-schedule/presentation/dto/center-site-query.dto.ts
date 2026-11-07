import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** `?siteId`: the site (branch) of the center; absent, the main site. */
export class CenterSiteQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: '`diagnostic_unit_sites.id`; absent, the main site.',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;
}
