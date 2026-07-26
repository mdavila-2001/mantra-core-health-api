import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** Cuerpo de `POST /iam/auth/token/refresh` (UC-01-06). */
export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token en crudo emitido previamente' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
