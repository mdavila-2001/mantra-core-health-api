import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { isUUID } from 'class-validator';
import { PinoLogger } from 'nestjs-pino';
import { runWithTenant, type AuthenticatedUser } from '../../../common';
import { Encounters } from '../../clinical/entities';
import { DiagnosticUnits } from '../../diagnostic_units/entities';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { InsuranceClaims, PatientCoverages } from '../entities';
import { INS } from '../insurance.concepts';
import type { MyClaimListDto, MyClaimsView } from '../dto/my-claims.dto';
import {
  InsurerReceivedClaimsService,
  MAX_RECEIVED_CLAIMS,
} from './insurer-received-claims.service';

/** Las consultas siempre restringen el dueño antes de leer solicitudes. */
@Injectable()
export class MyClaimsService {
  constructor(
    private readonly em: EntityManager,
    private readonly receivedClaims: InsurerReceivedClaimsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MyClaimsService.name);
  }

  /** Profesional > centro (laboratorio > imagen) > paciente > ninguna. */
  async list(
    actor: AuthenticatedUser,
    declaredTenantId?: string,
  ): Promise<MyClaimListDto> {
    const tenantId = this.selectedTenant(actor, declaredTenantId);
    const em = this.em.fork();
    if (actor.practitionerProfileId) {
      const encounters = await em.find(Encounters, {
        primaryPractitionerId: actor.practitionerProfileId,
      });
      return this.readClaims(em, actor, 'PRACTITIONER', {
        encounterId: { $in: encounters.map((encounter) => encounter.id) },
      });
    }

    if (tenantId) {
      const result = await runWithTenant(tenantId, () => {
        if (process.env.RLS_ENFORCE !== 'true')
          return this.readCenter(em, actor, tenantId);
        return em.transactional(async (tx) => {
          await tx.execute(
            "select set_config('app.system_context', 'false', true)",
          );
          await tx.execute(
            "select set_config('app.current_tenant_id', ?, true)",
            [tenantId],
          );
          return this.readCenter(tx, actor, tenantId);
        });
      });
      if (result) return result;
    }

    if (actor.roles.includes('PATIENT') && actor.patientProfileId) {
      const coverages = await em.find(PatientCoverages, {
        patientProfileId: actor.patientProfileId,
      });
      return this.readClaims(em, actor, 'PATIENT', {
        patientCoverageId: { $in: coverages.map((coverage) => coverage.id) },
      });
    }
    return { view: 'NONE', items: [], truncated: false };
  }

  /** No hay excepción de plataforma: la vista de centro requiere membresía. */
  private selectedTenant(
    actor: AuthenticatedUser,
    declared?: string,
  ): string | undefined {
    if (declared !== undefined) {
      if (typeof declared !== 'string' || !isUUID(declared)) {
        throw new BadRequestException('X-Tenant-Id debe ser un UUID');
      }
      if (!actor.tenantIds?.includes(declared)) {
        throw new ForbiddenException(
          'No hay acceso a las solicitudes del tenant indicado',
        );
      }
      return declared;
    }
    return actor.tenantIds?.length === 1 ? actor.tenantIds[0] : undefined;
  }

  /** Un tenant mixto usa laboratorio: evita una vista dependiente del orden de DB. */
  private async readCenter(
    em: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<MyClaimListDto | null> {
    const units = await em.find(DiagnosticUnits, {
      tenantId,
      statusConceptId: DUNIT.UNIT_ACTIVE,
      diagnosticUnitTypeConceptId: {
        $in: [DUNIT.UNIT_TYPE_LABORATORY, DUNIT.UNIT_TYPE_IMAGING],
      },
    });
    if (units.length === 0) return null;
    const laboratory = units.filter(
      (unit) => unit.diagnosticUnitTypeConceptId === DUNIT.UNIT_TYPE_LABORATORY,
    );
    const owned = laboratory.length > 0 ? laboratory : units;
    return this.readClaims(
      em,
      actor,
      laboratory.length > 0 ? 'LABORATORY' : 'IMAGING',
      {
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT,
        billingProviderEntityId: { $in: owned.map((unit) => unit.id) },
      },
    );
  }

  /** Sondeo de 501 filas; la proyección no revela póliza, afiliación ni firmante. */
  private async readClaims(
    em: EntityManager,
    actor: AuthenticatedUser,
    view: MyClaimsView,
    where: Record<string, unknown>,
  ): Promise<MyClaimListDto> {
    const rows = await em.find(InsuranceClaims, where, {
      orderBy: [
        { submittedAt: QueryOrder.DESC_NULLS_LAST },
        { id: QueryOrder.DESC },
      ],
      limit: MAX_RECEIVED_CLAIMS + 1,
    });
    const page = rows.slice(0, MAX_RECEIVED_CLAIMS);
    const items = await this.receivedClaims.buildMyItems(em, page, view);
    this.logger.info(
      {
        operation: 'insurance.my-claims.read',
        actorUserId: actor.id,
        view,
        claimIds: page.map((claim) => claim.id),
      },
      'Reading own insurance claims',
    );
    return { view, items, truncated: rows.length > MAX_RECEIVED_CLAIMS };
  }
}
