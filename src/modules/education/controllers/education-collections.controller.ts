import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { EducationCollectionsService } from '../services';
import { CoursePageDto, ListCoursesQueryDto } from '../dto';

/**
 * `GET` de colección de `education` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('education-collections')
@ApiBearerAuth()
@Controller()
export class EducationCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: EducationCollectionsService) {}

  /** V47-08: listar cursos del tenant. */
  @Get('education/courses')
  @Roles('EDUCATION_ADMIN', 'COURSE_AUTHOR')
  @ApiOperation({ summary: 'Listar cursos del tenant' })
  @ApiOkResponse({ type: CoursePageDto })
  listCourses(@Query() query: ListCoursesQueryDto): Promise<CoursePageDto> {
    return this.collections.listCourses(query);
  }
}
