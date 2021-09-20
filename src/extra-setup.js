
export default (sequelize) =>{
	const { user, nft, bid,  nft_property, event, vote, collection} = sequelize.models;

	user.hasMany(nft, {
		foreignKey: 'owner',
		constraints: false
	});
	nft.belongsTo(user, {
		foreignKey: 'creator',
		as: "creatorInfo",
		constraints: false
	});

	bid.belongsTo(nft, {
		foreignKey: 'nftId',
		as: "nft",
	});

	event.belongsTo(nft, {
		foreignKey: 'nftId',
		as: "nft",
	});

	vote.belongsTo(nft, {
		foreignKey: 'nftId',
		as: "nft",
	});

	nft.hasMany(nft_property, {as: "properties"})


	nft.belongsTo(collection, {
		foreignKey: 'nftType',
	});

	collection.hasMany(nft, {
		foreignKey: 'nftType',
	})
}