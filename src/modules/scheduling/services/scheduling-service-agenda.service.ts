import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, touch } from '../../../common';
import type { BookableSlots, PractitionerServiceOfferings } from '../entities';
import type { ServiceCatalog } from '../../billing/entities';
import {
  SchedulingCatalogRepository,
  SchedulingOfferingsRepository,
} from '../repositories';
import { SCHED } from '../scheduling.concepts';
import {
  cuposQueSePuedenReabrir,
  tramoOcupado,
  type Intervalo,
} from '../service-availability';
import {
  diasLocalesQueCoinciden,
  horaLocalAUtc,
  type DiaLocal,
} from '../scheduling-time';
import { SchedulingProfessionalTimeService } from './scheduling-professional-time.service';

const MS_POR_MINUTO = 60_000;

/**
 * Cuánto se ensancha la ventana al mirar compromisos vecinos: el techo de los
 * colchones (`MAX_SERVICE_BUFFER_MINUTES`), para no perder un turno cuya limpieza
 * llega hasta el rango que se está mirando aunque él mismo quede afuera.
 */
const MARGEN_DE_COLCHONES_MS = 240 * MS_POR_MINUTO;

/** Franjas de una plantilla que admiten servicios, con las reglas de su política. */
export interface FranjasDeServicio {
  readonly resourceId: string;
  readonly resourceName: string;
  readonly franjas: readonly Intervalo[];
  /** Aviso mínimo de la política de la plantilla, en minutos (0 ≡ sin política). */
  readonly minNoticeMinutes: number;
  /** Días de anticipación máximos; `undefined` ≡ sin tope declarado. */
  readonly maxAdvanceDays?: number;
}

/** Un recurso con lo mínimo que hace falta para mirar sus franjas. */
export interface SedeDelProfesional {
  readonly id: string;
  readonly name: string;
  readonly timeZone?: string;
}

/**
 * El tiempo de un profesional visto desde los servicios: qué está ocupado, qué franjas
 * admiten servicios y cómo se retraen y reabren los cupos de consulta.
 *
 * ## Por qué es un servicio aparte
 *
 * Lo usan tres casos de uso —leer horarios, retener un turno y reabrir lo retraído al
 * cancelar, vencer o terminar antes— y los tres tienen que mirar **el mismo** tiempo
 * ocupado. Con tres copias, la primera que se desviara dejaría ofrecer un horario que
 * otra rechaza.
 *
 * ## Qué cuenta como ocupado
 *
 * Citas confirmadas y tiempo ocupado (la regla madre), **retenciones vivas** de
 * cualquier cupo, y los turnos de servicio vivos **ensanchados con sus colchones**.
 * Las retenciones no las cuenta la regla madre y con turnos de largo variable son
 * justo lo que permite que dos pacientes reserven rangos que se pisan.
 */
@Injectable()
export class SchedulingServiceAgendaService {
  constructor(
    private readonly offeringsRepo: SchedulingOfferingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly tiempoProfesional: SchedulingProfessionalTimeService,
  ) {}

  /**
   * Todo lo que ocupa el tiempo del profesional en un rango, en todas sus sedes.
   *
   * @param ahora - «Ahora», inyectado para que las retenciones vencidas no cuenten.
   */
  async ocupadoDelProfesional(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    ahora: Date,
  ): Promise<Intervalo[]> {
    const desdeAncho = new Date(desde.getTime() - MARGEN_DE_COLCHONES_MS);
    const hastaAncho = new Date(hasta.getTime() + MARGEN_DE_COLCHONES_MS);

    const [compromisos, retenciones, servicios] = await Promise.all([
      this.tiempoProfesional.compromisos(
        em,
        practitionerProfileId,
        desdeAncho,
        hastaAncho,
      ),
      this.offeringsRepo.findLiveHoldsOfProfessional(
        em,
        practitionerProfileId,
        desdeAncho,
        hastaAncho,
        CONCEPTS.HOLD_ACTIVE,
        ahora,
      ),
      this.offeringsRepo.findLiveServiceSlotsOfProfessional(
        em,
        practitionerProfileId,
        desdeAncho,
        hastaAncho,
        {
          bookedStatusConceptId: CONCEPTS.SLOT_BOOKED,
          heldStatusConceptId: CONCEPTS.SLOT_HELD,
          activeHoldStatusConceptId: CONCEPTS.HOLD_ACTIVE,
        },
        ahora,
      ),
    ]);

    return [
      ...compromisos.map((c) => ({ startAt: c.startAt, endAt: c.endAt })),
      ...retenciones.map((r) => ({ startAt: r.startAt, endAt: r.endAt })),
      ...servicios.map((s) => tramoOcupado(s.startAt, s.endAt, s)),
    ];
  }

