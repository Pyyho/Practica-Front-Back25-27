import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// 1. Схема (SDL)
const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    birthYear: Int
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    publishedYear: Int
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
  }

  type Mutation {
    createAuthor(name: String!, birthYear: Int): Author!
    createBook(title: String!, authorId: ID!, publishedYear: Int): Book!
  }
`;

// 2. Данные в памяти
const authors = [
  { id: '1', name: 'Лев Толстой', birthYear: 1828 },
  { id: '2', name: 'Фёдор Достоевский', birthYear: 1821 },
];

const books = [
  { id: '1', title: 'Война и мир', publishedYear: 1869, authorId: '1' },
  { id: '2', title: 'Анна Каренина', publishedYear: 1877, authorId: '1' },
  { id: '3', title: 'Преступление и наказание', publishedYear: 1866, authorId: '2' },
];

// 3. Резолверы
const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find(book => book.id === id),
    authors: () => authors,
  },
  Mutation: {
    createAuthor: (_, { name, birthYear }) => {
      const newAuthor = {
        id: String(authors.length + 1),
        name,
        birthYear: birthYear || null,
      };
      authors.push(newAuthor);
      return newAuthor;
    },
    createBook: (_, { title, authorId, publishedYear }) => {
      // Проверка, что автор существует
      const authorExists = authors.some(a => a.id === authorId);
      if (!authorExists) {
        throw new Error(`Автор с id ${authorId} не найден`);
      }
      const newBook = {
        id: String(books.length + 1),
        title,
        publishedYear: publishedYear || null,
        authorId,
      };
      books.push(newBook);
      return newBook;
    },
  },
  // Вложенные резолверы для связей
  Book: {
    author: (parent) => authors.find(author => author.id === parent.authorId),
  },
  Author: {
    books: (parent) => books.filter(book => book.authorId === parent.id),
  },
};

// 4. Запуск сервера
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });

console.log(`🚀 GraphQL сервер запущен: ${url}`);