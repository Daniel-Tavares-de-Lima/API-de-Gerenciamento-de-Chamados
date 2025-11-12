#  API de Gerenciamento de Chamados

> Sistema de gestão de tickets/chamados com autenticação JWT, controle de permissões seguindo regras de negócios.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7.svg)](https://sequelizejs.com/)


## Sobre o Projeto

Esta API foi desenvolvida para gerenciar um sistema completo de **chamados/tickets**, similar a sistemas de help desk e service management. O projeto permite que usuários criem, acompanhem e gerenciem solicitações de suporte de forma organizada e eficiente.

###  Objetivo

Criar uma API RESTful robusta que implemente todas as funcionalidades de um sistema de gerenciamento de chamados, incluindo:

- Autenticação e autorização de usuários
- Criação e gerenciamento de formulários customizáveis
- Controle de status e prioridades de tickets
- Fluxo de trabalho definido para atendimento
- Soft delete para preservação de histórico
- Separação de permissões entre usuários internos e externos

---

##  Funcionalidades

###  Gestão de Usuários
- ✅ Cadastro de usuários (INTERNO e EXTERNO)
- ✅ Login com JWT (Bearer Token)
- ✅ Atualização de perfil
- ✅ Soft delete (exclusão lógica)
- ✅ Validação de CPF e email

###  Formulários
- ✅ Criação de formulários customizáveis (JSON)
- ✅ Ativação/desativação de formulários
- ✅ Soft delete


### 📋 Respostas de Formulários
- ✅ Preenchimento de formulários
- ✅ Validação dinâmica de campos
- ✅ Vinculação com tickets
-  Controle de acesso por criador

###  Tickets (Chamados)
- ✅ Criação de chamados
-  Controle de status (ABERTO → EM_ANDAMENTO → FECHADO)
-  Atribuição de responsáveis
-  Prioridades (BAIXA, MÉDIA, ALTA)
-  Ações especiais:
  - Pegar para mim
  - Devolver para fila
  - Fechar chamado
-  Listagem com filtros
- ✅ Soft delete

###  Segurança e Permissões
- ✅ Autenticação JWT
- ✅ Criptografia de senhas (bcrypt)
- ✅ Middleware de autorização
- ✅ Separação de permissões (INTERNO vs EXTERNO)

---

##  Tecnologias Utilizadas

### Backend
- **[Node.js](https://nodejs.org/)** (v18.x) - Runtime JavaScript
- **[Express.js](https://expressjs.com/)** (v4.x) - Framework web
- **[Sequelize](https://sequelizejs.com/)** (v6.x) - ORM para Node.js

### Banco de Dados
- **[MySQL](https://www.mysql.com/)** (v8.0) - Banco relacional

### Autenticação e Segurança
- **[jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)** - Geração de tokens JWT
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Hash de senhas

### DevOps
- **[Docker](https://www.docker.com/)** - Containerização
- **[Docker Compose](https://docs.docker.com/compose/)** - Orquestração de containers

### Desenvolvimento
- **[Nodemon](https://nodemon.io/)** - Auto-reload em desenvolvimento
- **[dotenv](https://www.npmjs.com/package/dotenv)** - Gerenciamento de variáveis de ambiente
