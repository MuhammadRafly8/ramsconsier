'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Matrix extends Model {
    static associate(models) {
      // define association here
      Matrix.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    }
  }
  
  Matrix.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    keyword: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        rows: [],
        columns: [],
        dependencies: {}
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sharedWith: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Matrix',
    tableName: 'matrices',
    timestamps: true
  });
  
  return Matrix;
};