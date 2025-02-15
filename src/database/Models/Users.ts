import { Sequelize, DataTypes, Model } from 'sequelize';

interface IUsers {
    user_id: number;
    username: string;
}

export class Users extends Model<IUsers> {
  public user_id!: number;
  public username!: string;
}

export const initUsersModel = (sequelize: Sequelize) => {
  Users.init({
    user_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'users',
    timestamps: false
  });
      console.log(`Таблица ${Users.tableName} зарегистрирована`);
};