import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  APP_ATTR,
  TracingService,
  type TraceSpan,
} from '../../../../observability';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  TokenService,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  BRANCH_TYPE_CONCEPT_BY_CODE,
  DIR,
  MEDICAL_FACILITY_TENANT_TYPES,
  TENANT_TYPE_CONCEPT_BY_CODE,
} from '../../../directory/directory.concepts';
import {
  countryConceptForLegalEntityType,
  resolveLegalEntityType,
} from '../../../../common/constants/legal-entity-types';
import {
  DIRECTORY_REGISTRATION_PORT,
  type DirectoryRegistrationPort,
} from '../ports/directory-registration.port';
import {
  EMAIL_NOTICE_PORT,
  type EmailNoticePort,
} from '../ports/email-notice.port';
import {
  PHARMACY_REGISTRATION_PORT,
  type PharmacyRegistrationPort,
} from '../ports/pharmacy-registration.port';
import { composeAccountDisplayName } from '../../../../common/text/person-name';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../../infrastructure/repositories';
import {
  RegisterOrganizationDto,
  RegisterOrganizationResponseDto,
} from '../../presentation/dto';
import { IamOrganizationRepresentativesService } from './iam-organization-representatives.service';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Nombre con el que nace la sede central de una farmacia (P50). */
const PHARMACY_HEADQUARTERS_NAME = 'Casa central';

/** Vida útil del token de verificación de correo (24 h). */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Las formas de persona natural: no tienen escritura de constitución. El
 * profesional independiente, además, ejerce con su NIT personal y sin
 * matrícula de comercio (`terminology-designations.es.ts`). Decisión del
 * propietario del 28/10/2026 para el alta de organización médica.
 */
const WITHOUT_CONSTITUTION: ReadonlySet<string> = new Set([
  'UNIPERSONAL',
  'PROFESIONAL_INDEPENDIENTE',
]);
const WITHOUT_COMMERCE_REGISTRY: ReadonlySet<string> = new Set([
  'PROFESIONAL_INDEPENDIENTE',
]);

/**
 * Los documentos que exige el tipo societario, comprobados **antes** de crear
 * nada (CL-43).
 *
 * El DTO deja opcionales la escritura de constitución, la matrícula de
 * comercio y el poder del representante porque las personas naturales no los
 * tienen (ver {@link WITHOUT_CONSTITUTION} y {@link WITHOUT_COMMERCE_REGISTRY});
 * el resto de las formas (SRL, S.A., ...) los exige. Vive acá y no en un
 * `@ValidateIf` del DTO porque el bloque `legalDocuments` no ve el
 * `legalEntityType`, que está un nivel más arriba. Responde 422 nombrando el
 * documento faltante y, al correr antes de cualquier escritura, no queda
 * ninguna cuenta a medias.
 */
function assertLegalDocumentsForEntityType(
  organization: RegisterOrganizationDto['organization'],
): void {
  const entityType = organization.legalEntityType ?? '';
  if (
    organization.legalDocuments &&
    organization.legalDocuments.commerceRegistryFileId === undefined &&
    !WITHOUT_COMMERCE_REGISTRY.has(entityType)
  ) {
    throw new PreconditionFailedException(
      'Falta la matrícula de comercio: sólo un profesional independiente puede omitirla',
      { document: 'commerceRegistryFileId' },
    );
  }
  if (organization.legalEntityType === 'UNIPERSONAL') return;
  if (
    organization.legalDocuments &&
    organization.legalDocuments.constitutionFileId === undefined &&
    !WITHOUT_CONSTITUTION.has(entityType)
  ) {
    throw new PreconditionFailedException(
      'Falta la escritura de constitución: sólo una empresa unipersonal o un profesional independiente pueden omitirla',
      { document: 'constitutionFileId' },
    );
  }
  // Farmacia (P50): el poder, como los otros cinco papeles, se exige para
  // operar y no para nacer (decisión D2 del carril). Lo hace cumplir la
  // verificación de la plataforma (`PharmacyOperatingRequirementsService`),
  // y la farmacia lo puede subir después con
  // `POST /tenants/{id}/affiliation-documents`.
  if (
    organization.tenantType !== 'PHARMACY' &&
    organization.legalRepresentative &&
    organization.legalRepresentative.powerOfAttorneyFileId === undefined
  ) {
    throw new PreconditionFailedException(
      'Falta el poder notariado del representante legal: sólo una empresa unipersonal puede omitirlo',
      { document: 'powerOfAttorneyFileId' },
    );
  }
}

