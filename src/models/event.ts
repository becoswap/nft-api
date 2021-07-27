import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define(
    'event',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      txHash: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      event: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      address: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      nftAddress: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      nftId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      from: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      to: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metadata: {
        allowNull: true,
        type: DataTypes.JSONB,
      },
    },
    {
      updatedAt: false,
      indexes: [
        {
          fields: ['nftAddress'],
        },
        {
          fields: ['nftId'],
        },
      ],
    }
  );
};
