# API de Gerenciamento de Chamados

> Sistema de gestão de tickets/chamados com autenticação JWT, controle de permissões e regras de negócio robustas para diferentes perfis de usuário.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7.svg)](https://sequelizejs.com/)

---

## 📌 Sobre o Projeto

Esta API fornece todos os recursos necessários para o gerenciamento de chamados internos e externos.  
Ela contempla:

- Autenticação JWT  
- Controle de permissões por perfil (interno, externo e admin)  
- CRUD de Usuários  
- CRUD de Tickets  
- Sistema de atribuição e fluxo (pegar/devolver)  
- Forms e respostas de forms  
- Histórico e eventos dos tickets  
- Chat por ticket (sistema de mensagens)  
- Soft delete em todos os módulos  
- Padronização de respostas com formatter próprio  
- Estrutura escalável seguindo boas práticas do Node + Express  

A API foi construída para ser robusta, escalável e fácil de integrar com qualquer frontend.

---

## 📁 Estrutura de Pastas (resumo)

src/
├── controllers/
├── middlewares/
├── migrations/
├── models/
├── routes/
├── services/
├── utils/
└── config/



• **Controllers** → recebem e tratam requisições  
• **Services** → regras de negócio  
• **Routes** → organização das rotas  
• **Models** → modelos Sequelize  
• **Migrations** → tabelas do banco  
• **Middlewares** → autenticação, autorização e validação  
• **Utils** → formatadores e helpers  

---

## 🚀 Tecnologias Utilizadas

- Node.js  
- Express  
- MySQL  
- Sequelize ORM  
- JWT Authentication  
- Docker & Docker Compose  
- Bcrypt (hash de senhas)  
- JOI (validações)  

---

## 🛠️ Como Rodar o Projeto

Você pode rodar com **Docker** ou **manualmente**.  
As duas maneiras estão descritas abaixo.

---

# 🐳 Rodando com Docker (RECOMENDADO)

Certifique-se de ter:

- Docker  
- Docker Compose  

### 1️⃣ Criar arquivo `.env`

Na raiz do projeto:
cp .env.example .env


Configure as credenciais:
DB_HOST=db
DB_USER=root
DB_PASS=root
DB_NAME=tickets
DB_PORT=3306
JWT_SECRET=sua_chave
JWT_EXPIRES=1d


### 2️⃣ Subir containers
docker-compose up --build

O banco estará rodando dentro do container MySQL.

### 3️⃣ Rodar migrations dentro do container
docker exec -it api-tickets npx sequelize db:migrate

### 4️⃣ Iniciar o servidor
npm start

A API rodará em:
http://localhost:3000

### 🔐 Autenticação

A API usa JWT Bearer Token.
Após o login, o backend retorna:

{
  "token": "xxxxx.yyyyy.zzzzz"
}

Exemplo de header necessário nas rotas protegidas:
Authorization: Bearer seu_token_aqui

### 🛡️ Regras de Permissões (resumo)

- admin → tudo liberado

- interno → pode atender e pegar tickets

- externo → pode criar chamados e ver os seus próprios

A API valida automaticamente o acesso (por ticket, form e mensagens)

### 🗂️ Migrations & Seeds

Rodar migrations:

npx sequelize db:migrate

Desfazer migrations:

npx sequelize db:migrate:undo


Seeds (se existirem):

npx sequelize db:seed:all

### 📦 Build de Produção
npm run build

No Docker, basta:

docker-compose up --build -d


