// src/routes/messageRoutes.js
const express = require('express');
const MessageController = require('../controllers/MessageController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

const messageController = new MessageController();
// Todas as rotas requerem autenticação
router.use(authMiddleware);
// Criar mensagem
// router.post('/messages', MessageController.create);
// Listar mensagens de um ticket
router.get('/tickets/:ticket_id/messages', messageController.readbyTicket);
// Buscar mensagem por ID
router.get('/messages/:id', messageController.show);
// Atualizar mensagem
// router.put('/messages/:id', MessageController.update);
// Deletar mensagem
// router.delete('/messages/:id', MessageController.delete);
module.exports = router;