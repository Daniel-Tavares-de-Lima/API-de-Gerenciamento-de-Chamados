'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id_message: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id_ticket',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Se ticket for deletado, mensagens também
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_user',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Não pode deletar user se tem mensagens
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Conteúdo da mensagem',
      },
      is_internal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Mensagem é nota interna (só INTERNO vê)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Índices para melhorar performance
    await queryInterface.addIndex('messages', ['ticket_id']);
    await queryInterface.addIndex('messages', ['sender_id']);
    await queryInterface.addIndex('messages', ['created_at']);
    await queryInterface.addIndex('messages', ['is_internal']);
  },
 

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
