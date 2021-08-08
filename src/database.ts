import { Sequelize } from 'sequelize';
import applyExtraSetup from './extra-setup';

// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
var sequelize;

if (process.env.POSTGRES_URI) {
  sequelize = new Sequelize(process.env.POSTGRES_URI);
} else {
  sequelize = new Sequelize('nfts', null, null, {
    dialect: 'postgres',
    port: 5432,
    replication: {
      read: [
        { host: process.env.DB_READ_1, username: 'postgres', password: process.env.DB_PASS },
        { host: process.env.DB_READ_2, username: 'postgres', password: process.env.DB_PASS },
      ],
      write: { host: process.env.DB_WRITE, username: 'postgres', password: process.env.DB_PASS },
    },
    pool: {
      // If you want to override the options used for the read/write pool you can do so here
      max: 20,
      idle: 30000,
    },
    logging: false,
  });
}

const modelDefiners = [
  require('./models/nft'),
  require('./models/event'),
  require('./models/syns_status'),
  require('./models/user'),
  require('./models/artwork'),
  require('./models/vote'),
];

// We define all models according to their files.
for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// We execute any extra setup after the models are defined, such as adding associations.
applyExtraSetup(sequelize);

export default sequelize;
