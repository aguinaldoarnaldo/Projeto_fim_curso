faz# 🔍 Diagnóstico e Correção do Sistema de Permissões

## 📋 Problema Identificado

O sistema de permissões não estava funcionando corretamente no frontend. Mesmo usuários com permissões adequadas não conseguiam visualizar botões e funcionalidades protegidas.

## 🔧 Correções Implementadas

### 1. **Backend - AuthService** (`auth_service.py`)
   
   **Problema:** Inconsistência entre os dados retornados no login vs. endpoint `/me/`
   
   **Correções:**
   - ✅ Alinhamento da estrutura de `user_data` entre `authenticate_user()` e `get_user_profile()`
   - ✅ Garantia de que `permissoes` seja sempre retornado como array
   - ✅ Priorização correta: `Usuario.permissoes` > `Funcionario.permissoes_adicionais`
   - ✅ Campo `is_superuser` e `papel` corretamente definidos em ambos os fluxos
   - ✅ Para funcionários, agora retorna `is_superuser` e `papel: 'Admin'` quando aplicável

### 2. **Frontend - Sistema de Debug** 

   **Adicionado:** Logging detalhado para rastrear o fluxo de permissões
   
   **Arquivos modificados:**
   - `frontend/src/hooks/usePermission.js` - Logs no hook de permissão
   - `frontend/src/utils/permissions.js` - Logs detalhados na função `hasPermission()`
   - `frontend/src/utils/debugPermissions.js` - Utilitário de debug (NOVO)

### 3. **Frontend - Proteção de Componentes**

   **Componentes atualizados com verificação de permissões:**
   - ✅ `Sidebar.jsx` - Menu lateral filtra itens por permissão
   - ✅ `Cursos.jsx` - Botões "Novo Curso" e "Editar" protegidos
   - ✅ `Salas.jsx` - Botões "Nova Sala" e "Editar" protegidos
   - ✅ `CandidateDetailModal.jsx` - Botão "Validar Inscrição e Gerar RUP" protegido

## 🧪 Como Testar

### Passo 1: Abrir o Console do Navegador

1. Faça login no sistema
2. Abra o DevTools (F12)
3. Vá para a aba "Console"

### Passo 2: Verificar os Logs

Você verá logs detalhados como:

```
🔍 [usePermission] Verificando permissão: view_dashboard
👤 [usePermission] Usuário: {nome: "...", email: "...", ...}
📜 [usePermission] Permissões do usuário: ["view_dashboard", "manage_usuarios", ...]
🎭 [usePermission] Papel: Admin
🔐 [usePermission] is_superuser: true
✅ [usePermission] Resultado para "view_dashboard": true
```

### Passo 3: Identificar Problemas

**Se as permissões NÃO estiverem funcionando, verifique:**

1. **Usuário não tem `permissoes` definidas:**
   ```
   📜 [usePermission] Permissões do usuário: []
   ```
   **Solução:** Ir em Configurações > Segurança > Selecionar o usuário > "Gestão de Acessos Individuais"

2. **`is_superuser` está `false` quando deveria ser `true`:**
   ```
   🔐 [usePermission] is_superuser: false
   ```
   **Solução:** Verificar se o papel do usuário está definido como "Admin" no backend

3. **Permissão específica não está na lista:**
   ```
   ❌ [hasPermission] Permissão "manage_cursos" NÃO encontrada na lista explícita
   ```
   **Solução:** Adicionar a permissão específica na "Gestão de Acessos Individuais"

## 📊 Fluxo de Verificação de Permissões

```
1. Usuário existe? ❌ → NEGADO
                   ✅ ↓
2. is_superuser = true? ✅ → PERMITIDO
                        ❌ ↓
3. Tem lista de permissões explícitas? ✅ → Verifica se permissão está na lista
                                       ❌ ↓
4. papel = 'Admin'? ✅ → PERMITIDO
                    ❌ ↓
5. cargo_nome contém 'admin'/'diretor'? ✅ → PERMITIDO
                                        ❌ ↓
6. Verifica permissões do ROLE (Secretaria, Professor, etc.)
   ↓
7. Se nada acima → NEGADO (Bloqueio Padrão)
```

## 🎯 Próximos Passos

### Para o Administrador:

1. **Faça login com a conta de administrador**
2. **Verifique os logs no console** - deve mostrar `is_superuser: true`
3. **Teste com a outra conta:**
   - Faça login com a conta que não estava funcionando
   - Verifique os logs no console
   - Se `permissoes: []`, vá para Configurações > Gestão de Acessos Individuais
   - Selecione as permissões necessárias e salve

### Para Remover os Logs (Produção):

Quando o sistema estiver funcionando corretamente, você pode remover os logs:

1. Em `frontend/src/hooks/usePermission.js` - remover os blocos `if (process.env.NODE_ENV === 'development')`
2. Em `frontend/src/utils/permissions.js` - remover a variável `DEBUG` e todos os logs condicionais

## 📝 Notas Importantes

- **Superusuários** têm acesso total, independente da lista de permissões
- **Papel "Admin"** também tem acesso total (se não houver lista de permissões explícitas)
- **Lista de Permissões Explícitas** tem prioridade sobre tudo (exceto superuser)
- Se um usuário tem uma lista vazia `[]`, ele **não terá acesso a nada**

## 🆘 Suporte

Se após seguir estes passos as permissões ainda não funcionarem:

1. Compartilhe os logs do console
2. Verifique se o backend está retornando os dados corretos (endpoint `/auth/me/`)
3. Verifique se há erros no console do navegador
