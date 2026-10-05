/**
 * Las fuentes de las fichas específicas por condición.
 *
 * Regla: sólo documentos públicos de organismos que se pueden citar, y de las
 * guías con derechos de autor (GINA, GOLD, KDIGO, EULAR, AAO, ACR) se toman
 * **categorías clínicas** —grados, estadios, clases—, que son hechos, nunca su
 * texto ni sus figuras. Cada ficha lo dice en su `note`.
 */
const LIBRE_OMS = 'CC BY-NC-SA 3.0 IGO';
const CATEGORIAS =
  'Guía de acceso público; se usan sus categorías clínicas, no su texto';

export const FUENTES = {
  NNAC_2025_MI: {
    sourceTitle:
      'Norma Nacional de Atención Clínica de Medicina Interna (2025)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://www.minsalud.gob.bo/component/jdownloads/send/67-nnac/963-norma-nacional-de-atencion-clinica-de-medicina-interna?Itemid=465',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  NNAC_2025_TI: {
    sourceTitle:
      'Norma Nacional de Atención Clínica de Terapia Intensiva (2025)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://www.minsalud.gob.bo/component/jdownloads/send/67-nnac/964-norma-nacional-de-atencion-clinica-de-terapia-intensiva?Itemid=465',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  NNAC_2025_TRA: {
    sourceTitle: 'Norma Nacional de Atención Clínica de Traumatología (2025)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://www.minsalud.gob.bo/component/jdownloads/send/67-nnac/965-norma-nacional-de-atencion-clinica-de-traumatologia?Itemid=465',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  NNAC_2025_URG: {
    sourceTitle:
      'Norma Nacional de Atención Clínica de Urgencias y Emergencias (2025)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://www.minsalud.gob.bo/component/jdownloads/send/67-nnac/966-norma-nacional-de-atencion-clinica-de-urgencias-y-emergencias?Itemid=465',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  NNAC_2025_NEU: {
    sourceTitle: 'Norma Nacional de Atención Clínica de Neurología (2025)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://www.minsalud.gob.bo/component/jdownloads/send/67-nnac/967-norma-nacional-de-atencion-clinica-de-neurologia?Itemid=465',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  NNAC_2025_PED: {
    sourceTitle: 'Norma Nacional de Atención Clínica de Pediatría (2025)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://www.minsalud.gob.bo/component/jdownloads/send/67-nnac/968-norma-nacional-de-atencion-clinica-de-pediatria?Itemid=465',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  NNAC_BOLIVIA: {
    sourceTitle:
      'Normas Nacionales de Atención Clínica (Serie Documentos Técnico-Normativos)',
    organization:
      'Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia',
    url: 'https://platform.who.int/docs/default-source/mca-documents/policy-documents/operational-guidance/BOL-AD-17-01-OPERATIONAL-GUIDANCE-2012-esp-Normas-Nacionales-de-Atencion-Clinica.pdf',
    license: 'Documento técnico-normativo estatal de acceso público',
  },
  MINSA_NT022: {
    sourceTitle:
      'Norma Técnica de Salud para la Gestión de la Historia Clínica — NT N.º 022-MINSA/DGSP-V.02',
    organization: 'Ministerio de Salud del Perú (MINSA)',
    url: 'https://bvs.minsa.gob.pe/local/dgsp/NT022hist.pdf',
    license: 'Norma técnica estatal de acceso público',
  },
  OMS_HEARTS: {
    sourceTitle:
      'HEARTS: paquete técnico para el manejo de las enfermedades cardiovasculares en la atención primaria de salud',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/hearts-technical-package',
    license: LIBRE_OMS,
  },
  OMS_HEARTS_D: {
    sourceTitle: 'HEARTS-D: diagnóstico y manejo de la diabetes tipo 2',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/who-ucn-ncd-20.1',
    license: LIBRE_OMS,
  },
  OPS_DENGUE: {
    sourceTitle:
      'Dengue: guías para la atención de enfermos en la Región de las Américas, 2.ª ed.',
    organization: 'Organización Panamericana de la Salud (OPS/OMS)',
    url: 'https://www.paho.org/es/temas/dengue',
    license: LIBRE_OMS,
  },
  OMS_MHGAP: {
    sourceTitle:
      'Guía de intervención mhGAP para los trastornos mentales, neurológicos y por consumo de sustancias, versión 2.0',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789241549790',
    license: LIBRE_OMS,
  },
  OMS_ANC: {
    sourceTitle:
      'Recomendaciones de la OMS sobre atención prenatal para una experiencia positiva del embarazo (2016)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789241549912',
    license: LIBRE_OMS,
  },
  OMS_POSTNATAL: {
    sourceTitle:
      'Recomendaciones de la OMS sobre la atención materna y neonatal para una experiencia posnatal positiva (2022)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789240045989',
    license: LIBRE_OMS,
  },
  OMS_PARTO: {
    sourceTitle:
      'Guía de cuidados durante el trabajo de parto (WHO Labour Care Guide, 2020)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789240017566',
    license: LIBRE_OMS,
  },
  OMS_MEC: {
    sourceTitle:
      'Criterios médicos de elegibilidad para el uso de anticonceptivos, 5.ª ed.',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789241549158',
    license: LIBRE_OMS,
  },
  OMS_CERVIX: {
    sourceTitle:
      'Directriz de la OMS para el tamizaje y tratamiento de lesiones precancerosas del cuello uterino (2021)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789240030824',
    license: LIBRE_OMS,
  },
  OMS_ICOPE: {
    sourceTitle:
      'Atención integrada para las personas mayores (ICOPE): guía de evaluación y planes de atención',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/WHO-FWC-ALC-19.1',
    license: LIBRE_OMS,
  },
  OMS_AIEPI: {
    sourceTitle:
      'Atención Integrada a las Enfermedades Prevalentes de la Infancia (AIEPI)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/integrated-management-of-childhood-illness',
    license: LIBRE_OMS,
  },
  OMS_TB: {
    sourceTitle:
      'Programa Mundial contra la Tuberculosis — directrices consolidadas',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/teams/global-tuberculosis-programme',
    license: LIBRE_OMS,
  },
  OMS_VIH: {
    sourceTitle: 'VIH: directrices consolidadas de la OMS',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/health-topics/hiv-aids',
    license: LIBRE_OMS,
  },
  OMS_MALARIA: {
    sourceTitle: 'Directrices de la OMS sobre la malaria',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/teams/global-malaria-programme',
    license: LIBRE_OMS,
  },
  OMS_CHAGAS: {
    sourceTitle: 'Enfermedad de Chagas (tripanosomiasis americana)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/health-topics/chagas-disease',
    license: LIBRE_OMS,
  },
  OMS_LEISH: {
    sourceTitle: 'Leishmaniasis',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/health-topics/leishmaniasis',
    license: LIBRE_OMS,
  },
  OMS_OBESIDAD: {
    sourceTitle: 'Obesidad y sobrepeso',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/health-topics/obesity',
    license: LIBRE_OMS,
  },
  OMS_DESNUTRICION: {
    sourceTitle: 'Malnutrición',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/health-topics/malnutrition',
    license: LIBRE_OMS,
  },
  OMS_EPILEPSIA: {
    sourceTitle: 'Epilepsia',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/health-topics/epilepsy',
    license: LIBRE_OMS,
  },
  OMS_VIOLENCIA: {
    sourceTitle:
      'Respuesta a la violencia de pareja y a la violencia sexual contra las mujeres: directrices clínicas (2013)',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789241548595',
    license: LIBRE_OMS,
  },
  OMS_ORAL: {
    sourceTitle: 'Oral health surveys: basic methods, 5.ª ed.',
    organization: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/publications/i/item/9789241548649',
    license: LIBRE_OMS,
  },
  NIH_NIHSS: {
    sourceTitle: 'NIH Stroke Scale',
    organization:
      'National Institute of Neurological Disorders and Stroke (NINDS/NIH)',
    url: 'https://www.ninds.nih.gov/health-information/stroke/assess-and-treat/nih-stroke-scale',
    license: 'Dominio público (Gobierno de los EE. UU.)',
  },
  NCI_CTCAE: {
    sourceTitle: 'Common Terminology Criteria for Adverse Events (CTCAE)',
    organization: 'National Cancer Institute (NCI/NIH)',
    url: 'https://ctep.cancer.gov/protocoldevelopment/electronic_applications/ctc.htm',
    license: 'Dominio público (Gobierno de los EE. UU.)',
  },
  ECOG: {
    sourceTitle: 'ECOG Performance Status Scale',
    organization: 'ECOG-ACRIN Cancer Research Group',
    url: 'https://ecog-acrin.org/resources/ecog-performance-status/',
    license: 'De uso libre, citando la fuente',
  },
  KDIGO: {
    sourceTitle: 'Guías de práctica clínica KDIGO',
    organization: 'Kidney Disease: Improving Global Outcomes (KDIGO)',
    url: 'https://kdigo.org/guidelines/',
    license: CATEGORIAS,
  },
  GINA: {
    sourceTitle: 'Global Strategy for Asthma Management and Prevention',
    organization: 'Global Initiative for Asthma (GINA)',
    url: 'https://ginasthma.org/reports/',
    license: CATEGORIAS,
  },
  GOLD: {
    sourceTitle:
      'Global Strategy for the Diagnosis, Management and Prevention of COPD',
    organization:
      'Global Initiative for Chronic Obstructive Lung Disease (GOLD)',
    url: 'https://goldcopd.org/',
    license: CATEGORIAS,
  },
  EULAR: {
    sourceTitle: 'Recomendaciones EULAR',
    organization: 'European Alliance of Associations for Rheumatology (EULAR)',
    url: 'https://www.eular.org/recommendations',
    license: CATEGORIAS,
  },
  AAO: {
    sourceTitle: 'Preferred Practice Pattern Guidelines',
    organization: 'American Academy of Ophthalmology (AAO)',
    url: 'https://www.aao.org/education/preferred-practice-pattern',
    license: CATEGORIAS,
  },
  ACR_BIRADS: {
    sourceTitle: 'Breast Imaging Reporting and Data System (BI-RADS)',
    organization: 'American College of Radiology (ACR)',
    url: 'https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/BI-RADS',
    license:
      'Sólo las categorías 0 a 6, que son de uso clínico universal; no se reproduce el atlas',
  },
};
