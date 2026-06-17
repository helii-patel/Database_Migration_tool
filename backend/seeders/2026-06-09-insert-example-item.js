module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.bulkInsert('example_items', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Example Item',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('example_items', { id: '11111111-1111-1111-1111-111111111111' });
  },
};
