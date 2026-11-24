# Mi Espacio — primera versión de trabajo

Aplicación web progresiva (PWA) adaptable a celular Android y computadora.

## Qué incluye esta primera entrega
- Tablero inicial y navegación por módulos.
- Recordatorios con fecha, hora y campo de anticipación (todavía no dispara notificaciones).
- Listas de compras por comercio con artículos, cantidades y marcación de comprado.
- Registro de medicamentos, stock mínimo y vencimiento.
- Biblioteca de enlaces/videos, películas/series y códigos útiles.
- Búsqueda en cada módulo.
- Exportación e importación de copia de seguridad JSON.
- Interfaz adaptable y estructura PWA con caché básica.

## Estado y limitaciones importantes
Esta es una primera base funcional para validar pantallas y organización. Los datos se guardan en el almacenamiento local del navegador/dispositivo. **Todavía no hay sincronización entre dispositivos, cuentas de usuario, notificaciones reales ni alarmas Android.** El campo de anticipación de los recordatorios es por ahora informativo. No usar esta versión como único medio para recordar medicación, turnos u otros asuntos críticos.

## Cómo probar en una computadora
La forma más sencilla es servir la carpeta mediante un servidor web local. Con Python 3 instalado, desde esta carpeta ejecutar:

```bash
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080` en el navegador.

Para instalarla como PWA y probar el service worker se necesita `localhost` o un sitio publicado con HTTPS. Abrir `index.html` directamente también permite probar las funciones básicas, pero no activa el service worker.

## Próxima etapa
Validar el diseño y los formularios. Después implementar almacenamiento robusto, sincronización segura y notificaciones; para alarmas de alta prioridad en Android se evaluará una capa nativa con AlarmManager.
