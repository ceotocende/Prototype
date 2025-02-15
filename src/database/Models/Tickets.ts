import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface ITickets {
    ticket_id: number;
    user_id: number;
    status: boolean;
    message_id_answer: number;
    message_id_reply: number;
    moderator: number;
    id?: number;
}

interface TicketsAttributes extends Optional<ITickets, 'ticket_id'> {};


export class Tickets extends Model<ITickets, TicketsAttributes> {
    public id!: number;
    public ticket_id!: number;
    public user_id!: string;
    public status!: boolean | true;
    public message_id_answer!: number;
    public message_id_reply!: number;
    public moderator!: number;
}

export const initTicketsModel = (sequelize: Sequelize) => {
    Tickets.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey: true,
        },
        ticket_id: {
            type: DataTypes.BIGINT,
            allowNull: false
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
        message_id_answer: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        message_id_reply: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        moderator: {
            type: DataTypes.BIGINT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'tickets',
        timestamps: false
    });
        console.log(`Таблица ${Tickets.tableName} зарегистрирована`);
};