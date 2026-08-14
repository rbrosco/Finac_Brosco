# 🚀 Finac_Brosco — Sistema de Gestão Financeira Inteligente

**Finac_Brosco** é uma plataforma moderna de controle e gestão financeira pessoal e empresarial desenvolvida com **Next.js 14 (App Router)**, **TypeScript**, **TailwindCSS**, **TypeORM** e **PostgreSQL**. Oferece dashboards visuais interativos, acompanhamento de contas, gestão de categorias, lançamentos recorrentes, além de **integração nativa com WhatsApp (Evolution API)** para registro de transações por linguagem natural e **n8n** via webhooks.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend (Fullstack)**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [TailwindCSS](https://tailwindcss.com/) + Ícones com [Lucide React](https://lucide.dev/)
- **Gráficos & Visualização**: [Recharts](https://recharts.org/)
- **Banco de Dados & ORM**: [PostgreSQL](https://www.postgresql.org/) + [TypeORM](https://typeorm.io/)
- **Autenticação**: JWT (`jsonwebtoken`) + Criptografia de senha com `bcryptjs`
- **Integrações & Automação**:
  - **WhatsApp API**: Evolution API (Processamento de mensagens em linguagem natural)
  - **Automação de Fluxos**: n8n Webhooks (Entrada e Saída)
- **Containerização**: Docker & Docker Compose

---

## ✨ Principais Funcionalidades

### 📊 Dashboard Interativo
- Visão geral de **Receitas**, **Despesas Fixas**, **Despesas Variáveis** e **Saldo Total**.
- Gráficos de distribuição mensal e gráfico de pizza por categoria.
- Lista rápida de transações recentes com indicadores visuais de status.

### 💳 Gestão de Contas Bancárias e Carteiras
- Cadastro de múltiplas contas (Conta Corrente, Poupança, Cartão de Crédito, Carteiras físicas).
- Saldo consolidado e em tempo real sincronizado com as movimentações.

### 🏷️ Categorias Personalizadas
- Organização em categorias de Receita e Despesa.
- Ícones personalizados, cores e suporte a orçamentos previstos por categoria.

### 💸 Gestão de Transações
- Cadastro de receitas e despesas com suporte a transações **recorrentes** (mensais, anuais, etc.).
- Filtros por período, conta, categoria e tipo.
- Processamento automático de lançamentos recorrentes via API cron.

### 🤖 Integração WhatsApp (Evolution API)
- Registro de gastos e receitas enviando mensagens de texto simples via WhatsApp (ex: *"Gastei 45 no mercado"* ou *"Recebi 1500 de freela"*).
- Interpretação inteligente de texto em linguagem natural (extração de valor, categoria e tipo de despesa).
- Envio de notificações e confirmações via WhatsApp.

### 🔗 Webhooks & n8n Automation
- Webhooks de entrada e saída para sincronizar transações com fluxos no **n8n**.
- Integração facilitada com ferramentas externas de automação.

---

## 📁 Estrutura do Projeto

```text
Finac_Brosco/
├── Dockerfile                   # Configuração de build da imagem Docker
├── docker-compose.yml           # Orquestração do App e Banco PostgreSQL
├── next.config.js               # Configuração do Next.js
├── tailwind.config.js           # Configuração de estilos TailwindCSS
├── tsconfig.json                # Configurações TypeScript
├── src/
│   ├── app/                     # Páginas (App Router) e Rotas de API
│   │   ├── accounts/            # Gestão de Contas
│   │   ├── api/                 # Endpoints REST (Auth, Contas, Transações, Webhooks, Seed)
│   │   ├── categories/          # Gestão de Categorias
│   │   ├── dashboard/           # Dashboard Principal
│   │   ├── integrations/        # Configuração WhatsApp & n8n
│   │   ├── reports/             # Relatórios Financeiros
│   │   └── transactions/        # Transações
│   ├── components/              # Componentes de UI Modulares e Reutilizáveis
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── dashboard/
│   │   ├── layout/              # Sidebar e Header
│   │   └── transactions/
│   └── lib/                     # Utilitários, Banco de Dados e Serviços
│       ├── auth.ts              # Helpers de Autenticação JWT
│       ├── db/                  # Data Source TypeORM e Entidades (User, Account, Transaction...)
│       └── services/            # Serviços da Evolution API (WhatsApp) e Webhook (n8n)
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js 18+](https://nodejs.org/) instalado
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (recomendado)

### 1. Clonar o Repositório
```bash
git clone https://github.com/rbrosco/Finac_Brosco.git
cd Finac_Brosco
```

### 2. Executar via Docker Compose (Forma Recomendada)
```bash
docker-compose up -d --build
```
A aplicação estará disponível em `http://localhost:3000`.

### 3. População Inicial do Banco de Dados (Seed)
Para criar dados de exemplo e o usuário padrão para testes, acesse:
`http://localhost:3000/api/seed`

---

## 🔒 Variáveis de Ambiente

As principais variáveis configuradas no ambiente ou no `docker-compose.yml`:

| Variável | Descrição | Valor Padrão (Exemplo) |
|---|---|---|
| `POSTGRES_HOST` | Host do banco de dados | `postgres` / `localhost` |
| `POSTGRES_PORT` | Porta do PostgreSQL | `5432` |
| `POSTGRES_USER` | Usuário do PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Senha do banco | `*` |
| `POSTGRES_DB` | Nome do banco de dados | `finac-db` |
| `JWT_SECRET` | Chave secreta para JWT | `finac_secret_jwt_key_...` |
| `EVOLUTION_API_KEY` | Chave de API da Evolution API | `*` |

---

## 👤 Autor

Desenvolvido por **[Rogger Brosco](https://github.com/rbrosco)**.
