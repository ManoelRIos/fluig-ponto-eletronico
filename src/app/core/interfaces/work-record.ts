export interface Values {
  documentId: number;
  values: Value[] | [];
}

export interface Value {
  fieldId: string;
  value: string;
}

export interface WorkRecord {
  id: string;
  datetime: string;
  criado_em: string;
  horario_registro: string; // Hora de entrada no formato HH:mm
  usuario_nome: string; // Nome completo do usuário
  usuario_codigo: number; // Código do usuário (tenantId)
}
