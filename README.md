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
| 📊 **Dashboard Interactivo** | Estadísticas en tiempo real con gráficos de dona y tendencias |
| 📋 **Gestión de Solicitudes** | CRUD completo con filtros por departamento, estado y fecha |
| 👥 **Vista por Estudiante** | Agrupa todas las solicitudes de un estudiante en un solo expediente |
| 🔐 **Sistema de Roles** | Control de acceso basado en roles (Lector, Coordinador, Administrador) |
| 📝 **Auditoría de Cambios** | Registro completo de todas las modificaciones realizadas |
| 📥 **Exportación Excel** | Descarga de datos filtrados en formato .xlsx |
| 🎯 **Onboarding Interactivo** | Tour guiado para nuevos usuarios |
| 🌙 **Modo Oscuro** | Interfaz adaptable a preferencias del usuario |

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
├── src/
│   ├── assets/             # Recursos (imágenes, etc.)
│   ├── components/         # Componentes React
│   │   ├── DashboardOverview.tsx    # Panel principal con estadísticas
│   │   ├── RequestsView.tsx         # Vista de solicitudes
│   │   ├── StudentRecords.tsx       # Expedientes por estudiante
│   │   ├── UserManagement.tsx       # Gestión de usuarios (admin)
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
│   ├── App.tsx              # Componente raíz con routing
│   ├── main.tsx             # Punto de entrada
│   └── index.css            # Estilos globales
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
    PROFILES ||--o{ AUDIT_LOGS : "genera"
    PROFILES {
        uuid id PK "ID del usuario (auth.users)"
        text email "Correo electrónico"
        enum role "sin_asignar|lector|coordinador|administrador"
        text initials "Iniciales del nombre"
        text full_name "Nombre completo"
    }

    OBSERVACIONES ||--o{ AUDIT_LOGS : "registra cambios"
    OBSERVACIONES {
        int id PK "ID autoincremental"
        enum estatus "POR REVISAR|EN REVISIÓN|SOLUCIONADO|..."
        enum clasificacion "IN|MC|IS|LP|TE|GE|AT|PP"
        text caso "Número de caso único"
        timestamp fecha "Fecha de creación"
        int cedula "Cédula del estudiante"
        text estudiante "Nombre del estudiante"
        int uc "Unidades de crédito"
        text semestre "Semestre actual"
        float promedio "Promedio académico"
        bool autoriza "Autorización del estudiante"
        text accion "Agregar o Retirar"
        text asignatura "Nombre de la asignatura"
        int nrc "Número de referencia del curso"
        text comentarios "Comentarios del estudiante"
        text contacto "Información de contacto"
        text responsable "Coordinador asignado"
        text respuesta_interna "Notas internas"
        text respuesta_estudiante "Respuesta al estudiante"
    }

    AUDIT_LOGS {
        int id PK "ID autoincremental"
        timestamp created_at "Fecha del registro"
        uuid user_id FK "Usuario que realizó la acción"
        text case_id "ID del caso afectado"
        text action "Tipo de acción realizada"
        jsonb details "Detalles adicionales"
        jsonb changes "Cambios realizados (before/after)"
    }

    PROYECCIONES {
        int campus "Código del campus"
        text program "Programa académico"
        text majorcode "Código de especialidad"
        text subjectsemester "Semestre de la materia"
        text subjectid "Código de la materia"
        text subjectname "Nombre de la materia"
        text studentid "Cédula del estudiante"
        text studentname "Nombre del estudiante"
        text averagegradepoints "Promedio de notas"
        text accumulatedcredits "Créditos acumulados"
    }
```

### Descripción de Tablas

| Tabla | Propósito | Registros |
|-------|-----------|-----------|
| `profiles` | Almacena información de usuarios y sus roles en el sistema | Variable |
| `observaciones` | Registra todas las solicitudes/tickets de inscripción de estudiantes | ~755 |
| `audit_logs` | Mantiene un historial de todas las acciones realizadas en el sistema | Variable |
| `proyecciones` | Datos de proyección académica para consulta de expedientes | ~7,068 |

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

1. **profiles** - Se crea automáticamente con un trigger en `auth.users`
2. **observaciones** - Datos de solicitudes (se pobla automáticamente)
3. **audit_logs** - Se crea para rastrear cambios
4. **proyecciones** - Datos de proyección académica (actualización semestral)

### 📥 Fuentes de Datos

#### Observaciones (Automático)

La tabla `observaciones` se **pobla automáticamente** desde un formulario de Google Forms mediante un script de **Google Apps Script**. 

```mermaid
flowchart LR
    A[📝 Google Forms<br/>Formulario de Observaciones] -->|Trigger onSubmit| B[⚙️ Google Apps Script]
    B -->|INSERT via API| C[(🗄️ Supabase<br/>observaciones)]
    C -->|Consulta| D[🖥️ React App]

    style A fill:#4285f4,stroke:#1a73e8,color:#fff
    style B fill:#f9ab00,stroke:#e37400,color:#000
    style C fill:#3fcf8e,stroke:#24b47e,color:#fff
    style D fill:#61dafb,stroke:#21a0c9,color:#000
```

> [!IMPORTANT]
> El script de Apps Script debe estar configurado con las credenciales de Supabase y un trigger `onFormSubmit` para sincronizar automáticamente las nuevas observaciones.

#### Proyecciones (Semestral)

La tabla `proyecciones` contiene datos de proyección académica de los estudiantes y debe **actualizarse cada inicio de semestre**:

1. Exportar datos de proyección desde el sistema académico institucional
2. Limpiar la tabla existente (opcional, según política de retención)
3. Importar el nuevo archivo CSV/Excel a Supabase

```bash
# Ejemplo: Importar proyecciones usando Supabase CLI
supabase db import --table proyecciones --file proyecciones_202601.csv
```

> [!NOTE]
> Los datos de proyecciones son utilizados para enriquecer los expedientes de estudiantes y no son modificados por la aplicación.


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
