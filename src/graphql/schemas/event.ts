import { buildSchema } from 'graphql';

const eventSchema = buildSchema(`
    type Event {
        id: ID!
        txHash: String!
        event: String!
        address: String!
        nftId: String!
        from: String!
        to: String
        metadata: Meta
        createdAt: String
    }

    type Meta {
        price: String
        buyer: String
        seller: String
        fee: String
    }

    enum OrderDirection {
        ASC
        DESC
    }

    enum EventOrderBy {
        createdAt
    }

    enum EventName {
        Ack,
        Trade,
        CancelBidToken,
        CancelSellToken
        Bid
    }

    input EventFilter {
        id: ID
        address: String
        nftId: String
        from: String
        to: String
        event: String
    }

    type Query {
        event(id: ID!): Event
        eventCount(where: EventFilter): Int!
        events(orderBy: EventOrderBy = createdAt, orderDirection: OrderDirection = DESC, offset: Int = 0, limit: Int = 30, where: EventFilter): [Event!]
    }
`);

export default eventSchema;
