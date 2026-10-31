import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  ADULT_AGE_YEARS,
  EXACT_SEARCH_HELP,
  ageInYears,
  checkExactPatientSearch,
} from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  SupportPatientSearchDto,
  SupportPatientSearchResponseDto,
} from '../dto';
import {
  SupportAccessRepository,
  SupportPatientsRepository,
} from '../repositories';
import { SupportAccessPolicy } from './support-access.policy';
import {
  loadPatientStanding,
  sealInOwnPartition,
} from './support-patient-access';
import {
  resolveNationalId,
  resolveTenantId,
  throttledException,
} from './support-patient-input';
import { SupportPatientProbeCounter } from './support-patient-probe-counter';
import { withTenantContext } from './tenant-context';
import { toMatchDto } from './support-patient-view';

/** Resultado interno: el rechazo se informa después de sellar la bitácora. */
type SearchOutcome =
  | { kind: 'found'; result: SupportPatientSearchResponseDto }
  | { kind: 'denied' }
  | { kind: 'inexact' };

/**
 * Búsqueda de pacientes del personal de apoyo. Es EXACTA —documento completo,
 * teléfono completo, o nombre completo más fecha de nacimiento exacta—, devuelve
 * lo mínimo para reconocer a la persona (id, nombre, edad, documento y teléfono
 * tapados y, en un menor, sus representantes) y **cada búsqueda queda auditada
 * en la organización indicada**, también la rechazada. Lo parcial se rechaza
 * con 422 y un mensaje que dice cómo buscar.
 *
 * ## Tope y bitácora
 *
 * - El intento se CUENTA primero, antes de mirar el cuerpo y fuera de la
 *   transacción (`SupportPatientProbeCounter`): por persona en todas sus
 *   organizaciones y por IP. Lo que acabe en rechazo o en excepción ya contó.
 * - El vínculo con la organización se verifica ANTES de sellar en ella: el
 *   rechazo de quien no tiene vínculo vivo allí se sella en su partición propia
 *   (sin tenant), nunca en la cadena de la organización del cuerpo.
 */
