import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
// La sede es el único puente estructurado entre una afiliación y una
// organización: `practitioner_affiliations.practice_site_id` →
// `practice_sites.managing_tenant_id`. Se importa la ENTIDAD y no el módulo de
// `practice` —igual que hace `profiles` con `chart` y `clinical`— porque lo
// único que se necesita de allá es resolver ese salto.
import { PracticeSites } from '../../practice/entities';
import { JurisdictionAuthorizations, Persons } from '../entities';
import {
  DirectoryMembershipsService,
  TenantAdministrationService,
} from '../../directory/services';
import { PROF } from '../profiles.concepts';
import {
  AFFILIATION_NOTICE_PORT,
  type AffiliationNoticeKind,
  type AffiliationNoticePort,
} from '../ports/affiliation-notice.port';
import {
  PersonAccountLinksRepository,
  PractitionerAffiliationsRepository,
} from '../repositories';
import type { PractitionerAffiliations } from '../entities';
import type { AffiliationRequestListDto, RejectAffiliationDto } from '../dto';

/**
 * Los tres estados del vínculo, con los conceptos que **hoy** existen.
 *
 * ## El bloqueador, dicho en voz alta
 *
 * El value set de `practitioner_affiliations.status_concept_id` sólo trae
 * `AFFILIATION_ACTIVE` y `AFFILIATION_RETRACTED`: nació para un historial
 * laboral —una línea de currículum que se declara y punto—, no para un trámite
 * con aprobación. Faltan conceptos propios de «pendiente», «aprobado» y
 * «rechazado», y crearlos es de Marcelo (`.puml → gen_ddl.py`), no de esta
 * tarea.
 *
 * Mientras tanto se usan los que hay, y el mapeo es deliberado y no arbitrario:
 *
 * - **pendiente** → `state:pending`, el estado transversal que ya significa
 *   «esperando una decisión» en el resto del sistema.
 * - **aprobado** → `AFFILIATION_ACTIVE`, que es exactamente lo que un vínculo
 *   aprobado es: activo.
 * - **rechazado** → `AFFILIATION_RETRACTED`, «retirado». No es la palabra
 *   ideal —un rechazo no es un retiro— pero es el único concepto del value set
 *   que significa «este vínculo no está en pie», y elegir un concepto de otro
 *   dominio sería peor.
 *
 * Cuando el value set exista, cambia este objeto y nada más: ningún otro lugar
 * compara contra estos conceptos a mano.
 */
export const ESTADO_DEL_VINCULO = {
  /** Pedido y esperando que la organización decida. */
  PENDIENTE: PROF.AFFILIATION_PENDING,
  /**
   * Declarado por el profesional, sin aprobación de nadie.
   *
   * No es un pendiente disfrazado. Los hospitales públicos y las cajas del
   * padrón nunca van a registrarse en la plataforma, así que no tienen a quién
   * apruebe: esperar esa aprobación bloquearía a sus médicos para siempre.
   * **Publica igual**; lo que no tiene es sello de la institución, y eso se dice
   * en pantalla.
   */
  DECLARADO: PROF.AFFILIATION_DECLARED,
  /** La organización lo aceptó. */
  APROBADO: PROF.AFFILIATION_APPROVED,
  /** La organización lo rechazó. */
  RECHAZADO: PROF.AFFILIATION_REJECTED,
  /** Estaba aprobado y la organización lo dio de baja. */
  REVOCADO: PROF.AFFILIATION_REVOKED,
} as const;

/**
 * Los ids que un estado puede tener escritos en la base, hoy.
 *
 * ## Por qué hay dos ids por estado y no uno
 *
 * v4.1.9 reemplazó los conceptos del vínculo, pero **el backfill todavía no
 * corrió**: las filas vivas siguen con los ids viejos escritos. Si la lectura
 * mirara sólo los nuevos, cada vínculo ya aprobado pasaría a no reconocerse —y
 * un médico que hoy publica dejaría de poder—.
 *
 * Así que se **escribe** con los nuevos y se **lee** aceptando los dos. Cuando
 * el patch v4.1.9 corra en todas las bases, los viejos desaparecen solos y este
 * mapa se poda sin tocar nada más; hasta entonces, borrarlo rompe datos reales.
 */
