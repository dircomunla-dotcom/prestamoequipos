# Sistema de Gestión de Préstamo de Equipamiento Audiovisual
### Secretaría de Cultura y Comunicación — Universidad Nacional de Lanús (UNLa)

Aplicación web integral diseñada para la gestión, reserva, seguimiento y control de inventario del equipamiento audiovisual de la UNLa (cámaras de cine, ópticas, microfonía, consolas de streaming, trípodes, paneles LED y accesorios).

---

## 🚀 Características Principales

### Para Solicitantes (Docentes, Nodocentes y Estudiantes)
- **Reserva en menos de 3 minutos:** Selección de fechas, catálogo en vivo y formulario guiado por pasos.
- **Kits Predefinidos:** "Kit Entrevista", "Kit Streaming" y "Kit Registro de Evento" añadibles en 1 clic.
- **Disponibilidad en tiempo real:** Cálculo continuo considerando reservas activas, margen de revisión de 24 hs y bloqueos institucionales.
- **Seguimiento transparente:** Consulta inmediata por código `PRE-2026-XXXX` y línea de tiempo de estados.
- **Acta de Préstamo oficial en PDF:** Descarga de documento formal listo para imprimir y firmar.

### Para la Administración (Secretaría de Cultura y Comunicación)
- **Panel de Hoy (Dashboard):** 6 tarjetas métricas accionables (*Pendientes*, *Retiros*, *Devoluciones*, *Atrasados*, *En mantenimiento*, *Bloqueos*).
- **Acciones en menos de 3 clics:** Aprobación/rechazo de solicitudes, entregas y reintegros directos desde la lista.
- **Checklist digital de entrega y devolución:** Verificación de DNI físico, control de estado técnico de cada equipo y sus accesorios (OK, con detalle, faltante, dañado).
- **Módulo de Bloqueos Institucionales:** Creación de reservas internas por evento, uso propio o mantenimiento en 1 paso, con detección obligatoria de colisiones y advertencia visual.
- **Calendario Gantt:** Diagrama de ocupación por equipo para detectar huecos y programar coberturas.
- **Inventario y Etiquetas QR:** Generador de etiquetas QR imprimibles por equipo.
- **Reportes e Indicadores:** Ranking de equipamiento más demandado, distribución por departamento de la UNLa y exportación a CSV.

---

## 🛠️ Stack Tecnológico

- **Framework Web:** Next.js 16+ (App Router con React 19 y TypeScript).
- **Estilos:** Tailwind CSS con tokens institucionales UNLa (paleta sobria violeta/azul `#4F46E5`, neutros cálidos y accesibilidad WCAG AA).
- **Base de Datos & ORM:** Prisma ORM con SQLite para desarrollo y modo demo portátil, con compatibilidad directa con PostgreSQL para producción.
- **Almacenamiento Persistente:** Repositorio JSON transaccional en `data/db.json` con auto-sembrado inicial.
- **Autenticación:**
  - Login con Google restringido a cuentas `@unla.edu.ar`.
  - Enlace mágico por correo electrónico.
  - **Modo Demo integrado:** selector instantáneo de usuario (Solicitante, Administrador, Superadministrador) en la barra superior.
- **Documentos:** Generador nativo de Actas de Préstamo en PDF (jsPDF).
- **Notificaciones:** Despachador de emails transaccionales con bandeja virtual de prueba y log en consola.

---

## 📋 Requisitos Previos

- **Node.js:** Versión 18 o superior (probado en Node v20 y v24).
- **NPM:** Versión 9 o superior (o Yarn / PNPM).
- **Docker y Docker Compose** (opcional, para despliegue en contenedores).

---

## 💻 Instalación y Puesta en Marcha Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/unla/prestamo-equipamiento-audiovisual.git
cd prestamoequipos
```

### 2. Instalar dependencias
```bash
npm install --legacy-peer-deps
```

### 3. Configurar variables de entorno
Copiá el archivo de ejemplo:
```bash
cp .env.example .env
```

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```

Abrí tu navegador en [http://localhost:3000](http://localhost:3000). La aplicación iniciará automáticamente con el **Modo Demo activo** y todo el inventario de 30 equipos y 10 pedidos de prueba cargados.

---

## 👤 Usuarios de Demostración Disponibles

Podés alternar entre los distintos perfiles con un clic en la barra superior:

| Rol | Nombre | Email | Departamento |
| :--- | :--- | :--- | :--- |
| **Solicitante** | Lic. Martín Rossi | `martin.rossi@unla.edu.ar` | Dpto. Humanidades y Artes (Docente) |
| **Administrador** | Lic. Laura Gómez | `laura.gomez@unla.edu.ar` | Secretaría de Cultura y Comunicación |
| **Superadministrador** | Ing. Carlos Menéndez | `carlos.menendez@unla.edu.ar` | Secretaría de Cultura y Comunicación |

Para restablecer los datos al estado inicial de fábrica en cualquier momento, presioná el botón **"Reiniciar datos"** en la barra superior de demostración.

---

## ⚙️ Configuración en Producción

### 1. Restringir Google OAuth al dominio `@unla.edu.ar`
En tu consola de Google Cloud:
1. Creá credenciales OAuth 2.0 Web Application.
2. Agregá como redirect URI: `https://tu-dominio.unla.edu.ar/api/auth/callback/google`.
3. En tu archivo `.env` configurá:
```env
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
ALLOWED_GOOGLE_DOMAIN="unla.edu.ar"
```

### 2. Configuración de Correo SMTP
Para enviar correos electrónicos reales a los solicitantes y administradores:
```env
SMTP_HOST="smtp.unla.edu.ar"
SMTP_PORT="587"
SMTP_USER="notificaciones.audiovisual@unla.edu.ar"
SMTP_PASS="tu-password-seguro"
SMTP_FROM="Secretaría de Cultura y Comunicación UNLa <prestamos-audiovisual@unla.edu.ar>"
```

### 3. Despliegue con Docker y Docker Compose
```bash
docker compose up -d --build
```
El contenedor expondrá la aplicación en el puerto `3000`, persistiendo la base de datos en el volumen `unla_data`.

---

## 💾 Procedimiento de Backup

La base de datos y los registros de auditoría se almacenan en el directorio `data/`:

### Generar copia de seguridad:
```bash
tar -czvf backup_prestamos_$(date +%Y%m%d).tar.gz data/
```

### Restaurar copia de seguridad:
```bash
tar -xzvf backup_prestamos_20261027.tar.gz
```

---

## 🧪 Ejecución de Tests Unitarios

Para verificar que todas las reglas de negocio (margen de 24 hs, solapamientos, stock de unidades, bloqueos recurrentes, restricciones de rol y detección de colisiones) funcionen correctamente:

```bash
node --test tests/business-rules.test.mjs
```

---

## 📄 Licencia y Créditos

Desarrollado para la **Secretaría de Cultura y Comunicación** de la **Universidad Nacional de Lanús (UNLa)**, Argentina.  
*Remedios de Escalada, Lanús, Provincia de Buenos Aires.*
