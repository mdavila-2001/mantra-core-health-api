import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ui_visibility_elements`: el catálogo de
 * elementos de la interfaz sobre los que se pueden declarar reglas de visibilidad.
 * Es un catálogo de plataforma (no lleva `tenant_id`; ver D-UV-1 del modelo).
 */
@Entity({ schema: 'authz', tableName: 'ui_visibility_elements' })
export class UiVisibilityElements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Clave estable `<modulo>.<pantalla>.<elemento>` (única).
   */
  @Property({ columnType: 'varchar' })
  key!: string;

  /**
   * Tipo de elemento: MODULE, MENU_SECTION, SCREEN, SECTION, WIDGET, FIELD o ACTION.
   */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /**
   * Código del módulo al que pertenece el elemento.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar' })
  moduleCode!: string;

  /**
   * Elemento padre en la jerarquía; ocultar el padre oculta a todos sus descendientes.
   */
  @Property({ fieldName: 'parent_element_id', type: 'uuid', nullable: true }) // FK → authz.ui_visibility_elements
  parentElementId?: string;

  /**
   * Etiqueta legible para el catálogo.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Descripción opcional del elemento.
   */
  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  /**
   * Visibilidad cuando ninguna regla aplica.
   */
  @Property({ fieldName: 'default_visible', type: 'boolean' })
  defaultVisible!: boolean;

  /**
   * Origen del elemento: CODE (sincronizado desde el registro del front) o ADMIN (alta manual).
   */
  @Property({ columnType: 'varchar' })
  source!: string;

  /**
   * Estado: ACTIVE o RETIRED (un elemento CODE que desaparece del registro se retira, no se borra).
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Fecha y hora en que el elemento pasó a RETIRED.
   */
  @Property({
    fieldName: 'retired_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retiredAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
