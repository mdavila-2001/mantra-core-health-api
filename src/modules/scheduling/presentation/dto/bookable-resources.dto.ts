import { ApiProperty } from '@nestjs/swagger';

/**
 * A practitioner (or laboratory) a patient can book with, in any organization.
 * One entry per person per organization: a doctor with two consulting rooms is
 * one choice; the room is asked afterwards with the tenant's own agenda.
 */
export class BookableResourceDto {
  /** The organization: the `X-Tenant-Id` its agenda is read with. */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /** Trade name, or legal name; the platform's own tenant reads «AloVida». */
  @ApiProperty()
  organizationName!: string;

  /** One of the person's resources in that organization. */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  /** Table the resource points to, e.g. `health_practitioner_profiles`. */
  @ApiProperty()
  resourceRefType!: string;

  /** The person (or room) behind the resource. */
  @ApiProperty({ format: 'uuid' })
  resourceRefId!: string;

  /** The person's display name, or the resource name when there is none. */
  @ApiProperty()
  name!: string;
}

/** Response of `GET /scheduling/bookable-resources`. */
export class BookableResourcesResponseDto {
  /** This page, by name. */
  @ApiProperty({ type: [BookableResourceDto] })
  items!: BookableResourceDto[];

  /** Entries in this page. */
  @ApiProperty()
  count!: number;

  /** Entries matching the query across all pages. */
  @ApiProperty()
  total!: number;
}