@Injectable()
export class SupportPatientSearchService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param policy - Política de acceso del personal de apoyo.
   * @param engagements - Vínculos de apoyo.
   * @param patients - Búsqueda exacta de pacientes.
   * @param audit - Sello en la cadena de auditoría.
   * @param probes - Contador atómico de consultas (persona e IP).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly policy: SupportAccessPolicy,
    private readonly engagements: SupportAccessRepository,
    private readonly patients: SupportPatientsRepository,
    private readonly audit: AuditTrailService,
    private readonly probes: SupportPatientProbeCounter,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportPatientSearchService.name);
  }

  /**
   * Busca pacientes con criterio exacto en nombre de la persona de apoyo.
   *
   * @param dto - Organización (`tenantId` u `org`) y criterios (`nationalId` o
   *   `document`, `phone`, `fullName` con `birthDate`).
   * @param actor - La persona de apoyo.
   * @param ip - IP de origen (tope por IP).
   * @returns Las coincidencias exactas, con lo mínimo para reconocerlas.
   */
  async search(
    dto: SupportPatientSearchDto,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<SupportPatientSearchResponseDto> {
    // Primero se cuenta, antes de resolver el cuerpo y fuera de la transacción.
    const probe = await this.probes.hit(actor.id, ip);
    if (!probe.allowed) {
      if (probe.firstOverflow) {
        await this.em.transactional((tx) =>
          sealInOwnPartition(this.audit, tx, actor, {
            action: 'SUPPORT_PATIENT_SEARCH_THROTTLED',
            entity: 'patient_search',
            success: false,
          }),
        );
      }
      throw throttledException(probe.exceeded);
    }
    const tenantId = resolveTenantId(dto);
    const criteria = {
      nationalId: resolveNationalId(dto),
      phone: dto.phone,
      fullName: dto.fullName,
      birthDate: dto.birthDate,
    };
    // Con RLS la ruta no trae organización activa: la lectura entra a la del
    // cuerpo (`withTenantContext`) para ver SUS vínculos, citas y representaciones.
    const outcome = await this.em.transactional((tx) =>
      withTenantContext(tx, tenantId, async (): Promise<SearchOutcome> => {
        const standing = await loadPatientStanding(
          this.policy,
          this.engagements,
          tx,
          actor.id,
          tenantId,
          new Date(),
          'search',
        );
        if (!standing.canSearch) {
          if (standing.linked) {
            await this.seal(
              tx,
              actor,
              tenantId,
              'SUPPORT_PATIENT_SEARCH_DENIED',
              false,
            );
          } else {
            // Sin vínculo vivo en la organización del cuerpo: el rechazo es de
            // la persona, no de esa organización.
            await sealInOwnPartition(this.audit, tx, actor, {
              action: 'SUPPORT_PATIENT_SEARCH_DENIED',
              entity: 'patient_search',
              success: false,
            });
          }
          return { kind: 'denied' };
        }
        const verdict = checkExactPatientSearch(criteria);
        if (!verdict.allowed || !verdict.mode) {
          await this.seal(
            tx,
            actor,
            tenantId,
            'SUPPORT_PATIENT_SEARCHED',
            false,
          );
          return { kind: 'inexact' };
        }
        const found = await this.patients.findExact(tx, verdict.mode, criteria);
        // Las condiciones `patients` de sus permisos (alcance, edad, banderas,
        // cobertura) filtran el resultado: lo que queda fuera es indistinguible de
        // un paciente inexistente y no gasta cupo de pacientes distintos.
        const visible =
          typeof this.policy.filterSearchResults === 'function'
            ? await this.policy.filterSearchResults(
                actor.id,
                tenantId,
                found.map((r) => r.profileId),
                tx,
              )
            : undefined;
        const rows = visible
          ? found.filter((r) => visible.has(r.profileId))
          : found;
        await this.seal(tx, actor, tenantId, 'SUPPORT_PATIENT_SEARCHED', true);
        // Un asiento por paciente devuelto: así se puede responder «quién buscó
        // al paciente X», que la fila de la búsqueda sola no permite.
        for (const row of rows) {
          await this.audit.record(tx, actor, {
            action: 'SUPPORT_PATIENT_SEARCH_MATCH',
            entity: 'patient',
            entityId: row.profileId,
            tenantId,
            success: true,
          });
        }
        const now = new Date();
        const minors = rows
          .filter(
            (r) =>
              (ageInYears(r.birthDate, now) ?? ADULT_AGE_YEARS) <
              ADULT_AGE_YEARS,
          )
          .map((r) => r.profileId);
        const representatives = await this.patients.findRepresentatives(
          tx,
          tenantId,
          minors,
        );
        return {
          kind: 'found',
          result: {
            items: rows.map((r) => toMatchDto(r, representatives, now)),
            count: rows.length,
          },
        };
      }),
    );
    if (outcome.kind === 'denied') {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'No puede buscar pacientes en esta organización',
        undefined,
        Reason.SUPPORT_PATIENT_SEARCH_DENIED,
      );
    }
    if (outcome.kind === 'inexact') {
      throw new PreconditionFailedException(
        EXACT_SEARCH_HELP,
        { accepted: ['nationalId', 'phone', 'fullName+birthDate'] },
        Reason.SUPPORT_PATIENT_SEARCH_INEXACT,
      );
    }
    return outcome.result;
  }

  /** Sella la búsqueda en la cadena de auditoría (sin criterios ni datos del paciente). */
  private async seal(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    action: string,
    success: boolean,
  ): Promise<void> {
    await this.audit.record(tx, actor, {
      action,
      entity: 'patient_search',
      tenantId,
      success,
    });
  }
}
