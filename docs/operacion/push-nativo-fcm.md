# Push nativo de la app (FCM)

La app móvil recibe los avisos por **Firebase Cloud Messaging (FCM HTTP v1)**.
FCM entrega a Android directo y a iOS a través de APNs, con la clave de Apple
cargada en Firebase, así que la API tiene un solo emisor
(`src/modules/messaging/services/native-push.service.ts`).

Sin las dos variables de abajo, el push nativo queda apagado. La API registra
una sola advertencia, la campana in-app sigue funcionando y los tokens que la app
registre igual se guardan, así que llegan avisos en cuanto se configura.

## Identificadores de la app

| Plataforma | Identificador | Dónde está |
|---|---|---|
| Android | `com.alovida.alovida` | `android/app/build.gradle.kts` (`applicationId`) |
| iOS | `com.alovida.alovida` | `ios/Runner.xcodeproj` (`PRODUCT_BUNDLE_IDENTIFIER`) |

## Pasos

1. **Proyecto Firebase.** En <https://console.firebase.google.com> se crea (o se
   reutiliza) el proyecto. Su *Project ID* va en `FCM_PROJECT_ID`.
2. **Apps.** En *Configuración del proyecto → General* se agrega una app Android
   y una app iOS con los identificadores de la tabla. Los archivos
   `google-services.json` y `GoogleService-Info.plist` son de la app móvil, no de
   la API.
3. **Clave APNs (iOS).** En Apple Developer, en *Certificates, Identifiers &
   Profiles → Keys*, se crea una clave con *Apple Push Notifications service
   (APNs)* y se descarga el `.p8`. En Firebase, en *Configuración del proyecto →
   Cloud Messaging → Configuración de apps de Apple*, se sube el `.p8` con su
   *Key ID* y el *Team ID*. El App ID de `com.alovida.alovida` debe tener
   activada la capacidad *Push Notifications*.
4. **Cuenta de servicio.** En *Configuración del proyecto → Cuentas de servicio*
   se pulsa *Generar nueva clave privada* y se descarga un JSON. Ese JSON es un
   secreto: no se versiona ni se pega en issues o PR.
5. **Coolify.** En las variables del servicio de la API:
   - `FCM_PROJECT_ID`: el Project ID del paso 1.
   - `FCM_SERVICE_ACCOUNT_JSON`: el contenido completo del JSON del paso 4, en
     una línea. Se marca como secreto. La API lee `client_email` y `private_key`.

   Después se redespliega la API.

## Contrato

- `PUT /notifications/native-push/token`, con cuerpo
  `{ token, platform: "IOS"|"ANDROID", deviceFingerprint }`, responde 204. El
  token se guarda cifrado en `iam.devices.push_token_encrypted`, en la fila propia
  de la cuenta para esa instalación. La API no guarda el `deviceFingerprint` del
  cliente: guarda `app:<sha256(huella)>:<sha256(usuario:huella)>`, el mismo valor
  que escribe `POST /iam/users/:id/devices`. Así cada cuenta de un teléfono
  compartido tiene su fila, y ningún valor que mande el cliente alcanza la fila de
  otra cuenta (ni las de inicio de sesión ni las de push del navegador). Al
  registrar el token, la API lo borra de las filas de otras cuentas de la misma
  instalación: los avisos llegan sólo a la cuenta que entró última. Un cierre de
  sesión sin red no alcanza a borrar el token; el registro siguiente sí.
- Socket y push salen sólo después del COMMIT de la transacción de la petición
  (`deferAfterTenantCommit`): un aviso cuya escritura se deshizo no suena.
- `DELETE /notifications/native-push/token`, con cuerpo `{ token }`, responde 204.
- El texto visible siempre es «AloVida» / «Tiene un aviso nuevo en AloVida». En
  `data` solo viajan identificadores: `notificationId`, `route`,
  `destinationType`, `destinationId` y `category`.
- En Android el aviso usa el canal `alovida_avisos`, que la app debe crear.
- Cuando FCM responde `UNREGISTERED` o 404, `SENDER_ID_MISMATCH`, o
  `INVALID_ARGUMENT` por el token, la API borra ese token.

## Comprobar

Con la app instalada y la sesión abierta, se genera cualquier aviso para esa
cuenta y debe llegar el push. Si no llega, conviene revisar en los logs de la API
`messaging.native-push.disabled` (faltan variables) o
`messaging.native-push.device` (FCM rechazó el envío, con `status` y `code`).
