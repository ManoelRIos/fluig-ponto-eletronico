// Interface que representa a estrutura da resposta do servidor da chamada de um dataset
export interface DatasetResponse {
    content: {
        columns: string[];
        values: any[];
    };
    message: string | null;
}