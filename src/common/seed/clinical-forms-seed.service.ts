import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';
import { CatalogConcepts } from '../../modules/terminology/entities';
import { SpecialtyChartTemplates } from '../../modules/chart/entities';
import {
  DynamicFieldDefinitions,
  DynamicFieldSections,
  FieldAssignments,
} from '../../modules/forms/entities';
import { CHART } from '../../modules/chart/chart.concepts';
import { FORMS } from '../../modules/forms/forms.concepts';
import { CHART_TEMPLATE_PROVENANCE_FIELD_CODE } from '../../modules/chart/dto';
import {
  STANDARD_FORMS,
  type StandardFormDefinition,
  type StandardFormSpecialty,
} from './data/clinical-forms/catalog';

/**
 * Prefijo de las claves de las que se derivan todos los identificadores de este
 * seed. Cambiarlo reescribe cada UUID derivado y el catálogo se sembraría por
 * duplicado, así que se trata como constante inmutable, igual que
 * `SALUD_UUID_NAMESPACE`.
 */
const ORIGIN = 'clinical-forms';

/**
 * Siembra el **contenido** del catálogo de formularios clínicos: la versión
 * general base de cada formulario estándar por especialidad, ya transcrita a
 * campos, con su ficha de procedencia.
 *
 * Carril R2-5, punto 5 del reclamo. La ronda anterior entregó el motor —un
 * admin arma la plantilla de su especialidad y un doctor la completa dentro del
 * encuentro— y quedó vacío, porque alguien tenía que sentarse a tipear cada
 * campo de cada formulario de cada especialidad. Esto es lo que va adentro. El
 * motor no se toca: las plantillas que este servicio crea tienen exactamente la
 * misma forma que las que crea `ChartTemplatesService.createTemplate`
 * (plantilla + sección + un `dynamic_field_definitions` por campo, asignado a
 * la sección), de modo que `GET /charts/templates` y `specialty-form-block` las
 * leen sin enterarse de que salieron de acá.
 *
 * ## Idempotente, y además no pisa lo ajeno
 *
 * Son dos garantías distintas y las dos hacen falta:
 *
 * - **No duplica.** Todos los identificadores derivan por UUIDv5 del `code` del
 *   formulario, así que correr el seed dos veces converge al mismo estado.
 * - **No pisa.** Si la plantilla de un formulario ya existe, se saltea entera
 *   —no se re-escriben sus campos ni su nombre—. Una organización que adaptó la
 *   ficha de cardiología a su manera no la pierde en el próximo despliegue. Es
 *   deliberado que el precio sea que una corrección del catálogo no se propague
 *   sola: para eso está `version` y un código nuevo.
 *
 * ## Las especialidades se siembran acá
 *
 * `terminology` sólo traía `profiles:SPECIALTY_GENERAL`, y sin concepto no hay
 * `specialty_concept_id` al que colgar una plantilla. Los conceptos de
 * especialidad que el catálogo necesita se materializan en este mismo servicio
 * —no en `terminology-seed.service.ts`, que en esta ronda lo tiene tomado otro
 * carril— con el mismo criterio que usa el agregador de módulos: `code` = la
 * clave, que es única globalmente y no choca con los `ACTIVE` genéricos de otros
 * dominios.
 *
 * ## Dónde vive la procedencia, mientras tanto
 *
 * `chart.specialty_chart_templates` no tiene columnas para organismo, URL ni
 * licencia, y el modelo no se edita a mano (ver el bloqueador en
 * `COORDINACION-AGENTES.md`). Hasta que existan, la ficha viaja **dentro del
 * propio esquema**, en un campo reservado de código `__catalog__` cuyo
 * `default_value_json` la guarda entera. `ChartTemplatesService` lo saca de
 * `fields` al responder y lo publica como `provenance`, así que ningún
 * consumidor lo ve como un campo a completar.
 */
