module.exports = async function deleteResourceHandler (model, Ids, userId, next) {
	const deleted_resources = [];
	for (let i = 0; i < Ids.length; i++) {
		const resourceId = Ids[i];
		const resource = await model.findById(resourceId);
		if (!resource) return next(new Error(`ResourceModel not found with id of ${resourceId}`, 404));
		if (resource.user.toString() !== userId.toString())
			return next(new Error(`User not authorized to delete resource`, 401));
		await resource.remove();
		deleted_resources.push(resource);
	}
	return deleted_resources;
};
