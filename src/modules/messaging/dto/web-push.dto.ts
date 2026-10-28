import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Claves de cifrado que genera el navegador para esta suscripción. */
export class WebPushKeysDto {
  @ApiProperty({ description: 'Clave pública ECDH (base64url)' })
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  p256dh!: string;

  @ApiProperty({ description: 'Secreto de autenticación (base64url)' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  auth!: string;
}

/** Cuerpo de `PUT /notifications/web-push/subscription`. */
export class WebPushSubscriptionDto {
  @ApiProperty({
    description: 'Dirección HTTPS del servicio de push del navegador',
  })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint!: string;

  @ApiProperty({ type: WebPushKeysDto })
  @ValidateNested()
  @Type(() => WebPushKeysDto)
  keys!: WebPushKeysDto;
}

/** Cuerpo de `DELETE /notifications/web-push/subscription`. */
export class WebPushUnsubscribeDto {
  @ApiProperty()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint!: string;
}

/** Respuesta de `GET /notifications/web-push/config`. */
export class WebPushConfigDto {
  @ApiProperty({
    description: 'Si el servidor tiene claves VAPID configuradas',
  })
  enabled!: boolean;

  @ApiProperty({ nullable: true, type: String })
  publicKey!: string | null;
}
