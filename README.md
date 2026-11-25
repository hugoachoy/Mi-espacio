# Mi Espacio

Aplicación web progresiva (PWA) para organización personal. Está publicada en GitHub Pages y puede utilizarse desde una computadora o un teléfono Android, tanto en el navegador como instalada en la pantalla de inicio.

**Aplicación:** https://hugoachoy.github.io/Mi-espacio/

## Funciones actuales

### Panel de inicio
- Resumen de recordatorios pendientes.
- Cantidad de listas de compras activas.
- Cantidad de medicamentos registrados.
- Cantidad de enlaces y videos guardados.
- Accesos directos a los módulos y a la creación de elementos.
- Vista de próximos recordatorios y accesos a la biblioteca personal.

### Recordatorios
- Registro de título, fecha, horario, anticipación del aviso y detalles.
- Consulta, edición y eliminación.
- Posibilidad de marcar un recordatorio como **Realizado**.
- Los recordatorios realizados conservan su tarjeta con un distintivo visual.
- Notificaciones push programadas, incluso cuando la aplicación no está abierta, en los dispositivos que hayan concedido permiso y activado las notificaciones.
- Al tocar una notificación, la aplicación abre el detalle del recordatorio correspondiente.

### Listas de compras
- Creación de listas identificadas por nombre y lugar o comercio.
- Incorporación de artículos y cantidades.
- Marcación de artículos comprados y eliminación de artículos.
- Indicador de progreso de cada lista.

### Medicación
- Registro del nombre y presentación del medicamento.
- Seguimiento del stock actual y del stock mínimo.
- Fecha de vencimiento y próximo pedido.
- Farmacia o proveedor y notas.
- Indicador en el panel de inicio para consultar los medicamentos que necesitan reposición.

### Biblioteca personal
- **Enlaces y videos:** título, tipo, dirección web, categoría y descripción.
- **Películas y series:** título, tipo, año, plataforma, estado, género y comentario personal.
- **Códigos útiles:** nombre, código, categoría, enlace opcional y descripción.

### Herramientas generales
- Búsqueda dentro de los módulos.
- Formularios para crear y editar elementos.
- Exportación de una copia de seguridad en formato JSON.
- Restauración desde una copia JSON.
- Diseño adaptable a pantallas de computadora y celular.
- Navegación lateral en escritorio y menú inferior en dispositivos móviles.

## Cuentas de usuario y separación de datos

Mi Espacio admite distintas cuentas de usuario. Cada persona puede registrarse e iniciar sesión con su propia cuenta de correo electrónico y contraseña.

- Cada cuenta mantiene sus propios registros en Supabase, asociados al identificador único del usuario.
- Las políticas de seguridad por usuario (Row Level Security, RLS) impiden que una cuenta consulte o modifique los datos de otra.
- El almacenamiento local del navegador también se separa por usuario: cada cuenta utiliza su propio espacio local.
- Al cerrar sesión, la aplicación vuelve al espacio anónimo y no deja visibles los registros de la cuenta que acaba de cerrarse.
- Una cuenta nueva comienza sin los registros de otras cuentas.
- Se puede utilizar la misma cuenta en varios dispositivos para acceder a los mismos datos sincronizados.

La separación entre cuentas fue probada con dos usuarios: cada uno conservó sus propios registros y los datos de prueba de la segunda cuenta no aparecieron en la cuenta principal.

## Sincronización entre dispositivos

Al iniciar sesión con la misma cuenta en la computadora y en Android, los datos de esa cuenta se sincronizan mediante **Supabase**.

- Los datos se mantienen también en el almacenamiento local del navegador, separado por cuenta.
- La aplicación consulta cambios al recuperar el foco y periódicamente mientras está abierta.
- Los cambios realizados se envían a la nube automáticamente.
- Desde el panel de cuenta se puede solicitar una sincronización manual y consultar el estado.

La sincronización requiere conexión a Internet y una sesión iniciada. La copia de seguridad JSON sigue disponible como respaldo independiente.