/**
 * Auto-registro de organizaciones (UC-04-01 en su variante self-service).
 *
 * Hasta ahora una organización sólo podía existir si un `SUPERADMIN` de la
 * plataforma la creaba a mano con `POST /admin/tenants`, y encima aportando el
 * `ownerUserId` de una cuenta que ya tenía que existir. Eso hacía imposible el
 * alta por iniciativa propia: la organización no podía crearse a sí misma.
 * Este servicio es el espejo de `IamPatientSelfRegistrationService` para el
 * lado B2B — la cuenta de quien dirige la organización y la organización nacen
 * en la misma transacción, porque una sin la otra no sirve para nada.
 *
 * Dos decisiones que no son negociables aquí:
 *
 * 1. El tenant nace PENDING/UNVERIFIED, igual que por la vía administrativa. Un
 *    prestador que se auto-verificara sería un agujero regulatorio: la
 *    verificación (`POST /admin/tenants/{id}/verification`) sigue siendo un
 *    acto de la plataforma, que es quien contrasta licencia y personería.
 * 2. La cuenta owner nace ACTIVA y con rol global `USER`. `SECURITY_ADMIN` y
 *    `SUPERADMIN` son roles de plataforma, no de cliente: concederlos aquí
 *    dejaría que cualquiera con un formulario se hiciera administrador del
 *    sistema entero. El poder del owner sobre SU organización viene de la
 *    membresía `DIR.ROLE_OWNER`, no del rol global.
 */
