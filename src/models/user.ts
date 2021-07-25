import { DataTypes } from 'sequelize';

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = sequelize => {
  sequelize.define('user', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    avatar: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    banner: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    introduction: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    website: {
      allowNull: true,
      type: DataTypes.STRING,
    },
  });
};
