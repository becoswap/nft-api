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
        nfts(orderBy: NFTOrderBy = createdAt, orderDirection: OrderDirection = DESC, offset: Int = 0, limit: Int = 30, where: NftFilter): [Nft!]
        nftCount(where: NftFilter): Int!
        nft(id: ID!): Nft
    }

    enum NFTOrderBy {
        nftId,
        price,
        votes,
        createdAt
    }

    input NftFilter {
        id: ID
        id__in: [ID]
        nftType: Int
        nftId: Int
        onSale: Boolean
        status: Int
        creator: String
        owner: String
        stringProperties: [StringPropertyFilter]
        intProperties: [IntPropertyFilter]
    }

    input StringPropertyFilter {
        name: String!
        values: [String!]
    }

    input IntPropertyFilter {
        name: String!
        ranges: RangeFilter
    }

    input RangeFilter {
        min: Int!
        max: Int!
    }
`);

export default schema;
