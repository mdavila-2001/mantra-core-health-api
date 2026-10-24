import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { EducationCollectionsController } from './education-collections.controller';

const handlers = EducationCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('EducationCollectionsController', () => {
  it('listCourses exige EDUCATION_ADMIN, COURSE_AUTHOR y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listCourses)).toEqual([
      'EDUCATION_ADMIN',
      'COURSE_AUTHOR',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCourses: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new EducationCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCourses(query)).resolves.toBe(page);
    expect(service.listCourses).toHaveBeenCalledWith(query);
  });
});
