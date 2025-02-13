import { Sequelize, DataTypes, Model } from 'sequelize';

interface ITickets {
    ticket_id: number;
    user_id: number;
    status: boolean;
    message_id: number;
}

export class Tickets extends Model<ITickets> {
    public ticket_id!: number;
    public user_id!: string;
    public status!: boolean | true;
    public message_id!: number;
}

export const initTicketsModel = (sequelize: Sequelize) => {
    Tickets.init({
        ticket_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        message_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'tickets',
        timestamps: false
    });
};