/**
 * Utilitário para formatar mensagens de erro das respostas da API (Django Rest Framework)
 * para exibição amigável na interface do utilizador.
 */
export const parseApiError = (error, defaultMsg = "Erro ao processar a solicitação") => {
    // Se não houver resposta do servidor
    if (!error.response) {
        return error.message || "Não foi possível conectar ao servidor. Verifique sua rede.";
    }

    const { data, status } = error.response;

    // Erros de Autenticação
    if (status === 401) return "Sessão expirada. Por favor, faça login novamente.";
    if (status === 403) return data.detail || "Você não tem permissão para realizar esta ação.";

    // Se a resposta for uma string simples
    if (typeof data === 'string') return data;

    // Erros de detalhe (Detail) do DRF
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.erro) return data.erro;

    // Se for um objeto com campos de validação { "nome": ["campo já existe"], ... }
    if (typeof data === 'object') {
        const errors = [];
        
        for (const field in data) {
            // Ignorar campos que não são mensagens de erro ou metadados
            if (field === 'status' || field === 'code') continue;

            const fieldName = formatFieldName(field);
            const fieldError = Array.isArray(data[field]) ? data[field][0] : data[field];
            
            // Tratamento especial para mensagens comuns de unicidade
            let errorMsg = fieldError;
            if (typeof fieldError === 'string') {
                if (fieldError.includes('already exists') || fieldError.includes('já existe')) {
                    if (field === 'numero_sala') {
                        errorMsg = "Já existe uma sala registada com este número. Por favor, utilize outro.";
                    } else if (field === 'nome' || field === 'nome_curso') {
                        errorMsg = "Este nome já está em uso em outro registo. Por favor, escolha um nome diferente.";
                    } else {
                        errorMsg = `Este valor já está em uso para o campo ${fieldName.toLowerCase()}.`;
                    }
                }
            }

            if (field === 'non_field_errors' || field === 'detail') {
                errors.push(errorMsg);
            } else if (errorMsg.includes('Erro de Lotação') || errorMsg.includes('Lotação Excessiva') || errorMsg.includes('já está em uso')) {
                // If it's a very specific custom message, don't necessarily need the field name prefix if it's already clear, 
                // but for consistency we keep it or format it better.
                errors.push(errorMsg);
            } else {
                errors.push(`${fieldName}: ${errorMsg}`);
            }
        }

        if (errors.length > 0) return errors.join('\n');
    }

    return defaultMsg;
};

/**
 * Formata o nome do campo para algo mais legível (ex: "id_sala" -> "Sala")
 */
function formatFieldName(field) {
    if (field === 'non_field_errors') return 'Erro';
    
    // Mapeamento de campos comuns para português amigável
    const mapping = {
        'nome': 'Nome',
        'numero_sala': 'Número da Sala',
        'capacidade_alunos': 'Capacidade',
        'id_ano': 'Ano Lectivo',
        'data_inicio': 'Data de Início',
        'data_fim': 'Data de Término',
        'status': 'Estado',
        'email': 'Email',
        'password': 'Senha',
        'senha_hash': 'Senha',
        'nome_completo': 'Nome Completo',
        'nome_curso': 'Nome do Curso',
        'capacidade': 'Capacidade',
        'username': 'Nome de Utilizador'
    };

    if (mapping[field]) return mapping[field];

    // Fallback: remover underscores e capitalizar
    return field
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
