// src/models/Message.js
const { Model, DataTypes } = require('sequelize');

class Message extends Model {
  static init(sequelize) {
    super.init(
      {
        id_message: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        ticket_id: { //--ID do ticket vinculado
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'tickets',
            key: 'id_ticket',
          },
          
        },
        sender_id: { //--ID do usuário que enviou a mensagem
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id_user',
          },
         
        },
        content: { //---O conteúdo da mensagem
          type: DataTypes.TEXT,
          allowNull: false,

        },
        is_internal: { //--Só interno vê a mensagem
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
         
        },
      },
      {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        timestamps: true,
        underscored: true,
        paranoid: true, // Soft delete
      }
    );
    return this;
  }

  static associate(models) {
    // Message pertence a um Ticket
    this.belongsTo(models.Ticket, {
      foreignKey: 'ticket_id',
      as: 'ticket',
    });

    // Message pertence a um User (quem enviou)
    this.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
    });
  }
}

module.exports = Message;