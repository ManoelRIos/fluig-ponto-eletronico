export interface Role {
  id: string | number
  documentid: number 
  cardid: number
  status: string
  view_default: string
  view_all: string
  view_manager: string
  criar: string
  edit: string
  approve: string
  refuse: string
  descricao: string
  idVinculo?: number
}