@Injectable()
export class ClinicalFormsSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalFormsSeedService.name);
  }

  /**
   * Materializa el catálogo. Público para que las pruebas de integración puedan
   * invocarlo tras crear el esquema, igual que el resto de los seeds.
   *
   * Se flushea por niveles —especialidades, después plantilla y sección,
   * después campos, después asignaciones— porque las FK del modelo son columnas
   * `uuid` planas y no relaciones del ORM: MikroORM no infiere el orden de
   * inserción a partir de ellas, así que un único flush violaría la FK del
   * padre. Es el mismo motivo que documenta `TerminologySeedService`.
   */
  async run(): Promise<{
    /** Plantillas creadas en esta corrida. */
    templates: number;
    /** Conceptos de especialidad creados en esta corrida. */
    specialties: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();

    const specialties = await this.seedSpecialties(em, now);

    let templates = 0;
    for (const form of STANDARD_FORMS) {
      templates += await this.seedForm(em, form, now);
    }

    if (templates > 0 || specialties > 0) {
      this.logger.info(
        { templates, specialties },
        'Catálogo de formularios clínicos estándar materializado',
      );
    }
    return { templates, specialties };
  }

  /** El concept id de una especialidad del catálogo, derivado de su código. */
  private specialtyConceptId(specialty: StandardFormSpecialty): string {
    return deterministicId(`${ORIGIN}:specialty:${specialty.code}`);
  }

  /**
   * Materializa como conceptos de terminología las especialidades que el
   * catálogo referencia y todavía no existen.
   *
   * Se consultan de golpe las ya presentes en vez de una por una: son quince
   * formularios sobre diez especialidades y el patrón N+1 en el arranque es
   * gratuito de evitar.
   */
  private async seedSpecialties(em: EntityManager, now: Date): Promise<number> {
    const porId = new Map<string, StandardFormSpecialty>();
    for (const form of STANDARD_FORMS) {
      porId.set(this.specialtyConceptId(form.specialty), form.specialty);
    }

    const ids = [...porId.keys()];
    const existentes = await em.find(CatalogConcepts, { id: { $in: ids } });
    const yaEstan = new Set(existentes.map((concept) => concept.id));

    let inserted = 0;
    for (const [id, specialty] of porId) {
      if (yaEstan.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          // La CLAVE, no el código humano: `catalog_concepts` tiene
          // UNIQUE(code_system_version_id, code) y el catálogo transversal ya
          // usa códigos genéricos. Los consumidores referencian por id.
          code: `${ORIGIN}:specialty:${specialty.code}`,
          display: specialty.display,
          abstract: false,
          selectable: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    if (inserted > 0) await em.flush();
    return inserted;
  }

  /**
   * Siembra un formulario completo, o no hace nada si su plantilla ya existe.
   *
   * @returns 1 si creó la plantilla, 0 si ya estaba.
   */
  private async seedForm(
    em: EntityManager,
    form: StandardFormDefinition,
    now: Date,
  ): Promise<number> {
    const templateId = deterministicId(`${ORIGIN}:template:${form.code}`);

    // La clave de origen: si la plantilla ya está, se saltea entera. No se
    // comparan campos ni nombre a propósito — una plantilla que la organización
    // editó tiene que sobrevivir al despliegue.
    if (await em.findOne(SpecialtyChartTemplates, { id: templateId })) {
      return 0;
    }

    const sectionId = deterministicId(`${ORIGIN}:section:${form.code}`);

    em.create(
      DynamicFieldSections,
      {
        id: sectionId,
        // Mismo formato que `ChartTemplatesService.createTemplate`, para que las
        // secciones del catálogo y las que arma un admin sean indistinguibles.
        code: `CHART_TPL-${form.code}`,
        name: form.name,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    // La sección se flushea ANTES de crear la plantilla, no las dos juntas:
    // `specialty_chart_templates.section_id` es una columna `uuid` plana con FK,
    // no una relación del ORM, así que MikroORM no infiere que la sección va
    // primero — ordena los inserts por tabla, y la plantilla entraba antes. La
    // base rechazaba el lote con `fk_specialty_chart_templates_section_id`, el
    // seed quedaba «omitido» en el arranque y el catálogo, vacío. Es el mismo
    // motivo por el que `TerminologySeedService` flushea por niveles.
    await em.flush();

    em.create(
      SpecialtyChartTemplates,
      {
        id: templateId,
        specialtyConceptId: this.specialtyConceptId(form.specialty),
        // Sin tenant: el catálogo es global y toda organización lo ve. Una
        // adaptación propia se hace duplicando, que es lo que ofrece la pantalla.
        tenantId: undefined,
        code: form.code,
        name: form.name,
        sectionId,
        version: form.version,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    await em.flush();

    // El campo reservado va primero (ordinal -1) para que quede fuera del rango
    // de los campos reales aunque alguien liste sin filtrar.
    await this.seedField(
      em,
      form,
      {
        code: CHART_TEMPLATE_PROVENANCE_FIELD_CODE,
        name: `Procedencia de «${form.name}»`,
        dataType: 'json',
        required: false,
      },
      -1,
      sectionId,
      form.provenance,
      now,
    );

    for (const [ordinal, field] of form.fields.entries()) {
      await this.seedField(em, form, field, ordinal, sectionId, undefined, now);
    }

    return 1;
  }

  /** Un campo del esquema, con su asignación a la sección de la plantilla. */
  private async seedField(
    em: EntityManager,
    form: StandardFormDefinition,
    field: {
      /** Código del campo dentro del formulario. */
      code: string;
      /** Nombre legible del campo. */
      name: string;
      /** Tipo de dato técnico. */
      dataType: string;
      /** Si es obligatorio al completar. */
      required?: boolean;
    },
    ordinal: number,
    sectionId: string,
    defaultValueJson: unknown,
    now: Date,
  ): Promise<void> {
    // El código se prefija con el de la plantilla porque
    // `forms.dynamic_field_definitions` es una tabla global: quince formularios
    // con un `motivo_consulta` cada uno chocarían entre sí. El prefijo no se ve
    // en ningún lado —lo que se dibuja es `name`— pero garantiza unicidad.
    const fieldCode = `${form.code}.${field.code}`;
    const fieldId = deterministicId(`${ORIGIN}:field:${fieldCode}`);

    if (!(await em.findOne(DynamicFieldDefinitions, { id: fieldId }))) {
      em.create(
        DynamicFieldDefinitions,
        {
          id: fieldId,
          code: fieldCode,
          name: field.name,
          dataType: field.dataType,
          defaultValueJson,
          schemaVersion: 1,
          stateConceptId: FORMS.FIELD_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      await em.flush();
    }

    const assignmentId = deterministicId(`${ORIGIN}:assignment:${fieldCode}`);
    if (await em.findOne(FieldAssignments, { id: assignmentId })) return;

    em.create(
      FieldAssignments,
      {
        id: assignmentId,
        fieldId,
        targetResourceConceptId: CHART.TEMPLATE_FIELD_TARGET,
        sectionId,
        required: field.required ?? false,
        ordinal,
        visible: true,
        editable: true,
        stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    await em.flush();
  }
}
