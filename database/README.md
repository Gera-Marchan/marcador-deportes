# 🗄️ Guía de Base de Datos PostgreSQL para Render

Esta carpeta contiene los scripts SQL para crear y mantener la base de datos de tu aplicación **Marcador Deportes SaaS**.

---

### 📂 Archivos en esta carpeta:

1. **`schema.sql`**: Script DDL para crear las tablas de `usuarios`, `patrocinadores` y `estados_partido`.
2. **`init_db.js`**: Script ejecutable en Node.js que conecta a PostgreSQL y ejecuta automáticamente las migraciones.

---

### 🚀 Pasos para desplegar la Base de Datos en Render.com:

1. Entra a tu panel de **Render.com**.
2. Haz clic en **New +** -> **PostgreSQL**.
3. Asigna un nombre (ej. `marcador-db`) y selecciona la región más cercana.
4. Elige el **Free Plan** (0$/mes).
5. Copia la **External Database URL** o **Internal Database URL** generada por Render.
6. En tu servicio Web en Render, agrega la variable de entorno:
   - **Nombre:** `DATABASE_URL`
   - **Valor:** `postgres://usuario:password@host/database_name`

---

### 🛠️ Ejecución manual del script SQL (Opcional):

Si deseas ejecutar el script `schema.sql` directamente mediante la consola `psql`:

```bash
psql "TU_DATABASE_URL_DE_RENDER" -f database/schema.sql
```
