# Sistema de Gestión de Solicitudes Académicas (Inscripciones)

## 1. Contexto del Proyecto
Este proyecto es una herramienta web desarrollada con **Vite + Svelte** para optimizar el proceso de inscripciones y modificaciones de carga académica en la Escuela de Ingeniería Informática de la UCAB.

**Problema Actual:**
Actualmente, el proceso se maneja en un archivo Excel compartido ("Excel Hell").
- **Redundancia:** Cada fila es una solicitud individual. Un estudiante puede enviar 5 solicitudes (filas) distintas, lo que dificulta ver su caso de forma integral.
- **Concurrencia:** Múltiples profesores editan el archivo a la vez.
- **Error Humano:** Dificultad para rastrear qué casos ya fueron atendidos si el estudiante repite la solicitud.

**Objetivo Principal:**
Transformar la vista plana del Excel en una **Vista Centrada en el Estudiante**. La aplicación debe agrupar todas las solicitudes bajo el número de Cédula del estudiante, permitiendo resolver su situación académica completa en un solo lugar.

---

## 2. Stack Tecnológico
- **Framework:** React (Vite)
- **Lenguaje:** TypeScript (Preferible) o JavaScript.
- **Estilos:** Tailwind CSS.
- **Manejo de Datos:** Procesamiento de CSV (Parseo de archivos planos a objetos JSON).

---

## 3. Lógica de Negocio y Reglas

### A. Estructura de Datos (Input)
El sistema se alimenta de un archivo `.csv` o `.xlsx` con las siguientes columnas exactas. La IA debe mapear estas columnas a propiedades del objeto:

| Columna Excel | Propiedad Sugerida | Descripción |
| :--- | :--- | :--- |
| **Estatus** | `status` | Estado actual del trámite. |
| **Clasif.** | `classification` | Departamento encargado. |
| **# de Caso** | `caseId` | ID único de la solicitud. |
| **Fecha** | `date` | Timestamp de la solicitud. |
| **Cédula** | `studentId` | **KEY PRINCIPAL PARA AGRUPAMIENTO.** |
| **Estudiante** | `studentName` | Nombre completo. |
| **Prom.** | `gpa` | Promedio de notas (Vital para prioridad). |
| **Acción** | `action` | `Agregar` o `Eliminar`. |
| **Nombre Asignatura**| `subject` | Materia solicitada. |
| **NRC** | `nrc` | Código numérico de la sección. |
| **Comentarios** | `comments` | Justificación del estudiante (CRÍTICO). |
| **Responsable** | `responsible` | Iniciales del profesor atendiendo (ej. HM, LM). |
| **Respuesta al Estudiante** | `response` | Texto final que se enviará. |

### B. Los 5 Estatus Posibles
El sistema debe permitir cambiar entre estos estados mediante un Dropdown:
1.  **POR REVISAR** (Default al importar).
2.  **SOLUCIONADO** (Verde).
3.  **NO PROCEDE** (Rojo - Ej. choque de horario o falta de cupo).
4.  **EN REVISIÓN** (Amarillo - Se está consultando con otra área).
5.  **REPETIDO/IGNORADO** (Gris - Solicitud duplicada).

### C. Clasificación de Departamentos
Se usa para filtrar la lista según quién esté usando la app:
- `IN`: Inglés
- `MC`: Materias Comunes (Física, Cálculo, etc.)
- `IS`: Ingeniería de Software
- `LP`: Lógica y Programación
- `TE`: Telemática
- `GE`: General
- `AT`: Apoyo a Toma de Decisiones
- `PP`: Prácticas Profesionales

---

## 4. Requerimientos Funcionales (Para el Agente)

### R1. Agrupación Inteligente (The "Student Card")
El sistema **NO** debe renderizar una tabla plana.
- Debe renderizar una lista de **Estudiantes**.
- Al hacer clic en un estudiante, se expande un panel (o modal) que muestra **todas** sus filas (solicitudes) ordenadas cronológicamente.
- **Indicadores visuales:** En la tarjeta cerrada del estudiante, mostrar contadores: *"3 Solicitudes (1 Pendiente)"*.

### R2. Filtros Rápidos
Barra lateral o superior con:
- Filtro por Departamento (`Clasif.`).
- Toggle para ocultar estudiantes con estatus "SOLUCIONADO" (para limpiar la vista).
- Buscador por Cédula o Nombre.

### R3. Edición y Persistencia
- La interfaz debe permitir editar el campo `Respuesta al Estudiante`, `Estatus` y `Responsable`.
- Debe existir un botón **"Exportar CSV"** que genere el archivo con la misma estructura original pero con los datos actualizados, listo para abrirse en Excel nuevamente.

---

## 5. Guía de Estilo (UI)
- **Diseño:** Institucional, Académico, Limpio.
- **Colores:** Usar paleta de azules oscuros y grises (Estilo universitario/corporativo).
- **Tipografía:** Sans-serif, legible para lectura densa de datos.
- **Feedback:** Badges de colores para los estatus para escaneo visual rápido.

## 6. Prompting Context (Para la IA)
*Si eres una IA leyendo esto:* Tu prioridad es la **integridad de los datos**. No inventes columnas nuevas. Asegúrate de que al exportar, el formato coincida con el de entrada para no romper la compatibilidad con el Excel administrativo de la universidad.
