import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define(
    'collection',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      avatar: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      banner: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      website: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      contract: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      totalVolume: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: 0,
      },
      totalItems: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalOwner: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      meta: {
        allowNull: false,
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      status: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      indexes: [],
    }
  );
};
