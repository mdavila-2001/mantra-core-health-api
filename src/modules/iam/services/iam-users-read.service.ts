import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import {
  CredentialsRepository,
  DevicesRepository,
  MfaFactorsRepository,
  SessionsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../repositories';
import type {
  ListCredentialsResponseDto,
  ListDevicesResponseDto,
  ListGlobalRolesResponseDto,
  ListMfaFactorsResponseDto,
  ListSessionsResponseDto,
  SearchUsersResponseDto,
  UserDetailResponseDto,
} from '../dto';

/**
 * Tope de usuarios que se resuelven por texto contra los sujetos de credencial
 * antes de acotar el listado.
 *
 * Existe porque la búsqueda por correo se hace en dos pasos (credenciales →
 * usuarios) y sin tope la primera consulta traería la tabla entera cuando alguien
 * escribe `@`. Con este límite la búsqueda por texto puede quedarse corta en una
 * base grande; es preferible a una consulta que degrada el listado entero, y el
 * cliente siempre puede afinar el texto.
 */
const SUBJECT_MATCH_LIMIT = 1000;

/**
 * Cara de lectura de `/iam/users`: el listado de usuarios, su ficha y sus
 * sub-colecciones (credenciales, dispositivos, factores de MFA, sesiones y roles
 * globales).
 *
 * ## Por qué es un servicio aparte
 *
 * Las seis lecturas comparten una regla que conviene tener en un solo sitio
 * auditable: **ninguna publica material secreto**. El hash de la contraseña, la
 * clave pública, el secreto del factor, el token de push y el identificador del
 * token de sesión se quedan en la entidad. Repartir estas lecturas entre los cinco
 * servicios de escritura dispersaría esa decisión en cinco archivos, y bastaría
 * con que uno devolviera la entidad entera para filtrarlo todo.
 *
 * Todas exigen `SECURITY_ADMIN` en el controlador: son datos de la cuenta de otra
 * persona.
 */
@Injectable()
export class IamUsersReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param usersRepo - Acceso a `iam.users`.
   * @param credentialsRepo - Acceso a `iam.authentication_credentials`.
   * @param devicesRepo - Acceso a `iam.devices`.
   * @param mfaRepo - Acceso a `iam.mfa_factors`.
   * @param sessionsRepo - Acceso a `iam.sessions`.
   * @param rolesRepo - Acceso a `iam.user_global_roles`.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly devicesRepo: DevicesRepository,
    private readonly mfaRepo: MfaFactorsRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamUsersReadService.name);
  }

  /**
   * UC-01-01 (cara de lectura): listado paginado de usuarios.
   *
   * El texto libre casa contra el nombre visible **y** contra el sujeto de las
   * credenciales, porque quien administra cuentas busca por correo mucho más a
   * menudo que por nombre, y el correo no vive en `iam.users`.
   *
   * @param options - Texto, estado, cursor y tope.
   * @returns Página de usuarios.
   */
  async searchUsers(options: {
    /** Texto libre sobre nombre visible y sujeto de credencial. */
    query?: string;
    /** Estado al que acotar. */
    statusConceptId?: string;
    /** Cursor opaco devuelto por la página anterior. */
    cursor?: string;
    /** Tope de filas de la página. */
    limit: number;
  }): Promise<SearchUsersResponseDto> {
    const em = this.em.fork();

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.displayName === 'string' && typeof after?.id === 'string'
        ? { displayName: after.displayName, id: after.id }
        : undefined;

    const ids = options.query
      ? (
          await this.credentialsRepo.findBySubjectMatch(
            em,
            options.query,
            SUBJECT_MATCH_LIMIT,
          )
        ).map((credential) => credential.userId)
      : undefined;

    // Se pide una fila de más para saber si hay página siguiente sin pagar un
    // COUNT sobre toda la tabla en cada página.
    const rows = await this.usersRepo.searchPage(
      em,
      {
        query: options.query,
        statusConceptId: options.statusConceptId,
        ids,
        after: afterKey,
      },
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const last = page.at(-1);
    return {
      items: page.map((user) => ({
        id: user.id,
        displayName: user.displayName,
        statusConceptId: user.statusConceptId,
        mfaStatusConceptId: user.mfaStatusConceptId,
        emailVerified: user.emailVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ displayName: last.displayName, id: last.id })
          : null,
    };
  }

  /**
   * Ficha de un usuario.
   *
   * @param userId - Usuario a leer.
   * @returns Ficha de la cuenta, sin material secreto.
   */
  async getUserById(userId: string): Promise<UserDetailResponseDto> {
    const em = this.em.fork();
    const user = await this.usersRepo.findById(em, userId);
    if (!user) {
      throw new ResourceNotFoundException('Usuario no encontrado', { userId });
    }

    return {
      id: user.id,
      displayName: user.displayName,
      statusConceptId: user.statusConceptId,
      mfaStatusConceptId: user.mfaStatusConceptId,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      timeZone: user.timeZone,
      preferredLanguageConceptId: user.preferredLanguageConceptId,
      residenceCountryConceptId: user.residenceCountryConceptId,
      dataResidencyRegionConceptId: user.dataResidencyRegionConceptId,
      legalBasisConceptId: user.legalBasisConceptId,
      privacyAcceptedAt: user.privacyAcceptedAt ?? null,
      privacyPolicyVersion: user.privacyPolicyVersion,
      mustChangePassword: user.mustChangePassword ?? false,
      anonymizedAt: user.anonymizedAt ?? null,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * UC-01-02 / UC-01-11 (cara de lectura): credenciales del usuario.
   *
   * @param userId - Usuario cuyas credenciales se listan.
   * @returns Credenciales sin hash ni clave pública.
   */
  async listCredentials(userId: string): Promise<ListCredentialsResponseDto> {
    const em = await this.forkForExistingUser(userId);
    const rows = await this.credentialsRepo.findByUser(em, userId);

    const items = rows.map((credential) => ({
      id: credential.id,
      methodConceptId: credential.methodConceptId,
      externalSubject: credential.externalSubject,
      identityProvider: credential.identityProvider,
      stateConceptId: credential.stateConceptId,
      lastUsedAt: credential.lastUsedAt ?? null,
      expiresAt: credential.expiresAt ?? null,
      createdAt: credential.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * UC-01-05 (cara de lectura): dispositivos del usuario.
   *
   * @param userId - Usuario cuyos dispositivos se listan.
   * @returns Dispositivos sin el token de notificaciones.
   */
  async listDevices(userId: string): Promise<ListDevicesResponseDto> {
    const em = await this.forkForExistingUser(userId);
    const rows = await this.devicesRepo.findByUser(em, userId);

    const items = rows.map((device) => ({
      id: device.id,
      deviceFingerprint: device.deviceFingerprint,
      platformConceptId: device.platformConceptId,
      hasPushToken: Boolean(device.pushTokenEncrypted),
      lastSeenAt: device.lastSeenAt ?? null,
      createdAt: device.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * UC-01-03 (cara de lectura): factores de MFA del usuario.
   *
   * @param userId - Usuario cuyos factores se listan.
   * @returns Factores sin el secreto cifrado.
   */
  async listMfaFactors(userId: string): Promise<ListMfaFactorsResponseDto> {
    const em = await this.forkForExistingUser(userId);
    const rows = await this.mfaRepo.findByUser(em, userId);

    const items = rows.map((factor) => ({
      id: factor.id,
      factorTypeConceptId: factor.factorTypeConceptId,
      stateConceptId: factor.stateConceptId,
      verifiedAt: factor.verifiedAt ?? null,
      createdAt: factor.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * UC-01-06 (cara de lectura): sesiones del usuario.
   *
   * @param userId - Usuario cuyas sesiones se listan.
   * @returns Sesiones sin el identificador del token.
   */
  async listSessions(userId: string): Promise<ListSessionsResponseDto> {
    const em = await this.forkForExistingUser(userId);
    const rows = await this.sessionsRepo.findByUser(em, userId);

    const items = rows.map((session) => ({
      id: session.id,
      deviceId: session.deviceId ?? null,
      geoLocation: session.geoLocation,
      stateConceptId: session.stateConceptId,
      expiresAt: session.expiresAt ?? null,
      createdAt: session.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * UC-01-10 (cara de lectura): roles globales del usuario.
   *
   * @param userId - Usuario cuyos roles se listan.
   * @returns Asignaciones vigentes y revocadas.
   */
  async listGlobalRoles(userId: string): Promise<ListGlobalRolesResponseDto> {
    const em = await this.forkForExistingUser(userId);
    const rows = await this.rolesRepo.findByUser(em, userId);

    const items = rows.map((role) => ({
      id: role.id,
      roleConceptId: role.roleConceptId,
      stateConceptId: role.stateConceptId,
      createdAt: role.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * Abre un contexto de lectura tras comprobar que el usuario existe.
   *
   * Sin la comprobación, pedir las credenciales de un id inventado devolvería una
   * lista vacía indistinguible de "este usuario no tiene ninguna", y la pantalla
   * mostraría un estado vacío en vez de un 404.
   *
   * @param userId - Usuario que debe existir.
   * @returns Contexto de persistencia listo para la consulta.
   */
  private async forkForExistingUser(userId: string): Promise<EntityManager> {
    const em = this.em.fork();
    if (!(await this.usersRepo.findById(em, userId))) {
      throw new ResourceNotFoundException('Usuario no encontrado', { userId });
    }
    return em;
  }
}
