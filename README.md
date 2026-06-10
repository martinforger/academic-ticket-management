# 🎓 Sistema de Gestión de Observaciones Académicas

Sistema web para la gestión y seguimiento de observaciones de inscripción académica de la Escuela de Ingeniería Informática. Permite a coordinadores y administradores revisar, clasificar y resolver solicitudes estudiantiles de manera eficiente.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Características Principales

| Funcionalidad | Descripción |
|---------------|-------------|
| 📊 **Dashboard Interactivo** | Estadísticas en tiempo real con gráficos de dona, métricas clave y registro de actividad |
| 📋 **Gestión de Solicitudes** | CRUD completo con filtros por departamento, estado, responsable, buscador y asignación automática |
| 👥 **Vista por Estudiante** | Agrupa todas las solicitudes de un estudiante en un solo expediente para ver su historial académico completo |
| 📅 **Constructor de Horarios** | Herramienta gráfica interactiva para que estudiantes armen su horario ideal, resuelvan colisiones visuales de secciones y guarden sus selecciones de manera persistente |
| 📤 **Carga y Gestión Masiva** | Panel administrativo para importar y gestionar semestres, materias, proyecciones y horarios desde archivos Excel/CSV |
| 🛠️ **Utilidades Académicas** | Herramientas de balanceo de secciones (algoritmo multi-nivel de reubicación), cierre de secciones (simulador de reubicación automática de alumnos) y auditoría de proyecciones |
| 🔐 **Sistema de Roles** | Control de acceso basado en roles (Lector, Coordinador, Administrador) con restricciones a nivel de frontend y políticas RLS en base de datos |
| 📝 **Auditoría de Cambios** | Registro automático de auditoría en la base de datos para todas las modificaciones críticas de solicitudes o roles |
| 📥 **Exportación Excel** | Descarga de reportes filtrados y propuestas de balanceo/cierre de secciones en formato Excel (.xlsx) |
| 🎯 **Onboarding Interactivo** | Tour guiado paso a paso para facilitar la adopción por parte de coordinadores nuevos |
| 🌙 **Modo Oscuro** | Interfaz adaptable y pulida compatible con preferencias del sistema y usuario |

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2** - Biblioteca de UI con las últimas características
- **TypeScript 5.9** - Tipado estático para mayor robustez
- **Vite 7.2** - Build tool ultrarrápido con HMR
- **TailwindCSS 3.4** - Framework CSS utility-first
- **Material Symbols** - Iconografía moderna de Google

### Backend (Supabase)
- **Supabase Auth** - Autenticación segura con email/password
- **PostgreSQL 17** - Base de datos relacional robusta
- **Row Level Security (RLS)** - Políticas de seguridad a nivel de fila

### Librerías Adicionales
- **@supabase/supabase-js** - Cliente oficial de Supabase
- **xlsx** - Generación de archivos Excel

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Despliegue

```mermaid
flowchart TB
    subgraph Cliente["🖥️ Cliente (Browser)"]
        React["React App<br/>TypeScript + Vite"]
    end

    subgraph Supabase["☁️ Supabase Cloud"]
        Auth["🔐 Auth Service<br/>JWT + Sessions"]
        DB["🗄️ PostgreSQL<br/>Database"]
        RLS["🛡️ Row Level Security<br/>Policies"]
    end

    subgraph Hosting["🌐 Hosting"]
        CDN["Vercel / Netlify<br/>Static Files"]
    end

    React -->|HTTPS| CDN
    React -->|API Calls| Auth
    React -->|Queries| DB
    Auth -->|Validates| RLS
    DB -->|Enforces| RLS

    style Cliente fill:#1a1a2e,stroke:#16213e,color:#fff
    style Supabase fill:#1e3a5f,stroke:#3fcf8e,color:#fff
    style Hosting fill:#2d2d44,stroke:#646cff,color:#fff
```

### Estructura del Proyecto

