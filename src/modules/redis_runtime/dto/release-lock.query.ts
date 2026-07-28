import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Query de `DELETE /redis-runtime/locks/:key`: token del titular del lock. */
export class ReleaseLockQuery {
  @ApiProperty({ description: 'Token devuelto al adquirir el lock (CAS de liberación)' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  token!: string;
}
