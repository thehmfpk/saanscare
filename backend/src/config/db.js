const { Sequelize } = require("sequelize");
require("dotenv").config();

const dialect = (process.env.DB_DIALECT || "sqlite").toLowerCase();

let sequelize;

if (dialect === "mysql") {
  const useSSL = String(process.env.DB_SSL || "false").toLowerCase() === "true";
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      dialectOptions: useSSL
        ? { ssl: { require: true, rejectUnauthorized: process.env.DB_SSL_STRICT !== "false" } }
        : {},
    }
  );
} else {
  // SQLite — zero-config, works instantly for demos/dev. Same SQL models/queries
  // work unchanged if you switch DB_DIALECT=mysql later for production/judging.
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.SQLITE_PATH || "./saanscare.sqlite",
    logging: false,
  });
}

module.exports = sequelize;
