import { SEED, deterministicId } from '../constants/concepts';
import { AFFILIATION_DOCUMENT_VALUE_SETS } from '../../modules/directory/affiliation-documents';
import { LEGAL_REPRESENTATIVE_ROLE_VALUE_SET } from '../../modules/directory/legal-representatives';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Los cuatro conjuntos de valores del onboarding legal de una organización:
 * documentos de afiliación, autoridad emisora, estado de verificación del
 * documento y rol del representante legal.
 *
 * ## Por qué viven acá
 *
 * `AffiliationDocumentConceptsService` los resuelve por `internal_code` y, si
 * falta alguno, el alta de organización responde 422 «El catálogo de documentos
 * de afiliación no está disponible» (defecto D6 del 26/09/2026). Hasta ahora
 * sólo los sembraba el paquete del modelo (`gen_seeds.py`), que el despliegue
 * no carga: su base es el DDL más `seed-cli`. Es el mismo caso que
 * `VS_BO_DEPARTMENT` y se resuelve igual: el catálogo se declara en el
 * repositorio de la API y lo materializa un seeder idempotente.
 *
 * ## Procedencia
 *
 * Catálogo **interno** (no oficial). Partió de los códigos del paquete del
 * modelo `mantra-core-health-model` (`salud-db/gen_seeds.py`: `VS_OWNER`
 * v4.0.3 / v4.0.4, y `salud-db/data/value-set-extensions.json` para
 * `CERTIFICADO_RADIOPROTECCION`): 9 / 7 / 5 / 7 valores. Esos códigos se
 * conservan **todos y sin renombrar** (hay filas guardadas que apuntan a sus
 * ids deterministas) y su rótulo no cambia: el seeder no pisa conceptos ya
 * sembrados, así que cambiarlo dejaría bases viejas y nuevas mostrando textos
 * distintos para el mismo código.
 *
 * Sobre esa base se amplió (26/10/2026, el cliente pidió «la máxima amplitud»)
 * con lo que en Bolivia se exige de verdad a clínicas, consultorios,
 * laboratorios, farmacias, importadoras y centros de imagen: registro de
 * comercio y vida societaria, tributario (SIN/SIAT), municipal y de seguridad
 * del inmueble, habilitación sanitaria (SEDES de los nueve departamentos,
 * Ministerio de Salud, AGEMED, INLASA), radioprotección (IBTEN / IBMETRO),
 * ejercicio profesional (títulos, matrícula, colegios), laboral y seguridad
 * social, seguros y finanzas. Los roles de representante cubren los cargos de
 * cada forma societaria (SRL, S.A., cooperativa, fundación, entidad pública,
 * sucursal extranjera) y los responsables técnicos que el SEDES pide nombrar.
 *
 * Los rótulos van en castellano con tildes: el paquete los deriva del código
 * sin tildes (`Escritura Constitucion`), que no es lo que se muestra a una
 * persona.
 *
 * ## Orden
 *
 * El orden de cada lista agrupa por trámite y deja `OTRO` al final. Las
 * opciones nuevas caen entre medio de las viejas, así que el seeder realinea
 * el `ordinal` de las membresías ya sembradas (mismo criterio que
 * `BoOccupationsSeedService.seedMemberships`); un código no se quita nunca.
 *
 * ## Por qué cada conjunto tiene su propia versión de sistema de códigos
 *
 * `catalog_concepts.code` es único por versión de sistema de códigos
 * (`uq_catalog_concepts_version_code`) y `OTRO` está en tres de los cuatro
 * conjuntos. El servicio busca el concepto por su código **crudo**
 * (`NIT_EXHIBICION`, `OTRO`…), así que no se puede prefijar para desambiguar
 * como hace `geo:bo:department:SC`. Se repite el criterio del paquete del
 * modelo: una versión por conjunto (`1.0.0-vs_<nombre>`), cada una bajo el
 * sistema de códigos interno.
 */

/** Código del valor «Otro», presente en tres de los cuatro conjuntos. */
const OTHER_CODE = 'OTRO';

/** Versión única que recibe cada conjunto. */
export const AFFILIATION_CATALOG_VERSION = '1.0.0';

/** Un valor del conjunto: el código que el servicio busca y su rótulo en castellano. */
export interface AffiliationCatalogMember {
  /** Código crudo, en MAYÚSCULAS. Es la clave estable del concepto dentro de su conjunto. */
  readonly code: string;
  /** Rótulo en castellano. */
  readonly display: string;
}

/** Un conjunto de valores del onboarding legal con todos sus miembros, en orden. */
export interface AffiliationCatalogSet {
  /** `internal_code` del conjunto; es lo que el servicio de dominio consulta. */
  readonly code: string;
  /** Nombre legible del conjunto. */
  readonly name: string;
  /** Qué gobierna, en una línea. */
  readonly description: string;
  /** Sus miembros, en el orden que se ofrecen (el índice es el `ordinal`). */
  readonly members: readonly AffiliationCatalogMember[];
}