  /**
   * Las franjas que admiten servicios en el rango, por plantilla.
   *
   * Una franja admite servicios si su modo es `SERVICES` o `MIXED`. Sin modo
   * declarado (`NULL`) es sólo consultas: así se comportaba toda franja antes de este
   * cambio y es lo que mantiene intacta la agenda existente.
   */
  async franjasDeServicios(
    em: EntityManager,
    practitionerProfileId: string,
    sedes: readonly SedeDelProfesional[],
    desde: Date,
    hasta: Date,
  ): Promise<FranjasDeServicio[]> {
    if (sedes.length === 0) return [];
    const sedePorId = new Map(sedes.map((sede) => [sede.id, sede]));

    const reglas = await this.catalogRepo.findRulesByResourceOwner(
      em,
      practitionerProfileId,
      CONCEPTS.TEMPLATE_PUBLISHED,
    );

    const porPlantilla = new Map<
      string,
      FranjasDeServicio & { franjas: Intervalo[] }
    >();
    for (const { rule, resourceId, validTo: validaHasta } of reglas) {
      const sede = sedePorId.get(resourceId);
      if (sede === undefined) continue;
      if (!admiteServicios(rule.bookingModeConceptId)) continue;

      let grupo = porPlantilla.get(rule.scheduleTemplateId);
      if (grupo === undefined) {
        const politica = await this.politicaDe(em, rule.scheduleTemplateId);
        grupo = {
          resourceId,
          resourceName: sede.name,
          franjas: [],
          minNoticeMinutes: politica.minNoticeMinutes,
          maxAdvanceDays: politica.maxAdvanceDays,
        };
        porPlantilla.set(rule.scheduleTemplateId, grupo);
      }

      const zona = sede.timeZone ?? 'UTC';
      for (const dia of diasLocalesQueCoinciden(
        desde,
        hasta,
        rule.dayOfWeek,
        zona,
      )) {
        if (!vigenteEseDia(dia, rule.validFrom, rule.validTo ?? validaHasta))
          continue;
        const inicio = horaLocalAUtc(dia, rule.startTime, zona);
        const fin = horaLocalAUtc(dia, rule.endTime, zona);
        const recortadoDesde = inicio < desde ? desde : inicio;
        const recortadoHasta = fin > hasta ? hasta : fin;
        if (recortadoHasta > recortadoDesde) {
          grupo.franjas.push({
            startAt: recortadoDesde,
            endAt: recortadoHasta,
          });
        }
      }
    }
    return [...porPlantilla.values()];
  }

  /**
   * Retira de la oferta los cupos de consulta que un turno de servicio pisa.
   *
   * Es el mismo gesto que la cita puntual del doctor, con un estado propio: el
   * cupo queda **retraído** y no bloqueado, porque al bloqueado nadie lo devuelve y
   * al retraído sí. Sólo los intactos (sin reserva adentro).
   *
   * @returns Cuántos cupos se retiraron.
   */
  async retraer(
    em: EntityManager,
    resourceRefId: string,
    desde: Date,
    hasta: Date,
    actorUserId: string | undefined,
  ): Promise<number> {
    const libres = await this.catalogRepo.findOpenSlotsOfProfessionalInWindow(
      em,
      resourceRefId,
      desde,
      hasta,
      CONCEPTS.SLOT_OPEN,
    );
    for (const libre of libres) {
      libre.statusConceptId = SCHED.SLOT_RETRACTED;
      touch(libre, actorUserId);
    }
    return libres.length;
  }

