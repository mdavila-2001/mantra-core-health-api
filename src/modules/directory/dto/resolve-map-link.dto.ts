import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

/** The link a user pasted in the "location link" field of a branch. */
export class ResolveMapLinkDto {
  /** Google Maps (long or `maps.app.goo.gl`) or OpenStreetMap link. */
  @ApiProperty({
    maxLength: 2000,
    example: 'https://maps.app.goo.gl/uwjxPfc6SYBhtQ3e7',
  })
  @IsString()
  @MaxLength(2000)
  @Matches(/^https?:\/\//i, { message: 'url debe ser http o https' })
  url!: string;
}

/** What the link points to, so the map can show the pin before saving. */
export class ResolveMapLinkResponseDto {
  /** `false` when the link carries no coordinates the server could read. */
  @ApiProperty() resolved!: boolean;

  /** Latitude (-90 to 90), when resolved. */
  @ApiPropertyOptional() latitude?: number;

  /** Longitude (-180 to 180), when resolved. */
  @ApiPropertyOptional() longitude?: number;
}