const IDS_ACEPTADOS: Readonly<Record<string, readonly string[]>> = {
  PENDIENTE: [PROF.AFFILIATION_PENDING, CONCEPTS.STATE_PENDING],
  DECLARADO: [PROF.AFFILIATION_DECLARED],
  APROBADO: [PROF.AFFILIATION_APPROVED, PROF.AFFILIATION_ACTIVE],
  RECHAZADO: [PROF.AFFILIATION_REJECTED, PROF.AFFILIATION_RETRACTED],
  REVOCADO: [PROF.AFFILIATION_REVOKED],
};

/**
 * Si un concepto guardado corresponde a ese estado.
 *
 * Se compara con esto y no con `===` contra `ESTADO_DEL_VINCULO` mientras el
 * backfill no haya corrido.
 *
 * @param conceptId - El estado tal como está en la fila.
 * @param estado - El estado buscado.
 * @returns `true` si coinciden, con id viejo o nuevo.
 */
export function esEstado(
  conceptId: string,
  estado: keyof typeof ESTADO_DEL_VINCULO,
): boolean {
  return IDS_ACEPTADOS[estado].includes(conceptId);
}

/** Todos los ids que significan «la organización todavía no decidió». */
export const IDS_PENDIENTES: readonly string[] = IDS_ACEPTADOS.PENDIENTE;

/**
 * El vínculo médico–organización, con aprobación (TP-2).
 *
 * ## Qué estaba mal
 *
 * Un profesional cargaba su afiliación y quedaba **activa en el acto**: nadie
 * de la organización la veía, ni la aceptaba, ni podía negarla. Cualquiera
 * podía declararse parte de una clínica y el sistema lo daba por cierto en su
 * trayectoria y en su perfil público. La palabra «afiliación» describía dos
 * cosas distintas —una línea de currículum y una relación laboral vigente— y
 * el sistema sólo sabía tratar la primera.
 *
 * ## La distinción que resuelve el problema
 *
 * Una afiliación **sin sede** es historia: «trabajé en el Hospital de Clínicas
 * entre 2015 y 2019». No hay a quién pedirle permiso —esa organización puede ni
 * existir en el sistema— y sigue funcionando como siempre.
 *
 * Una afiliación **con sede** es una relación con una organización que está
 * acá, y ésa sí necesita que la organización la acepte. Es la que decide si el
 * profesional aparece asociado a ella y si puede publicar agenda en sus sedes.
 *
 * ## La regla de visibilidad vive en un solo lugar
 *
 * `visiblesDeTerceros` es el único método que decide qué afiliaciones se
 * muestran a alguien que no es el titular. Todo lo que las publica —la
 * trayectoria vista por otro, el perfil público, la agenda por sede— pasa por
 * ahí. Repartir la condición «sólo las aprobadas» por cada pantalla es la forma
 * segura de que una se olvide.
 */
