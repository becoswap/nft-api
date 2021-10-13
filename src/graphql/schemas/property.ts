import { buildSchema } from 'graphql';

const propertySchema = buildSchema(`
    type PropertyStats {
        stringProperties: [StringPropery!]
        intProperties: [IntPropery]
    }

    type StringPropery {
        key: String!
        values: [StringPropertyValue!]
    }

    type StringPropertyValue {
        value: String!
        count: Int!
    }

    type IntPropery {
        key: String!
        value: Range
    }

    type Range {
        min: Int!
        max: Int!
    }

    input PropertyStatsFilter {
        nftType: Int
        owner: String
        creator: String
    }

    type Query {
        propertyStats(where: PropertyStatsFilter): PropertyStats
    }
`);

export default propertySchema;
