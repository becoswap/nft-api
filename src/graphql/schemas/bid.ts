import { buildSchema } from 'graphql';

const bidSchema = buildSchema(`
    type Bid {
        id: ID!
        nftId: String!
        bidder: String!
        address: String!
        price: String!
        createdAt: String!
        nft: Nft
    }

    type Nft {
        id: ID!
    }

    enum OrderDirection {
        ASC
        DESC
    }

    enum BidOrderBy {
        createdAt
    }

    input BidFilter {
        id: ID
        nftId: String
        bidder: String
        address: String
        nft: BidNftFilter
    }

    input BidNftFilter {
        owner: String
    }

    type Query {
        bid(id: ID!): Bid
        bidCount(where: BidFilter): Int!
        bids(orderBy: BidOrderBy = createdAt, orderDirection: OrderDirection = DESC, offset: Int = 0, limit: Int = 30, where: BidFilter): [Bid!]
    }
`);

export default bidSchema;
