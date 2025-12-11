const MessageService = require("../../services/MessageServices");
const { success } = require("../../utils/responseFormatter");

const messageService = new MessageService();

class MessageController{

    //--GET - Listar mensagens de um ticet
    async readbyTicket(req, res){
        try{
            const {ticket_id} = req.params;
            const result = await messageService.listMessages(ticket_id, req.user);

            //--Se a busca não for bem sucessidade, retorna um erro
            if(!result.success){
                return res.status(400).json(error(result.errors))
            }
            
            return res.json(
                success({
                    messages: result.messages,
                    total: result.total
                })
            )
        }catch(err){
            console.error("Erro ao listar as mensagens", err);
            return res.status(500).json(error("Erro inteno no servidor"))
        }
    }


    //--Buscar mensagem por id
    async show(req, res){
        try{
            const {id} = req.params;
            const result = await messageService.getMessagebyId(id, req.user);

            //---Se a busca não for bem sucessidadd, retorna um erro
            if(!result.success){
                return res.status(400).json(error(result.errors))
            }

            return res.json(success(result.message));
        }catch(err){
            console.error("Erro ao buscar mensagem: ", err)
            return res.status(500)
        }
    }

}

module.exports = MessageController;