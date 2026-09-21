import {
  contentHash,
  fillerReason,
  mergeContent,
  misplacedFields,
  reviewViolations,
  submissionViolations,
  type ReviewContext,
} from './annotation.policy';
import { EMPTY_CONTENT, type AnnotationContent } from './catalog.model';

const RATIONALE =
  'Sin esta tabla no se puede reconstruir qué médico atendió cada cita cuando el paciente reclama un reembolso.';

function content(
  overrides: Partial<AnnotationContent> = {},
): AnnotationContent {
  return { ...EMPTY_CONTENT, ...overrides };
}

describe('annotation.policy', () => {
  describe('mergeContent', () => {
    it('aplica el parche sin mutar el contenido vigente', () => {
      const current = content({
        purpose: 'Propósito anterior de la tabla de citas',
      });
      const next = mergeContent(current, { businessOwner: 'Equipo Agenda' });
      expect(current.businessOwner).toBeNull();
      expect(next).toMatchObject({
        purpose: 'Propósito anterior de la tabla de citas',
        businessOwner: 'Equipo Agenda',
      });
    });

    it('trata la cadena vacía como ausencia y null como borrado', () => {
      const current = content({ purpose: 'algo', definition: 'otra cosa' });
      const next = mergeContent(current, { purpose: '   ', definition: null });
      expect(next.purpose).toBeNull();
      expect(next.definition).toBeNull();
    });

    it('deduplica productores y consumidores', () => {
      const next = mergeContent(null, {
        consumers: [' agenda ', 'agenda', '', 'billing'],
      });
      expect(next.consumers).toEqual(['agenda', 'billing']);
    });
  });

  describe('misplacedFields', () => {
    it('rechaza campos de columna en una tabla y viceversa', () => {
      expect(misplacedFields('OBJECT', { unit: 'kg' })).toHaveLength(1);
      expect(
        misplacedFields('COLUMN', { rowGrain: 'una fila por cita' }),
      ).toHaveLength(1);
      expect(misplacedFields('COLUMN', { unit: 'kg' })).toHaveLength(0);
    });
  });

  describe('fillerReason', () => {
    it.each([
      ['Almacena los datos de pacientes y sus citas médicas', 'GENERIC_PHRASE'],
      ['Tabla de citas médicas del sistema de agenda', 'GENERIC_PHRASE'],
      ['Stores the data of appointments for the clinic', 'GENERIC_PHRASE'],
      ['corto', 'TOO_SHORT'],
    ])('marca "%s" como %s', (text, reason) => {
      expect(fillerReason(text, 'appointments')).toBe(reason);
    });

    it('marca la plantilla de la bóveda como relleno', () => {
      const vault =
        'Si esta tabla se eliminara, el negocio perdería el registro mismo de operación.';
      expect(fillerReason(vault, 'entity_registry')).toBe('GENERIC_PHRASE');
    });

    it('acepta una justificación que dice algo que el nombre no dice', () => {
      expect(fillerReason(RATIONALE, 'appointments')).toBeNull();
    });
  });

  describe('submissionViolations', () => {
    it('exige propósito, justificación y grano en una tabla', () => {
      const violations = submissionViolations(
        'OBJECT',
        content(),
        'appointments',
      );
      expect(violations.map((v) => v.field)).toEqual([
        'purpose',
        'existenceRationale',
        'rowGrain',
      ]);
    });

    it('acepta un campo desconocido si se declara como pregunta abierta', () => {
      const violations = submissionViolations(
        'OBJECT',
        content({
          purpose: RATIONALE,
          rowGrain: 'Una fila por cita confirmada, identificada por su id.',
          openQuestions: [
            {
              field: 'existenceRationale',
              question: '¿Qué proceso original motivó crearla?',
            },
          ],
        }),
        'appointments',
      );
      expect(violations).toEqual([]);
    });

    it('rechaza texto de relleno aunque el campo esté lleno', () => {
      const violations = submissionViolations(
        'OBJECT',
        content({
          purpose: RATIONALE,
          existenceRationale: 'Almacena los datos de las citas de la clínica',
          rowGrain: 'Una fila por cita confirmada, identificada por su id.',
        }),
        'appointments',
      );
      expect(violations).toEqual([
        expect.objectContaining({
          field: 'existenceRationale',
          reason: 'FILLER_TEXT:GENERIC_PHRASE',
        }),
      ]);
    });

    it('en una columna sólo exige la definición', () => {
      expect(submissionViolations('COLUMN', content(), 'status')).toEqual([
        expect.objectContaining({ field: 'definition' }),
      ]);
    });
  });

  describe('reviewViolations', () => {
    const base: ReviewContext = {
      status: 'NEEDS_REVIEW',
      currentRevisionNo: 2,
      expectedRevisionNo: 2,
      revisionAuthorId: 'author',
      reviewerId: 'reviewer',
      decision: 'APPROVED',
      comment: null,
      evidenceCount: 1,
    };

    it('permite aprobar con evidencia y revisor distinto', () => {
      expect(reviewViolations(base)).toEqual([]);
    });

    it('impide la autoaprobación sin importar el rol', () => {
      expect(reviewViolations({ ...base, reviewerId: 'author' })).toEqual([
        expect.objectContaining({ reason: 'SELF_REVIEW' }),
      ]);
    });

    it('no aprueba sin evidencia', () => {
      expect(reviewViolations({ ...base, evidenceCount: 0 })).toEqual([
        expect.objectContaining({ reason: 'APPROVAL_NEEDS_EVIDENCE' }),
      ]);
    });

    it('un rechazo necesita comentario', () => {
      expect(
        reviewViolations({ ...base, decision: 'REJECTED', comment: 'mal' }),
      ).toEqual([
        expect.objectContaining({ reason: 'REJECTION_NEEDS_COMMENT' }),
      ]);
    });

    it('sólo se revisa lo que está pendiente', () => {
      expect(reviewViolations({ ...base, status: 'DRAFT' })).toEqual([
        expect.objectContaining({ reason: 'NOT_PENDING_REVIEW' }),
      ]);
    });
  });

  describe('contentHash', () => {
    it('no depende del orden de las claves', () => {
      const a = content({ purpose: 'x', businessOwner: 'y' });
      const b = { ...content(), businessOwner: 'y', purpose: 'x' };
      expect(contentHash(a)).toBe(contentHash(b));
      expect(contentHash(a)).not.toBe(contentHash(content({ purpose: 'z' })));
    });
  });
});
