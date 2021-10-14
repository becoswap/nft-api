import { buildSchema } from 'graphql';

const collectionSchema = buildSchema(`
    type Collection {
        id: ID!
        name: String!
        avatar: String!
        banner: String!
        description: String!
        website: String!
        contract: String!
        totalVolume: String!
        totalItems: String!
        totalOwner: String!
        meta: CollectionMeta
        status: Int!
    }

    type CollectionMeta {
        sortOptions: [SortOption!]
    }

    type SortOption {
        label: String!
        value: String!
    }

    enum OrderDirection {
        ASC
        DESC
    }

    enum CollectionOrderBy {
        createdAt
    }

    input CollectionFilter {
        id: ID!
    }

    type Query {
        collection(id: ID!): Collection
        collectionCount(where: CollectionFilter): Int!
        collections(orderBy: CollectionOrderBy = createdAt, orderDirection: OrderDirection = DESC, offset: Int = 0, limit: Int = 30, where: CollectionFilter): [Collection!]
    }
`);

export default collectionSchema;
