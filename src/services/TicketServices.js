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


        const allowTransitions = transitions[currentStatus];

        //---Verifica se não há newStatus no array allowTransitions
        if(!allowTransitions.includes(newStatus)){
            errors.push(`Não é possivel mudar de ${currentStatus} para ${newStatus}`);

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
        if(newStatus === "FECHADO" && currentStatus !== "ANDAMENTO"){
            errors.push("Só é pissível fechar um ticket que esteja em ANDAMENTO");
        }

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
        if(!responseId){
            return {valid: true, response: null}
        }

        const response = await FormResponse.findByPk(responseId);

        if(!response){
            return {valid: false, errors: ["Resposta de formulário não encontrada"]}
        }

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
}