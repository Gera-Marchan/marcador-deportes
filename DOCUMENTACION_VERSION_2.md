# 🚀 NiñoPrieto! Multi-Deportes OBS - VERSIÓN 2 (Master HTML Broadcast Engine)

## 📌 ¿Qué es la Versión 2?

La **VERSIÓN 2** implementa la arquitectura de **Escena Única con Master Overlay HTML**. 
En lugar de depender de múltiples escenas y transiciones dentro de OBS Studio, **OBS Studio solo necesita 1 Única Escena ("EN VIVO")** y todo el control gráfico (pantalla de espera, previa con logos, medio tiempo, marcador transparente, patrocinadores fullscreen y fallas técnicas) se opera remotamente desde tu celular, tablet o PC en el panel de control (`index.html`).

---

## 🎬 Configuración en OBS Studio (Solo 2 Pasos)

1. **Crear 1 sola escena** llamada **`EN VIVO`**.
2. **Agregar solo 2 fuentes** en la escena:
   - 🔴 **Fuente de Navegador (1920x1080)**: Apuntando a `http://localhost:8080/overlay.html` *(o tu URL en la nube)*.
   - 🎥 **Captura de Video / Cámara**: Tu cámara de transmisión o capturadora HDMI *(Ubicada abajo)*.

---

## 🎮 Modos de Escena HTML desde el Panel de Control (`index.html`)

En el **Bloque 1: ESCENA ÚNICA (PLANTILLAS EN VIVO)** de la web/app encontrarás los botones de cambio de vista instantáneo:

| Botón | Función en Pantalla |
| :--- | :--- |
| 🔴 **EN VIVO / MARCADOR** | Fondo 100% transparente para ver la cámara de OBS + Marcador Deportivo + Cintillo + Patrocinador en esquina. |
| ⏳ **ESPERA / EN BREVE** | Muestra la pantalla de inicio `img/ESPERA.png` con la insignia *"INICIAMOS EN BREVE"*. |
| 👋 **BIENVENIDA / PREVIA** | Muestra la pantalla `img/BIENVENIDOS.PNG` con la tarjeta central con logos y nombres de **VISITA VS LOCAL**. |
| ⏸️ **MEDIO TIEMPO** | Muestra la pantalla `img/MEDIOTIEMPO.png` con la tarjeta de **Marcador al Momento**. |
| 📢 **PATROCINADORES FULL** | Muestra la galería/showcase gigante fullscreen de todos los patrocinadores activos. |
| ⚠️ **FALLA TÉCNICA** | Muestra la pantalla `img/PROBELMAS.png` para avisos de interrupción. |
| 🖼️ **MARCO CÁMARA (ON/OFF)** | Activa o desactiva un marco decorativo deportivo brillante sobre el borde del video. |

---

## ⚡ Motor de Sincronización en Tiempo Real (Server-Sent Events)

- **API SSE (`/api/events`)**: Sincronización ultrarrápida en tiempo real con latencia **< 5ms** sin dependencias externas.
- **Contador de Dispositivos Conectados**: Badge visual `⚡ REALTIME (X DISP.)` que muestra la cantidad de celulares y overlays sincronizados activamente.
- **Reconexión Automática OBS**: Módulo `startOBSAutoReconnect()` que reconecta automáticamente con OBS Studio WebSocket (puerto 4455) en caso de reinicio de la transmisión o caída Wi-Fi.

---

## ⚙️ Servidor Local vs. Servidor en la Nube (Render.com)

### 💻 Servidor Local (PC de Transmisión):
```bash
cd "C:\Users\gerardo_marchan\Downloads\bocinas pruebas\VERSION 2"
node server.js
```
Acceso desde la PC o celular en la red Wi-Fi: `http://localhost:8080` o `http://<IP-LOCAL>:8080`.

### 🌐 Servidor en la Nube (Render.com):
- **Root Directory:** `VERSION 2`
- **Build Command:** `echo "No build step"`
- **Start Command:** `node server.js`
- Acceso global desde cualquier lugar: `https://tu-app.onrender.com`

