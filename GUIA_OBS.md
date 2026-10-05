# Guía Completa de Integración con OBS Studio (versión 28+ y obs-websocket 5.x)

Esta guía detalla paso a paso cómo conectar la interfaz web de control remoto para Béisbol y cómo cargar el marcador (*Scorebug*) animado en directo dentro de **OBS Studio**.

---

## 📁 Ubicación Directa del Proyecto
Todos los archivos del proyecto se encuentran en la carpeta exacta:
```text
C:\Users\gerardo_marchan\Downloads\bocinas pruebas\
├── index.html        (Panel de Control Remoto para Tablet / PC)
├── overlay.html      (Marcador gráfico transparente para OBS Browser Source)
├── styles.css        (Estilos UI Clean & Dark Ultra-minimalista)
├── app.js            (Lógica e integración con obs-websocket-js v5.x)
└── obs-websocket.js (Librería nativa offline obs-websocket-js v5.0.3)
```

---

## ⚙️ PASO 1: Configurar OBS WebSocket (Server)

1. Abre **OBS Studio** (Asegúrate de usar OBS v28.0 o superior, el cual ya incluye OBS WebSocket v5 de fábrica).
2. En la barra de menú superior de OBS, haz clic en **Herramientas (Tools) -> Ajustes del servidor WebSocket (WebSocket Server Settings)**.
3. Asegúrate de tener activadas las siguientes opciones:
   - **Habilitar el servidor WebSocket (Enable WebSocket Server)**: [X] Activado.
   - **Puerto del servidor (Server Port)**: `4455` (Por defecto).
   - **Habilitar autenticación (Enable Authentication)**: 
     - Si deseas contraseña, marca la casilla y establece la clave (ejemplo: `12345678`).
     - Si estás en una red Wi-Fi privada local y deseas conexión instantánea, puedes desmarcarla.
4. Haz clic en **Aplicar** y luego en **Aceptar**.

---

## 📺 PASO 2: Agregar el Marcador (Overlay) en OBS Studio

Puedes mostrar el marcador en OBS usando el archivo gráfico `overlay.html`:

1. En la ventana principal de OBS Studio, ve al panel de **Fuentes (Sources)** en la escena donde transmitirás el partido.
2. Haz clic en el botón **"+"** (Agregar Fuente) y selecciona **Navegador (Browser)**.
3. Nómbralo: `Scorebug_Beisbol` y presiona **Aceptar**.
4. En la ventana de propiedades de la fuente Navegador:
   - Marca la casilla **Archivo local (Local file)**.
   - En el campo **Archivo local**, haz clic en **Examinar (Browse)** y selecciona la ruta:
     `C:\Users\gerardo_marchan\Downloads\bocinas pruebas\overlay.html`
   - **Ancho (Width)**: `1920`
   - **Alto (Height)**: `1080`
   - Marca las casillas:
     - [X] *Actualizar el navegador cuando la escena se vuelva activa*.
     - [X] *Controlar el audio mediante OBS* (Opcional).
5. Haz clic en **Aceptar**. Verás el elegante marcador gráfico desplegado en la esquina inferior izquierda de tu pantalla de transmisión.

---

## 🔤 PASO 3: (Opcional) Sincronizar Fuentes de Texto Nativas en OBS Studio

Si prefieres usar fuentes de texto independientes (GDI+ / Freetype) dentro de tu diseño de OBS en lugar del marcador web `overlay.html`, la interfaz de control actualizará automáticamente las siguientes fuentes de texto en OBS si existen en tu escena:

| Variable en Control Remoto | Nombre exacto de la Fuente de Texto en OBS |
| :--- | :--- |
| **Nombre Equipo Visitante** | `Equipo_Visita` |
| **Carreras Visitante** | `Score_Visita` |
| **Hits Visitante** | `Hits_Visita` |
| **Errores Visitante** | `Errors_Visita` |
| **Nombre Equipo Local** | `Equipo_Local` |
| **Carreras Local** | `Score_Local` |
| **Hits Local** | `Hits_Local` |
| **Errores Local** | `Errors_Local` |
| **Texto de Inning** | `Inning` |
| **Resumen Conteo (B-S-O)** | `Conteo_BSO` |

---

## 🎬 PASO 4: Configurar Escenas y Mezclador de Audio

Para tener control total de botones rápidos y sliders de volumen desde la tablet:

1. **Escenas**: Crea en OBS Studio escenas con los siguientes nombres exactos (o cámbiables directamente en la cuadrícula del panel):
   - `ESPERA`
   - `CAMPO`
   - `HOME`
   - `REPETICIÓN`
   - `MEDIO INNING`
2. **Entradas de Audio**: En el Mezclador de Audio de OBS, nombra a tus micrófonos/pistas:
   - `NARRADOR` (o micrófono principal de locutores)
   - `AMBIENTE` (o micrófono ambiental de campo)

---

## 📱 PASO 5: Abrir y Operar el Control Remoto en Tablet o PC

### Opción A: Desde la misma Computadora del Operador
Simplemente haz doble clic en el archivo `index.html` ubicado en:
`C:\Users\gerardo_marchan\Downloads\bocinas pruebas\index.html`

### Opción B: Desde una Tablet táctil (iPad, Android, Microsoft Surface)
1. Conecta la Tablet a la misma red Wi-Fi de la computadora donde corre OBS.
2. Abre el símbolo del sistema (CMD) en la PC y escribe `ipconfig` para conocer tu IP local (ej. `192.168.1.50`).
3. En la esquina superior derecha del panel web (`index.html`), abre el icono de **Configuración (Engranaje)** e ingresa la IP de tu PC (`192.168.1.50`), Puerto (`4455`) y la contraseña establecida.
4. Presiona **Conectar a OBS**. ¡El indicador cambiará a **ONLINE** en verde y tendrás control total multitáctil en tiempo real!

---

## 💡 Consejos de Operación durante el Partido
- **Contadores B/S/O de 1 toque**: Al presionar sobre los círculos de Bola, Strike u Out, estos se iluminarán instantáneamente.
- **Auto-reset de Lanzamiento**: Al tocar el botón **"Lanzamiento Terminado / Reset"** o al registrar 3 Outs, el conteo de bolas y strikes se reinicia automáticamente a cero.
- **Bases Ocupadas**: Toca los rombos (1B, 2B, 3B) para encender las bases ocupadas en color ámbar radiante.
- **Intercambiar Equipos**: En el bloque de marcador, presiona **"🔄 Intercambiar Equipos"** para invertir automáticamente los nombres y puntuaciones en la parte alta/baja de la entrada.
- **Protección de Streaming**: El botón **"INICIAR STREAM"** requiere confirmación de seguridad para evitar arranques o cortes accidentales de la transmisión.
