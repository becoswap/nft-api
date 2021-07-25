import { Sequelize } from "sequelize"
import applyExtraSetup from "./extra-setup"
const databaseURI = process.env.POSTGRES_URI || "postgres://postgres:example@localhost:5432/beco-nft"

// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
const sequelize = new Sequelize(databaseURI);


const modelDefiners = [
	require('./models/nft'),
	require('./models/event'),
	require('./models/syns_status'),
	require('./models/user')
];


// We define all models according to their files.
for (const modelDefiner of modelDefiners) {
	modelDefiner(sequelize);
}

// We execute any extra setup after the models are defined, such as adding associations.
applyExtraSetup(sequelize);

export default sequelize