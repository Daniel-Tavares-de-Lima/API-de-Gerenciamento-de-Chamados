'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //---Adiciona deleted_at em users
    await queryInterface.addColumn("users", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    
    ///---Adiciona deleted_at em forms
    await queryInterface.addColumn("forms", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    ///---Adiciona deleted_at em form_resposes;
    await queryInterface.addColumn("form_responses", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("tickets", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    
  },

  async down (queryInterface) {
    //--Remove as colunas
    await queryInterface.removeColumn("users", "deleted_at");
    await queryInterface.removeColumn("forms", "deleted_at");
    await queryInterface.removeColumn("form_responses", "deleted_at");
    await queryInterface.removeColumn("tickets", "deleted_at");
  }
};
