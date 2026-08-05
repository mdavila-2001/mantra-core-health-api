import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { EducationController } from './education.controller';

const actor = { id: 'user-1', roles: ['EDUCATION_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const catalogService = {
    publishCourse: mockFn(),
    publishVersion: mockFn(),
    assignInstructor: mockFn(),
    openCohort: mockFn(),
    createAssessment: mockFn(),
    createReview: mockFn(),
  };
  const learningService = {
    enrollLearner: mockFn(),
    recordProgress: mockFn(),
    startAttempt: mockFn(),
    submitAttempt: mockFn(),
    completeEnrollment: mockFn(),
    issueCertificate: mockFn(),
    recordCmeCredit: mockFn(),
    revokeCertificate: mockFn(),
  };
  return {
    controller: new EducationController(
      catalogService as any,
      learningService as any,
    ),
    catalogService,
    learningService,
  };
}

describe('EducationController', () => {
  it('delegates course publication (UC-47-01)', async () => {
    const d = build();
    const dto = { code: 'CUR-01' } as any;
    d.catalogService.publishCourse.mockResolvedValue({ id: ID });

    await d.controller.publishCourse(dto, actor);

    expect(d.catalogService.publishCourse).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates version publication with the route id (UC-47-02)', async () => {
    const d = build();
    const dto = { changelog: 'cambios' } as any;
    d.catalogService.publishVersion.mockResolvedValue({ version: 2 });

    await d.controller.publishVersion(ID, dto, actor);

    expect(d.catalogService.publishVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates instructor assignment and cohort opening (UC-47-03, UC-47-04)', async () => {
    const d = build();
    const instructorDto = { displayName: 'Dra. Pérez', role: 'LEAD' } as any;
    const cohortDto = { code: 'C-1', deliveryMode: 'ONLINE' } as any;
    d.catalogService.assignInstructor.mockResolvedValue({ instructorId: ID });
    d.catalogService.openCohort.mockResolvedValue({ id: ID });

    await d.controller.assignInstructor(ID, instructorDto, actor);
    await d.controller.openCohort(ID, cohortDto, actor);

    expect(d.catalogService.assignInstructor).toHaveBeenCalledWith(
      ID,
      instructorDto,
      actor,
    );
    expect(d.catalogService.openCohort).toHaveBeenCalledWith(
      ID,
      cohortDto,
      actor,
    );
  });

  it('delegates enrollment (UC-47-05)', async () => {
    const d = build();
    const dto = { courseId: ID } as any;
    d.learningService.enrollLearner.mockResolvedValue({ id: ID });

    await d.controller.enrollLearner(dto, actor);

    expect(d.learningService.enrollLearner).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates progress recording (UC-47-06)', async () => {
    const d = build();
    const dto = { lessonId: ID, status: 'COMPLETED' } as any;
    d.learningService.recordProgress.mockResolvedValue({
      progressPercent: '50.00',
    });

    await d.controller.recordProgress(ID, dto, actor);

    expect(d.learningService.recordProgress).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates assessment design (UC-47-07)', async () => {
    const d = build();
    const dto = { title: 'Examen', questions: [] } as any;
    d.catalogService.createAssessment.mockResolvedValue({ id: ID });

    await d.controller.createAssessment(ID, dto, actor);

    expect(d.catalogService.createAssessment).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates attempt start and submission (UC-47-08, UC-47-09)', async () => {
    const d = build();
    const startDto = { enrollmentId: ID } as any;
    const submitDto = { responsesJson: {} } as any;
    d.learningService.startAttempt.mockResolvedValue({ id: ID });
    d.learningService.submitAttempt.mockResolvedValue({ score: '80.00' });

    await d.controller.startAttempt(ID, startDto, actor);
    await d.controller.submitAttempt(ID, submitDto, actor);

    expect(d.learningService.startAttempt).toHaveBeenCalledWith(
      ID,
      startDto,
      actor,
    );
    expect(d.learningService.submitAttempt).toHaveBeenCalledWith(
      ID,
      submitDto,
      actor,
    );
  });

  it('delegates completion without a body (UC-47-10)', async () => {
    const d = build();
    d.learningService.completeEnrollment.mockResolvedValue({ id: ID });

    await d.controller.completeEnrollment(ID, actor);

    expect(d.learningService.completeEnrollment).toHaveBeenCalledWith(
      ID,
      actor,
    );
  });

  it('delegates certificate issuance and CME credit (UC-47-11, UC-47-12)', async () => {
    const d = build();
    const certDto = {} as any;
    const cmeDto = { practitionerProfileId: ID } as any;
    d.learningService.issueCertificate.mockResolvedValue({ id: ID });
    d.learningService.recordCmeCredit.mockResolvedValue({ id: ID });

    await d.controller.issueCertificate(ID, certDto, actor);
    await d.controller.recordCmeCredit(ID, cmeDto, actor);

    expect(d.learningService.issueCertificate).toHaveBeenCalledWith(
      ID,
      certDto,
      actor,
    );
    expect(d.learningService.recordCmeCredit).toHaveBeenCalledWith(
      ID,
      cmeDto,
      actor,
    );
  });

  it('delegates review creation (UC-47-13)', async () => {
    const d = build();
    const dto = { rating: 5 } as any;
    d.catalogService.createReview.mockResolvedValue({ id: ID });

    await d.controller.createReview(ID, dto, actor);

    expect(d.catalogService.createReview).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates certificate revocation (UC-47-14)', async () => {
    const d = build();
    const dto = { reason: 'motivo' } as any;
    d.learningService.revokeCertificate.mockResolvedValue({ id: ID });

    await d.controller.revokeCertificate(ID, dto, actor);

    expect(d.learningService.revokeCertificate).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.catalogService.publishCourse.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.publishCourse({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
