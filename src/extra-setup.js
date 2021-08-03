
export default (sequelize) =>{
	const { user, nft } = sequelize.models;

	user.hasMany(nft, {
		foreignKey: 'owner',
		constraints: false
	});
	nft.belongsTo(user, {
		foreignKey: 'creator',
		as: "creatorInfo",
		constraints: false
	});
}