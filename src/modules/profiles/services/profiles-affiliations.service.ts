import { Injectable } from '@nestjs/common';
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
import { TenantAdministrationService } from '../../directory/services';
import { PROF } from '../profiles.concepts';
import { PractitionerAffiliationsRepository } from '../repositories';
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
  PENDIENTE: CONCEPTS.STATE_PENDING,
  /** La organización lo aceptó. */
  APROBADO: PROF.AFFILIATION_ACTIVE,
  /** La organización lo rechazó, o el profesional lo retiró. */
  RECHAZADO: PROF.AFFILIATION_RETRACTED,
} as const;

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
   * @param tenantAdmin - Quién administra cada organización.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly affiliationsRepo: PractitionerAffiliationsRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly logger: PinoLogger,
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
    if (!practiceSiteId) return ESTADO_DEL_VINCULO.APROBADO;

    const site = await em.findOne(PracticeSites, { id: practiceSiteId });
    if (!site) {
      throw new ResourceNotFoundException('La sede indicada no existe', {
        practiceSiteId,
      });
    }

    const tenantId = site.managingTenantId;
    // Una sede sin organización a cargo no tiene a quién pedirle permiso.
    if (!tenantId) return ESTADO_DEL_VINCULO.APROBADO;

    const esSuya = actor.tenantIds?.includes(tenantId) === true;
    return esSuya ? ESTADO_DEL_VINCULO.APROBADO : ESTADO_DEL_VINCULO.PENDIENTE;
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

    return {
      items: solicitudes.map((fila) => ({
        id: fila.id,
        practitionerProfileId: fila.practitionerProfileId,
        organizationName: fila.organizationName,
        roleTitle: fila.roleTitle,
        practiceSiteId: fila.practiceSiteId ?? null,
        startDate: fila.startDate,
        statusConceptId: fila.statusConceptId,
        createdAt: fila.createdAt,
      })),
    };
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
    });
  }

  /**
   * La organización rechaza el vínculo.
   *
   * ## El motivo no se guarda todavía, y conviene saberlo
   *
   * `practitioner_affiliations` no tiene columna donde escribirlo, y agregarla
   * es un cambio de esquema —de Marcelo—. Se acepta en el cuerpo y viaja al
   * registro estructurado, que es donde hoy queda rastro de por qué se rechazó;
   * lo que falta es devolvérselo al profesional en su pantalla. Anotado como
   * bloqueador: sin esa columna, un rechazo es mudo para quien lo recibe.
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
    },
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
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

      if (solicitud.statusConceptId !== ESTADO_DEL_VINCULO.PENDIENTE) {
        throw new PreconditionFailedException('Esa solicitud ya fue resuelta', {
          affiliationId,
          statusConceptId: solicitud.statusConceptId,
        });
      }

      solicitud.statusConceptId = decision.destino;
      // Quién y cuándo: `touch` escribe `updated_by_user_id` y `updated_at`,
      // que es el rastro que el prompt pide y el que la tabla ya sabe guardar.
      touch(solicitud, actor.id);

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
    });
  }
}
