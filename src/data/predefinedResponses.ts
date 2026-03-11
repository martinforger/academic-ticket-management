// Predefined response templates for student communications
// These templates avoid mentioning specific NRCs to prevent issues with section balancing

export interface PredefinedResponse {
  id: string;
  category: string;
  label: string;
  text: string;
}

export const PREDEFINED_RESPONSES: PredefinedResponse[] = [
  // Category: Agregar (exitosa)
  {
    id: 'add-success-1',
    category: 'Agregar (Exitosa)',
    label: 'Inscripción exitosa con cupo',
    text: 'La asignatura solicitada fue inscrita satisfactoriamente. Hemos añadido la asignatura solicitada a tu horario en una sección que tenía cupos disponibles.'
  },
  {
    id: 'add-success-2',
    category: 'Agregar (Exitosa)',
    label: 'Inscripción exitosa (corto)',
    text: '¡Saludos! Fuiste inscrito en la asignatura solicitada en la sección con cupo disponible.'
  },
  {
    id: 'add-success-3',
    category: 'Agregar (Exitosa)',
    label: 'Inscripción exitosa (mínimo)',
    text: '¡Saludos! Fuiste inscrito en la asignatura solicitada.'
  },

  // Category: Agregar (fallida por cupos)
  {
    id: 'add-fail-cupo-1',
    category: 'Sin Cupo',
    label: 'Sin cupos disponibles',
    text: '¡Saludos! La asignatura solicitada no pudo ser inscrita dado que no tenía cupo disponible para Ing. Informática.'
  },
  {
    id: 'add-fail-cupo-2',
    category: 'Sin Cupo',
    label: 'Sin cupos, invitar a reintentar',
    text: 'Lamentablemente, la asignatura solicitada no tiene cupos disponibles. Si deseas seguir inscribiéndola, llena nuevamente el formulario indicando tu intención de ser inscrito y se te asignará en una sección con cupo disponible.'
  },

  // Category: Agregar (fallida por prerrequisitos)
  {
    id: 'add-fail-prereq-1',
    category: 'Prerrequisitos',
    label: 'Falta prerrequisito (genérico)',
    text: 'Lamentablemente no se pudo procesar tu solicitud, ya que aún no has aprobado el prerrequisito correspondiente de la asignatura.'
  },
  {
    id: 'add-fail-prereq-2',
    category: 'Prerrequisitos',
    label: 'No cumple prerrequisito',
    text: 'Lamentablemente, no cumples con el prerrequisito de la asignatura, razón por la cual no pudimos procesar tu solicitud.'
  },

  // Category: Agregar (fallida por horario)
  {
    id: 'add-fail-horario',
    category: 'Horario',
    label: 'Sin permiso de modificar horario',
    text: '¡Hola! Dado que no diste permiso de modificar tu horario y la única forma de inscribir la asignatura era cambiando tu horario, no pudimos inscribir la asignatura solicitada.'
  },

  // Category: Eliminar
  {
    id: 'del-success-1',
    category: 'Eliminar',
    label: 'Eliminación exitosa (formal)',
    text: 'La eliminación de la asignatura solicitada ha sido procesada exitosamente. La materia ya no forma parte de tu carga académica para el período actual.'
  },
  {
    id: 'del-success-2',
    category: 'Eliminar',
    label: 'Eliminación exitosa (corto)',
    text: '¡Saludos! Fue eliminada tu inscripción de la asignatura solicitada.'
  },
  {
    id: 'del-success-3',
    category: 'Eliminar',
    label: 'Eliminación exitosa (mínimo)',
    text: '¡Saludos! Ha sido eliminada de tu inscripción la asignatura solicitada.'
  },

  // Category: Cambio de sección
  {
    id: 'cambio-seccion',
    category: 'Cambio de Sección',
    label: 'Cambio no posible, sugerir 1x1',
    text: 'Lamentablemente no es posible realizar el cambio de sección. Si lo deseas, puedes aplicar al cambio UNO a UNO, buscando a un compañero que se encuentre en la sección deseada y ambos llenar el formulario que se encuentra en esta página.'
  },

  // Category: Trabajo de Grado
  {
    id: 'trabajo-grado',
    category: 'Trabajo de Grado',
    label: 'Proceso especial de TG',
    text: 'La inscripción del curso de Trabajo de Grado es un proceso especial y no se realiza en la solicitud de inscripción regular. Los interesados deben realizar el trámite correspondiente directamente en el Departamento de Prácticas Profesionales de la Escuela.'
  },

  // Category: Otros
  {
    id: 'pending',
    category: 'Otros',
    label: 'En proceso',
    text: 'Ya recibimos tu solicitud. Estaremos procesándola a la brevedad.'
  },
  {
    id: 'repetido',
    category: 'Otros',
    label: 'Solicitud repetida',
    text: 'Solicitud repetida.'
  }
];

// Group responses by category for easier rendering in dropdowns
export const RESPONSES_BY_CATEGORY = PREDEFINED_RESPONSES.reduce((acc, response) => {
  if (!acc[response.category]) {
    acc[response.category] = [];
  }
  acc[response.category].push(response);
  return acc;
}, {} as Record<string, PredefinedResponse[]>);
