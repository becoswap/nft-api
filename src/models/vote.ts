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
      nftId: {
        allowNull: false,
        type: DataTypes.STRING,
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
      indexes: [
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
