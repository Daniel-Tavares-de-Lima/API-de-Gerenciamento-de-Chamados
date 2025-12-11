const {Message, Ticket}  = require("../app/models");
const { error } = require("../utils/responseFormatter");


class MessageService{

    //--Listar mensagens
    async listMessages(ticketId, user){
        //--Verifica se o ticket existe
        const ticketValidation = await this.validateTicket(ticketId);

        if(!ticketValidation.valid){
            return{success: false, errors: ticketValidation.errors}
        }

        //--Verifica a permissão do usuário
        const permission = this.checkUserPermission(user, ticketValidation.ticket);
        
        if(!permission.valid){
            return{success: false, errors: permission.errors}
        }

        //---Monta os filtros
        const where = {ticket_id: ticketId}

        //---Quem é externo não vê notas internas
        if(user.role === "externo"){
            where.is_internal = false;
        }

        const messages = await Message.findAll({
            where, order: [["created_at", "ASC"]],
            include: [{
                association: "sender", 
                attributes: ["id_user", "email", "role"]
            }]
        })

        return{
            success: true, messages, total: messages.length
        }
    }

    //--Lista mensagens por ID
    async getMessageById(messageId, user){
        const message = await Message.findByPk(messageId, {
            include: [{
                association: "sender", attributes: ["id_user", "email", "role"]
            },
            {
                association: "ticket",
                attributes: ["id_ticket", "status", "creator_id"]
            }
        ]
        })

        if(!message){
            return{success: false, errors: ["Mensagem não encontrada"]}
        }

        //---Verifica permissão sobre o ticket
        const permission = this.checkUserPermission(user, message.ticket);

        if(!permission.valid){
            return{success: false, errors: permission.errors}
        }

        //--Quem é extermo não pode ver motas internas
        if(user.role === "externo" && message.is_internal){
            return{success:false, errors: ["Você não tem permissão para ver está messagem"]}
        }

        return{
            success:true, message
        }
    }


    //--Valida tickets
    async validateTicket(ticketId){
        const ticket = await Ticket.findOne({
            where: {id_ticket: ticketId}
        });

        if(!ticket){
            return {valid: false, errors: ["Ticket não encontrado"]}
        }

        return{valid: true, ticket}
    }

    checkUserPermission(user, ticket){
        ///-Externo só pode ver mensagens dos seus tickets
        if(user.role === "externo" && ticket.creator_id !== user.id){
            return{
                valid: false, errors: ["Voce só pode acessar suas mensagens"]
            }
        }

        return {valid: true}
    }
    
}

module.exports = MessageService;