  /**
   * Vuelve a ofrecer los cupos de consulta retraídos que **ya no chocan con nada**.
   *
   * Se llama cuando un turno de servicio deja de ocupar tiempo: vence la retención,
   * se cancela o termina antes. Reabre sólo lo que quedó libre: el cupo que otro
   * servicio sigue pisando se queda retraído, porque ofrecerlo sería ofrecer un
   * horario que no existe.
   *
   * @param desde - Inicio del rango que se acaba de liberar.
   * @param hasta - Fin del rango que se acaba de liberar.
   * @returns Cuántos cupos volvieron a ofrecerse.
   */
  async reabrir(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    actorUserId: string | undefined,
  ): Promise<number> {
    const desdeAncho = new Date(desde.getTime() - MARGEN_DE_COLCHONES_MS);
    const hastaAncho = new Date(hasta.getTime() + MARGEN_DE_COLCHONES_MS);

    const retraidos = await this.offeringsRepo.findRetractedSlotsOfProfessional(
      em,
      practitionerProfileId,
      desdeAncho,
      hastaAncho,
      SCHED.SLOT_RETRACTED,
    );
    if (retraidos.length === 0) return 0;

    const ocupado = await this.ocupadoDelProfesional(
      em,
      practitionerProfileId,
      desdeAncho,
      hastaAncho,
      new Date(),
    );
    const reabribles = new Set(
      cuposQueSePuedenReabrir(
        retraidos.map((cupo) => ({
          id: cupo.id,
          startAt: cupo.startAt,
          endAt: cupo.endAt ?? cupo.startAt,
        })),
        ocupado,
      ),
    );
    const reabiertos: BookableSlots[] = retraidos.filter((cupo) =>
      reabribles.has(cupo.id),
    );
    for (const cupo of reabiertos) {
      cupo.statusConceptId = CONCEPTS.SLOT_OPEN;
      touch(cupo, actorUserId);
    }
    return reabiertos.length;
  }

  /**
   * Devuelve las consultas retraídas que el rango de un cupo ya no pisa.
   *
   * Resuelve el profesional desde el recurso del cupo; un cupo de un recurso que no es
   * un profesional (una sala, un equipo) no retrae nada y no devuelve nada.
   */
  async reabrirTramo(
    em: EntityManager,
    slot: { resourceId?: string | null },
    desde: Date,
    hasta: Date,
    actorUserId: string | undefined,
  ): Promise<number> {
    if (!slot.resourceId) return 0;
    const recurso = await this.catalogRepo.findResourceById(
      em,
      slot.resourceId,
    );
    if (
      !recurso ||
      !['practitioner_profiles', 'health_practitioner_profiles'].includes(
        recurso.resourceRefType,
      )
    ) {
      return 0;
    }
    return this.reabrir(em, recurso.resourceRefId, desde, hasta, actorUserId);
  }

  /** La oferta de un cupo de servicio y lo que el catálogo dice de su servicio. */
  async ofertaDelCupo(
    em: EntityManager,
    offeringId: string,
  ): Promise<{
    oferta: PractitionerServiceOfferings;
    catalogo: ServiceCatalog | null;
  } | null> {
    const oferta = await this.offeringsRepo.findOfferingById(em, offeringId);
    if (oferta === null) return null;
    const catalogo = await this.offeringsRepo.findCatalogItem(
      em,
      oferta.serviceCatalogId,
    );
    return { oferta, catalogo };
  }

  private async politicaDe(
    em: EntityManager,
    templateId: string,
  ): Promise<{ minNoticeMinutes: number; maxAdvanceDays?: number }> {
    const plantilla = await this.catalogRepo.findTemplateById(em, templateId);
    const politica =
      plantilla?.bookingPolicyId == null
        ? null
        : await this.catalogRepo.findPolicyById(em, plantilla.bookingPolicyId);
    return {
      minNoticeMinutes: politica?.minNoticeMinutes ?? 0,
      maxAdvanceDays: politica?.maxAdvanceDays ?? undefined,
    };
  }
}

function admiteServicios(modo?: string | null): boolean {
  return modo === SCHED.RULE_MODE_SERVICES || modo === SCHED.RULE_MODE_MIXED;
}

/** `YYYY-MM-DD` de un día local, comparable como texto. */
function ymdDeDia(dia: DiaLocal): string {
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${dia.year}-${dos(dia.month)}-${dos(dia.day)}`;
}

/** `YYYY-MM-DD` de una columna `date`, que el driver entrega como `Date` o como texto. */
function ymdDeColumna(valor: Date | string): string {
  return typeof valor === 'string'
    ? valor.slice(0, 10)
    : valor.toISOString().slice(0, 10);
}

function vigenteEseDia(
  dia: DiaLocal,
  validFrom?: Date | string | null,
  validTo?: Date | string | null,
): boolean {
  const ymd = ymdDeDia(dia);
  if (validFrom != null && ymd < ymdDeColumna(validFrom)) return false;
  if (validTo != null && ymd > ymdDeColumna(validTo)) return false;
  return true;
}
