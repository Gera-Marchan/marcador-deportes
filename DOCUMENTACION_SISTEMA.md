# 📘 Documentación del Sistema: NiñoPrieto! Multi-Deportes OBS

**NiñoPrieto! Multi-Deportes OBS** es un sistema profesional e integral para la gestión de marcadores en vivo, gráficos en pantalla (*Scorebug*), efectos de sonido de estadio, cintillo de noticias, patrocinadores y control remoto web/móvil para transmisiones deportivas en **OBS Studio**, **Facebook Live**, **TikTok**, **YouTube** y **Twitch**.

---

## 🚀 1. Arquitectura Técnica y Componentes del Sistema

El sistema está construido en un ecosistema desacoplado y ligero para garantizar latencia cero y paridad absoluta entre dispositivos:

1. **Panel de Control Principal (`index.html`)**:
   - Interfaz web táctil y adaptable (*Mobile-First*) para controlar marcadores, cronómetros, efectos de sonido y transmisión desde la PC, celular o tablet.
2. **Motor del Sistema (`app.js`)**:
   - Contiene la lógica central multi-deporte, administración del estado (*state management*), temporizadores de precisión, compresión de imágenes, emisor de eventos y cliente OBS WebSocket.
3. **Marcador Gráfico / Overlay (`overlay.html`)**:
   - Capa gráfica de alta definición (1920x1080) lista para insertarse en OBS como **Fuente de Navegador (*Browser Source*)**. Incluye animaciones CSS3 3D, efectos de cristal (*Glassmorphism*), banderas dinámicas y overlays gigantes de celebración.
4. **Servidor HTTP & REST API (`server.js`)**:
   - Servidor Node.js ligero que corre en el puerto **8080**. Expone el endpoint `/api/state` con cabeceras CORS libres para que cualquier dispositivo en la red local pueda leer y actualizar el marcador.
5. **Aplicación Móvil Android (`NiñoPrieto_MultiDeportes_v1.apk`)**:
   - Aplicación nativa instalable en teléfonos y tablets Android que envuelve el panel de control remoto.

---

## ⚾ 2. Funcionalidades del Módulo de Béisbol

- **Nombres y Colores de Equipos**:
  - Entrada de texto para **Visita** y **Local** con selector de color personalizado (*Color Picker*).
  - Botón de **Intercambiar Equipos (`swapTeams`)** para invertir lados instantáneamente.
- **Escudos / Logos de Equipos**:
  - Subida de logos con compresión automática en cliente mediante Canvas HTML5 (160x160 px), previniendo saturación de memoria.
- **Indicador "AL BATE"**:
  - Resaltado dinámico con borde neón verde sobre la tarjeta del equipo al bate según la mitad del inning.
- **Control de Marcador, Hits y Errores**:
  - Botones de incremento/decremento (`+`, `-`) para carreras de Visita/Local, HITS y ERRORES (ERR).
- **Situación de Juego (Inning y Diamante de Bases)**:
  - Selector de Inning: Indicador de parte Alta (`▲`) / Baja (`▼`) y contador numérico de Inning.
  - Diamante interactivo de 3 bases (**1ª Base, 2ª Base, 3ª Base**) con encendido brillante neón.
- **Conteo de Puntos (Balls, Strikes, Outs)**:
  - **Bolas (B)**: Luces indicadoras de 1 a 4 bolas. Al llegar a 4 bolas avanza automáticamente a los corredores (*Base por bolas / Walk*) y reinicia la cuenta.
  - **Strikes (S)**: Luces indicadoras de 1 a 3 strikes. Al llegar a 3 strikes suma un Out automáticamente (*Strikeout*).
  - **Outs (O)**: Luces indicadoras de 1 a 3 outs. Al llegar al 3º Out dispara la alerta de *Cambio de Inning*, limpia bases y reinicia la cuenta.
- **Botones de Jugada Rápida y Overlays Gigantes**:
  - `¡HIT! ⚾` — Dispara banner de jugada.
  - `¡STRIKEOUT! ꓘ` — Dispara banner de ponche.
  - `¡HOMERUN! ⚾💥` — Dispara animación gigante de cuatro esquinas con el nombre del bateador.
  - `¡GRAND SLAM! 💣💥` — Dispara animación gigante de cuadrangular con bases llenas.

---

## ⚽ 3. Funcionalidades del Módulo de Fútbol

- **Reloj de Juego en Tiempo Real**:
  - Cronómetro digital en vivo (`00:00`) con botones de **`▶ INICIAR`**, **`PAUSAR`**, **`+1 MIN`**, **`-1 MIN`** y **`RESET`**.
