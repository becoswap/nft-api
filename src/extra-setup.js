
export default (sequelize) =>{
	const { user, nft } = sequelize.models;

	user.hasMany(nft, {
		foreignKey: 'owner'
	});
	nft.belongsTo(user, {
		foreignKey: 'owner'
	});
}