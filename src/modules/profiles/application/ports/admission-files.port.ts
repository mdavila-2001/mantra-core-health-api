/** Los bytes de un archivo ya autorizado por la admisión. */
export interface AdmissionFileContent {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly originalName?: string;
}

/**
 * Descarga de archivos para el visor de la admisión.
 *
 * **No autoriza nada**: quien llama —`PractitionerAdmissionDocumentsService`—
 * ya comprobó que el archivo es de ESA admisión y que quien lo pide puede
 * verla. Por eso es un puerto aparte del de adjuntos.
 */
export interface AdmissionFilesPort {
  downloadAuthorized(
    fileId: string,
    operation: string,
  ): Promise<AdmissionFileContent>;
}

export const ADMISSION_FILES_PORT = Symbol('ADMISSION_FILES_PORT');
