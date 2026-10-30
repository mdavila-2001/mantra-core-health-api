import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { TenantsRepository } from '../../directory/repositories/tenants.repository';
import { AddressesRepository } from '../../common/repositories';
import { PRAC } from '../practice.concepts';
import { PracticeSitesRepository, PracticesRepository } from '../repositories';
import type {
  CreateOrganizationPracticeDto,
  OrganizationPracticeResponseDto,
} from '../dto';
import { siteCodeBase, uniqueCode } from '../site-code';

/**
 * Alta de la práctica y la primera sede de una organización ya verificada
 * (CM-11, A-10).
 *
 * `POST /practices` y `POST /practices/:practiceId/sites` exigen
 * `SECURITY_ADMIN`, y el autorregistro sólo materializa práctica propia para
 * `DIAGNOSTIC_CENTER`. Un centro médico registrado como `HOSPITAL` quedaba
 * entonces sin práctica ni sede hasta que la plataforma las creara por él, y
 * sin sede no hay dónde colgar el catálogo por sede ni un punto para la
 * búsqueda por cercanía. Este servicio le da ese paso a la propia
 * organización: su poder viene de la membresía `OWNER`/`ADMIN` **de ese**
 * tenant (A-6), no de un rol global.
 *
 * Mismo patrón que `OwnSiteProvisioningService`: práctica → dirección → sede,
 * pero acá sí abre su transacción, porque lo llama un endpoint y no otro
 * caso de uso que ya tenga una abierta.
 */
@Injectable()
export class OrganizationPracticeProvisioningService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia; de él sale la transacción.
   * @param tenantAdmin - Regla de administración por organización.
   * @param tenantsRepo - Organizaciones, para leer su verificación.
   * @param practicesRepo - Prácticas.
   * @param sitesRepo - Sedes.
   * @param addressesRepo - Dirección de la sede.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly tenantsRepo: TenantsRepository,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrganizationPracticeProvisioningService.name);
  }

  /**
   * Crea la práctica y su primera sede en una sola transacción.
   *
   * @param tenantId - Organización que abre su práctica.
   * @param dto - Nombre de la práctica y datos de la sede.
   * @param actor - Quien pide; debe administrar **esa** organización.
   * @returns Los identificadores de la práctica y de la sede.
   * @throws ForbiddenException si el actor no administra la organización (403).
   * @throws ResourceNotFoundException si la organización no existe (404).
   * @throws PreconditionFailedException si la organización no está verificada (422).
   * @throws ConflictException si ya tiene una práctica con ese nombre (409).
   */
  async provision(
    tenantId: string,
    dto: CreateOrganizationPracticeDto,
    actor: AuthenticatedUser,
  ): Promise<OrganizationPracticeResponseDto> {
    this.logger.info(
      {
        operation: 'practice.organization.provision',
        tenantId,
        actorId: actor.id,
      },
      'Provisioning organization practice',
    );
    return this.em.transactional(async (tx) => {
      // Primero la autorización: quien no administra la organización no debe
      // enterarse de si existe, está verificada o ya tiene práctica.
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);

      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      if (!tenant) {
        throw new ResourceNotFoundException('Organización no encontrada', {
          tenantId,
        });
      }
      // «Verificada» es el estado de verificación, no el de ciclo de vida: la
      // organización recién registrada ya es PENDING/UNVERIFIED y la
      // plataforma la verifica por `POST /admin/tenants/:id/verification`.
      if (tenant.verificationStatusConceptId !== CONCEPTS.TENANT_VERIFIED) {
        throw new PreconditionFailedException(
          'La organización todavía no fue verificada',
          { tenantId },
        );
      }

      const code = siteCodeBase(dto.name, 'CENTRO-MEDICO');
      const clash = await this.practicesRepo.findByTenantAndCode(
        tx,
        tenantId,
        code,
      );
      if (clash) {
        throw new ConflictException(
          'La organización ya tiene una práctica con ese nombre',
          { tenantId },
        );
      }

      const practice = this.practicesRepo.create(tx, {
        tenantId,
        code,
        name: dto.name,
        typeConceptId: PRAC.PRACTICE_TYPE_MEDICAL_CENTER,
        adminUserId: actor.id,
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // La dirección es de la organización (`OWNER_TENANT`), no de quien la
      // cargó: sobrevive al cambio de administrador.
      const address = this.addressesRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
        ownerId: tenantId,
        lines: dto.site.addressText.trim(),
        city: dto.site.cityText,
        countryConceptId: CONCEPTS.COUNTRY_BO,
        useConceptId: CONCEPTS.ADDR_USE_WORK,
        typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
        latitude: String(dto.site.latitude),
        longitude: String(dto.site.longitude),
        actorUserId: actor.id,
      });
      await tx.flush();

      const siteCode = await uniqueCode(
        siteCodeBase(dto.site.name, 'SEDE'),
        async (candidate) =>
          (await this.sitesRepo.findByPracticeAndCode(
            tx,
            practice.id,
            candidate,
          )) !== null,
      );
      const site = this.sitesRepo.create(tx, {
        practiceId: practice.id,
        code: siteCode,
        name: dto.site.name,
        siteTypeConceptId: PRAC.SITE_TYPE_OFFICE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        addressId: address.id,
        managingTenantId: tenantId,
        // F1: la sede pertenece al tenant de su práctica (NOT NULL desde v4.2.67).
        tenantId,
        statusConceptId: PRAC.SITE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'practice.organization.provision',
          practiceId: practice.id,
          practiceSiteId: site.id,
        },
        'Organization practice provisioned',
      );
      return { practiceId: practice.id, practiceSiteId: site.id };
    });
  }
}