@Injectable()
export class ProfilesAffiliationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param affiliationsRepo - Acceso a `profiles.practitioner_affiliations`.
   * @param accountLinksRepo - Qué usuario encarna a cada profesional.
   * @param tenantAdmin - Quién administra cada organización.
   * @param memberships - Membresías del directorio (la aprobación concede una).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly affiliationsRepo: PractitionerAffiliationsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly memberships: DirectoryMembershipsService,
    private readonly logger: PinoLogger,
    @Inject(AFFILIATION_NOTICE_PORT)
    private readonly avisos: AffiliationNoticePort,
  ) {
    this.logger.setContext(ProfilesAffiliationsService.name);
  }

  /**
   * Las afiliaciones que se le pueden mostrar a un tercero.
   *
   * Sólo las aprobadas y las que son puro historial. Una pendiente no se
   * muestra —decir que alguien trabaja en una clínica que todavía no lo aceptó
   * es afirmar algo falso— y una rechazada tampoco.
   *
   * El titular ve las suyas todas, con su estado: para eso existe la lectura de
   * su propio perfil, y esconderle su propia solicitud pendiente lo dejaría sin
   * saber que la mandó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @returns Sus afiliaciones publicables.
   */
  visiblesDeTerceros(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PractitionerAffiliations[]> {
    return this.affiliationsRepo.findByPractitionerInStatus(
      em,
      practitionerProfileId,
      [ESTADO_DEL_VINCULO.APROBADO],
    );
  }

  /**
   * Con qué estado nace un vínculo que se acaba de declarar.
   *
   * Sin sede es historia y nace activa. Con una sede de la propia organización
   * del profesional —su consultorio particular, el tenant personal que el flujo
   * de alta ya le da— también: pedirle permiso a sí mismo no es una regla, es
   * un trámite inventado. Con una sede ajena, nace pendiente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede declarada, si la hay.
   * @param actor - Quien declara el vínculo.
   * @returns El concepto de estado con el que se crea.
   */
  async estadoInicial(
    em: EntityManager,
    practiceSiteId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<string> {
    // Sin sede el vínculo no nombra ninguna organización de la plataforma: es
    // una línea de currículum. Nadie lo aprobó, así que decir «aprobado» sería
    // escribir un hecho que no ocurrió.
    if (!practiceSiteId) return ESTADO_DEL_VINCULO.DECLARADO;

    const site = await em.findOne(PracticeSites, { id: practiceSiteId });
    if (!site) {
      throw new ResourceNotFoundException('La sede indicada no existe', {
        practiceSiteId,
      });
    }

    const tenantId = site.managingTenantId;
    // Una sede sin organización a cargo no tiene a quién pedirle permiso.
    if (!tenantId) return ESTADO_DEL_VINCULO.DECLARADO;

    // La propia organización dando de alta a su gente: ahí sí aprobó alguien, y
    // ese alguien es quien está creando el vínculo.
    if (actor.tenantIds?.includes(tenantId) === true) {
      return ESTADO_DEL_VINCULO.APROBADO;
    }

    // Y si la organización no tiene a nadie que pueda decidir —los hospitales
    // públicos y las cajas del padrón, que nunca van a registrarse—, dejar el
    // pedido pendiente lo condenaría a esperar para siempre.
    const hayQuienDecida = await this.tenantAdmin.hasAdministrators(
      em,
      tenantId,
    );
    return hayQuienDecida
      ? ESTADO_DEL_VINCULO.PENDIENTE
      : ESTADO_DEL_VINCULO.DECLARADO;
  }

  /**
   * La bandeja de la organización: quiénes pidieron atender en sus sedes.
   *
   * El filtro por organización va **en la consulta** y no armado después: las
   * sedes se resuelven primero acotadas al tenant, y la búsqueda de
   * afiliaciones sale de esa lista. Es la lección del #156 —la cola de
   * moderación se listaba sin filtro y un moderador veía las denuncias de todas
   * las clínicas—, y acá no hay forma de que se cuele la solicitud de otra
   * organización porque no hay un paso donde pudiera colarse.
   *
   * @param tenantId - Organización que mira su bandeja.
   * @param actor - Quien la mira; tiene que administrarla.
   * @returns Las solicitudes pendientes de sus sedes.
   */
  async listarSolicitudes(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<AffiliationRequestListDto> {
    const em = this.em.fork();
    await this.tenantAdmin.assertCanAdminister(em, tenantId, actor);

    const sedes = await em.find(
      PracticeSites,
      { managingTenantId: tenantId },
      { fields: ['id'] },
    );

    const solicitudes = await this.affiliationsRepo.findBySites(
      em,
      sedes.map((sede) => sede.id),
      [ESTADO_DEL_VINCULO.PENDIENTE],
    );

    const quienes = await this.identidadDe(
      em,
      solicitudes.map((fila) => fila.practitionerProfileId),
    );

    return {
      items: solicitudes.map((fila) => {
        const quien = quienes.get(fila.practitionerProfileId);
        return {
          id: fila.id,
          practitionerProfileId: fila.practitionerProfileId,
          practitionerName: quien?.nombre ?? null,
          practitionerLicense: quien?.matricula ?? null,
          organizationName: fila.organizationName,
          roleTitle: fila.roleTitle,
          practiceSiteId: fila.practiceSiteId ?? null,
          startDate: fila.startDate,
          statusConceptId: fila.statusConceptId,
          createdAt: fila.createdAt,
        };
      }),
    };
  }

  /**
   * Quiénes son los profesionales de un lote de solicitudes.
   *
   * Dos consultas para toda la bandeja en vez de dos por solicitud: una
   * organización con veinte pedidos haría cuarenta viajes a la base cada vez
   * que alguien abre la pantalla.
   *
   * La matrícula se resuelve por `practitioner_profile_id`; si hay más de una
   * —jurisdicciones distintas— gana cualquiera, porque lo que la bandeja
   * necesita es poder verificar que existe, no cuál de todas.
   *
   * @param em - Contexto de persistencia.
   * @param perfiles - Los profesionales a identificar.
   * @returns Nombre y matrícula por perfil.
   */
  private async identidadDe(
    em: EntityManager,
    perfiles: readonly string[],
  ): Promise<Map<string, { nombre: string | null; matricula: string | null }>> {
    const identidades = new Map<
      string,
      { nombre: string | null; matricula: string | null }
    >();
    if (perfiles.length === 0) return identidades;

    const ids = [...new Set(perfiles)];
    const [personas, matriculas] = await Promise.all([
      em.find(Persons, { id: { $in: ids } }),
      em.find(JurisdictionAuthorizations, {
        practitionerProfileId: { $in: ids },
      }),
    ]);

    const matriculaPorPerfil = new Map(
      matriculas.map((fila) => [
        fila.practitionerProfileId,
        fila.licenseNumber,
      ]),
    );
    for (const persona of personas) {
      identidades.set(persona.id, {
        nombre: nombreVisible(persona),
        matricula: matriculaPorPerfil.get(persona.id) ?? null,
      });
    }
    return identidades;
  }

  /** La organización acepta el vínculo. */
  async aprobar(
    tenantId: string,
    affiliationId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.decidir(tenantId, affiliationId, actor, {
      destino: ESTADO_DEL_VINCULO.APROBADO,
      operacion: 'profiles.affiliation.approve',
      desde: 'PENDIENTE',
      siNoEsta: 'Esa solicitud ya fue resuelta',
    });
  }

  /**
   * La organización rechaza el vínculo, y el motivo se guarda.
   *
   * `decision_reason_text` existe desde v4.1.9 y hasta ahora nadie la escribía:
   * el motivo viajaba sólo al registro estructurado, así que un rechazo era
   * mudo para quien lo recibe. Ahora se persiste y el profesional lo lee en su
   * historial.
   */
  async rechazar(
    tenantId: string,
    affiliationId: string,
    dto: RejectAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.decidir(tenantId, affiliationId, actor, {
      destino: ESTADO_DEL_VINCULO.RECHAZADO,
      operacion: 'profiles.affiliation.reject',
      motivo: dto.reason,
      desde: 'PENDIENTE',
      siNoEsta: 'Esa solicitud ya fue resuelta',
    });
  }

  /**
   * La organización da de baja un vínculo que ya había aprobado.
   *
   * ## Por qué faltaba, y por qué importa
   *
   * `AFFILIATION_REVOKED` existe desde v4.1.9 y **nada lo escribía**: aprobar
   * era irreversible por omisión, no por decisión. Y el gating de agenda ya
   * defendía ese estado —un vínculo revocado no deja aceptar turnos—, así que
   * defendía algo que sólo se alcanzaba escribiendo en la base a mano.
   *
   * ## Lo que NO hace
   *
   * No cancela las citas ya confirmadas. Dejarlas caer en bloque plantaría a
   * pacientes que tenían un turno prometido, por un trámite entre el médico y la
   * organización del que no fueron parte. Lo que sí ocurre desde la revocación:
   * no puede aceptar turnos nuevos ni publicar más agenda ahí.
   *
   * @param tenantId - La organización que revoca.
   * @param affiliationId - El vínculo.
   * @param dto - Motivo, que el profesional va a leer.
   * @param actor - Quien revoca; tiene que poder administrar la organización.
   */
  async revocar(
    tenantId: string,
    affiliationId: string,
    dto: RejectAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.decidir(tenantId, affiliationId, actor, {
      destino: ESTADO_DEL_VINCULO.REVOCADO,
      operacion: 'profiles.affiliation.revoke',
      motivo: dto.reason,
      desde: 'APROBADO',
      siNoEsta: 'Sólo se puede revocar un vínculo aprobado',
    });
  }

  /**
   * El tronco común de aprobar y rechazar.
   *
   * Las dos hacen lo mismo salvo el estado al que llevan: comprobar que quien
   * decide administra **esa** organización, que la solicitud sea de una de sus
   * sedes, y que todavía esté pendiente. Escribirlas dos veces garantizaría que
   * una de las tres comprobaciones se caiga de una de las dos.
   */
  private async decidir(
    tenantId: string,
    affiliationId: string,
    actor: AuthenticatedUser,
    decision: {
      readonly destino: string;
      readonly operacion: string;
      readonly motivo?: string;
      /**
       * Desde qué estado se admite la transición.
       *
       * Aprobar y rechazar sólo tienen sentido sobre un pedido pendiente;
       * revocar, sólo sobre uno ya aprobado. Declararlo acá evita que cada
       * operación repita la comprobación y que una se olvide.
       */
      readonly desde: keyof typeof ESTADO_DEL_VINCULO;
      /** Qué decir cuando el vínculo no está en ese estado. */
      readonly siNoEsta: string;
    },
  ): Promise<void> {
    const perfil = await this.em.transactional(async (tx) => {
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);

      const solicitud = await this.affiliationsRepo.findById(tx, affiliationId);
      if (!solicitud) {
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          affiliationId,
        });
      }

      // La solicitud tiene que ser de una sede de ESTA organización. Sin esto,
      // el administrador de A podría decidir sobre las de B con sólo conocer un
      // identificador — el criterio e2e del prompt.
      const sede = solicitud.practiceSiteId
        ? await tx.findOne(PracticeSites, {
            id: solicitud.practiceSiteId,
            managingTenantId: tenantId,
          })
        : null;
      if (!sede) {
        // 404 y no 403: para quien administra esta organización, una solicitud
        // de otra sencillamente no existe. Decir «prohibido» confirmaría que
        // existe, que es la mitad de lo que un sondeo busca.
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          affiliationId,
        });
      }

      if (!esEstado(solicitud.statusConceptId, decision.desde)) {
        throw new PreconditionFailedException(decision.siNoEsta, {
          affiliationId,
          statusConceptId: solicitud.statusConceptId,
        });
      }

      solicitud.statusConceptId = decision.destino;
      // El motivo se guarda, no sólo se registra: un rechazo que sólo vive en
      // el log es mudo para quien lo recibe. La columna existe desde v4.1.9 y
      // nadie la escribía.
      if (decision.motivo !== undefined && decision.motivo.trim() !== '') {
        solicitud.decisionReasonText = decision.motivo.trim();
      }
      // Quién y cuándo: `touch` escribe `updated_by_user_id` y `updated_at`,
      // que es el rastro que el prompt pide y el que la tabla ya sabe guardar.
      touch(solicitud, actor.id);

      if (decision.destino === ESTADO_DEL_VINCULO.APROBADO) {
        await this.concederMembresia(tx, solicitud, tenantId, actor);
      }

      this.logger.info(
        {
          operation: decision.operacion,
          affiliationId,
          tenantId,
          actorId: actor.id,
          reason: decision.motivo,
        },
        'Practitioner affiliation decided',
      );

      return solicitud.practitionerProfileId;
    });

    // El aviso va DESPUÉS de la transacción, y a propósito: la decisión ya está
    // escrita y confirmada. Emitir dentro dejaría la escritura esperando a un
    // canal de mensajería, y un fallo suyo revertiría una aprobación que la
    // organización ya tomó.
    await this.avisar(perfil, tenantId, affiliationId, decision);
  }

  /**
   * Le cuenta al profesional qué decidió la organización.
   *
   * ## Por qué nunca lanza
   *
   * Que no salga un aviso es un problema del aviso. La decisión ya ocurrió, ya
   * está escrita, y volver a intentarla porque falló mensajería sería peor.
   *
   * @param practitionerProfileId - De quién es el vínculo.
   * @param tenantId - La organización que decidió.
   * @param affiliationId - El vínculo.
   * @param decision - Qué se decidió y con qué motivo.
   */
  private async avisar(
    practitionerProfileId: string,
    tenantId: string,
    affiliationId: string,
    decision: { readonly destino: string; readonly motivo?: string },
  ): Promise<void> {
    const kind = AVISO_POR_DESTINO[decision.destino];
    if (kind === undefined) return;

    const cuenta = await this.cuentaDelProfesional(practitionerProfileId);
    if (cuenta === null) {
      this.logger.info(
        { operation: 'profiles.affiliation.notice', affiliationId },
        'El profesional no tiene cuenta: no hay a quién avisarle',
      );
      return;
    }

    const motivo =
      decision.motivo !== undefined && decision.motivo.trim() !== ''
        ? ` Motivo: ${decision.motivo.trim()}`
        : '';

    await this.avisos.emit({
      kind,
      recipientUserId: cuenta,
      tenantId,
      subject: ASUNTO[kind],
      bodyText: `${CUERPO[kind]}${motivo}`,
      affiliationId,
    });
  }

  /**
   * La cuenta que encarna a un profesional, o `null` si no tiene.
   *
   * Un profesional sin cuenta de portal existe —lo cargó una organización— y
   * simplemente no hay a dónde mandarle el aviso. No es un error.
   *
   * @param practitionerProfileId - El perfil profesional.
   * @returns El id de usuario, o `null`.
   */
  private async cuentaDelProfesional(
    practitionerProfileId: string,
  ): Promise<string | null> {
    const filas = await this.em.execute<{ user_id: string }[]>(
      `SELECT user_id FROM profiles.person_account_links
        WHERE person_id = ? LIMIT 1`,
      [practitionerProfileId],
    );
    return filas[0]?.user_id ?? null;
  }

  /**
   * Le da al profesional aprobado la llave de la organización.
   *
   * ## Por qué aprobar no alcanzaba
   *
   * El aislamiento multi-tenant se resuelve por **membresía**: el claim
   * `tenants` del token se arma leyendo `directory.tenant_memberships`, y el
   * interceptor de contexto rechaza cualquier petición que nombre un tenant que
   * no esté ahí. El vínculo aprobado no participaba de esa cuenta, así que la
   * organización aprobaba y el médico seguía sin poder publicar agenda en ella:
   * la petición moría en el interceptor, antes de que la regla del vínculo
   * —que sí existía y sí lo habría dejado pasar— llegara a mirarlo.
   *
   * ## Por qué un rol propio y no `STAFF`
   *
   * Lo que la organización aceptó fue que el profesional **atienda**, no que
   * administre. `DIR.ROLE_PRACTITIONER` queda fuera de los roles que
   * administran, así que la membresía abre el tenant para su agenda y deja
   * cerrada la gestión de personas, sedes y configuración.
   *
   * ## Sin cuenta no hay membresía, y no es un error
   *
   * Un perfil dado de alta por la organización puede no tener todavía una
   * cuenta que lo encarne. En ese caso la aprobación es válida igual —el
   * vínculo queda aprobado, que es lo que la organización decidió— y la
   * membresía llegará cuando la persona vincule su cuenta. Se registra el aviso
   * para que quede rastro y no se descubra por la ausencia.
   *
   * Un fallo al **crear** la membresía, en cambio, sí tumba la transacción:
   * aprobar en silencio sin conceder acceso reproduce el defecto original de
   * forma invisible.
   *
   * @param tx - Transacción de la decisión, ya validada.
   * @param solicitud - El vínculo recién aprobado.
   * @param tenantId - Organización que aprueba.
   * @param actor - Quien aprueba.
   */
  private async concederMembresia(
    tx: EntityManager,
    solicitud: PractitionerAffiliations,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const cuenta = await this.accountLinksRepo.findActiveByPerson(
      tx,
      solicitud.practitionerProfileId,
    );
    if (!cuenta) {
      this.logger.warn(
        {
          operation: 'profiles.affiliation.approve.membership',
          affiliationId: solicitud.id,
          tenantId,
          practitionerProfileId: solicitud.practitionerProfileId,
        },
        'Vínculo aprobado sin cuenta activa: la membresía queda pendiente',
      );
      return;
    }

    const { membership, creada } =
      await this.memberships.ensureMembresiaAsistencial(tx, {
        userId: cuenta.userId,
        tenantId,
        actorUserId: actor.id,
      });

    this.logger.info(
      {
        operation: 'profiles.affiliation.approve.membership',
        affiliationId: solicitud.id,
        tenantId,
        membershipId: membership.id,
        outcome: creada ? 'creada' : 'ya-existia',
      },
      'Membership granted for approved affiliation',
    );
  }
}

