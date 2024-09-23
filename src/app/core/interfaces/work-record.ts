export interface Values {
  documentId: number;
  values: Value[] | [];
}

export interface Value {
  fieldId: string;
  value: string
}

export interface WorkRecord {
  createdAt: string;
  dayOfWeek: string; // Dia da semana em texto (e.g., Monday, Tuesday)
  entryTime: string; // Hora de entrada no formato HH:mm
  userName: string; // Nome completo do usuário
  userCode: string; // Código do usuário (tenantId)
}