- **Períodos del Partido**:
  - `1º TIEMPO (00')`
  - `2º TIEMPO (45')`
  - `1º EXTRA (90')`
  - `2º EXTRA (105')`
- **Tiempo Añadido (Descuento)**:
  - Acceso directo a tiempo extra (`+3' EXTRA`, `+5' EXTRA`) que se muestra en el marcador.
- **Goles Separados por Equipo**:
  - **`⚽ GOL (VISITA)`** ➔ Incrementa el marcador de Visita y lanza la celebración gigante `¡GOOOOOOL!` en OBS con el nombre del equipo Visita.
  - **`⚽ GOL (LOCAL)`** ➔ Incrementa el marcador de Local y lanza la celebración gigante `¡GOOOOOOL!` en OBS con el nombre del equipo Local.
- **Sanciones y VAR**:
  - Tarjetas Amarillas (`🟨`) por equipo.
  - Tarjetas Rojas / Expulsiones (`🟥`) por equipo.
  - Banner de **`📺 REVISIÓN VAR`**.
  - Banner de **`⚽ PENALTY`**.
- **Adaptabilidad de Pantalla**:
  - Al seleccionar Fútbol, el overlay oculta automáticamente los datos de béisbol (bolas, strikes, outs y diamante) y activa el reloj de partido y banderas de fútbol.

---

## 🔊 4. Mezclador de Audio de 4 Canales y Efectos de Estadio (Sound FX)

### Mezclador de Audio de 4 Canales:
- Control deslizante de volumen independiente para:
  1. **Narrador** (Micrófono principal).
  2. **Ambiente** (Sonido de campo).
  3. **Micrófono 2 / Aux 3**.
  4. **Aux 4 / Música**.

### Enrutamiento de Audio (*Audio Routing*):
- Tres modos de salida de audio intercambiables:
  - `SOLO ALTAVOCES`: El audio suena únicamente en el celular o bocinas locales.
  - `SOLO TRANSMISIÓN`: El audio se envía directamente a OBS WebSocket.
  - `AMBOS`: El audio suena localmente y en la transmisión simultáneamente.

### Efectos de Sonido Integrados (Formato WAV sintetizado):
- `👏 APLAUSOS` — Ovasión de multitud y aplausos rítmicos.
- `🎺 ÓRGANO ESTADIO` — Melodía clásica de béisbol ("Charge!").
- `⚾ BATAZO` — Efecto de impacto seco de bate con pelota.
- `🔔 CAMPANA OUT` — Campana de confirmación de out.

---

## 📢 5. Cintillo de Noticias (*Ticker Tape*) y Patrocinadores

- **Cintillo de Noticias Marquee**:
  - Cinta desplazable continua en la parte inferior del marcador para mostrar anuncios, promociones o avisos durante el juego.
- **Rotación Automática de Patrocinadores**:
  - Carrusel de patrocinadores con subida de imágenes/logos.
  - Rotación automática configurable por segundos.
  - Mantiene el 100% de opacidad para máxima visibilidad en pantalla.

---

## 🎨 6. Temas Visuales Intercambiables (*Scorebug Themes*)

El marcador gráfico incluye 5 temas estilizados que se cambian desde el menú de Configuración:
1. **Dark Pro** (Por defecto - Azul obscuro elegante con neón).
2. **Neon Blue** (Bordes brillantes cyber-blue).
3. **Crimson Red** (Estilo agresivo rojo deportivo).
4. **Gold League** (Dorado de gala tipo campeonato).
5. **Glassmorphic** (Efecto de cristal translúcido esmerilado).

---

## 🔄 7. Mecanismos de Sincronización Multi-Red

Para garantizar que los marcadores no pierdan sincronía sin importar la red:
- **LocalStorage Event Sync**: Actualización instantánea entre pestañas del mismo navegador.
- **BroadcastChannel API**: Canal de mensajería bidireccional entre ventanas y la app.
- **REST API HTTP Polling (`/api/state`)**: Consulta continua cada 200ms desde `overlay.html` al servidor Node.js en el puerto 8080.
- **OBS WebSocket Client (`ws://localhost:4455`)**: Comunicación bidireccional directa con OBS Studio.

---

## 📦 8. Archivos Compilados y Descargables

Todos los archivos ejecutables y respaldos se encuentran organizados en:
- **Carpeta del Proyecto**: `Downloads/bocinas pruebas/`
- **Ejecutable APK Android**: `Downloads/bocinas pruebas/NiñoPrieto_MultiDeportes_v1.apk`
- **Respaldo ZIP de Código**: `Downloads/bocinas pruebas/Respaldo_Beisbol_v1.zip`
- **Guía de Migración**: `Downloads/bocinas pruebas/README.md`
