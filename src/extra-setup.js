
export default (sequelize) =>{
	const { user, nft, bid,  nft_property, event, vote} = sequelize.models;

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

	nft.hasMany(nft_property, {as: "search_properties"})
	nft.hasMany(nft_property, {as: "properties"})

	nft.hasMany(nft_property)
}