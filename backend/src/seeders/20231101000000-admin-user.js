'use strict';
import { genSalt, hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function up(queryInterface, Sequelize) {
  const salt = await genSalt(10);
  const hashedPassword = await hash('admin123', salt);

  return queryInterface.bulkInsert('users', [{
    id: uuidv4(),
    username: 'admin',
    password: hashedPassword,
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }]);
}
export async function down(queryInterface, Sequelize) {
  return queryInterface.bulkDelete('users', { username: 'admin' }, {});
}