# 📱 Guía para la App Nativa Android (Control Baseball OBS)

¡Ya hemos generado el **Proyecto Nativo de Android** completo para tu aplicación!

Ubicación del proyecto Android:
`C:\Users\gerardo_marchan\Downloads\bocinas pruebas\BaseballRemoteAndroid`

---

## 🌟 Características de la App Nativa Android:
1. **Recursos Empaquetados Offline (`file:///android_asset/index.html`)**: La aplicación incluye todos los archivos web (`index.html`, `styles.css`, `app.js`, `obs-websocket.js`), por lo que la interfaz carga al instante sin depender de un servidor Node.js intermediario.
2. **Modo Inmersivo (Pantalla Completa)**: Se ajusta perfectamente a la pantalla del Samsung S25 Ultra eliminando las barras del sistema.
3. **Soporte para Tráfico de Red Local HTTP/WebSocket (`network_security_config.xml`)**: Configurado específicamente para permitir la conexión en vivo vía Wi-Fi al OBS Studio (`ws://192.168.10.177:4455`).

---

## 🛠️ Opciones para Generar e Instalar el Archivo `.apk`

### Opción 1: Compilar usando Android Studio (Recomendado)
1. Descarga e instala **[Android Studio](https://developer.android.com/studio)** si aún no lo tienes.
2. Abre Android Studio y selecciona **Open an Existing Project**.
3. Selecciona la carpeta:
   `C:\Users\gerardo_marchan\Downloads\bocinas pruebas\BaseballRemoteAndroid`
4. Deja que Android Studio sincronice las dependencias de Gradle automáticamente.
5. Conecta tu **Samsung S25 Ultra** mediante cable USB a la computadora (asegúrate de activar **Depuración por USB** en las opciones de desarrollador del teléfono).
6. En Android Studio, presiona el botón de **Play ▶️ (Run 'app')** en la barra superior.
7. ¡La app **Control Baseball OBS** se instalará en tu teléfono automáticamente con su ícono y ejecución independiente!

---

### Opción 2: Compilar el APK desde Línea de Comandos
Si tienes Android Studio / Gradle configurado en el sistema, puedes generar el APK de release directamente abriendo una consola en la carpeta `BaseballRemoteAndroid` y ejecutando:

```bash
gradlew assembleRelease
```
El archivo `.apk` final se generará en:
`BaseballRemoteAndroid/app/build/outputs/apk/release/app-release-unsigned.apk`

---

### Opción 3: PWA (Acceso Directo Instantáneo en 10 Segundos)
Si prefieres no instalar Android Studio:
1. Abre Google Chrome en tu Samsung S25 Ultra.
2. Entra a `http://192.168.10.177:8080`.
3. Toca los tres puntos `⋮` arriba a la derecha y selecciona **"Agregar a la pantalla de inicio"** o **"Instalar Aplicación"**.
4. ¡Listo! Se creará el ícono en tu menú de apps y funcionará exactamente igual que una app instalada de la Play Store.
