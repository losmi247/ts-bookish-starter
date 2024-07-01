import * as tedious from 'tedious';

export const databaseConnectionConfig: tedious.ConnectionConfiguration = {
    server: '127.0.0.1',
    authentication: {
        type: 'default',
        options: {
            userName: 'BookishCM',
            password: 'abcdefghij123*',
            trustServerCertificate: true,
            encrypt: false,
        }
    },
    options: {
        port: 1433,
        trustServerCertificate: true,
        database: 'bookish',
    }
}