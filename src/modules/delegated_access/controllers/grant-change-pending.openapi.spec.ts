import { GrantChangePendingDto } from '../dto';
import { SupportEngagementsController } from './support-engagements.controller';
import { TeamAdminController } from './team-admin.controller';

/**
 * Otorgar o editar un permiso puede responder `202` con `GrantChangePendingDto` (átomo CRÍTICA que
 * espera a otra persona: cuatro ojos). Si el contrato OpenAPI no lo declara, el cliente generado solo
 * conoce el 201/200 y trata el 202 como error. Lo exige el contrato de las cuatro rutas.
 */

/** Clave de metadatos de `@ApiResponse` de @nestjs/swagger (no se puede importar: el paquete cierra sus subrutas). */
const API_RESPONSE = 'swagger/apiResponse';

type Route = readonly [string, object, string];

const ROUTES: readonly Route[] = [
  [
    'POST /org/support-engagements/:id/grants',
    SupportEngagementsController.prototype,
    'addGrant',
  ],
  [
    'PATCH /org/support-engagements/:id/grants',
    SupportEngagementsController.prototype,
    'updateGrant',
  ],
  [
    'POST /org/team/members/:id/grants',
    TeamAdminController.prototype,
    'addGrant',
  ],
  [
    'PATCH /org/team/members/:id/grants',
    TeamAdminController.prototype,
    'updateGrant',
  ],
];

describe('OpenAPI: 202 GrantChangePendingDto al otorgar o editar permisos', () => {
  it.each(ROUTES)(
    '%s declara el 202 con GrantChangePendingDto',
    (_name, proto, method) => {
      const handler: unknown = Object.getOwnPropertyDescriptor(
        proto,
        method,
      )?.value;
      const responses = Reflect.getMetadata(API_RESPONSE, handler as object) as
        Record<string, { type?: unknown }> | undefined;
      expect(responses?.['202']?.type).toBe(GrantChangePendingDto);
    },
  );
});
