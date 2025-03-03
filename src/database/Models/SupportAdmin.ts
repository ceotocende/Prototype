import { Sequelize, DataTypes, Model } from 'sequelize';

interface ISupportsAdmins {
    user_admin_id: number;
    super_user: boolean;
}

export class SupportsAdmins extends Model<ISupportsAdmins> {
  public user_admin_id!: number;
  public super_user!: boolean;
}

export const initSupportsAdminsModel = (sequelize: Sequelize) => {
  SupportsAdmins.init({
    user_admin_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    super_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'supports_admins',
    timestamps: false
  });
      console.log(`Таблица ${SupportsAdmins.tableName} зарегистрирована`);
};