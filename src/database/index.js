const cors = require("cors");
const express = require("express");
require("dotenv").config();

const app = express();

// Importa as rotas
const userRoutes = require('./app/routes/userRoutes'); 

app.use(cors()); //--Requisições de outros grupos
app.use(express.json()); //--Para interpretar JSON
app.use(express.urlencoded({extended: true})); //--Dados do formulário


//--Rota para teste
app.get("/", (req, res) => {
    res.json({
        message: "API DE Chamados - QSM",
        version: "1.0",
        status: "Online!"
    });
})

//--- Outras rotas -- EM ANDAMENTO
app.use('/api', userRoutes);
// app.use("/users", userRouter);
// app.user("/tickets", ticketsRouter)

//--Rota para erros
app.use((req, res) => {
    res.status(404).json({
        error: "Rota não encontrada",
        path: req.originalUrl
    });
})

//--Middlewares para tratamento de erros
app.use((err, req, res, next) =>{
    console.error("Erro: ", err);

    res.status(err.status).json({
        error: err.message
    });
})

module.exports = app;