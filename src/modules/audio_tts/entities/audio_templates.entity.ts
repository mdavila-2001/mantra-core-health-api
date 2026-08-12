import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Catálogo de plantillas de audio (`audio_tts.audio_templates`).
 *
 * El texto vive aquí y **no** en el código de quien pide el audio: cambiar lo
 * que dice la bienvenida es entonces un dato, no un despliegue. La clave
 * primaria es el código funcional (`onboarding.welcome.named`) porque es lo que
 * los llamadores escriben y lo que la identidad del asset incluye; un uuid
 * añadiría una indirección que nadie usaría.
 */
@Entity({ schema: 'audio_tts', tableName: 'audio_templates' })
export class AudioTemplates {
  /**
   * Código funcional de la plantilla.
   */
  @PrimaryKey({ columnType: 'varchar(160)' })
  code!: string;

  /**
   * Versión del texto. Forma parte de la identidad del asset: subirla invalida
   * la caché de esa plantilla sin borrar nada, porque los audios anteriores
   * siguen siendo válidos para la versión con la que se generaron.
   */
  @Property({ columnType: 'int' })
  version!: number;

  /**
   * Estrategia: `STATIC`, `DYNAMIC` o `FALLBACK`. Restringida por CHECK en base
   * (ver `physical.catalog.ts`).
   */
  @Property({ columnType: 'varchar(16)' })
  strategy!: string;

  /**
   * Texto con marcadores `{{variable}}`. Las plantillas `STATIC` y `FALLBACK`
   * no llevan ninguno.
   */
  @Property({ fieldName: 'template_text', columnType: 'text' })
  templateText!: string;

  /**
   * Idioma propio de la plantilla; si falta, se usa el idioma por defecto de la
   * configuración.
   */
  @Property({ columnType: 'varchar(20)', nullable: true })
  language?: string;

  /**
   * Plantilla de degradación específica de esta. Si falta, se usa la global.
   */
  @Property({
    fieldName: 'fallback_template_code',
    columnType: 'varchar(160)',
    nullable: true,
  }) // FK → audio_tts.audio_templates
  fallbackTemplateCode?: string;

  /**
   * Desactivar una plantilla la retira del servicio sin borrar los assets que
   * ya generó: `resolve()` la trata como inexistente.
   */
  @Property({ fieldName: 'is_active', columnType: 'boolean', default: true })
  isActive: boolean = true;

  /**
   * Valor de created at mantenido por la instancia.
   */
  @Property({
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  /**
   * Valor de updated at mantenido por la instancia. Lo mantiene un trigger en
   * base (`audio_tts.touch_updated_at`) para que un UPDATE por SQL directo no
   * pueda dejarlo obsoleto.
   */
  @Property({
    fieldName: 'updated_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  updatedAt: Date = new Date();
}
