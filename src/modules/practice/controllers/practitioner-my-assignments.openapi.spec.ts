import { MyRoleAssignmentResponseDto } from '../dto/self-request-role-assignment.dto';
import { SupportTeamMemberDto } from '../../delegated_access/dto/practitioner-support.dto';
import { PractitionerSupportController } from '../../delegated_access/controllers/practitioner-support.controller';
import { SupportTeamResponseDto } from '../../delegated_access/dto/practitioner-support.dto';
import { PractitionerSitesController } from './practitioner-sites.controller';

/**
 * Contrato OpenAPI de lo que el doctor necesita para «¿por qué pudo?» con datos
 * reales (pendientes 76): sin el id de su asignación de rol y el tenant, la
 * pantalla no puede armar la consulta de explain.
 */

/** Claves de metadatos de @nestjs/swagger (el paquete cierra sus subrutas). */
const API_RESPONSE = 'swagger/apiResponse';
const API_MODEL_PROPERTIES = 'swagger/apiModelPropertiesArray';

/** Nombres de las propiedades `@ApiProperty` de un DTO, sin el prefijo `:`. */
function propertiesOf(dto: { prototype: object }): string[] {
  const keys = Reflect.getMetadata(API_MODEL_PROPERTIES, dto.prototype) as
    string[] | undefined;
  return (keys ?? []).map((key) => key.replace(/^:/, ''));
}

describe('OpenAPI: GET /practitioners/me/role-assignments', () => {
  it('declara el 200 como lista de MyRoleAssignmentResponseDto', () => {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      PractitionerSitesController.prototype,
      'listMyAssignments',
    )?.value;
    const responses = Reflect.getMetadata(API_RESPONSE, handler as object) as
      Record<string, { type?: unknown; isArray?: boolean }> | undefined;
    expect(responses?.['200']?.type).toBe(MyRoleAssignmentResponseDto);
    expect(responses?.['200']?.isArray).toBe(true);
  });

  it('MyRoleAssignmentResponseDto documenta tenantId', () => {
    expect(propertiesOf(MyRoleAssignmentResponseDto)).toContain('tenantId');
  });
});

describe('OpenAPI: GET /me/practitioner/support-team', () => {
  it('declara el 200 como SupportTeamResponseDto', () => {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      PractitionerSupportController.prototype,
      'team',
    )?.value;
    const responses = Reflect.getMetadata(API_RESPONSE, handler as object) as
      Record<string, { type?: unknown }> | undefined;
    expect(responses?.['200']?.type).toBe(SupportTeamResponseDto);
  });

  it('SupportTeamMemberDto documenta practitionerRoleAssignmentId', () => {
    expect(propertiesOf(SupportTeamMemberDto)).toContain(
      'practitionerRoleAssignmentId',
    );
  });
});
