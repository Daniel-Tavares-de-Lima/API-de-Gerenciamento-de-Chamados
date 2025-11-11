const app = require("./index");


app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
    console.log("http://localhost:3000");
})

module.exports = app;
