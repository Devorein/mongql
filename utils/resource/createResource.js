module.exports = async function createResource (model, userId, data) {
	data.user = userId;
	return await model.create(data);
};
