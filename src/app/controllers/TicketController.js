const { Ticket, Form, FormResponse, User } = require('../models');
const { sequelize } = require('../models');
const TicketServices = require("../../services/TicketServices");

const {success, error, paginated} = require("../../utils/responseFormatter");
//--Classe instanciada
const ticketServices = new TicketServices();

//--Validações services
class TicketController {
  // CREATE - Criar um novo ticket
  async create(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      // const { form_id, response_id, priority, notes } = req.body;
      const creator_id = req.user.id;

      const result = await ticketServices.createTicket(req.body, creator_id);

      if(!result.success){
        await transaction.rollback();
        return res.status(400).json(error("Erro ao criar ticket", result.errors))
      }

      await transaction.commit()
      return res.status(200).json(success(result.ticket, "Ticket criado com sucesso"));

    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao criar ticket:', error);
      return res.status(500).json({
        error: 'Erro ao criar ticket.'
      });
    }
  }

  // READ - Listar tickets
  async read(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        form_id,
      } = req.query;
      const offset = (page - 1) * limit;

      // Monta filtros
      const where = {};

      // externo só vê seus próprios tickets
      if (req.user.role === 'externo') {
        where.creator_id = req.user.id;
      }

      // Filtros opcionais
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (form_id) where.form_id = form_id;

      const { count, rows: tickets } = await Ticket.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ['priority', 'DESC'], // Prioridade maior primeiro
          ['created_at', 'DESC'], // Mais recente primeiro
        ],
        include: [
          {
            association: 'form',
            attributes: ['id_form', 'assunto', 'benefiario'],
          },
          {
            association: 'creator',
            attributes: ['id_user', 'email', 'role'],
          },
          {
            association: 'responsible',
            attributes: ['id_user', 'email', 'role'],
          },
        ],
      });

      return res.json({
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        tickets,
      });
    } catch (error) {
      console.error('Erro ao listar tickets:', error);
      return res.status(500).json({
        error: 'Erro ao listar tickets.',
        details: error.message,
      });
    }
  }

  // READ BY ID - Buscar ticket por ID
  async readId(req, res) {
    try {
      const { id } = req.params;

      const ticket = await Ticket.findOne({
        where: { id_ticket: id },
        include: [
          {
            association: 'form',
            attributes: ['id_form', 'assunto', 'benefiario', 'description'],
          },
          {
            association: 'creator',
            attributes: ['id_user', 'email', 'cpf', 'role'],
          },
          {
            association: 'responsible',
            attributes: ['id_user', 'email', 'role'],
          },
          {
            association: 'response',
            attributes: ['id', 'content'],
          },
        ],
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket não encontrado.',
        });
      }

      // externo só pode ver seus próprios tickets
      if (
        req.user.role === 'externo' &&
        ticket.creator_id !== req.user.id
      ) {
        return res.status(403).json({
          error: 'Acesso negado.',
          message: 'Você só pode visualizar seus próprios tickets.',
        });
      }

      return res.json(ticket);
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      return res.status(500).json({
        error: 'Erro ao buscar ticket.',
        details: error.message,
      });
    }
  }

  // UPDATE - Atualizar ticket
  async update(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { status, priority, responsible_id, notes } = req.body;

      const ticket = await Ticket.findOne({
        where: { id_ticket: id },
      });

      if (!ticket) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Ticket não encontrado.',
        });
      }

      // externo não pode atualizar tickets
      if (req.user.role === 'externo') {
        await transaction.rollback();
        return res.status(403).json({
          error: 'Acesso negado.',
          message: 'Apenas usuários INTERNOS podem atualizar tickets.',
        });
      }

      // Verifica se o ticket pode ser editado
      if (!ticket.editTicket()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Ticket FECHADO não pode ser editado.',
        });
      }

      // Validação de mudança de status
      if (status && status !== ticket.status) {
        // Validação: EM_ANDAMENTO requer responsible_id
        if (status === 'EM_ANDAMENTO') {
          const newResponsible = responsible_id || ticket.responsible_id;
          if (!newResponsible) {
            await transaction.rollback();
            return res.status(400).json({
              error:
                'Para mudar para EM_ANDAMENTO é necessário atribuir um responsável.',
            });
          }
        }

        // Validação: FECHADO só se estiver EM_ANDAMENTO
        if (status === 'FECHADO' && !ticket.fechar()) {
          await transaction.rollback();
          return res.status(400).json({
            error:
              'Só é possível fechar um ticket que esteja EM_ANDAMENTO.',
          });
        }

        // Validação: Voltar para ABERTO requer remover responsável
        if (status === 'ABERTO' && ticket.status === 'EM_ANDAMENTO') {
          if (responsible_id !== null && ticket.responsible_id !== null) {
            await transaction.rollback();
            return res.status(400).json({
              error:
                'Para voltar para ABERTO é necessário remover o responsável.',
            });
          }
        }

        // Valida se a transição é permitida
        if (!ticket.canChangeStatusTo(status)) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Não é possível mudar de ${ticket.status} para ${status}.`,
            allowedTransitions: {
              ABERTO: ['EM_ANDAMENTO'],
              EM_ANDAMENTO: ['FECHADO', 'ABERTO'],
              FECHADO: [],
            },
          });
        }
      }

      // Se está removendo responsável de um ticket EM_ANDAMENTO, volta para ABERTO
      if (
        responsible_id === null &&
        ticket.responsible_id !== null &&
        ticket.status === 'EM_ANDAMENTO'
      ) {
        await ticket.update(
          {
            responsible_id: null,
            status: 'ABERTO',
            ...(priority && { priority }),
            ...(notes !== undefined && { notes }),
          },
          { transaction }
        );
      } else {
        // Atualização normal
        await ticket.update(
          {
            ...(status && { status }),
            ...(priority && { priority }),
            ...(responsible_id !== undefined && { responsible_id }),
            ...(notes !== undefined && { notes }),
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Recarrega com relacionamentos
      await ticket.reload({
        include: [
          {
            association: 'form',
            attributes: ['id_form', 'assunto', 'benefiario'],
          },
          {
            association: 'creator',
            attributes: ['id_user', 'email', 'role'],
          },
          {
            association: 'responsible',
            attributes: ['id_user', 'email', 'role'],
          },
        ],
      });

      return res.json({
        message: 'Ticket atualizado com sucesso!',
        ticket,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao atualizar ticket:', error);
      return res.status(500).json({
        error: 'Erro ao atualizar ticket.',
        details: error.message,
      });
    }
  }

  // DELETE - Remover ticket
  async delete(req, res) {
    try {
      const { id } = req.params;

      const ticket = await Ticket.findOne({
        where: { id_ticket: id },
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket não encontrado.',
        });
      }

      // externo não pode deletar
      if (req.user.role === 'externo') {
        return res.status(403).json({
          error: 'Acesso negado.',
          message: 'Apenas usuários INTERNOS podem deletar tickets.',
        });
      }

      // Não pode deletar ticket FECHADO
      if (!ticket.editTicket()) {
        return res.status(400).json({
          error: 'Ticket FECHADO não pode ser deletado.',
        });
      }

      await ticket.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar ticket:', error);
      return res.status(500).json({
        error: 'Erro ao deletar ticket.',
        details: error.message,
      });
    }
  }

  // AÇÃO: Pegar ticket para mim
  async assignToMe(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      // Apenas interno pode pegar tickets
      if (req.user.role !== 'interno') {
        await transaction.rollback();
        return res.status(403).json({
          error: 'Apenas usuários INTERNOS podem assumir tickets.',
        });
      }

      const ticket = await Ticket.findOne({
        where: { id_ticket: id },
      });

      if (!ticket) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Ticket não encontrado.',
        });
      }

      if (ticket.status !== 'ABERTO') {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Só é possível pegar tickets com status ABERTO.',
        });
      }

      // Atribui ao usuário logado e muda para EM_ANDAMENTO
      await ticket.update(
        {
          responsible_id: req.user.id,
          status: 'EM_ANDAMENTO',
        },
        { transaction }
      );

      await transaction.commit();

      await ticket.reload({
        include: [
          { association: 'form' },
          { association: 'creator' },
          { association: 'responsible' },
        ],
      });

      return res.json({
        message: 'Ticket atribuído com sucesso!',
        ticket,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao atribuir ticket:', error);
      return res.status(500).json({
        error: 'Erro ao atribuir ticket.',
        details: error.message,
      });
    }
  }

  // Devolver ticket para a fila
  async returnToQueue(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      // Apenas interno pode devolver
      if (req.user.role !== 'interno') {
        await transaction.rollback();
        return res.status(403).json({
          error: 'Apenas usuários INTERNOS podem devolver tickets.',
        });
      }

      const ticket = await Ticket.findOne({
        where: { id_ticket: id },
      });

      if (!ticket) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Ticket não encontrado.',
        });
      }

      if (ticket.status !== 'EM_ANDAMENTO') {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Só é possível devolver tickets EM_ANDAMENTO.',
        });
      }

      // Remove responsável e volta para ABERTO
      await ticket.update(
        {
          responsible_id: null,
          status: 'ABERTO',
        },
        { transaction }
      );

      await transaction.commit();

      await ticket.reload({
        include: [
          { association: 'form' },
          { association: 'creator' },
        ],
      });

      return res.json({
        message: 'Ticket devolvido para a fila com sucesso!',
        ticket,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao devolver ticket:', error);
      return res.status(500).json({
        error: 'Erro ao devolver ticket.',
        details: error.message,
      });
    }
  }

  // Fechar ticket
  async close(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      // Apenas interno pode fechar
      if (req.user.role !== 'interno') {
        await transaction.rollback();
        return res.status(403).json({
          error: 'Apenas usuários INTERNOS podem fechar tickets.',
        });
      }

      const ticket = await Ticket.findOne({
        where: { id_ticket: id },
      });

      if (!ticket) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Ticket não encontrado.',
        });
      }

      if (!ticket.fechar()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Só é possível fechar tickets que estejam EM_ANDAMENTO.',
        });
      }

      await ticket.update({ status: 'FECHADO' }, { transaction });

      await transaction.commit();

      await ticket.reload({
        include: [
          { association: 'form' },
          { association: 'creator' },
          { association: 'responsible' },
        ],
      });

      return res.json({
        message: 'Ticket fechado com sucesso!',
        ticket,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao fechar ticket:', error);
      return res.status(500).json({
        error: 'Erro ao fechar ticket.',
        details: error.message,
      });
    }
  }
}

module.exports = new TicketController();