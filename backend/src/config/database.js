require('dotenv').config();

export const development = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'webrams',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: false
};
export const test = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_TEST_NAME || 'webrams_test',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: false
};
export const production = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
};