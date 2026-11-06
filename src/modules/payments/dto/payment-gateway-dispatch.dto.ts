import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';
import {
  GATEWAY_PAYMENT_METHOD_TYPES,
  type GatewayPaymentMethodType,
} from '../gateway/payments-gateway.types';

/** 10 o más letras entre letras, números, espacios y puntuación corriente. */
const REASON_PATTERN =
  /^(?=(?:[^\p{L}]*\p{L}){10})[\p{L}\p{N}\s.,;:()¿?¡!'"%/_-]{10,300}$/u;

/** Cuerpo de la conciliación de una reserva de despacho. */
export class ReconcileGatewayDispatchDto {
  @ApiProperty({
    description:
      'El MISMO medio de pago con el que se intentó el cobro la primera vez (no se persiste): con otro, la pasarela contesta `idempotency_key_reused`.',
    enum: GATEWAY_PAYMENT_METHOD_TYPES,
  })
  @IsIn(GATEWAY_PAYMENT_METHOD_TYPES as readonly string[])
  paymentMethodType!: GatewayPaymentMethodType;
}

/** Cuerpo del cierre manual de una reserva de despacho. */
export class CloseGatewayDispatchDto {
  @ApiProperty({
    description:
      'Motivo del cierre, obligatorio: qué se comprobó contra la pasarela. Sin datos personales ni de pacientes.',
    minLength: 10,
    maxLength: 300,
  })
  // Sólo texto: letras, números y puntuación corriente, con al menos 10 letras. No
  // llaves, corchetes ni símbolos (rechaza JSON y basura numérica). Se recorta antes
  // de validar y no se convierte a texto un número ni un objeto.
  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    typeof obj.reason === 'string' ? obj.reason.trim() : obj.reason,
  )
  @IsString()
  @MaxLength(300)
  @Matches(REASON_PATTERN, {
    message:
      'El motivo debe ser texto con al menos 10 letras (sin llaves, corchetes ni símbolos)',
  })
  reason!: string;
}

/** Una reserva de despacho que requiere conciliación. Sin datos personales. */
export class PendingGatewayDispatchDto {
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiPropertyOptional({
    description:
      'Antigüedad de la reserva en milisegundos; ausente si su fecha no se puede leer.',
    nullable: true,
  })
  ageMs!: number | null;

  @ApiProperty({
    description:
      '`true` si todavía se puede reenviar con la misma clave (conciliar); `false` si hay que cerrarla a mano.',
  })
  canReconcile!: boolean;
}

/** Resultado del cierre manual. */
export class ClosedGatewayDispatchDto {
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
