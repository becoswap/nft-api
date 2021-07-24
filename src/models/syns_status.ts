import { DataTypes } from "sequelize"

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports =  (sequelize) => {
	sequelize.define('sync_status', {
		id: {
			allowNull: false,
			autoIncrement: false,
			primaryKey: true,
			type: DataTypes.STRING
		},
		lastBlock: {
			allowNull: false,
			type: DataTypes.INTEGER
		}
	}, {
        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false,

        // If don't want createdAt
        createdAt: false,

        // If don't want updatedAt
        updatedAt: false,

    });
};