export const AFFILIATION_CATALOG_SETS: readonly AffiliationCatalogSet[] = [
  {
    code: AFFILIATION_DOCUMENT_VALUE_SETS.documentType,
    name: 'Tipo de documento de afiliación',
    description:
      'Documentos legales con los que una organización acredita su afiliación ' +
      '(`tenant_affiliation_documents.document_type_concept_id`).',
    members: [
      { code: 'ESCRITURA_CONSTITUCION', display: 'Escritura de constitución' },
      {
        code: 'TESTIMONIO_CONSTITUCION',
        display: 'Testimonio notarial de la escritura de constitución',
      },
      { code: 'ESTATUTOS_SOCIALES', display: 'Estatutos sociales' },
      { code: 'ACTA_FUNDACION', display: 'Acta de fundación' },
      {
        code: 'ESCRITURA_MODIFICACION',
        display: 'Escritura de modificación de la sociedad',
      },
      {
        code: 'ESCRITURA_TRANSFORMACION',
        display: 'Escritura de transformación, fusión o escisión',
      },
      {
        code: 'ACTA_JUNTA_SOCIOS',
        display: 'Acta de asamblea de socios o junta de accionistas',
      },
      { code: 'ACTA_DIRECTORIO', display: 'Acta de directorio' },
      {
        code: 'LIBRO_REGISTRO_ACCIONES',
        display: 'Libro de registro de acciones o de socios',
      },
      {
        code: 'PERSONALIDAD_JURIDICA',
        display: 'Resolución de personalidad jurídica',
      },
      { code: 'REGISTRO_ONG_VIPFE', display: 'Registro de ONG ante el VIPFE' },
      {
        code: 'REGISTRO_COOPERATIVA_AFCOOP',
        display: 'Registro de cooperativa ante la AFCOOP',
      },
      {
        code: 'DOCUMENTOS_SOCIEDAD_EXTRANJERA',
        display:
          'Documentos legalizados o apostillados de la sociedad extranjera',
      },
      {
        code: 'PROTOCOLIZACION_SUCURSAL',
        display: 'Protocolización de la sucursal de sociedad extranjera',
      },
      {
        code: 'NORMA_CREACION_ENTIDAD_PUBLICA',
        display:
          'Norma de creación de la entidad pública (ley, decreto u ordenanza)',
      },
      { code: 'BALANCE_APERTURA', display: 'Balance de apertura' },
      { code: 'ESTADOS_FINANCIEROS', display: 'Estados financieros auditados' },
      { code: 'MATRICULA_SEPREC', display: 'Matrícula del SEPREC' },
      {
        code: 'MATRICULA_FUNDEMPRESA',
        display: 'Matrícula de comercio de FUNDEMPRESA',
      },
      {
        code: 'CERTIFICADO_ACTUALIZACION_MATRICULA',
        display: 'Certificado de actualización de matrícula de comercio',
      },
      {
        code: 'CERTIFICADO_REGISTRO_COMERCIO',
        display: 'Certificado de registro de comercio',
      },
      {
        code: 'PODER_REPRESENTANTE_LEGAL',
        display: 'Poder del representante legal',
      },
      { code: 'PODER_ESPECIAL', display: 'Poder especial' },
      {
        code: 'INSCRIPCION_PODER_SEPREC',
        display: 'Inscripción del poder en el registro de comercio',
      },
      {
        code: 'CI_REPRESENTANTE_LEGAL',
        display: 'Cédula de identidad del representante legal',
      },
      {
        code: 'CI_SOCIOS',
        display: 'Cédula de identidad de socios o accionistas',
      },
      {
        code: 'ACTA_NOMBRAMIENTO',
        display: 'Acta de nombramiento de autoridades',
      },
      {
        code: 'CERTIFICADO_ANTECEDENTES_REJAP',
        display: 'Certificado de antecedentes penales (REJAP)',
      },
      { code: 'NIT_EXHIBICION', display: 'NIT (exhibición)' },
      {
        code: 'CERTIFICADO_INSCRIPCION_NIT',
        display:
          'Certificado de inscripción al padrón nacional de contribuyentes',
      },
      {
        code: 'AUTORIZACION_FACTURACION',
        display: 'Autorización de facturación electrónica o en línea',
      },
      {
        code: 'CERTIFICADO_NO_ADEUDO_TRIBUTARIO',
        display: 'Certificado de no adeudo tributario',
      },
      {
        code: 'CERTIFICADO_SOLVENCIA_FISCAL',
        display:
          'Certificado de información sobre solvencia con el fisco (CISF)',
      },
      {
        code: 'DECLARACIONES_JURADAS_IMPUESTOS',
        display: 'Declaraciones juradas de impuestos',
      },
      {
        code: 'LICENCIA_FUNCIONAMIENTO',
        display: 'Licencia de funcionamiento',
      },
      {
        code: 'PADRON_MUNICIPAL',
        display:
          'Padrón municipal de contribuyentes (patente de actividad económica)',
      },
      { code: 'CERTIFICADO_USO_SUELO', display: 'Certificado de uso de suelo' },
      { code: 'PLANOS_APROBADOS', display: 'Planos arquitectónicos aprobados' },
      {
        code: 'PLANO_DISTRIBUCION_AMBIENTES',
        display: 'Plano de distribución de ambientes',
      },
      { code: 'CROQUIS_UBICACION', display: 'Croquis de ubicación' },
      { code: 'CONTRATO_ALQUILER', display: 'Contrato de alquiler' },
      { code: 'CONTRATO_ANTICRETICO', display: 'Contrato de anticrético' },
      {
        code: 'TITULO_PROPIEDAD_INMUEBLE',
        display: 'Título de propiedad del inmueble (folio real)',
      },
      {
        code: 'FACTURA_SERVICIOS_BASICOS',
        display: 'Factura de servicios básicos',
      },
      {
        code: 'FOTOGRAFIAS_INFRAESTRUCTURA',
        display: 'Fotografías de la infraestructura',
      },
      {
        code: 'CERTIFICADO_BOMBEROS',
        display: 'Certificado de seguridad contra incendios (bomberos)',
      },
      {
        code: 'PLAN_EMERGENCIA_EVACUACION',
        display: 'Plan de emergencia y evacuación',
      },
      {
        code: 'PLAN_GESTION_RIESGOS',
        display: 'Plan de gestión de riesgos y contingencias',
      },
      { code: 'LICENCIA_AMBIENTAL', display: 'Licencia ambiental' },
      {
        code: 'CERTIFICADO_FUMIGACION',
        display: 'Certificado de fumigación y control de plagas',
      },
      {
        code: 'CERTIFICADO_LIMPIEZA_TANQUES',
        display: 'Certificado de limpieza y desinfección de tanques de agua',
      },
      { code: 'CERTIFICADO_SEDES', display: 'Certificado del SEDES' },
      {
        code: 'RESOLUCION_APERTURA_SEDES',
        display: 'Resolución de apertura y funcionamiento del SEDES',
      },
      {
        code: 'RENOVACION_FUNCIONAMIENTO_SEDES',
        display: 'Renovación de funcionamiento del SEDES',
      },
      {
        code: 'HABILITACION_MINISTERIO_SALUD',
        display:
          'Habilitación del establecimiento de salud (Ministerio de Salud)',
      },
      {
        code: 'ACREDITACION_ESTABLECIMIENTO_SALUD',
        display: 'Acreditación de calidad del establecimiento de salud',
      },
      {
        code: 'CATEGORIZACION_ESTABLECIMIENTO',
        display:
          'Resolución de nivel de atención y categorización del establecimiento',
      },
      {
        code: 'CODIGO_ESTABLECIMIENTO_SNIS',
        display: 'Código de establecimiento de salud (SNIS)',
      },
      { code: 'CARTERA_SERVICIOS', display: 'Cartera de servicios' },
      {
        code: 'INVENTARIO_EQUIPAMIENTO',
        display: 'Inventario de equipamiento médico',
      },
      { code: 'REGLAMENTO_INTERNO', display: 'Reglamento interno' },
      {
        code: 'MANUAL_ORGANIZACION_FUNCIONES',
        display: 'Manual de organización y funciones',
      },
      {
        code: 'MANUAL_PROCEDIMIENTOS',
        display: 'Manual de procedimientos y protocolos clínicos',
      },
      { code: 'ROL_TURNOS', display: 'Rol de turnos del personal' },
      { code: 'NOMINA_PERSONAL', display: 'Nómina del personal de salud' },
      {
        code: 'NOMBRAMIENTO_DIRECTOR_MEDICO',
        display: 'Nombramiento del director médico o técnico',
      },
      { code: 'PLAN_BIOSEGURIDAD', display: 'Plan y plano de bioseguridad' },
      {
        code: 'PLAN_RESIDUOS_HOSPITALARIOS',
        display: 'Plan de manejo de residuos sólidos hospitalarios',
      },
      {
        code: 'CONTRATO_RECOLECCION_RESIDUOS',
        display: 'Contrato de recolección de residuos hospitalarios',
      },
      {
        code: 'CARNET_SANITARIO_PERSONAL',
        display: 'Carnet sanitario del personal',
      },
      {
        code: 'CERTIFICADO_VACUNACION_PERSONAL',
        display: 'Certificado de vacunación del personal',
      },
      {
        code: 'CONVENIO_REFERENCIA',
        display: 'Convenio de referencia y contrarreferencia',
      },
      {
        code: 'CONVENIO_SUS',
        display: 'Convenio de prestación de servicios del SUS',
      },
      {
        code: 'CONVENIO_SEGURIDAD_SOCIAL',
        display:
          'Convenio con ente gestor de la seguridad social de corto plazo',
      },
      {
        code: 'REGISTRO_AGEMED_FARMACIA',
        display: 'Registro de farmacia ante la AGEMED',
      },
      {
        code: 'AUTORIZACION_AGEMED_IMPORTADORA',
        display: 'Autorización de la AGEMED para importadora o distribuidora',
      },
      {
        code: 'REGISTRO_SANITARIO_PRODUCTO',
        display: 'Registro sanitario de producto',
      },
      {
        code: 'CONTRATO_REGENTE_FARMACEUTICO',
        display: 'Contrato o designación del regente farmacéutico',
      },
      {
        code: 'LICENCIA_SUSTANCIAS_CONTROLADAS',
        display: 'Licencia para manejo de estupefacientes y psicotrópicos',
      },
      {
        code: 'LIBRO_CONTROL_PSICOTROPICOS',
        display: 'Libro de control de estupefacientes y psicotrópicos',
      },
      { code: 'REGISTRO_SENASAG', display: 'Registro sanitario del SENASAG' },
      {
        code: 'CERTIFICADO_BUENAS_PRACTICAS_ALMACENAMIENTO',
        display: 'Certificado de buenas prácticas de almacenamiento',
      },
      {
        code: 'CERTIFICADO_BUENAS_PRACTICAS_DISPENSACION',
        display: 'Certificado de buenas prácticas de dispensación',
      },
      {
        code: 'CERTIFICADO_BUENAS_PRACTICAS_MANUFACTURA',
        display: 'Certificado de buenas prácticas de manufactura',
      },
      {
        code: 'CERTIFICADO_BUENAS_PRACTICAS_LABORATORIO',
        display: 'Certificado de buenas prácticas de laboratorio',
      },
      {
        code: 'CONTROL_CALIDAD_EXTERNO_LABORATORIO',
        display:
          'Certificado de control de calidad externo de laboratorio (INLASA)',
      },
      {
        code: 'ACREDITACION_ISO_15189',
        display: 'Acreditación ISO 15189 de laboratorio clínico',
      },
      {
        code: 'ACREDITACION_ISO_17025',
        display: 'Acreditación ISO 17025 de laboratorio de ensayo',
      },
      {
        code: 'CERTIFICADO_RADIOPROTECCION',
        display: 'Certificado de radioprotección',
      },
      {
        code: 'LICENCIA_OPERACION_RAYOS_X',
        display:
          'Licencia de operación de equipos generadores de radiación ionizante',
      },
      {
        code: 'LICENCIA_PERSONAL_OCUPACIONALMENTE_EXPUESTO',
        display: 'Licencia individual del personal ocupacionalmente expuesto',
      },
      {
        code: 'INFORME_DOSIMETRIA_PERSONAL',
        display: 'Informe de dosimetría personal',
      },
      {
        code: 'PLAN_PROTECCION_RADIOLOGICA',
        display: 'Plan de protección radiológica',
      },
      {
        code: 'CERTIFICADO_BLINDAJE',
        display: 'Certificado de cálculo y verificación de blindaje',
      },
      {
        code: 'CERTIFICADO_CALIBRACION_EQUIPOS',
        display: 'Certificado de calibración de equipos',
      },
      {
        code: 'CONTRATO_MANTENIMIENTO_EQUIPOS',
        display: 'Contrato de mantenimiento preventivo de equipos',
      },
      {
        code: 'MATRICULA_PROFESIONAL',
        display: 'Matrícula profesional del Ministerio de Salud',
      },
      {
        code: 'TITULO_PROVISION_NACIONAL',
        display: 'Título en provisión nacional',
      },
      { code: 'DIPLOMA_ACADEMICO', display: 'Diploma académico' },
      {
        code: 'TITULO_ESPECIALIDAD',
        display: 'Título o certificado de especialidad',
      },
      {
        code: 'REVALIDA_TITULO_EXTRANJERO',
        display: 'Reválida de título obtenido en el extranjero',
      },
      {
        code: 'CERTIFICADO_COLEGIO_MEDICO',
        display: 'Certificado de afiliación al Colegio Médico',
      },
      {
        code: 'CERTIFICADO_COLEGIO_BIOQUIMICA',
        display:
          'Certificado de afiliación al Colegio de Bioquímica y Farmacia',
      },
      {
        code: 'CERTIFICADO_COLEGIO_ODONTOLOGOS',
        display: 'Certificado de afiliación al Colegio de Odontólogos',
      },
      {
        code: 'CERTIFICADO_COLEGIO_ENFERMERAS',
        display: 'Certificado de afiliación al Colegio de Enfermeras',
      },
      {
        code: 'CERTIFICADO_COLEGIO_PROFESIONAL',
        display: 'Certificado de afiliación a otro colegio profesional',
      },
      {
        code: 'CERTIFICADO_RESIDENCIA_MEDICA',
        display: 'Certificado de residencia médica',
      },
      {
        code: 'REGISTRO_OBLIGATORIO_EMPLEADORES',
        display:
          'Registro obligatorio de empleadores (ROE) del Ministerio de Trabajo',
      },
      {
        code: 'REGLAMENTO_INTERNO_TRABAJO',
        display: 'Reglamento interno de trabajo aprobado',
      },
      {
        code: 'INSCRIPCION_ENTE_GESTOR_SALUD',
        display: 'Inscripción patronal en el ente gestor de salud',
      },
      {
        code: 'INSCRIPCION_GESTORA',
        display:
          'Inscripción en la Gestora Pública de la Seguridad Social de Largo Plazo',
      },
      {
        code: 'CERTIFICADO_NO_ADEUDO_SEGURIDAD_SOCIAL',
        display: 'Certificado de no adeudo a la seguridad social',
      },
      {
        code: 'PROGRAMA_SEGURIDAD_SALUD_OCUPACIONAL',
        display: 'Programa de seguridad y salud en el trabajo',
      },
      {
        code: 'POLIZA_RESPONSABILIDAD_CIVIL',
        display: 'Póliza de seguro de responsabilidad civil profesional',
      },
      {
        code: 'POLIZA_SEGURO_INMUEBLE',
        display: 'Póliza de seguro contra incendio y aliados',
      },
      {
        code: 'POLIZA_SEGURO_EQUIPOS',
        display: 'Póliza de seguro de equipos médicos',
      },
      {
        code: 'AUTORIZACION_APS',
        display: 'Resolución de autorización de la APS',
      },
      {
        code: 'LICENCIA_ASFI',
        display: 'Licencia de funcionamiento de la ASFI',
      },
      {
        code: 'CERTIFICADO_CUENTA_BANCARIA',
        display: 'Certificado de cuenta bancaria',
      },
      { code: 'BOLETA_GARANTIA', display: 'Boleta de garantía' },
      {
        code: 'REGISTRO_PROVEEDOR_ESTADO',
        display: 'Registro único de proveedores del Estado (RUPE)',
      },
      {
        code: 'REGISTRO_MARCA_SENAPI',
        display: 'Registro de marca ante el SENAPI',
      },
      {
        code: 'CERTIFICADO_FIRMA_DIGITAL',
        display: 'Certificado de firma digital (ADSIB)',
      },
      { code: 'DECLARACION_JURADA', display: 'Declaración jurada' },
      {
        code: 'CARTA_SOLICITUD_AFILIACION',
        display: 'Carta de solicitud de afiliación',
      },
      { code: OTHER_CODE, display: 'Otro' },
    ],
  },
  {
    code: AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority,
    name: 'Autoridad emisora',
    description:
      'Organismo que emite el documento de afiliación ' +
      '(`tenant_affiliation_documents.issuing_authority_concept_id`).',
    members: [
      { code: 'SEPREC', display: 'SEPREC' },
      {
        code: 'FUNDEMPRESA',
        display: 'FUNDEMPRESA (registro de comercio hasta 2022)',
      },
      { code: 'REGISTRO_COMERCIO', display: 'Registro de Comercio' },
      { code: 'NOTARIA', display: 'Notaría' },
      {
        code: 'DIRECCION_NOTARIADO',
        display: 'Dirección del Notariado Plurinacional (DIRNOPLU)',
      },
      { code: 'DERECHOS_REALES', display: 'Derechos Reales' },
      {
        code: 'CONSEJO_MAGISTRATURA',
        display: 'Consejo de la Magistratura (REJAP)',
      },
      {
        code: 'MINISTERIO_PRESIDENCIA',
        display: 'Ministerio de la Presidencia (personalidad jurídica)',
      },
      {
        code: 'GOBIERNO_DEPARTAMENTAL',
        display: 'Gobierno autónomo departamental',
      },
      {
        code: 'VIPFE',
        display:
          'VIPFE — Viceministerio de Inversión Pública y Financiamiento Externo',
      },
      {
        code: 'AFCOOP',
        display:
          'AFCOOP — Autoridad de Fiscalización y Control de Cooperativas',
      },
      {
        code: 'CANCILLERIA',
        display:
          'Ministerio de Relaciones Exteriores (legalización y apostilla)',
      },
      { code: 'CONSULADO', display: 'Consulado' },
      { code: 'SIAT', display: 'SIAT' },
      { code: 'SIN', display: 'Servicio de Impuestos Nacionales (SIN)' },
      { code: 'CONTRALORIA', display: 'Contraloría General del Estado' },
      { code: 'SEGIP', display: 'SEGIP' },
      { code: 'SERECI', display: 'SERECI — Servicio de Registro Cívico' },
      { code: 'DIGEMIG', display: 'Dirección General de Migración' },
      { code: 'GOBIERNO_MUNICIPAL', display: 'Gobierno municipal' },
      { code: 'GAM_LA_PAZ', display: 'Gobierno Autónomo Municipal de La Paz' },
      {
        code: 'GAM_EL_ALTO',
        display: 'Gobierno Autónomo Municipal de El Alto',
      },
      {
        code: 'GAM_SANTA_CRUZ',
        display: 'Gobierno Autónomo Municipal de Santa Cruz de la Sierra',
      },
      {
        code: 'GAM_COCHABAMBA',
        display: 'Gobierno Autónomo Municipal de Cochabamba',
      },
      { code: 'GAM_SUCRE', display: 'Gobierno Autónomo Municipal de Sucre' },
      { code: 'GAM_ORURO', display: 'Gobierno Autónomo Municipal de Oruro' },
      { code: 'GAM_POTOSI', display: 'Gobierno Autónomo Municipal de Potosí' },
      { code: 'GAM_TARIJA', display: 'Gobierno Autónomo Municipal de Tarija' },
      {
        code: 'GAM_TRINIDAD',
        display: 'Gobierno Autónomo Municipal de Trinidad',
      },
      { code: 'GAM_COBIJA', display: 'Gobierno Autónomo Municipal de Cobija' },
      {
        code: 'BOMBEROS',
        display: 'Dirección de Bomberos de la Policía Boliviana',
      },
      {
        code: 'AUTORIDAD_AMBIENTAL',
        display: 'Autoridad ambiental competente',
      },
      { code: 'EMPRESA_ASEO_MUNICIPAL', display: 'Empresa municipal de aseo' },
      { code: 'SEDES', display: 'SEDES' },
      { code: 'SEDES_CHUQUISACA', display: 'SEDES Chuquisaca' },
      { code: 'SEDES_LA_PAZ', display: 'SEDES La Paz' },
      { code: 'SEDES_COCHABAMBA', display: 'SEDES Cochabamba' },
      { code: 'SEDES_ORURO', display: 'SEDES Oruro' },
      { code: 'SEDES_POTOSI', display: 'SEDES Potosí' },
      { code: 'SEDES_TARIJA', display: 'SEDES Tarija' },
      { code: 'SEDES_SANTA_CRUZ', display: 'SEDES Santa Cruz' },
      { code: 'SEDES_BENI', display: 'SEDES Beni' },
      { code: 'SEDES_PANDO', display: 'SEDES Pando' },
      { code: 'MINISTERIO_SALUD', display: 'Ministerio de Salud y Deportes' },
      {
        code: 'AGEMED',
        display:
          'AGEMED — Agencia Estatal de Medicamentos y Tecnologías en Salud',
      },
      {
        code: 'ASUSS',
        display:
          'ASUSS — Autoridad de Supervisión de la Seguridad Social de Corto Plazo',
      },
      {
        code: 'INLASA',
        display: 'INLASA — Instituto Nacional de Laboratorios de Salud',
      },
      {
        code: 'SENASAG',
        display:
          'SENASAG — Servicio Nacional de Sanidad Agropecuaria e Inocuidad Alimentaria',
      },
      { code: 'DGSC', display: 'Dirección General de Sustancias Controladas' },
      {
        code: 'ENTE_GESTOR_SALUD',
        display: 'Ente gestor de la seguridad social de corto plazo',
      },
      { code: 'CAJA_NACIONAL_SALUD', display: 'Caja Nacional de Salud' },
      {
        code: 'IBMETRO',
        display: 'IBMETRO — Instituto Boliviano de Metrología',
      },
      {
        code: 'DTA_IBMETRO',
        display: 'Dirección Técnica de Acreditación del IBMETRO',
      },
      {
        code: 'IBTEN',
        display: 'IBTEN — Instituto Boliviano de Ciencia y Tecnología Nuclear',
      },
      {
        code: 'APS',
        display:
          'APS — Autoridad de Fiscalización y Control de Pensiones y Seguros',
      },
      {
        code: 'ASFI',
        display: 'ASFI — Autoridad de Supervisión del Sistema Financiero',
      },
      {
        code: 'GESTORA',
        display: 'Gestora Pública de la Seguridad Social de Largo Plazo',
      },
      { code: 'ENTIDAD_BANCARIA', display: 'Entidad bancaria' },
      { code: 'ENTIDAD_ASEGURADORA', display: 'Entidad aseguradora' },
      {
        code: 'SENAPI',
        display: 'SENAPI — Servicio Nacional de Propiedad Intelectual',
      },
      {
        code: 'ADSIB',
        display:
          'ADSIB — Agencia de Gobierno Electrónico y Tecnologías de Información',
      },
      {
        code: 'SICOES',
        display: 'SICOES — Sistema de Contrataciones Estatales',
      },
      {
        code: 'MINISTERIO_TRABAJO',
        display: 'Ministerio de Trabajo, Empleo y Previsión Social',
      },
      { code: 'MINISTERIO_EDUCACION', display: 'Ministerio de Educación' },
      { code: 'UNIVERSIDAD_PUBLICA', display: 'Universidad pública' },
      { code: 'UNIVERSIDAD_PRIVADA', display: 'Universidad privada' },
      { code: 'UNIVERSIDAD_EXTRANJERA', display: 'Universidad extranjera' },
      {
        code: 'CEUB',
        display: 'CEUB — Comité Ejecutivo de la Universidad Boliviana',
      },
      { code: 'COLEGIO_MEDICO', display: 'Colegio Médico de Bolivia' },
      {
        code: 'COLEGIO_MEDICO_DEPARTAMENTAL',
        display: 'Colegio Médico departamental',
      },
      {
        code: 'COLEGIO_BIOQUIMICA',
        display: 'Colegio de Bioquímica y Farmacia de Bolivia',
      },
      {
        code: 'COLEGIO_ODONTOLOGOS',
        display: 'Colegio de Odontólogos de Bolivia',
      },
      {
        code: 'COLEGIO_ENFERMERAS',
        display: 'Colegio de Enfermeras de Bolivia',
      },
      { code: 'COLEGIO_PROFESIONAL', display: 'Otro colegio profesional' },
      { code: 'CAMARA_COMERCIO', display: 'Cámara de comercio o de industria' },
      { code: OTHER_CODE, display: 'Otro' },
    ],
  },
  {
    code: AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
    name: 'Estado de verificación del documento de afiliación',
    description:
      'Estado de revisión de un documento de afiliación ' +
      '(`tenant_affiliation_documents.verification_status_concept_id`).',
    members: [
      { code: 'PENDIENTE', display: 'Pendiente' },
      { code: 'EN_REVISION', display: 'En revisión' },
      {
        code: 'EN_VERIFICACION_EXTERNA',
        display: 'En verificación ante la autoridad emisora',
      },
      { code: 'OBSERVADO', display: 'Observado' },
      { code: 'SUBSANADO', display: 'Subsanado' },
      { code: 'VERIFICADO', display: 'Verificado' },
      {
        code: 'VERIFICADO_CON_OBSERVACIONES',
        display: 'Verificado con observaciones',
      },
      { code: 'POR_VENCER', display: 'Próximo a vencer' },
      { code: 'VENCIDO', display: 'Vencido' },
      { code: 'RECHAZADO', display: 'Rechazado' },
      { code: 'ILEGIBLE', display: 'Ilegible' },
      { code: 'INCOMPLETO', display: 'Incompleto' },
      { code: 'SUSPENDIDO', display: 'Suspendido' },
      { code: 'REVOCADO', display: 'Revocado por la autoridad emisora' },
      { code: 'ANULADO', display: 'Anulado' },
      {
        code: 'REEMPLAZADO',
        display: 'Reemplazado por una versión más reciente',
      },
    ],
  },
  {
    code: LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
    name: 'Rol del representante legal',
    description:
      'Cargo con el que una persona representa o gerencia la organización ' +
      '(`tenant_legal_representatives.representative_role_concept_id`).',
    members: [
      { code: 'REPRESENTANTE_LEGAL', display: 'Representante legal' },
      { code: 'APODERADO', display: 'Apoderado' },
      { code: 'APODERADO_ESPECIAL', display: 'Apoderado especial' },
      { code: 'PROPIETARIO', display: 'Propietario' },
      { code: 'SOCIO_GERENTE', display: 'Socio gerente' },
      { code: 'SOCIO_ADMINISTRADOR', display: 'Socio administrador' },
      { code: 'ADMINISTRADOR_UNICO', display: 'Administrador único' },
      {
        code: 'REPRESENTANTE_SUCURSAL_EXTRANJERA',
        display: 'Representante permanente de sucursal extranjera',
      },
      { code: 'LIQUIDADOR', display: 'Liquidador' },
      { code: 'INTERVENTOR', display: 'Interventor' },
      { code: 'PRESIDENTE_DIRECTORIO', display: 'Presidente del directorio' },
      {
        code: 'VICEPRESIDENTE_DIRECTORIO',
        display: 'Vicepresidente del directorio',
      },
      { code: 'SECRETARIO_DIRECTORIO', display: 'Secretario del directorio' },
      { code: 'DIRECTOR', display: 'Director (miembro del directorio)' },
      { code: 'SINDICO', display: 'Síndico' },
      {
        code: 'PRESIDENTE_CONSEJO_ADMINISTRACION',
        display: 'Presidente del consejo de administración',
      },
      {
        code: 'PRESIDENTE_CONSEJO_VIGILANCIA',
        display: 'Presidente del consejo de vigilancia',
      },
      { code: 'PRESIDENTE', display: 'Presidente (asociación o fundación)' },
      { code: 'DIRECTOR_EJECUTIVO', display: 'Director ejecutivo' },
      {
        code: 'MAXIMA_AUTORIDAD_EJECUTIVA',
        display: 'Máxima autoridad ejecutiva (MAE)',
      },
      { code: 'RECTOR', display: 'Rector' },
      { code: 'DECANO', display: 'Decano' },
      { code: 'GERENTE_GENERAL', display: 'Gerente general' },
      {
        code: 'GERENTE_ADMINISTRATIVO_FINANCIERO',
        display: 'Gerente administrativo y financiero',
      },
      { code: 'GERENTE_COMERCIAL', display: 'Gerente comercial' },
      { code: 'GERENTE_MARKETING', display: 'Gerente de marketing' },
      { code: 'GERENTE_OPERACIONES', display: 'Gerente de operaciones' },
      {
        code: 'GERENTE_RECURSOS_HUMANOS',
        display: 'Gerente de recursos humanos',
      },
      {
        code: 'GERENTE_TECNOLOGIA',
        display: 'Gerente de tecnología y sistemas',
      },
      { code: 'GERENTE_CALIDAD', display: 'Gerente de calidad' },
      { code: 'GERENTE_REGIONAL', display: 'Gerente regional' },
      { code: 'GERENTE_SUCURSAL', display: 'Gerente de sucursal' },
      { code: 'ADMINISTRADOR', display: 'Administrador' },
      { code: 'CONTADOR_GENERAL', display: 'Contador general' },
      { code: 'ASESOR_LEGAL', display: 'Asesor legal' },
      { code: 'OFICIAL_CUMPLIMIENTO', display: 'Oficial de cumplimiento' },
      {
        code: 'RESPONSABLE_PROTECCION_DATOS',
        display: 'Responsable de protección de datos personales',
      },
      { code: 'DIRECTOR_MEDICO', display: 'Director médico' },
      { code: 'SUBDIRECTOR_MEDICO', display: 'Subdirector médico' },
      { code: 'DIRECTOR_TECNICO', display: 'Director técnico' },
      { code: 'JEFE_MEDICO', display: 'Jefe médico' },
      { code: 'JEFE_ENFERMERIA', display: 'Jefe de enfermería' },
      { code: 'REGENTE_FARMACEUTICO', display: 'Regente farmacéutico' },
      {
        code: 'RESPONSABLE_LABORATORIO',
        display: 'Responsable técnico de laboratorio',
      },
      {
        code: 'RESPONSABLE_PROTECCION_RADIOLOGICA',
        display: 'Encargado de protección radiológica',
      },
      {
        code: 'RESPONSABLE_BIOSEGURIDAD',
        display: 'Responsable de bioseguridad',
      },
      { code: OTHER_CODE, display: 'Otro' },
    ],
  },
];

