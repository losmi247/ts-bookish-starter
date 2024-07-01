import * as tedious from 'tedious';
import { DataType } from 'tedious/lib/data-type';
import { databaseConnectionConfig } from './databaseConnectionConfig';

export class QueryParameter {
    name: string;
    value: string;
    type: DataType;

    constructor(name: string, value: string, type: DataType) {
        this.name = name;
        this.value = value;
        this.type = type;
    }
}

export class Query {
    sqlStatement: string;
    parameters: QueryParameter[];

    constructor(sqlStatement: string, parameters: QueryParameter[]) {
        this.sqlStatement = sqlStatement;
        this.parameters = parameters;
    }

    executeStatement() {
        let databaseConnection = new tedious.Connection(databaseConnectionConfig);
        let table = Array(0);
        return new Promise<Array<any>>((resolve, reject) => {
            databaseConnection.connect((err) => {
                if (err) {
                    console.log('Connection Failed');
                    reject(err);
                }
    
                const databaseRequest = new tedious.Request(this.sqlStatement, (err, rowCount) => {
                    if (err) {
                        reject(err);
                    }
                    console.log('Request completed');
                    databaseConnection.close();
                });
            
                for(let parameter of this.parameters) {
                    databaseRequest.addParameter(parameter.name, parameter.type);
                }

                let obj = {};
                for(let parameter of this.parameters) {
                    obj[parameter.name] = parameter.value;
                }
                databaseRequest.on('prepared', () => {
                    console.log('request prepared');
                    
                    databaseConnection.execute(databaseRequest, obj);
                });

                databaseRequest.on('row', (columns) => {
                    table.push(columns);
                });

                databaseRequest.on('requestCompleted', () => {
                    resolve(table);
                });
    
                databaseConnection.prepare(databaseRequest);
            });
        });
    }
}