@Injectable()
export class IamOrganizationSelfRegistrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenService - Valor de token service requerido por la operación.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param emailVerificationsRepo - Valor de email verifications repo requerido por la operación.
   * @param directory - Tenant, membresía, sucursales, perfil por tipo y documentos legales (subtarea 1.2) de `directory`.
   * @param emailNotice - Encolado del correo de verificación.
   * @param pharmacies - La farmacia, su central y sus sucursales, que nacen con el alta (P50).
   * @param representatives - Registra al representante legal y a las gerencias (subtarea 1.4).
   * @param logger - Valor de logger requerido por la operación.
   * @param tracing - Valor de tracing requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly emailVerificationsRepo: EmailVerificationsRepository,
    @Inject(DIRECTORY_REGISTRATION_PORT)
    private readonly directory: DirectoryRegistrationPort,
    @Inject(EMAIL_NOTICE_PORT)
    private readonly emailNotice: EmailNoticePort,
    @Inject(PHARMACY_REGISTRATION_PORT)
    private readonly pharmacies: PharmacyRegistrationPort,
    private readonly representatives: IamOrganizationRepresentativesService,
    private readonly logger: PinoLogger,
    private readonly tracing: TracingService,
  ) {
    this.logger.setContext(IamOrganizationSelfRegistrationService.name);
  }

  /**
   * Da de alta la organización y la cuenta de su owner en una sola operación.
   *
   * @param dto - Datos de la organización y de su owner.
   * @param ip - IP de origen, para el evento de seguridad.
   * @returns Identificadores de lo creado y si salió el correo de verificación.
   * @throws ConflictException si el código de organización o el correo ya existen.
   */
  async registerOrganization(
    dto: RegisterOrganizationDto,
    ip?: string,
  ): Promise<RegisterOrganizationResponseDto> {
    // Span de negocio: el alta cruza dos módulos y cinco tablas, y encola un
    // correo fuera de la transacción. Cuando alguien reporte "me registré pero
    // no puedo entrar", el span dice hasta dónde llegó el flujo.
    //
    // Privacidad: no se registra el correo ni el nombre del owner. Sólo el tipo
    // de organización y los identificadores internos ya creados.
    return this.tracing.runInSpan(
      'directory.organization.self-register',
      {
        [APP_ATTR.MODULE]: 'directory',
        [APP_ATTR.OPERATION]: 'organization.self-register',
        [APP_ATTR.ENTITY_TYPE]: 'directory.tenants',
        'directory.organization.type':
          dto.organization.tenantType ?? 'PROVIDER',
      },
      (span) => this.performRegisterOrganization(dto, span, ip),
    );
  }

  /**
   * Registro propiamente dicho. Se extrajo para que `registerOrganization` sea
   * sólo la declaración del span de negocio.
   */
  private async performRegisterOrganization(
    dto: RegisterOrganizationDto,
    span: TraceSpan,
    ip?: string,
  ): Promise<RegisterOrganizationResponseDto> {
    this.logger.info(
      { operation: 'directory.organization.self-register' },
      'Organization self-registration',
    );

    const created = await this.em.transactional(async (tx) => {
      // Las dos unicidades se comprueban ANTES de escribir nada: el código de
      // tenant y el correo del owner son ambos únicos, y descubrirlo por una
      // violación de constraint devolvería un 500 en vez de un 409 explicativo.
      const codeClash = await this.directory.findTenantByCode(
        tx,
        dto.organization.code,
      );
      if (codeClash) {
        this.logger.warn(
          {
            operation: 'directory.organization.self-register',
            reason: 'code-in-use',
          },
          'Rejected self-registration: organization code already exists',
        );
        throw new ConflictException(
          'El código de organización ya existe',
          { code: dto.organization.code },
          IamErrorReason.ORGANIZATION_CODE_IN_USE,
        );
      }

      // Cerrojo por correo antes de comprobarlo, como el alta de paciente: sin
      // él, dos altas simultáneas con el mismo correo pasan las dos la lectura y
      // la segunda choca con el índice único como un 409 genérico.
      await this.credentialsRepo.lockSubjectForRegistration(
        tx,
        dto.owner.email,
      );
      const emailClash = await this.credentialsRepo.findLivePasswordBySubject(
        tx,
        dto.owner.email,
      );
      if (emailClash) {
        this.logger.warn(
          {
            operation: 'directory.organization.self-register',
            reason: 'email-in-use',
          },
          'Rejected self-registration: owner email already registered',
        );
        throw new ConflictException(
          'Ya existe una cuenta con ese correo',
          undefined,
          IamErrorReason.EMAIL_ALREADY_REGISTERED,
        );
      }

      // El tipo declarado y sus datos se validan antes de escribir nada —ni
      // siquiera la cuenta—, y con ellos los conceptos: un `countryConceptId`
      // inexistente sólo lo delataba la FK, ya dentro del INSERT, y salía
      // como 500 sin decir qué campo era.
      this.directory.assertProfileMatchesType(dto.organization);
      assertLegalDocumentsForEntityType(dto.organization);
      await this.directory.assertConceptsExist(
        tx,
        this.directory.declaredConcepts(dto.organization),
      );

      // 1) Cuenta del owner, ACTIVA y con su contraseña definitiva: el titular
      // está presente, así que no hay token de activación ni cambio forzado.
      // El nombre sale de las partes; si el cliente mandó la forma anterior,
      // manda esa.
      const user = this.usersRepo.create(tx, {
        displayName: composeAccountDisplayName(dto.owner),
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        timeZone: dto.owner.timeZone ?? dto.organization.timeZone,
      });
      // Las FK son columnas uuid planas: persistir el padre antes de los hijos.
      await tx.flush();

      this.credentialsRepo.createPassword(tx, {
        userId: user.id,
        externalSubject: dto.owner.email,
        secretHash: await argon2.hash(dto.owner.password),
        actorUserId: user.id,
      });
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.USER,
        actorUserId: user.id,
      });

      // 2) La organización, pendiente de verificación por la plataforma.
      const tenant = this.directory.createTenant(tx, {
        code: dto.organization.code,
        legalName: dto.organization.legalName,
        tradeName: dto.organization.tradeName,
        tenantTypeConceptId:
          TENANT_TYPE_CONCEPT_BY_CODE[
            dto.organization.tenantType ?? 'PROVIDER'
          ],
        legalEntityTypeConceptId: resolveLegalEntityType(
          dto.organization.legalEntityType,
          undefined,
          CONCEPTS.LEGAL_ENTITY_COMPANY,
        ),
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        // El «país de constitución» que el tipo societario implica: sólo se
        // usa cuando el cliente eligió el tipo pero no declaró país explícito
        // — evita pedir la misma cosa dos veces cuando el tipo ya la dice.
        countryConceptId:
          dto.organization.countryConceptId ??
          countryConceptForLegalEntityType(dto.organization.legalEntityType),
        jurisdictionConceptId: dto.organization.jurisdictionConceptId,
        timeZone: dto.organization.timeZone,
        actorUserId: user.id,
      });
      await tx.flush();

      // La aseguradora, el corredor o la unidad diagnóstica se materializan
      // aquí: elegir el tipo y no crear su fila dejaba un tenant etiquetado
      // que no se sostiene en nada. Acá el owner ES el actor: es su propia
      // alta, así que no hace falta el quinto parámetro.
      const profileId = await this.directory.materializeProfile(
        tx,
        tenant.id,
        dto.organization,
        user.id,
      );

      // Establecimiento médico: `materializeProfile` ya persistió el NIT, el
      // registro sanitario, el director y las sedes declaradas. La respuesta lo
      // informa sólo para los cinco tipos médicos: `true` si el alta trajo el
      // bloque, `false` si no.
      const medicalFacilityRegistered = MEDICAL_FACILITY_TENANT_TYPES.includes(
        dto.organization.tenantType,
      )
        ? dto.organization.medicalFacility !== undefined
        : undefined;

      // 2b) Farmacia (P50): la fila de `pharmacy.pharmacies` en borrador, su
      // práctica propia y la casa central y cada sucursal como sede física y
      // sede dispensadora, con la central enlazada. Las sucursales además se
      // registran en `directory.branches`, que es lo que lista y edita el
      // portal de la organización. Todo en esta transacción: si algo falla no
      // queda una farmacia sin sedes ni sedes sin farmacia.
      let pharmacyId: string | undefined;
      if (dto.organization.tenantType === 'PHARMACY') {
        this.createPharmacyBranches(tx, tenant.id, dto, user.id);
        const block = dto.organization.pharmacy;
        const provisioned = await this.pharmacies.provision(
          tx,
          {
            tenantId: tenant.id,
            code: dto.organization.code,
            legalName: dto.organization.legalName,
            tradeName: dto.organization.tradeName,
            ownerUserId: user.id,
            timeZone: dto.organization.timeZone,
          },
          {
            headquarters: {
              name: PHARMACY_HEADQUARTERS_NAME,
              addressLines: block?.address,
              latitude: block?.latitude,
              longitude: block?.longitude,
            },
            branches: (block?.branches ?? []).map((branch) => ({
              name: branch.name,
              latitude: branch.latitude,
              longitude: branch.longitude,
            })),
          },
          user.id,
        );
        pharmacyId = provisioned.pharmacyId;
      }

      // 3) La membresía OWNER, que es lo que convierte a esa cuenta en dueña de
      // esta organización y lo único que la hace utilizable: sin esta fila,
      // `TenantContextInterceptor` rechaza con 403 cualquier request posterior.
      const membership = this.directory.createTenantMembership(tx, {
        userId: user.id,
        tenantId: tenant.id,
        tenantRoleConceptId: DIR.ROLE_OWNER,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        actorUserId: user.id,
      });

      // 3b) Documentos legales de afiliación (subtarea 1.2), si el alta los
      // declaró. Va DESPUÉS del tenant y ANTES del correo, dentro de esta
      // misma transacción: cada PDF se reclama por su `fileId` y queda
      // vinculado al tenant recién creado, así que un archivo no puede
      // terminar reclamado por un tenant que no llegó a existir. Un 422 acá
      // (archivo ajeno, ya reclamado, o el catálogo sin sembrar) revienta
      // toda el alta — ni cuenta, ni tenant, ni correo.
      const legalDocumentIds = dto.organization.legalDocuments
        ? await this.directory.attachRegistrationDocuments(tx, {
            tenantId: tenant.id,
            ownerUserId: user.id,
            legalEntityType: dto.organization.legalEntityType,
            taxIdentifier:
              dto.organization.taxIdentifier ??
              dto.organization.payer?.regulatorIdentifier ??
              dto.organization.medicalFacility?.taxIdentifierNumber,
            documents: {
              CONSTITUTION_DOC:
                dto.organization.legalDocuments.constitutionFileId,
              TAX_IDENTIFIER_DOC:
                dto.organization.legalDocuments.taxIdentifierFileId,
              COMMERCE_REGISTRY_DOC:
                dto.organization.legalDocuments.commerceRegistryFileId,
              OPERATING_LICENSE_DOC:
                dto.organization.legalDocuments.operatingLicenseFileId,
              HEALTH_AUTHORITY_CERT_DOC:
                dto.organization.legalDocuments
                  .healthAuthorityCertificateFileId,
            },
          })
        : undefined;

      // 3c) Representante legal y gerencias de contacto (subtarea 1.4), si el
      // alta las declaró. Va DESPUÉS de los documentos porque el poder
      // notariado no puede repetir un archivo que los cinco ya reclamaron, y
      // dentro de la misma transacción: las personas, sus contactos y sus
      // vínculos no deben sobrevivir a un alta que termina revertida.
      const representativesRegistered =
        dto.organization.legalRepresentative || dto.organization.executives
          ? (
              await this.representatives.register(tx, {
                tenantId: tenant.id,
                ownerUserId: user.id,
                legalEntityType: dto.organization.legalEntityType,
                legalDocumentFileIds: dto.organization.legalDocuments
                  ? Object.values(dto.organization.legalDocuments).filter(
                      (fileId): fileId is string => fileId !== undefined,
                    )
                  : [],
                legalRepresentative: dto.organization.legalRepresentative,
                executives: dto.organization.executives,
              })
            ).representativesRegistered
          : undefined;

      // 4) Verificación del correo. Igual que en el registro de pacientes, no
      // condiciona el acceso: el owner puede entrar y preparar su organización
      // mientras la plataforma revisa la documentación.
      const { raw, hash } = this.tokenService.issueRefreshToken();
      this.emailVerificationsRepo.create(tx, {
        userId: user.id,
        email: dto.owner.email,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        actorUserId: user.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: user.id,
        ip,
        detailJson: {
          flow: 'organization-self-registration',
          tenantId: tenant.id,
          ...(legalDocumentIds
            ? { legalDocuments: legalDocumentIds.length }
            : {}),
          ...(representativesRegistered === undefined
            ? {}
            : { representatives: representativesRegistered }),
          ...(medicalFacilityRegistered ? { medicalFacility: true } : {}),
        },
      });

      await tx.flush();

      return {
        tenantId: tenant.id,
        code: tenant.code,
        ownerUserId: user.id,
        membershipId: membership.id,
        status: tenant.statusConceptId,
        emailVerificationToken: raw,
        // Sólo DIAGNOSTIC_CENTER materializa una fila propia con id útil
        // para el cliente; PROVIDER no tiene tabla propia y PAYER/BROKER
        // devuelven la suya por su propio contrato (no expuesto acá).
        diagnosticUnitId:
          dto.organization.tenantType === 'DIAGNOSTIC_CENTER'
            ? profileId
            : undefined,
        pharmacyId,
        legalDocumentsRegistered: legalDocumentIds?.length,
        representativesRegistered,
        medicalFacilityRegistered,
      };
    });

    // El correo se encola FUERA de la transacción: si la mensajería falla, la
    // organización ya creada no debe deshacerse — el owner puede entrar igual y
    // el correo se puede reemitir.
    span.setAttribute(APP_ATTR.ENTITY_ID, created.tenantId);
    span.addEvent('registration.persisted');

    const emailVerificationSent = await this.sendVerificationEmail(
      created.ownerUserId,
      dto.owner.email,
      created.emailVerificationToken,
    );

    span.setAttribute('iam.registration.email_sent', emailVerificationSent);
    this.logger.info(
      {
        operation: 'directory.organization.self-register',
        tenantId: created.tenantId,
        ownerUserId: created.ownerUserId,
      },
      'Organization self-registered',
    );
    return {
      tenantId: created.tenantId,
      code: created.code,
      ownerUserId: created.ownerUserId,
      membershipId: created.membershipId,
      status: created.status,
      emailVerificationSent,
      diagnosticUnitId: created.diagnosticUnitId,
      pharmacyId: created.pharmacyId,
      legalDocumentsRegistered: created.legalDocumentsRegistered,
      representativesRegistered: created.representativesRegistered,
      medicalFacilityRegistered: created.medicalFacilityRegistered,
    };
  }

  /**
   * Crea la casa central (si el alta trae su punto) y cada sucursal declarada.
   * El código sale del nombre, en mayúsculas y sin repetirse dentro del alta.
   */
  private createPharmacyBranches(
    tx: EntityManager,
    tenantId: string,
    dto: RegisterOrganizationDto,
    actorUserId: string,
  ): void {
    const block = dto.organization.pharmacy;
    if (!block) return;
    const used = new Set<string>();
    const codeOf = (name: string): string => {
      const base =
        name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 90) || 'SUCURSAL';
      let code = base;
      for (let n = 2; used.has(code); n += 1) code = `${base}-${n}`;
      used.add(code);
      return code;
    };
    const add = (item: {
      name: string;
      latitude?: number;
      longitude?: number;
      description?: string;
      locationUrl?: string;
    }): void => {
      this.directory.createBranch(tx, {
        tenantId,
        code: codeOf(item.name),
        name: item.name,
        branchTypeConceptId: BRANCH_TYPE_CONCEPT_BY_CODE.OFFICE,
        statusConceptId: DIR.BRANCH_ACTIVE,
        timeZone: dto.organization.timeZone,
        latitude:
          item.latitude !== undefined ? String(item.latitude) : undefined,
        longitude:
          item.longitude !== undefined ? String(item.longitude) : undefined,
        description: item.description,
        locationUrl: item.locationUrl,
        actorUserId,
      });
    };
    if (block.latitude !== undefined && block.longitude !== undefined) {
      add({
        name: 'Casa central',
        latitude: block.latitude,
        longitude: block.longitude,
      });
    }
    for (const branch of block.branches ?? []) add(branch);
  }

  /**
   * Encola el correo con el token de verificación.
   *
   * Devuelve si quedó encolado en vez de propagar el error: no poder avisar por
   * correo no invalida un alta que ya es válida.
   *
   * @param userId - Destinatario interno.
   * @param email - Dirección a la que va el correo.
   * @param token - Token en claro, que sólo viaja en el correo.
   * @returns `true` si la solicitud de notificación quedó registrada.
   */
  private async sendVerificationEmail(
    userId: string,
    email: string,
    token: string,
  ): Promise<boolean> {
    try {
      await this.emailNotice.enqueueEmail({
        recipientUserId: userId,
        recipientAddress: email,
        subject: 'Verifique el correo de su organización',
        bodyText:
          'Para verificar su correo, use este código: ' +
          `${token}\n\nTu organización quedó registrada y está pendiente ` +
          'de verificación por parte de la plataforma.',
      });
      return true;
    } catch (error) {
      this.logger.warn(
        {
          operation: 'directory.organization.self-register',
          userId,
          err: error,
        },
        'Could not enqueue the verification email; the organization is registered anyway',
      );
      return false;
    }
  }
}
