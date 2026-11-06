import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { NativePlatform } from '../services/native-push.service';

/** Body of `PUT /notifications/native-push/token`. */
export class NativePushTokenDto {
  @ApiProperty({ description: 'FCM registration token of this app install' })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  token!: string;

  @ApiProperty({ enum: ['IOS', 'ANDROID'] })
  @IsIn(['IOS', 'ANDROID'])
  platform!: NativePlatform;

  @ApiProperty({
    description:
      'Stable install fingerprint, the same one sent to POST /iam/users/:id/devices',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  deviceFingerprint!: string;
}

/** Body of `DELETE /notifications/native-push/token`. */
export class NativePushTokenDeleteDto {
  @ApiProperty({ description: 'FCM registration token to forget' })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  token!: string;
}
