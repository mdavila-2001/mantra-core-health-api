import { ApiProperty } from '@nestjs/swagger';
import { DIRECTORY_USER_TYPES } from '../ports/users-directory-read.port';

export class DirectoryRoleDto {
  @ApiProperty({ format: 'uuid' }) assignmentId!: string;
  @ApiProperty({ example: 'SECURITY_ADMIN' }) roleCode!: string;
  @ApiProperty() roleName!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  tenantId!: string | null;
  @ApiProperty({ nullable: true, type: String }) validTo!: string | null;
}

export class DirectoryPermissionSummaryDto {
  @ApiProperty({ description: 'Distinct permissions allowed and not denied' })
  allowed!: number;
  @ApiProperty({ description: 'Distinct permissions denied (deny wins)' })
  denied!: number;
  @ApiProperty({ description: 'Allowed permissions flagged as dangerous' })
  dangerous!: number;
  @ApiProperty({ description: 'Active direct grants outside any role' })
  directGrants!: number;
  @ApiProperty({
    description:
      'True for a platform SUPERADMIN: it passes permission checks as a wildcard, so the counts above do not bound it',
  })
  unrestricted!: boolean;
}

export class DirectoryUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: DIRECTORY_USER_TYPES }) type!: string;
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  mfaStatusConceptId!: string | null;
  @ApiProperty({ nullable: true, type: String }) lastLoginAt!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    example: 'm***@c***.org',
    description: 'Null unless the login subject is an email',
  })
  maskedEmail!: string | null;
  @ApiProperty({
    type: [String],
    example: ['SECURITY_ADMIN'],
    description: 'Active iam global role codes, sorted; empty when none',
  })
  globalRoles!: string[];
  @ApiProperty({
    type: [DirectoryRoleDto],
    description:
      'Live authz assignments that apply in the scope: those of the organization and those with no tenant (tenantId null)',
  })
  roles!: DirectoryRoleDto[];
  @ApiProperty({ type: DirectoryPermissionSummaryDto })
  permissions!: DirectoryPermissionSummaryDto;
}

export class UsersDirectoryPageDto {
  @ApiProperty({ type: [DirectoryUserDto] }) items!: DirectoryUserDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({
    enum: ['PLATFORM', 'TENANT'],
    description: 'Scope the caller was held to',
  })
  scope!: 'PLATFORM' | 'TENANT';
}
