const {Ticket, Form, FormResponse, User} = require("../app/models");
const { success, error } = require("../utils/responseFormatter");


class TicketServices{
    //---Valida transição de status
    validateStatusTransition(currentStatus, newStatus, responsibleId = null){
        const errors = [];

        //---Todos os andamentos possíveis
        const transitions = {
            ABERTO: ["EM_ANDAMENTO"],
            EM_ANDAMENTO: ["FECHADO", "ABERTO"],
            FECHADO: []
        }

        //--Obtém as transições validas para o status atual
        const allowTransitions = transitions[currentStatus];
        console.log(allowTransitions)

        //---Verifica se não há newStatus no array allowTransitions
        if(!allowTransitions.includes(newStatus)){
            errors.push(`Não é possivel mudar de ${currentStatus} para ${newStatus}`);

            //--Retorna o resultado da validação com o erro
            return{
                valid: false,
                errors, 
                allowTransitions
            }
        }

        //---Mudar para andamento
        if(newStatus === "EM_ANDAMENTO" && !responsibleId){
            errors.push("Para mudar para 'ANDAMENTO' é necessário atribuir um responsável");
        }

        //----Fechar um ticket
        if(newStatus === "FECHADO" && currentStatus !== "EM_ANDAMENTO"){
            errors.push("Só é pissível fechar um ticket que esteja em ANDAMENTO");
        }

        //--Retorna a validação 
        return{
            valid: errors.length === 0,
            errors
        }
    }


    //---Valida se o formulário existe e se está ativo
    async validateForm(id){
        const form  = await Form.findOne({where: {id_form: id}});

        //--Não encontrado
        if(!form){
            return{
                valid: false,
                errors: ["Formulário não encontrado."]
            }
        }

        ///-Não está ativo
        if(!form.is_active){
            return{
                valid: false,
                errors: ["Esse formulário está inativo e não pode ser usado"]
            }
        }

        return{
            valid: true,
            form
        }

    }


    ///----Valida se response existe e pertence ao form
    async validateFormResponse(responseId, formId){
        //--Se não foi enviada nenhuma resposta
        if(!responseId){
            return {valid: true, response: null}
        }

        //--Busca a resposta pelo ID
        const response = await FormResponse.findByPk(responseId);

        //---Se não encontrar retorna erro
        if(!response){
            return {valid: false, errors: ["Resposta de formulário não encontrada"]}
        }   


        //--Verifica se a resposta pertence ao mesmo formulário
        if(response.form_id !== formId){
            return{
                valid: false, errors: ["A Resposta não pertence ao formulário informado"]
            }
        }

        return{
            valid: true,
            response
        }
    }


    ///---Verifica se o ticket pode ser editado
    canEditTicket(ticket){
        if(ticket.status === "FECHADO"){
            return{
                valid: false,
                errors: ["Ticket FECHADO não pode ser editado"]
            }
        }

        return {valid: true}
    }

    //--Verifica permissões de usuários sobre tickets
    checkUserPermission(user, ticket){
        if(user.role === "externo" && ticket.creator_id !== user.id){
            return{
                valid: false,
                errors: ["Voce só pode visuliazar seus próprios tickets"]
            }
        }

        return {valid: true}
    }


    //---Monta filtros para listagem
    buildListFilters(user, filters = {}){
       const where = {};

       //--Quem é externo vê apenas seus tickets
       if(user.role === "externo"){
            where.creator_id = user.id
       }

       if(filters.status){
            where.status = filters.status;
       }else if(filters.priority){
            where.priority = filters.priority
       }else if(filters.form_id){
            where.form_id = filters.form_id
       }else if(filters.responsible_id){
            where.response_id = filters.response_id
       }

       return where
    }

    //-------Inclui relacionamentos padrão
    getDefaultIncludes() {
        return [
            {
                association: 'form',
                attributes: ['id_form', 'assunto', 'benefiario', 'description'],
            },
            {
                association: 'creator',
                attributes: ['id_user', 'email', 'role'],
            },
            {
                association: 'responsible',
                attributes: ['id_user', 'email', 'role'],
            },
            {
                association: 'response',
                attributes: ['id', 'content'],
            },
        ];
    }

