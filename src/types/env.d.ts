declare namespace NodeJS {
    interface ProcessEnv {
        BOT_TOKEN: string;
        USER_DB: any;
        PORT_DB: number;
        HOST_DB: string;
        PASSWORD_DB: string;
        NAME_DB: string;
    }
}