/** Id determinista del conjunto de valores. */
export const affiliationSetId = (set: AffiliationCatalogSet): string =>
  valueSetId(set.code);

/** Id determinista de la versión única del conjunto. */
export const affiliationSetVersionId = (set: AffiliationCatalogSet): string =>
  valueSetVersionId(set.code);

/** URL canónica FHIR del conjunto. */
export const affiliationSetCanonicalUrl = (
  set: AffiliationCatalogSet,
): string => valueSetCanonicalUrl(set.code);

/** Id determinista de la versión del sistema de códigos que aloja los conceptos del conjunto. */
export const affiliationCodeSystemVersionId = (
  set: AffiliationCatalogSet,
): string =>
  deterministicId(
    `seed:code-system-version:${SEED.codeSystemInternalCode}:${set.code}`,
  );

/** Etiqueta de esa versión, `1.0.0-vs_<nombre>`, la misma que usa el paquete del modelo. */
export const affiliationCodeSystemVersionLabel = (
  set: AffiliationCatalogSet,
): string => `${AFFILIATION_CATALOG_VERSION}-${set.code.toLowerCase()}`;

/** Id determinista del concepto de un miembro. */
export const affiliationConceptId = (
  set: AffiliationCatalogSet,
  code: string,
): string => deterministicId(`affiliation:${set.code}:concept:${code}`);

/** Id determinista de la membresía `(conjunto, concepto)`. */
export const affiliationMemberId = (
  set: AffiliationCatalogSet,
  code: string,
): string => valueSetMemberId(set.code, affiliationConceptId(set, code));