## Notificaciones push

Las notificaciones se gestionan mediante el sistema Web Push y una función de Supabase Edge Functions.

- Cada dispositivo debe activar las notificaciones y conceder permiso al navegador.
- Los dispositivos habilitados registran su suscripción para recibir avisos.
- Una tarea programada de Supabase ejecuta la revisión de recordatorios.
- Se contemplan avisos anticipados expresados en minutos, horas, días o semanas.
- El sistema evita enviar repetidamente la misma notificación para un mismo aviso.
- Al abrir una notificación, se intenta localizar el recordatorio y mostrar su ficha.

Las suscripciones de notificaciones se asocian al usuario autenticado y al dispositivo correspondiente. Cada usuario debe activar las notificaciones en cada dispositivo que quiera utilizar.

Las notificaciones dependen de los permisos del navegador, la conexión y los servicios del dispositivo. Para asuntos críticos, conviene mantener un medio de respaldo.

## Tecnologías y arquitectura

- HTML, CSS y JavaScript sin framework de interfaz.
- PWA: manifest.webmanifest y sw.js (service worker).
- GitHub Pages para publicación.
- Supabase Auth para autenticación.
- Supabase Database para sincronización de datos.
- Supabase Edge Functions y Web Push para envío de notificaciones.
- Almacenamiento local del navegador como persistencia en el dispositivo.

### Archivos principales

| Archivo | Función |
|---|---|
| index.html | Estructura principal de la aplicación y navegación. |
| app.js | Módulos, formularios, operaciones, autenticación, sincronización y notificaciones. |
| styles.css | Diseño visual y adaptación a distintos tamaños de pantalla. |
| sw.js | Caché de la PWA y recepción/apertura de notificaciones push. |
| manifest.webmanifest | Nombre y configuración de instalación de la PWA. |
| supabase/functions/send-reminders/index.ts | Función de servidor que revisa y envía recordatorios programados. |

## Datos y seguridad

- La información personal se guarda en el almacenamiento local y, cuando hay una sesión activa, en la base de datos de Supabase.
- La tabla de datos utiliza políticas de seguridad por usuario (Row Level Security, RLS).
- Las suscripciones push se asocian al usuario autenticado.
- La clave pública de Supabase y la clave pública VAPID utilizadas por el cliente no son claves privadas.
- Las claves privadas, secretos de cron y credenciales de servidor deben permanecer en los secretos de Supabase y nunca deben publicarse en este repositorio.
- No se deben borrar los datos del navegador ni el almacenamiento local como método de actualización de la aplicación.

## Desarrollo y prueba local

Se necesita Python 3 para levantar un servidor web local. Desde la carpeta del proyecto, ejecutar:

    python3 -m http.server 8080

Abrir luego http://localhost:8080

Para probar las funciones de PWA y el service worker se requiere localhost o un sitio publicado mediante HTTPS. Algunas funciones, como la autenticación, la sincronización y las notificaciones push, requieren además que la configuración de Supabase esté disponible y correctamente configurada.

## Publicación

- Repositorio: https://github.com/hugoachoy/Mi-espacio
- Sitio publicado: https://hugoachoy.github.io/Mi-espacio/

Al modificar archivos de la aplicación, se debe actualizar la versión de caché definida en la primera línea de sw.js (actualmente mi-espacio-shell-v13) para que los navegadores descarguen los archivos nuevos. No es necesario ni recomendable borrar el almacenamiento local: allí pueden existir datos del usuario.

## Estado del proyecto

Mi Espacio está en uso y probada en computadora y Android. Se verificaron la autenticación, la separación de datos entre cuentas, el cierre de sesión sin exposición de registros, la sincronización entre dispositivos, las copias de seguridad, las notificaciones push para ambas cuentas de prueba y la apertura del recordatorio desde la notificación. El proyecto continúa evolucionando; este README describe las funciones implementadas actualmente, no una lista de funciones futuras.
