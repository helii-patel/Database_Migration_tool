module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('example_items', {
      id: {
        type: 'UUID',
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: 'VARCHAR(255)',
        allowNull: false,
      },
      created_at: {
        type: 'DATETIME',
        allowNull: false,
      },
      updated_at: {
        type: 'DATETIME',
        allowNull: false,
      },
    });
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('example_items');
  },
};