```
academic-ticket-management/
├── public/                  # Archivos estáticos
├── shortcodes/              # Herramientas y páginas estáticas HTML/JS standalone (integrables externamente)
│   ├── enrollment-recommendations.html # Constructor interactivo de horarios y visualizador de materias por semestre
│   ├── formulario_observaciones.html   # Formulario inteligente para radicar observaciones/solicitudes de estudiantes
│   ├── enrollment-responses.html       # Visualizador estático de respuestas a solicitudes
│   ├── subject-schedule.html           # Buscador simple de horarios y materias
│   └── test-builder.html               # Sandbox/entorno experimental del constructor de horarios
├── src/
│   ├── assets/             # Recursos (imágenes, etc.)
│   ├── components/         # Componentes React (SPA)
│   │   ├── DashboardOverview.tsx    # Panel principal con estadísticas
│   │   ├── RequestsView.tsx         # Vista de solicitudes (CRUD + Auditoría)
│   │   ├── StudentRecords.tsx       # Expedientes por estudiante
│   │   ├── UserManagement.tsx       # Gestión de usuarios (admin)
│   │   ├── UploadProjections.tsx    # Panel de administración e importación de datos
│   │   ├── SectionBalancing.tsx     # Utilidad de Balanceo de Secciones
│   │   ├── SectionClosing.tsx       # Utilidad de Cierre de Secciones
│   │   ├── ProjectionAudit.tsx      # Utilidad de Auditoría de Proyecciones
│   │   ├── MateriaModal.tsx         # Modal de gestión individual de materias
│   │   ├── LoginPage.tsx            # Página de login
│   │   ├── RegisterPage.tsx         # Página de registro
│   │   ├── PendingApprovalPage.tsx  # Página de espera de aprobación
│   │   ├── OnboardingTour.tsx       # Tour de bienvenida
│   │   ├── NavigationSidebar.tsx    # Barra de navegación lateral
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx  # Contexto de autenticación global
│   ├── lib/
│   │   └── supabase.ts      # Cliente de Supabase configurado
│   ├── utils/
│   │   └── dataUtils.ts     # Funciones de transformación de datos
│   ├── types.ts             # Definiciones de tipos TypeScript
│   ├── App.tsx              # Componente raíz con routing reactivo (basado en estados)
│   ├── main.tsx             # Punto de entrada
│   └── index.css            # Estilos globales y tokens
├── .env                     # Variables de entorno (no versionado)
├── package.json             # Dependencias y scripts
├── tailwind.config.js       # Configuración de TailwindCSS
├── tsconfig.json            # Configuración de TypeScript
└── vite.config.ts           # Configuración de Vite
```

---

