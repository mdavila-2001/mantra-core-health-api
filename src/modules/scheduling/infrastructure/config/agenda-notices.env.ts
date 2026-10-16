/**
 * Base pública del front, para convertir la `route` de un aviso de agenda en
 * un enlace absoluto dentro del correo (P8/TAREA-15, AC-15-1/-3/-4).
 *
 * ## Por qué el correo necesita esto y el in-app no
 *
 * El in-app vive dentro de la misma app: `payload.route` alcanza, porque el
 * front que lo lee ya conoce su propio dominio. El correo lo abre un cliente
 * ajeno (Gmail, Outlook) que no tiene ese contexto — sin una base absoluta,
 * «hacé click para responder» no tiene a dónde apuntar.
 *
 * ## Por qué no hay token de acción (P-15-2, decidido)
 *
 * El enlace lleva a la pantalla de la app donde la sesión ya autenticada
 * decide; no muta nada por sí mismo. Es la opción que la propia ficha marca
 * como «mucho más barata y mucho más segura» frente a inventar un token de
 * propósito limitado sin sesión para una acción clínica. Ver
 * `messaging-agenda-notice.adapter.ts`.
 */
export function loadAgendaNoticesEnv(): { webAppBaseUrl: string } {
  const raw = process.env.WEB_APP_BASE_URL ?? 'http://localhost:4200';
  // Sin barra final: `agenda-notices.ts` siempre da la ruta con su propia
  // barra inicial (`/schedule?vista=citas`), y concatenar dos rompería el path.
  return { webAppBaseUrl: raw.replace(/\/+$/, '') };
}
