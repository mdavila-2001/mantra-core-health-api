import { serviceKindOf } from './service-kind';
import { SERVICE_KINDS } from './surveys-standard.catalog';

describe('serviceKindOf', () => {
  it.each([
    ['Ecografía abdominal', 'IMAGING'],
    ['RADIOGRAFÍA DE TÓRAX', 'IMAGING'],
    ['Resonancia magnética de rodilla', 'IMAGING'],
    ['Hemograma completo', 'LAB'],
    ['Análisis de orina', 'LAB'],
    ['Control de laboratorio', 'LAB'],
    ['Consulta de telemedicina', 'TELEMEDICINE'],
    ['Teleconsulta de seguimiento', 'TELEMEDICINE'],
    ['Visita médica a domicilio', 'HOME_CARE'],
    ['Atención farmacéutica', 'PHARMACY'],
    ['Sesión de fisioterapia', 'THERAPY'],
    ['Psicoterapia individual', 'THERAPY'],
    ['Apendicectomía', 'PROCEDURE'],
    ['Biopsia de piel', 'PROCEDURE'],
    ['Colonoscopía diagnóstica', 'PROCEDURE'],
    ['Consulta de medicina general', 'CONSULTATION'],
    ['Control prenatal', 'CONSULTATION'],
    ['Certificado médico', 'OTHER'],
  ])('«%s» → %s', (name, kind) => {
    expect(serviceKindOf(name)).toBe(kind);
  });

  it('sin nombre es OTHER, y siempre devuelve un tipo del catálogo', () => {
    expect(serviceKindOf(undefined)).toBe('OTHER');
    expect(serviceKindOf('')).toBe('OTHER');
    expect(SERVICE_KINDS).toContain(serviceKindOf('lo que sea'));
  });
});