## 📊 Modelo de Datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    profiles {
        uuid id PK "auth.users ID"
        text email "Correo electrónico"
        user_role role "Rol de usuario"
        text initials "Iniciales"
        text full_name "Nombre completo"
        timestamp created_at "Fecha creación"
    }

    audit_logs {
        bigint id PK "Generado por defecto"
        timestamp created_at "Fecha del registro"
        uuid user_id FK "auth.users ID"
        text case_id "ID del caso"
        text action "Acción realizada"
        jsonb details "Detalles en JSON"
        jsonb changes "Cambios en JSON"
    }

    carrera {
        int car_id PK "Autoincremental"
        varchar car_nombre "Nombre de carrera (Único)"
        varchar car_codigo "Código de carrera (Único)"
        text car_clasificacion_grado "Clasificación de grado"
        text car_cod_corto "Código corto de carrera"
    }

    estudiante {
        int est_id PK "Autoincremental"
        int est_cedula "Cédula (Único)"
        text est_nombre "Nombre completo"
        char est_ubic_sem "Ubicación semestral"
        char est_cumplimiento "Cumplimiento"
        numeric est_promedio "Promedio"
        int est_creditos_acum "Créditos acumulados"
        int est_cod_campus "Código de campus"
        varchar est_genero "Género"
        text est_correo "Correo electrónico"
        int est_car_id_fk FK "carrera ID"
    }

    materia {
        int mat_id PK "Autoincremental"
        text mat_cod "Código de materia (Único)"
        text mat_departamento "Departamento"
        text mat_nombre "Nombre de la materia"
        int mat_creditos "Unidades de crédito"
        text mat_taxonomia "Taxonomía"
        int mat_horas_teoria "Horas teoría"
        int mat_horas_practica "Horas práctica"
        int mat_horas_lab "Horas laboratorio"
        int mat_horas_est_indep "Horas est. indep."
        text mat_modality "Modalidad (P|V)"
        boolean mat_is_requirement "Materia requisito"
    }

    materia_carrera {
        int id PK "Autoincremental"
        int materia_id FK "materia ID"
        int carrera_id FK "carrera ID"
        boolean mat_sec_is_elective "Es electiva"
        text mat_car_semestre "Semestre en carrera"
    }

    observacion {
        int obs_id PK "Autoincremental"
        Estatus obs_estatus "Estatus de observación"
        Clasificacion obs_clasificacion "Clasificación"
        text obs_num_caso "Número de caso único"
        timestamp obs_fecha "Fecha de registro"
        boolean obs_autoriza "Autorización estudiante"
        text obs_accion "Acción"
        text obs_comentarios "Comentarios"
        text obs_responsable "Responsable"
        text obs_respuesta_interna "Respuesta interna"
        text obs_respuesta_externa "Respuesta externa"
        int est_id FK "estudiante ID"
        int mat_id FK "materia ID"
        int obs_nrc_solicitado "NRC solicitado"
        int obs_semester FK "semestre ID"
    }

    proyeccion {
        int proy_id PK "Autoincremental"
        int proy_intentos "Intentos de cursado"
        int est_id FK "estudiante ID"
        int mat_id FK "materia ID"
        int sem_id FK "semestre ID"
        int proy_car_id FK "carrera ID"
    }

    seccion {
        bigint sec_id PK "Generado por defecto"
        int sec_nrc "NRC de sección (Único)"
        int sec_numero "Número de sección"
        text sec_inscritos "Estudiantes inscritos"
        text sec_cupo "Cupo máximo"
        text sec_profesor "Nombre del profesor"
        text sec_hor_lun "Horario Lunes"
        text sec_hor_mar "Horario Martes"
        text sec_hor_mie "Horario Miércoles"
        text sec_hor_jue "Horario Jueves"
        text sec_hor_vie "Horario Viernes"
        text sec_hor_sab "Horario Sábado"
        text sec_hor_dom "Horario Domingo"
        int sec_mat_id FK "materia ID"
        boolean sec_is_displayed_on_web "Visible en web"
        int sec_sem FK "semestre ID"
    }

    semestre {
        int sem_id PK "Autoincremental"
        text sem_nombre "Nombre descriptivo de periodo"
        boolean sem_is_active "Es semestre activo"
        text TERM "Código TERM"
    }

    profiles ||--|| auth_users : "references"
    audit_logs }o--|| auth_users : "logged_by"
    carrera ||--o{ estudiante : "has"
    carrera ||--o{ materia_carrera : "includes"
    carrera ||--o{ proyeccion : "includes"
    estudiante ||--o{ proyeccion : "has"
    estudiante ||--o{ observacion : "makes"
    materia ||--o{ materia_carrera : "associated_with"
    materia ||--o{ proyeccion : "projected_in"
    materia ||--o{ seccion : "has"
    materia ||--o{ observacion : "requested_in"
    semestre ||--o{ proyeccion : "applies_to"
    semestre ||--o{ observacion : "applies_to"
    semestre ||--o{ seccion : "applies_to"
```

### Descripción de Tablas

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Almacena información de usuarios y sus roles en el sistema (Lector, Coordinador, Administrador) |
| `carrera` | Catálogo maestro de carreras universitarias y programas (tanto Majors como Minors) |
| `estudiante` | Listado maestro de estudiantes con su información académica, promedio, créditos acumulados y carrera asociada |
| `materia` | Listado maestro de asignaturas con sus créditos, taxonomía, distribución de horas, modalidad y prerrequisitos |
| `materia_carrera` | Relación intermedia que define a qué carreras pertenece cada materia, el semestre sugerido y si es electiva |
| `seccion` | Registro detallado de cada sección/NRC de materias, incluyendo cupos, inscritos, profesor y sus horarios semanales por bloque |
| `semestre` | Control de periodos académicos (semestres ordinarios e intensivos) y su estado activo actual |
| `proyeccion` | Tabla intermedia de intersección que define la proyección de una materia para un estudiante en un semestre y carrera específicos |
| `observacion` | Registra todas las solicitudes y observaciones hechas por los estudiantes relativas a una materia, sección, estudiante y semestre |
| `audit_logs` | Mantiene una bitácora detallada de todas las acciones de edición y cambios de roles para auditoría |

### Enumeraciones (ENUMs)

**Estatus de Solicitud:**
- `POR REVISAR` - Nueva solicitud pendiente de revisión
- `EN REVISIÓN` - Siendo evaluada por un coordinador
- `SOLUCIONADO` - Resuelta satisfactoriamente
- `NO PROCEDE` - Rechazada por no cumplir requisitos
- `REPETIDO` - Duplicado de otra solicitud
- `IGNORADO` - Descartada sin acción
- `REVISADO` - Revisada pero sin acción específica

**Clasificación por Departamento:**
- `IN` - Ingeniería Informática
- `MC` - Matemáticas y Computación
- `IS` - Ingeniería de Sistemas
- `LP` - Lenguajes de Programación
- `TE` - Tecnología
- `GE` - General
- `AT` - Atención al Estudiante
- `PP` - Prácticas Profesionales

**Roles de Usuario:**
- `sin_asignar` - Usuario nuevo pendiente de aprobación
- `lector` - Solo puede visualizar información
- `coordinador` - Puede gestionar solicitudes de su área
- `administrador` - Acceso completo al sistema

---

## 🔐 Flujos de Autenticación

### Flujo de Registro de Usuario

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant App as React App
    participant Auth as Supabase Auth
    participant DB as PostgreSQL
    participant Email as Email Service

    Usuario->>App: Completa formulario de registro
    App->>Auth: signUp(email, password, metadata)
    Auth->>DB: Crea usuario en auth.users
    Auth->>DB: Trigger crea perfil en profiles<br/>(role: sin_asignar)
    Auth->>Email: Envía email de confirmación
    Auth-->>App: Retorna sesión (pendiente confirmación)
    App-->>Usuario: Muestra mensaje de éxito
    
    Note over Usuario,Email: El usuario debe confirmar su email
    
    Usuario->>Email: Click en enlace de confirmación
    Email->>Auth: Verifica token
    Auth->>DB: Actualiza email_confirmed_at
    Auth-->>Usuario: Redirige a la aplicación
```

### Flujo de Inicio de Sesión

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant App as React App
    participant Auth as Supabase Auth
    participant DB as PostgreSQL
    participant Context as AuthContext

    Usuario->>App: Ingresa email y contraseña
    App->>Auth: signInWithPassword(email, password)
    
    alt Credenciales válidas
        Auth-->>App: Retorna Session + User
        App->>Context: Actualiza estado de sesión
        Context->>DB: SELECT * FROM profiles WHERE id = user.id
        DB-->>Context: Retorna perfil del usuario
        
        alt role = "sin_asignar"
            Context-->>App: Usuario sin rol asignado
            App-->>Usuario: Muestra PendingApprovalPage
        else role != "sin_asignar"
            Context-->>App: Usuario aprobado
            
            alt Primera vez (showOnboarding)
                App-->>Usuario: Muestra OnboardingTour
            else Usuario recurrente
                App-->>Usuario: Muestra Dashboard
            end
        end
    else Credenciales inválidas
        Auth-->>App: Error de autenticación
        App-->>Usuario: Muestra mensaje de error
    end
```

### Flujo de Aprobación de Cuenta (Admin)

```mermaid
flowchart TD
    A[👤 Nuevo Usuario Registrado] -->|role: sin_asignar| B[📋 Aparece en UserManagement]
    B --> C{¿Admin aprueba?}
    
    C -->|Sí| D[Admin selecciona rol]
    D --> E[UPDATE profiles SET role = nuevo_rol]
    E --> F[✅ Usuario puede acceder al sistema]
    
    C -->|No| G[❌ Usuario permanece en espera]
    G --> H[Muestra PendingApprovalPage]
    
    style A fill:#fbbf24,stroke:#f59e0b,color:#000
    style F fill:#22c55e,stroke:#16a34a,color:#fff
    style H fill:#ef4444,stroke:#dc2626,color:#fff
```

### Matriz de Permisos por Rol

| Funcionalidad | sin_asignar | lector | coordinador | administrador |
|---------------|:-----------:|:------:|:-----------:|:-------------:|
| Ver Dashboard | ❌ | ✅ | ✅ | ✅ |
| Ver Solicitudes | ❌ | ✅ | ✅ | ✅ |
| Editar Solicitudes | ❌ | ❌ | ✅ | ✅ |
| Ver Estudiantes | ❌ | ✅ | ✅ | ✅ |
| Gestionar Usuarios | ❌ | ❌ | ❌ | ✅ |
| Exportar Excel | ❌ | ✅ | ✅ | ✅ |

---

## 📈 Flujos de Negocio

### Ciclo de Vida de una Solicitud

```mermaid
stateDiagram-v2
    [*] --> POR_REVISAR: Estudiante envía solicitud

    POR_REVISAR --> EN_REVISION: Coordinador abre caso
    POR_REVISAR --> IGNORADO: Sin relevancia
    POR_REVISAR --> REPETIDO: Duplicado detectado

    EN_REVISION --> SOLUCIONADO: Aprobada y procesada
    EN_REVISION --> NO_PROCEDE: No cumple requisitos
    EN_REVISION --> REVISADO: Revisado sin acción
    EN_REVISION --> POR_REVISAR: Devuelto para más info

    SOLUCIONADO --> [*]
    NO_PROCEDE --> [*]
    REVISADO --> [*]
    IGNORADO --> [*]
    REPETIDO --> [*]
```

**Leyenda de Estados:**
| Estado | Color | Descripción |
|--------|-------|-------------|
| `POR_REVISAR` | 🟡 Amarillo | Nueva solicitud pendiente |
| `EN_REVISION` | 🔵 Azul | Siendo evaluada |
| `SOLUCIONADO` | 🟢 Verde | Resuelta satisfactoriamente |
| `NO_PROCEDE` | 🔴 Rojo | Rechazada |
| `REVISADO` | 🩶 Gris | Revisada sin acción específica |
| `REPETIDO` | ⚪ Gris claro | Duplicado |
| `IGNORADO` | ⚪ Gris claro | Descartada |


### Flujo de Gestión de Solicitudes

```mermaid
sequenceDiagram
    autonumber
    actor Coord as Coordinador
    participant App as RequestsView
    participant Modal as RequestDetailModal
    participant DB as PostgreSQL
    participant Audit as audit_logs

    Coord->>App: Abre vista de solicitudes
    App->>DB: SELECT * FROM observaciones
    DB-->>App: Lista de solicitudes
    App-->>Coord: Muestra tabla con filtros

    Coord->>App: Click en una solicitud
    App->>Modal: Abre modal de detalle
    
    Note over Modal: Auto-claim si no hay responsable
    Modal->>DB: UPDATE observaciones SET responsable = usuario
    
    Coord->>Modal: Modifica campos (estado, respuesta, etc.)
    Coord->>Modal: Click "Guardar Cambios"
    
    Modal->>DB: UPDATE observaciones SET ...
    Modal->>Audit: INSERT INTO audit_logs (action, changes, ...)
    
    DB-->>Modal: Confirmación
    Modal-->>App: Actualiza lista local
    App-->>Coord: Muestra solicitud actualizada
```

### Flujo del Dashboard

```mermaid
flowchart LR
    subgraph Carga["📊 Carga Inicial"]
        A[Componente Monta] --> B[fetchData]
        B --> C[get_dashboard_stats RPC]
        C --> D[Estadísticas calculadas]
    end

    subgraph Stats["📈 Estadísticas"]
        D --> E[Total Estudiantes]
        D --> F[Solicitudes Activas]
        D --> G[Tasa de Resolución]
        D --> H[Casos Urgentes]
    end

    subgraph Charts["📉 Gráficos"]
        D --> I[Donut por Departamento]
        D --> J[Top Responsables]
        D --> K[Tendencia Semanal]
    end

    subgraph Logs["📝 Actividad"]
        L[fetchLogs] --> M[audit_logs recientes]
        M --> N[Timeline de actividad]
    end

    style Carga fill:#1e3a5f,stroke:#3fcf8e,color:#fff
    style Stats fill:#2d2d44,stroke:#fbbf24,color:#fff
    style Charts fill:#1a1a2e,stroke:#3b82f6,color:#fff
    style Logs fill:#2d2d44,stroke:#8b5cf6,color:#fff
```

### Flujo de Vista por Estudiante

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario
    participant SR as StudentRecords
    participant Utils as dataUtils
    participant Modal as StudentDetailModal

    User->>SR: Navega a "Estudiantes"
    SR->>SR: fetchRequests()
    SR->>Utils: groupRequestsByStudent(requests)
    
    Note over Utils: Agrupa solicitudes por cédula<br/>Calcula totales y pendientes
    
    Utils-->>SR: Array de StudentSummary
    SR-->>User: Muestra tabla de estudiantes

    User->>SR: Aplica filtros (depto, semestre, estado)
    SR->>SR: useMemo filtra solicitudes
    SR->>Utils: Re-agrupa con filtros
    SR-->>User: Actualiza tabla

    User->>SR: Click en estudiante
    SR->>Modal: Abre expediente completo
    Modal-->>User: Lista todas las solicitudes del estudiante
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x o **pnpm** >= 8.x
- Cuenta en [Supabase](https://supabase.com) (plan gratuito disponible)

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

> [!NOTE]
> Las credenciales de Supabase se obtienen desde el dashboard del proyecto en:
> **Settings → API → Project URL** y **Project API keys (anon/public)**

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/academic-ticket-management.git
cd academic-ticket-management

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 📦 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| **dev** | `npm run dev` | Inicia servidor de desarrollo con HMR |
| **build** | `npm run build` | Compila TypeScript y genera bundle de producción |
| **preview** | `npm run preview` | Sirve el build de producción localmente |
| **lint** | `npm run lint` | Ejecuta ESLint para análisis de código |

### Ejemplo de Uso

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Previsualizar build
npm run preview
```

---

## 🌐 Despliegue

### Despliegue en Vercel (Recomendado)

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno en el dashboard de Vercel
3. El despliegue será automático con cada push a `main`

```bash
# Configuración en vercel.json (opcional)
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Despliegue en Netlify

1. Conectar repositorio en [netlify.com](https://netlify.com)
2. Configurar:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Agregar variables de entorno en Site settings

### Build Manual

```bash
# Generar build optimizado
npm run build

# Los archivos estáticos estarán en ./dist
# Subir contenido de dist/ a cualquier hosting estático
```

---

## 🔧 Configuración de Supabase

### Tablas Requeridas

El sistema requiere las siguientes tablas en Supabase:

1. **profiles** - Tabla de perfiles de usuario, creada automáticamente con un trigger en `auth.users`.
2. **observacion** - Registros de solicitudes y observaciones de estudiantes.
3. **audit_logs** - Bitácora de cambios para auditoría de acciones del personal.
4. **proyeccion** - Datos de proyección académica por estudiante.
5. **carrera** - Catálogo maestro de carreras y programas académicos (Majors y Minors).
6. **materia** - Catálogo maestro de asignaturas con sus créditos, taxonomías y horas.
7. **materia_carrera** - Relación de asignaturas pertenecientes a cada carrera (incluyendo electivas).
8. **semestre** - Registro de periodos académicos (semestres e intensivos) con indicación de cuál es el periodo activo.

### 📥 Entrada de Observaciones (Estudiantes)

Las observaciones y solicitudes de ajuste de NRC son radicadas directamente por los estudiantes usando el formulario web independiente en el shortcode: [formulario_observaciones.html](file:///c:/Users/luisr/dev/academic-ticket-management/shortcodes/formulario_observaciones.html).

```mermaid
flowchart LR
    A[🖥️ Alumno<br/>Formulario de Observaciones] -->|Inserta vía cliente JS| B[(🗄️ Supabase<br/>observacion)]
    B -->|Consulta reactiva| C[🖥️ React App<br/>RequestsView]

    style A fill:#4285f4,stroke:#1a73e8,color:#fff
    style B fill:#3fcf8e,stroke:#24b47e,color:#fff
    style C fill:#61dafb,stroke:#21a0c9,color:#000
```

> [!NOTE]
> Este formulario realiza la carga dinámica de los datos del estudiante y sus materias proyectadas directamente desde la base de datos al validar su cédula, permitiéndole elegir de forma interactiva la acción a solicitar. En caso de no existir datos o proyección cargada, le permite auto-registrarse de manera sencilla.

#### Datos Académicos y Carga Masiva (Panel de Datos - Admin)

El sistema permite a los administradores cargar y sincronizar los datos maestros directamente desde la interfaz web en la sección **Datos** sin requerir CLI o acceso directo al motor de base de datos:

1. **Carga de Proyecciones (Semestral)**:
   - Se realiza al inicio de cada periodo académico.
   - Se selecciona la carrera y periodo académico correspondientes.
   - El archivo Excel/CSV debe contener las columnas `studentId`, `averageGradePoints`, `accumulatedCredits`, `subjectId` y `attempts`.
   - La base de datos ejecuta el stored procedure `upload_proyecciones`, el cual limpia de manera atómica las proyecciones previas del periodo y carrera seleccionados antes de insertar los nuevos registros.

2. **Carga de Horarios**:
   - Importa el archivo de planificación de secciones y horarios de la carrera en el periodo.
   - El archivo CSV debe usar delimitador de punto y coma `;` y tener las columnas de horarios estándar (LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO, SSBSECT_CRN, SSBSECT_SUBJ_CODE, SSBSECT_CRSE_NUMB, PROFESOR, SECCION, INSCRITOS, CUPO).
   - Utiliza el stored procedure `upload_horarios_programa`, limpiando previamente los horarios de la carrera y periodo seleccionados.

3. **Carga de Estudiantes General**:
   - Sincroniza el listado maestro de estudiantes del sistema académico institucional.
   - Procesa archivos CSV grandes por lotes de 500 registros usando el stored procedure `upload_estudiantes_general`.

4. **Creación y Activación de Semestres (Periodos / TERM)**:
   - Permite a los administradores registrar nuevos periodos (ej. `202625` para Sem Mar/Jul 2025-26) y seleccionar cuál periodo se define como el periodo activo del sistema para las solicitudes y simulaciones.

5. **Catálogo de Materias**:
   - Listado maestro y completo de asignaturas en el que se pueden buscar, crear o editar detalles como créditos, taxonomía, distribución de horas (teoría, práctica, laboratorio, independiente), modalidad y dependencias.


### Trigger para Crear Perfiles

```sql
-- Crear función para nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, initials, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'sin_asignar',
    UPPER(SUBSTRING(NEW.email FROM 1 FOR 2)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Función RPC para Dashboard

```sql
-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
  -- Ver implementación en migraciones del proyecto
$$ LANGUAGE plpgsql;
```

---

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Añade nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

---

## 📄 Licencia

Este proyecto es de uso interno para la Escuela de Ingeniería Informática.

---

<div align="center">

**Desarrollado con ❤️ para la Escuela de Ingeniería Informática**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)](https://supabase.com)

</div>
