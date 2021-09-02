import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define(
    'nft',
    {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: DataTypes.STRING,
      },
      name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      nftType: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      nftId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      creator: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      owner: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      price: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      auctionPrice: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      maxBidPrice: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      fileUrl: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      tokenUrl: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      votes: {
        allowNull: false,
        type: DataTypes.INTEGER,
        default: 0,
      },
      exchangeAddress: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      quoteToken: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      attributes: {
        allowNull: true,
        type: DataTypes.JSONB,
      },
      onSale: {
        allowNull: false,
        default: false,
        type: DataTypes.BOOLEAN,
      },
      status: {
        allowNull: false,
        default: 0,
        type: DataTypes.INTEGER,
      },
    },
    {
      indexes: [
        {
          fields: ['nftType'],
        },
        {
          fields: ['creator'],
        },
        {
          fields: ['owner'],
        },
        {
          fields: ['onSale'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['votes'],
        },
        {
          fields: ['attributes'],
          using: 'gin',
          operator: 'jsonb_path_ops',
        },
      ],
    }
  );
};
