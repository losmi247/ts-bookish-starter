import { Router, Request, Response } from 'express';
import * as tedious from 'tedious';

class Book {
    ISBN: string;
    title: string;

    constructor(ISBN: string, title: string) {
        this.ISBN = ISBN;
        this.title = title;
    }
}

class BookController {
    router: Router;
    databaseConnection: tedious.Connection;

    constructor() {
        var config: tedious.ConnectionConfiguration = {
            //client: 'mssql',
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
                port: 1433, // Default Port
                trustServerCertificate: true,
                database: 'bookish',
            }
        };

        this.databaseConnection = new tedious.Connection(config);

        this.router = Router();
        this.router.get('/:id', this.getBook.bind(this));
        this.router.post('/', this.createBook.bind(this));
    }

    getBook(req: Request, res: Response) {
        const sqlStatement = "SELECT * FROM Books";
        this.databaseConnection.connect((err) => {
            if (err) {
                console.log('Connection Failed');
                throw err;
            }

            const databaseRequest = new tedious.Request(sqlStatement, (err, rowCount) => {
                if (err) {
                    throw err;
                }
                console.log('DONE!');
            });

            // whenever a row is emitted from the db, add it to our list
            let books = new Array(0);
            databaseRequest.on('row', (columns) => {
                let book = new Book(columns[0].value, columns[1].value);
                books.push(book);
            });

            /// this event fires when the sql command has been completed
            databaseRequest.on('doneInProc', (rowCount, more) => {
                console.log(rowCount + ' rows returned');
                
                /// send an http response to client
                res.status(200).json(books);
            });

            this.databaseConnection.execSql(databaseRequest);
        });
    }

    createBook(req: Request, res: Response) {
        let bookTitle: string = req.body.title;
        let authorFirstName: string = req.body.firstName;
        let authorSurname: string = req.body.lastName;
        let isbn: string = req.body.isbn;
        let numberOfCopies = req.body.copies;

        const sqlStatementForTableBooks = `INSERT INTO Books VALUES (${isbn}, ${bookTitle})`;
        this.databaseConnection.connect((err) => {
            if (err) {
                console.log('Connection Failed');
                throw err;
            }

            const databaseRequest = new tedious.Request(sqlStatementForTableBooks, (err, rowCount) => {
                if (err) {
                    throw err;
                }
                console.log('DONE!');
            });

            /// this event fires when the sql command has been completed
            databaseRequest.on('doneInProc', (rowCount, more) => {
                /// send an http response to client
                res.status(200);
            });

            this.databaseConnection.execSql(databaseRequest);
        });
    }
}

export default new BookController().router;