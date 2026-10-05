# 🚀 NiñoPrieto! Multi-Deportes OBS - Guía de Instalación y Migración

Sistema profesional de transmisión deportiva en vivo con marcador interactivo (**Béisbol** ⚾ y **Fútbol** ⚽), control remoto web/móvil, efectos de sonido de estadio, cintillo de noticias y rotación automática de patrocinadores para **OBS Studio**.

---

## 📁 Estructura de Archivos del Proyecto

- `index.html` — Panel de Control Principal (interfaz táctil y de escritorio).
- `app.js` — Motor del sistema (lógica multi-deporte, cronómetro de fútbol, at-bat béisbol, temporizadores y WebSocket).
- `overlay.html` — Marcador gráfico (*Scorebug*) para agregar a OBS como Fuente de Navegador (*Browser Source*).
- `server.js` — Servidor HTTP local con soporte REST API `/api/state` en el puerto **8080**.
- `sounds/` — Carpeta con efectos de audio de estadio (`aplausos.wav`, `organo.wav`, `batazo.wav`, `out_bell.wav`).

---

## 🛠️ Guía de Instalación Inicial en una PC Nueva

### 1. Copiar la Carpeta del Proyecto
Copia la carpeta completa `bocinas pruebas` (o `RESPALDO_BEISBOL_V1`) a tu disco duro en la nueva computadora.

### 2. Instalar Node.js y Arrancar el Servidor Local
1. Descarga e instala **Node.js LTS** desde [https://nodejs.org](https://nodejs.org).
2. Abre la consola de comandos (**CMD** o **PowerShell**) en la carpeta del proyecto y ejecuta:
   ```bash
   node server.js
   ```
   *(Verás la confirmación: `Servidor activo en el puerto 8080`)*.

### 3. Configurar OBS Studio
1. Abre **OBS Studio**.
2. Ve al menú superior **Herramientas ➔ Ajustes del servidor WebSocket**.
3. Asegúrate de tener marcada la opción **Habilitar el servidor WebSocket** (Puerto por defecto: `4455`).

### 4. Abrir el Panel de Control Web
1. En tu navegador (Chrome/Edge) abre: `http://localhost:8080`
2. En la barra superior presiona el icono de engranaje **Configuración (⚙️)** y verifica que el puerto sea `4455` y la contraseña coincida con OBS.

### 5. Conectar Celulares / Tablets en la misma Red Wi-Fi
1. Conecta tu teléfono o tablet al mismo Wi-Fi que la computadora.
2. Averigua la dirección IP local de tu computadora ejecutando `ipconfig` en CMD (ejemplo: `192.168.1.75`).
3. En el navegador del celular abre:
   ```text
   http://192.168.1.75:8080
   ```

---

## 🌐 Despliegue en la Nube (Render.com)

Para usar el marcador desde cualquier celular o PC sin importar la red Wi-Fi:
1. Sube tu código a GitHub.
2. Crea un **Web Service** gratuito en [Render.com](https://render.com).
3. Configura los parámetros:
   - **Root Directory:** `VERSION 2`
   - **Build Command:** `echo "No build step"`
   - **Start Command:** `node server.js`
4. En OBS Studio, apunta tu Fuente de Navegador a: `https://tu-app.onrender.com/overlay.html`.

---

## 🎥 Cómo Exportar e Importar el Respaldo Completo de OBS (Escenas, Fuentes y Pantallas)

Para respaldar la configuración completa de tus fuentes, pantallas y escenas de OBS y abrirlos **tal cual** en otra computadora:

### 📥 1. Exportar la Colección de Escenas
1. En OBS, ve al menú superior **Colección de Escenas ➔ Exportar**.
2. Guarda el archivo `.json` en tu memoria USB (ejemplo: `MisEscenasDeportivas.json`).

### 👤 2. Exportar el Perfil (Ajustes de Video/Stream)
1. En OBS, ve al menú superior **Perfil ➔ Exportar**.
2. Selecciona una carpeta de tu memoria USB para guardar tus ajustes de resolución, bitrate y claves de transmisión.

### 📤 3. Importar en la Nueva Computadora
1. Abre OBS en la nueva computadora.
2. Ve a **Colección de Escenas ➔ Importar**, selecciona tu archivo `.json` cargado desde la USB.
3. Ve a **Perfil ➔ Importar**, selecciona la carpeta cargada desde la USB.
4. En **Colección de Escenas**, selecciona tu colección importada y ¡todas tus fuentes, pantallas y capas aparecerán exactamente igual!

---

## ⚡ Solución de Problemas Frecuentes

- **¿El marcador overlay no se actualiza?**
  Asegúrate de tener corriendo `node server.js` en la consola (o tener tu servicio activo en Render).
- **¿El celular no conecta al panel local?**
  Verifica que el teléfono y la computadora estén en la misma red Wi-Fi y que el Firewall de Windows permita el puerto 8080.
- **¿Alerta de clave de transmisión en OBS?**
  Configura tu Clave de Transmisión en OBS (*Ajustes ➔ Emisión*). El panel preservará tus ajustes internos de OBS.

