import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define(
    'vote',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      nftType: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      nftId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      voter: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      votes: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
    },
    {
      // If don't want updatedAt
      updatedAt: false,

      indexes: [
        {
          fields: ['nftType'],
        },
        {
          fields: ['nftId'],
        },
        {
          fields: ['voter'],
        },
      ],
    }
  );
};
