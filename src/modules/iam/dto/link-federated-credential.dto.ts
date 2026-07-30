import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /iam/users/:id/credentials/federated` (UC-01-02). */
export class LinkFederatedCredentialDto {
  /**
   * Valor de identity provider mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Proveedor de identidad externo (p. ej. google, azure-ad)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  identityProvider!: string;

  /**
   * Valor de external subject mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador del sujeto en el proveedor externo',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(320)
  externalSubject!: string;
}
