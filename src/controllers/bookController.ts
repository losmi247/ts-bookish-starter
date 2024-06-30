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
        let databaseConnectionConfiguration: tedious.ConnectionConfiguration = {
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
                port: 1433,
                trustServerCertificate: true,
                database: 'bookish',
            }
        };

        this.databaseConnection = new tedious.Connection(databaseConnectionConfiguration);

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
                this.databaseConnection.close();
            });

            // whenever a row is emitted from the db, add it to our list
            let books = new Array(0);
            databaseRequest.on('row', (columns) => {
                let book = new Book(columns[0].value, columns[1].value);
                books.push(book);
            });

            // this event fires when the sql command has been completed
            databaseRequest.on('doneInProc', (rowCount, more) => {
                console.log(rowCount + ' rows returned');
                
                // send an http response to client
                res.status(200).json(books);
            });

            // start the sql command
            this.databaseConnection.execSql(databaseRequest);
        });
    }

    createBook(req: Request, res: Response) {
        let bookTitle: string = req.body.title;
        let authorFirstName: string = req.body.firstName;
        let authorSurname: string = req.body.lastName;
        let isbn: string = req.body.isbn;
        let numberOfCopies: number = req.body.copies;

        const sqlCommand = `
            DECLARE @author_id INT;

            BEGIN TRANSACTION;

            -- add to AuthorInfo
            IF NOT EXISTS (SELECT * FROM AuthorInfo WHERE first_name = @authorFirstName AND surname = @authorSurname)
            BEGIN
                INSERT INTO AuthorInfo (first_name, surname) VALUES (@authorFirstName, @authorSurname);
            END

            -- add to Authors
            SELECT @author_id = author_id FROM AuthorInfo 
            WHERE first_name = @authorFirstName AND surname = @authorSurname;
            IF NOT EXISTS (SELECT * FROM Authors WHERE isbn = @isbn AND author_id = @author_id)
            BEGIN
                INSERT INTO Authors (isbn, author_id) VALUES (@isbn, @author_id);
            END

            -- add to Books
            IF NOT EXISTS (SELECT * FROM Books WHERE isbn = @isbn)
            BEGIN
                INSERT INTO Books (isbn, title) VALUES (@isbn, @bookTitle);
            END

            -- add #copies to Copies
            DECLARE @Counter INT 
            SET @Counter=1
            WHILE (@Counter <= @numberOfCopies)
            BEGIN
                INSERT INTO Copies (isbn) VALUES (@isbn)
                SET @Counter = @Counter + 1
            END

            COMMIT TRANSACTION;`;

        this.databaseConnection.connect((err) => {
            if (err) {
                console.log('Connection Failed');
                throw err;
            }

            const databaseRequest = new tedious.Request(sqlCommand, (err, rowCount) => {
                if (err) {
                    throw err;
                }
                console.log('DONE!');
                this.databaseConnection.close();
            });
    
            databaseRequest.addParameter('bookTitle', tedious.TYPES.VarChar);
            databaseRequest.addParameter('authorFirstName', tedious.TYPES.VarChar);
            databaseRequest.addParameter('authorSurname', tedious.TYPES.VarChar);
            databaseRequest.addParameter('isbn', tedious.TYPES.VarChar);
            databaseRequest.addParameter('numberOfCopies', tedious.TYPES.Int); 
    
            databaseRequest.on('prepared', () => {
                console.log('request prepared');
                
                /// execute the prepared statement
                this.databaseConnection.execute(databaseRequest, {
                    bookTitle: bookTitle,
                    authorFirstName: authorFirstName,
                    authorSurname: authorSurname,
                    isbn: isbn,
                    numberOfCopies: numberOfCopies
                });
            });

            // this event fires when the sql command has been completed
            databaseRequest.on('requestCompleted', () => {
                // send an http response to client
                res.status(200).json({});
            });

            //databaseConnection.execSql(databaseRequest);         
            this.databaseConnection.prepare(databaseRequest);
        });
    }
}

export default new BookController().router;