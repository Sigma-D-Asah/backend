import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
    NODE_ENV: string;
    HOST: string;
    PORT: number;
    DATABASE_URL: string;
    OPENAI_API_KEY: string;
}

function getConfig(): AppConfig {
    return {
        NODE_ENV: process.env.NODE_ENV || 'development',
        HOST: process.env.HOST || '127.0.0.1',
        PORT: Number(process.env.PORT) || 3000,
        DATABASE_URL: process.env.DATABASE_URL || '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    };
}

export const appConfig = getConfig();