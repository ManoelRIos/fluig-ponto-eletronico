export interface WorkRecord {
  id: string | number
  datetime: string
  criado_em: string
  horario_registro: string // Hora de entrada no formato HH:mm
  usuario_nome: string // Nome completo do usuário
  usuario_codigo: number // Código do usuário (tenantId)
  documentid: number
  cardid: number
  status: WorkStatus
  localidade: string
  observacao: string
  foto_codigo: string
}

export enum WorkStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Refused = 'refused',
  Approved = 'approved',
}