/**
 * El nombre de una persona, tal como se le muestra a quien decide.
 *
 * Prefiere `display_name` porque es lo que la propia persona eligió mostrar;
 * si no lo tiene, se arma con las partes. Devuelve `null` y no una cadena vacía
 * cuando no hay nada: la pantalla debe poder distinguir «sin nombre cargado» de
 * un nombre en blanco.
 */
function nombreVisible(persona: Persons): string | null {
  if (persona.displayName !== undefined && persona.displayName !== null) {
    const propio = persona.displayName.trim();
    if (propio !== '') return propio;
  }
  const partes = [persona.name, persona.lastName, persona.motherLastName]
    .filter((parte): parte is string => typeof parte === 'string')
    .map((parte) => parte.trim())
    .filter((parte) => parte !== '');
  return partes.length === 0 ? null : partes.join(' ');
}

/**
 * Qué aviso corresponde a cada estado al que se puede llegar decidiendo.
 *
 * Un estado que no está acá no avisa nada, y está bien: `DECLARADO` y
 * `PENDIENTE` no son decisiones de la organización, son cómo nace el vínculo.
 */
const AVISO_POR_DESTINO: Readonly<Record<string, AffiliationNoticeKind>> = {
  [ESTADO_DEL_VINCULO.APROBADO]: 'AFFILIATION_APPROVED',
  [ESTADO_DEL_VINCULO.RECHAZADO]: 'AFFILIATION_REJECTED',
  [ESTADO_DEL_VINCULO.REVOCADO]: 'AFFILIATION_REVOKED',
};

/** Lo que se lee en la campana sin abrir nada. */
const ASUNTO: Readonly<Record<AffiliationNoticeKind, string>> = {
  AFFILIATION_APPROVED: 'Te aceptaron como profesional',
  AFFILIATION_REJECTED: 'No aceptaron tu vínculo',
  AFFILIATION_REVOKED: 'Dieron de baja tu vínculo',
};

/**
 * El cuerpo del aviso.
 *
 * Cada uno dice **qué cambia para el médico**, no sólo qué pasó: enterarse de
 * que lo aprobaron sin saber que ya puede publicar agenda deja el aviso a mitad
 * de camino.
 */
const CUERPO: Readonly<Record<AffiliationNoticeKind, string>> = {
  AFFILIATION_APPROVED:
    'La organización te aceptó como profesional suyo. Ya podés publicar tu agenda ahí.',
  AFFILIATION_REJECTED:
    'La organización no aceptó el vínculo que pediste. Si creés que es un error, hablá con ellos.',
  AFFILIATION_REVOKED:
    'La organización dio de baja tu vínculo. Las citas que ya confirmaste siguen en pie, pero no vas a poder aceptar turnos nuevos ni publicar más agenda ahí.',
};
