import { Sequelize } from "sequelize";
import { FAQ, initFAQModel } from "./Models/FAQ";
import { initUsersModel, Users } from "./Models/Users";
import { sequelize } from "./sequelize";
import { initTicketsModel, Tickets } from "./Models/Tickets";

export async function syncDataBase() {
    try {
        await sequelize.authenticate();
        console.log('База данных открыта');
        
        initFAQModel(sequelize);
        initUsersModel(sequelize);
        initTicketsModel(sequelize);
        
        await FAQ.sync();
        await Users.sync();
        await Tickets.sync();

    } catch (err) {
        console.error('Оп ошибка: ' + err)
    }
} 

export default sequelize;