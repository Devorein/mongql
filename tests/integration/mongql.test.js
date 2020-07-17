const mongoose = require('mongoose');

const Mongql = require('../../src/MonGql');

test('Should throw without a resource key in schema', () => {
	const UserSchema = new mongoose.Schema({
		name: String
	});

	expect(() => {
		new Mongql({
			Schemas: [ UserSchema ]
		});
	}).toThrow();
});

describe('Single schema Typedefs generation', () => {
	const UserSchema = new mongoose.Schema({
		name: String
	});

	UserSchema.mongql = {
		resource: 'User'
	};

	const mongql = new Mongql({
		Schemas: [ UserSchema ]
	});

	let TransformedTypedefs;

	beforeEach(async () => {
		const res = await mongql.generate();
		TransformedTypedefs = res.TransformedTypedefs;
	});

	it('Should create typedefs from schema', async () => {
		expect(TransformedTypedefs).not.toBe(null);
		expect(TransformedTypedefs).not.toBe(undefined);
	});

	it('Should create typedefs with both obj and arr properties', async () => {
		expect(TransformedTypedefs).toHaveProperty('obj');
		expect(TransformedTypedefs).toHaveProperty('arr');
	});

	it('Should create typedefs where obj key has user key and not any others', async () => {
		expect(TransformedTypedefs).toHaveProperty('obj.User');
		expect(TransformedTypedefs).not.toHaveProperty('obj.Settings');
	});

	it('Should create typedefs where arr key has only user', async () => {
		expect(TransformedTypedefs.arr.length).toBe(1);
		expect(TransformedTypedefs.arr.length).not.toBe(2);
	});

	it('Should create typedefs where both arr and object are same', async () => {
		expect(TransformedTypedefs.arr.length).toBe(Object.keys(TransformedTypedefs.obj).length);
		expect(TransformedTypedefs.arr[0]).toBe(TransformedTypedefs.obj.User);
	});

	// it('Should create typedefs properly', async () => {
	// 	const { TransformedTypedefs } = await mongql.generate();
	// 	console.log(TransformedTypedefs.obj);
	// });
});

describe('Single schema Resolvers generation', () => {
	const UserSchema = new mongoose.Schema({
		name: String
	});

	UserSchema.mongql = {
		resource: 'User'
	};

	const mongql = new Mongql({
		Schemas: [ UserSchema ]
	});

	let TransformedResolvers;

	beforeEach(async () => {
		const res = await mongql.generate();
		TransformedResolvers = res.TransformedResolvers;
	});

	it('Should create resolvers from schema', async () => {
		expect(TransformedResolvers).not.toBe(null);
		expect(TransformedResolvers).not.toBe(undefined);
	});

	it('Should create resolvers with both obj and arr properties', async () => {
		expect(TransformedResolvers).toHaveProperty('obj');
		expect(TransformedResolvers).toHaveProperty('arr');
	});

	it('Should create resolvers where obj key has user key and not any others', async () => {
		expect(TransformedResolvers).toHaveProperty('obj.User');
		expect(TransformedResolvers).not.toHaveProperty('obj.Settings');
	});

	it('Should create resolvers where arr key has only user', async () => {
		expect(TransformedResolvers.arr.length).toBe(1);
		expect(TransformedResolvers.arr.length).not.toBe(2);
	});

	it('Should create resolvers where both arr and object are same', async () => {
		expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
		expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
	});
});
