require("dotenv").config();

module.exports = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    define: {
        // Cria o update_at e o created_at
        timestamps: true,
        //- Coloca o underscore nas colunas
        underscoreAll: true,
        underscoredAll: true
    },

}