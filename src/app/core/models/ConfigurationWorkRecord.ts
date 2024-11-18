export interface ConfigurationWorkRecord {
  id: string | number
  datetime: string
  criado_em: string
  horario_registro: string // Hora de entrada no formato HH:mm
  usuario_nome: string // Nome completo do usuário
  usuario_codigo: number // Código do usuário (tenantId)
  documentid: number
  cardid: number
  localidade: string
  observacao: string
  codigo_foto: string
  codigo_pasta: string
}

