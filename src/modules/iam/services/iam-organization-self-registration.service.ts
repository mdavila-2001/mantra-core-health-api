import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  APP_ATTR,
  TracingService,
  type TraceSpan,
} from '../../../observability';
import {
  CONCEPTS,
  ConflictException,
  TokenService,
  type AuthenticatedUser,
} from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import {
  DIR,
  TENANT_TYPE_CONCEPT_BY_CODE,
} from '../../directory/directory.concepts';
import {
  TenantMembershipsRepository,
  TenantsRepository,
} from '../../directory/repositories';
import { TenantTypeProfileService } from '../../directory/services';
import { composeAccountDisplayName } from '../../profiles/person-name';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../repositories';
import {
  RegisterOrganizationDto,
  RegisterOrganizationResponseDto,
} from '../dto';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Vida útil del token de verificación de correo (24 h). */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

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
   * @param tenantsRepo - Valor de tenants repo requerido por la operación.
   * @param membershipsRepo - Valor de memberships repo requerido por la operación.
   * @param notificationsService - Valor de notifications service requerido por la operación.
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
    private readonly tenantsRepo: TenantsRepository,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly typeProfile: TenantTypeProfileService,
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
      const codeClash = await this.tenantsRepo.findByCode(
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
        throw new ConflictException('El código de organización ya existe', {
          code: dto.organization.code,
        });
      }

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
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }

      // El tipo declarado y sus datos se validan antes de escribir nada —ni
      // siquiera la cuenta—, y con ellos los conceptos: un `countryConceptId`
      // inexistente sólo lo delataba la FK, ya dentro del INSERT, y salía
      // como 500 sin decir qué campo era.
      this.typeProfile.assertProfileMatchesType(dto.organization);
      await this.typeProfile.assertConceptsExist(
        tx,
        this.typeProfile.declaredConcepts(dto.organization),
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
      const tenant = this.tenantsRepo.create(tx, {
        code: dto.organization.code,
        legalName: dto.organization.legalName,
        tradeName: dto.organization.tradeName,
        tenantTypeConceptId:
          TENANT_TYPE_CONCEPT_BY_CODE[
            dto.organization.tenantType ?? 'PROVIDER'
          ],
        legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_COMPANY,
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        countryConceptId: dto.organization.countryConceptId,
        jurisdictionConceptId: dto.organization.jurisdictionConceptId,
        timeZone: dto.organization.timeZone,
        actorUserId: user.id,
      });
      await tx.flush();

      // La aseguradora, el corredor o la unidad diagnóstica se materializan
      // aquí: elegir el tipo y no crear su fila dejaba un tenant etiquetado
      // que no se sostiene en nada. Acá el owner ES el actor: es su propia
      // alta, así que no hace falta el quinto parámetro.
      const profileId = await this.typeProfile.materializeProfile(
        tx,
        tenant.id,
        dto.organization,
        user.id,
      );

      // 3) La membresía OWNER, que es lo que convierte a esa cuenta en dueña de
      // esta organización y lo único que la hace utilizable: sin esta fila,
      // `TenantContextInterceptor` rechaza con 403 cualquier request posterior.
      const membership = this.membershipsRepo.create(tx, {
        userId: user.id,
        tenantId: tenant.id,
        tenantRoleConceptId: DIR.ROLE_OWNER,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        actorUserId: user.id,
      });

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
    };
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
    const actor: AuthenticatedUser = { id: userId, roles: [] };
    try {
      await this.notificationsService.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId: userId,
          recipientAddress: email,
          payloadJson: {
            subject: 'Verificá el correo de tu organización',
            bodyText:
              'Para verificar tu correo, usá este código: ' +
              `${token}\n\nTu organización quedó registrada y está pendiente ` +
              'de verificación por parte de la plataforma.',
          },
        },
        actor,
      );
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
