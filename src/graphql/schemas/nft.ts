import { buildSchema } from 'graphql';

const schema = buildSchema(`
    type Nft {
        id: ID!
        creator: String!
        owner: String!
        nftType: Int!
        nftID: Int!
        name: String
        price: String
        auctionPrice: String
        onSale: Boolean!
        status: Int!
        thumbnail: String
        fileUrl: String
        tokenUrl: String
        votes: Int!
        exchangeAddress: String
        quoteToken: String
        creatorInfo: User
        properties: [Propery!]
    }

    type Propery {
        name: String!
        value: String
        intValue: Int
        maxVaule: Int
    }

    type User {
        id: ID!
        name: String!
        avatar: String
    }

    enum OrderDirection {
        ASC
        DESC
    }

    type Query {
        nfts(orderBy: OrderBy, orderDirection: OrderDirection, offset: Int, limit: Int, where: NftFilter): [Nft!]
    }

    enum OrderBy {
        nftId,
        price,
        votes,
        createdAt
    }

    input NftFilter {
        id: ID
        id__in: [ID]
        nftType: String
        nftId: Int
        onSale: Boolean
        status: Int
        creator: String
        owner: String
        stringProperties: [StringProperyFilter]
        intProperties: [IntProperyFilter]
    }

    input StringProperyFilter {
        name: String!
        values: [String!]
    }

    input IntProperyFilter {
        name: String!
        ranges: Range
    }

    input Range {
        min: Int!
        max: Int!
    }
`);

export default schema;
