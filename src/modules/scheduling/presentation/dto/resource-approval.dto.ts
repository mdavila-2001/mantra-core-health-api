import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { BookingResponseDto } from './scheduling-bookings.dto';

/** Query of `GET /scheduling/my-resources` (v4.2.88). */
export class MyResourcesQueryDto {
  @ApiProperty({ format: 'uuid', description: 'Tenant dueño de las agendas' })
  @IsUUID()
  tenantId!: string;
}

/** Body of `PATCH /scheduling/resources/:id`. Omitted fields are kept. */
@ApiSchema({ name: 'SchedulingUpdateResourceDto' })
export class UpdateResourceDto {
  @ApiPropertyOptional({
    description:
      'Si las solicitudes de consulta esperan que el profesional las acepte. ' +
      'Con `false` nacen confirmadas. La oferta de un servicio sigue mandando sobre su cupo.',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

/** One of the practitioner's own agendas and how it receives requests. */
export class ResourceApprovalDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    description:
      'Si las solicitudes de consulta esperan que el profesional las acepte',
  })
  requiresApproval!: boolean;
}

/** Response of `GET /scheduling/my-resources`. */
export class MyResourcesResponseDto {
  @ApiProperty({ type: [ResourceApprovalDto] })
  items!: ResourceApprovalDto[];
}

/** Response of `POST /scheduling/holds/:holdToken/request`. */
export class BookingRequestResponseDto extends BookingResponseDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description:
      'Presente cuando la solicitud nació confirmada porque no requiere la aceptación del profesional.',
  })
  confirmedAt?: string;
}
