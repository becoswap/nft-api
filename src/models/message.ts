import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define(
    'message',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      object_type: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      object_id: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {
      updatedAt: false,
      createdAt: false,
    }
  );
};
