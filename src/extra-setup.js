
export default (sequelize) =>{
	const { user, nft, bid } = sequelize.models;

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
}