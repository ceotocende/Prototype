import { Sequelize, DataTypes, Model } from 'sequelize';

interface IMEssages {
    message_id: number;
    tickets_id: number;
    text: string;
}

export class Messages extends Model<IMEssages> {
  public message_id!: number;
  public tickets_id!: number;
  public text!:string;
}

export const initMessagesModel = (sequelize: Sequelize) => {
    Messages.init({
        message_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
        },
        tickets_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'messages',
        timestamps: false
    });
    console.log(`Таблица ${Messages.tableName} зарегистрирована`)
};