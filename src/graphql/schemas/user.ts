import { buildSchema } from 'graphql';

const userSchema = buildSchema(`
    type User {
        id: ID!
        name: String!
        avatar: String
        banner: String
        introduction: String
        website: String
        createdAt: String!
    }

    enum OrderDirection {
        ASC
        DESC
    }

    enum UserOrderBy {
        createdAt
    }

    input UserFilter {
        id: ID
    }

    type Query {
        user(id: ID!): User
        userCount(where: UserFilter): Int!
        users(orderBy: UserOrderBy = createdAt, orderDirection: OrderDirection = DESC, offset: Int = 0, limit: Int = 30, where: UserFilter): [User!]
    }
`);

export default userSchema;