    //---CREATE --- Cria um novo ticket
    async createTicket(data, creatorId){
        const {form_id, response_id, priority, notes} = data;

        const errors = []

        //---Não encontrado o id
        if(!form_id){
            return{
                success: false,
                errors: ["O campo Id é obrigatório"]
            }
        }

        //---Valida o form
        const formValidation = await this.validateForm(form_id);
        if(!formValidation.valid){
            return{
                success: false,
                errors: formValidation.errors
            }
        }


        ///--Valida o response se for informada
        if(response_id){
            const responseValidation = await this.validateFormResponse(response_id, form_id);
            if(!responseValidation.valid){
                return{
                    success: false,
                    errors: responseValidation.errors
                }
            }
        }

        //--Cria o ticket
        const ticket = await Ticket.create({
            form_id,
            response_id: response_id,
            creator_id: creatorId,
            responsible_id: null,
            status: "ABERTO",
            priority: priority,
            notes: notes
            
        })

        //--Recarrega com os relacionamentos
        await ticket.reload({
            include: this.getDefaultIncludes()
        });

        return{
            success: true,
            ticket
        }
    }


    //----Lista tickets com os filtros
    async listTickets(user, page = 1, limit = 10, filters = {}){
        const calculation = (page - 1) * limit;

        const where = this.buildListFilters(user, filters);

        const { count, rows: tickets} = await Ticket.findAndCountAll({
            where,
            limit: parseInt(limit),
            calculation: parseInt(calculation),
            order: [
                ["priority", "DESC"], //--Prioridade maior primeiro
                ["created_at", "DESC"] //--- Mais recente primeiro
            ],
            include: this.getDefaultIncludes()
        })

        return{
            tickets,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        }
    }


    //---Busca o ticket por ID
    async getTicketById(ticketId, user){
        const ticket = await Ticket.findOne({
            where: {id_ticket: ticketId},
            include: this.getDefaultIncludes()
        })

        if(!ticket){
            return {success: false, errors: ["Ticket não encontrado"]}
        }


        ///--Verifica permissões
        const permission = this.checkUserPermission(user, ticket );

        if(!permission.valid){
            return{
                success: false,
                errors: permission.errors
            }
        }

        return{success: true, ticket}
    }


    async updateTicket(ticketId, data){
        //---Encontra o ticket pelo id
        const ticket = await Ticket.findOne({
            where: {id_ticket: ticketId}
        });

        //---Verifica se encontrou, caso não: 
        if(!ticket){
            return{success: false, errors: ["Ticket não encontrado"]}
        }

        //--Verifica se pode editar
        const canEdit = this.canEditTicket(ticket);
        if(!canEdit.valid){
            return{
                success: false, errors: canEdit.errors
            }
        }

        const{status, priority, responsible_id, notes} = data;

        //----Verifica  a mudança de status
        if(status && status !== ticket.status){
            const newResponsible = responsible_id !== undefined ? responsible_id : ticket.response_id;

            const statusValidation = this.validateStatusTransition(ticket.status, status, newResponsible)

            //---Verifica se o status é valido, caso não
            if(!statusValidation.valid){
                return{success: false, errors: statusValidation.errors, allowTransitions: statusValidation.allowTransitions}
            }
        }

        ///--Verifica se está removendo responsável de um ticket em ANDAMENTO para ABERTO
        if(responsible_id === null && ticket.responsible_id !== null && ticket.status === "EM_ANDAMENTO"){
            await ticket.update({
                responsible_id: null,
                status: "ABERTO",
                ...Form(priority && {priority}),
                ...Form(notes !== undefined && {notes})
            });
        }else{
            ///--Atualiza normal
            await ticket.update({
                ...(status && {status}),
                ...(priority && {priority}),
                ...(responsible_id !== undefined && {responsible_id}),
                ...(notes !== undefined && {notes})
            })
        }

        //--Recarrega com os relacionamentos com as outras tabelas
        await ticket.reload({include: this.getDefaultIncludes()});

        return{
            success: true, ticket
        }
    }


    /////---DELETE - Deletar ticket
    async deleteTicket(ticketId) {
        const ticket = await Ticket.findOne({
            where: { id_ticket: ticketId },
        });

        if (!ticket) {
            return {
                success: false,
                errors: ['Ticket não encontrado'],
            };
        }

        // Verifica se pode deletar
        const canEdit = this.canEditTicket(ticket);
        if (!canEdit.valid) {
            return {
                success: false,
                errors: ['Ticket FECHADO não pode ser deletado'],
            };
        }

        await ticket.destroy();

        return {
            success: true,
        };
    }

       
}

module.exports = TicketServices;