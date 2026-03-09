# 🚀 Guia de Hospedagem (Produção) - SGM

Este documento serve como um guia passo-a-passo para quando decidires hospedar o **Sistema de Gestão de Matrículas (SGM)** num servidor real (como AWS, DigitalOcean, Heroku ou VPS própria).

---

## 1. Configurações do Backend (Django)

No ficheiro `.env` do servidor, deves alterar as seguintes variáveis para garantir segurança máxima:

### 🛑 O que colocar em ALLOWED_HOSTS?
Esta variável diz ao Django quais os nomes de site que ele pode responder. 
- Se o teu site for `www.meuprojeto.ao`, deves colocar isso.
- Podes também pôr o IP fixo do teu servidor se não tiveres domínio.
- Exemplo: `ALLOWED_HOSTS=www.meuprojeto.ao, api.meuprojeto.ao, 157.245.xxx.xxx`

### 🛑 Configurações Recomendadas (.env)
```env
DEBUG=False
ALLOWED_HOSTS=www.teudominio.com, api.teudominio.com
SECRET_KEY=uma-chave-muito-longa-e-secreta-gera-uma-nova
```

### 🌍 Conectividade (CORS)
Deixa de usar o modo "aberto" e restringe apenas ao teu site frontend:
```env
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://www.teudominio.com
```

### 📧 E-mail Real (SMTP)
Para que os alunos recebam os e-mails na caixa de entrada e não no terminal:
1. No `settings.py`, muda para:
   `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'`
2. No `.env`, usa uma **Senha de App**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=teu-email-oficial@gmail.com
EMAIL_HOST_PASSWORD=teu-codigo-de-16-letras-do-google
```

---

## 2. Configurações do Frontend (React + Vite)

Ao colocar o frontend na internet, ele precisa de saber o endereço real do teu backend.

### Criar ficheiro `.env` no Frontend
Na raiz da pasta `frontend/`, cria um ficheiro chamado `.env.production` com este conteúdo:
```env
VITE_API_URL=https://api.teudominio.com/api/v1/
```
*O código que escrevemos no `api.js` vai detectar automaticamente este valor e deixar de usar o IP dinâmico.*

---

## 3. Comandos de Preparação

Antes de carregar os ficheiros para o servidor, executa estes comandos para optimizar o sistema:

### No Backend:
```bash
# Recolher todos os ficheiros estáticos (CSS/JS do Admin) numa única pasta
python manage.py collectstatic

# Aplicar todas as migrações na base de dados do servidor
python manage.py migrate
```

### No Frontend:
```bash
# Gerar a versão otimizada ("build") para o servidor
npm run build
```
*Isto criará uma pasta `dist/`. É o conteúdo desta pasta que deves colocar no teu servidor web (Nginx/Apache).*

---

## 4. Checklist Final de Segurança ✅
- [ ] O `DEBUG` está como `False`?
- [ ] Troquei todas as senhas padrão (DB_PASSWORD, EMAIL_PASSWORD)?
- [ ] O firewall do meu servidor só permite as portas necessárias (80, 443, 8000)?
- [ ] Configurei o HTTPS (Certificado SSL)? *O Django em produção exige HTTPS para segurança dos tokens.*

---

> [!TIP]
> **Dica de Ouro:** Guarda este ficheiro num local seguro. Quando o projeto estiver pronto para "voar", segue estes passos e o sistema estará protegido como um software profissional.
