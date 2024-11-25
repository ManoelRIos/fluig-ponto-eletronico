import { DataValues } from "@tensorflow/tfjs-core"

export interface WorkRecord {
  id: string | number
  datetime: string
  criado_em: string
  horario_registro: string
  usuario_nome: string
  usuario_codigo: number
  dia_semana: string
  documentid: number
  cardId: number
  status: WorkStatus
  localidade: string
  observacao: string
  foto_codigo: string
  values: DataValues
  status_integracao: string
}

export enum WorkStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Refused = 'refused',
  Approved = 'approved',
}
