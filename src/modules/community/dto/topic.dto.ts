import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Body of `POST /community/topics`: an own topic for groups and forums. */
export class CreateTopicDto {
  /** Visible name of the topic. */
  @ApiProperty({ minLength: 3, maxLength: 80 })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string;
}
