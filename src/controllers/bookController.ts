import { Router, Request, Response } from 'express';
import * as tedious from 'tedious';
import { Query, QueryParameter} from '../query';

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

    constructor() {
        this.router = Router();
        this.router.get('/', this.getBooks.bind(this));
        this.router.get('/search', this.searchBooks.bind(this));
        this.router.post('/', this.createBook.bind(this));
    }

    async getBooks(req: Request, res: Response) {
        let sqlStatement = `
        SELECT * FROM Books
        ORDER BY title`;

        let getBooks = new Query(sqlStatement, new Array(0));

        try {
            let booksTable: Array<any[]> = await getBooks.executeStatement();
            let books = new Array(0);
            for(let columns of booksTable) {
                let book = new Book(columns[0].value, columns[1].value);
                books.push(book);
            }
            res.status(200).json(books);
        } catch {
            res.status(401);
        }
    }

    async searchBooks(req: Request, res: Response) {
        let bookTitle = req.query.title;
        let authorFirstName = req.query.firstName;
        let authorSurname = req.query.surname;

        console.log(bookTitle , authorFirstName , authorSurname);

        const sqlStatement = `
            SELECT Books.isbn, Books.title, AuthorInfo.first_name, AuthorInfo.surname FROM Books
            INNER JOIN Authors ON Books.isbn = Authors.isbn
            INNER Join AuthorInfo ON Authors.author_id = AuthorInfo.author_id
            WHERE (title=@bookTitle OR @bookTitle IS NULL) 
                AND (first_name=@authorFirstName OR @authorFirstName is NULL) 
                AND (surname=@authorSurname OR @authorSurname is NULL);`;

        let searchParameters = new Array(0);
        searchParameters.push(new QueryParameter("bookTitle", (bookTitle as string), tedious.TYPES.VarChar));
        searchParameters.push(new QueryParameter("authorFirstName", (authorFirstName as string), tedious.TYPES.VarChar));
        searchParameters.push(new QueryParameter("authorSurname", (authorSurname as string), tedious.TYPES.VarChar));
        
        let searchBooks = new Query(sqlStatement, searchParameters);

        try {
            let booksTable: Array<any[]> = await searchBooks.executeStatement();
            let books = new Array(0);
            for(let columns of booksTable) {
                for(let i = 0; i < columns.length; i++) {
                    books.push(columns[i].value)
                }
            }
            res.status(200).json(books);
        } catch {
            res.status(401);
        }

    }

    async createBook(req: Request, res: Response) {
        let bookTitle: string = req.body.title;
        let authorFirstName: string = req.body.firstName;
        let authorSurname: string = req.body.surname;
        let isbn: string = req.body.isbn;
        let numberOfCopies: number = req.body.numberOfCopies;

        const sqlStatementAddBook = `
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

            COMMIT TRANSACTION;`;

        let bookParameters = new Array(0);
        bookParameters.push(new QueryParameter("bookTitle", bookTitle, tedious.TYPES.VarChar));
        bookParameters.push(new QueryParameter("authorFirstName", authorFirstName, tedious.TYPES.VarChar));
        bookParameters.push(new QueryParameter("authorSurname", authorSurname, tedious.TYPES.VarChar));
        bookParameters.push(new QueryParameter("isbn", isbn, tedious.TYPES.VarChar));

        let addBook = new Query(sqlStatementAddBook, bookParameters);
        try {
            await addBook.executeStatement();
        } catch {
            return res.status(400).json();
        }

        const sqlStatementAddCopies = `
            INSERT INTO Copies (isbn) VALUES (@isbn)
        `;

        for(let i = 0; i < numberOfCopies; i++){
            try{
                let copiesParameters = new Array(0);
                copiesParameters.push(new QueryParameter("isbn", isbn, tedious.TYPES.VarChar));
                let addCopies = new Query(sqlStatementAddCopies, copiesParameters);
                await addCopies.executeStatement();
            } catch {
                return res.status(400).json();
            }
        }

        res.status(201).json();
    }
}

export default new BookController().router;