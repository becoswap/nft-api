import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define(
    'nft_property',
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
      type: {
        allowNull: false,
        type: DataTypes.STRING,
        enum: ['property', 'stats', 'level', 'other'],
        defaultValue: 'property',
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      maxValue: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      value: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      intValue: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
    },
    {
      updatedAt: false,
      createdAt: false,
      indexes: [
        {
          fields: ['nftId'],
        },
        {
          fields: ['value'],
        },
        {
          fields: ['intValue'],
        },
      ],
    }
  );
};
