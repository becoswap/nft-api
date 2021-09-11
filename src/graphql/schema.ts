import { buildSchema } from 'graphql';

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    nfts(order: String, offset: Int, limit: Int, where: NFTFilter): [Nft]
  }

  input NFTFilter {
    nftId: Int,
    nftType: Int

    nftId__in: [ID!]

    cardId: String
  }


  type Nft {
    id: ID!
    name: String
    nftId: Int!
    nftType: Int!
    creator: String
    owner: String
    description: String
    price: String
    auctionPrice: String
    fileUrl: String
    tokenUrl: String
    exchangeAddress: String
    quoteToken: String
    attributes: Attributes
    onSale: Boolean
    status: Int
  }

  type Attributes {
    owner: String!
    cardId: String!
    classId:String!
    rarity: String!
    sireId: String! 
    matronId: String! 
    genes: String! 
    cooldownEndBlock: String!
    siringWithId: String! 


    "Body Parts"
    anten: String!
    head: String!
    eye: String!
    lShouder: String!
    rShouder: String!
    lArm: String!
    rArm: String!
    lHand: String!
    rHand: String!

    "Monster: Body Parts"
    mouth: String!
    hand: String!
    arm: String!

    "Stats"
    hp: String!
    speed: String!
    strength: String!
  }
`);

export default schema;
