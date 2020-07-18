const mongoose = require('mongoose');
const { isDocumentNode, documentApi } = require('graphql-extra');
const gql = require('graphql-tag');

const Mongql = require('../../src/MonGql');

describe('Errors', () => {
	const UserSchema = new mongoose.Schema({
		name: String
	});

	const SettingsSchema = new mongoose.Schema({
		created_at: {
			type: Date,
			mongql: {
				scalar: 'Date'
			}
		}
	});

	SettingsSchema.mongql = {
		resource: 'Settings'
	};

	test('Should throw without a resource key in schema', () => {
		expect(() => {
			new Mongql({
				Schemas: [ UserSchema ]
			});
		}).toThrow();
	});

	test('Should throw even if a single schema doesnt have resource key', () => {
		expect(() => {
			new Mongql({
				Schemas: [ UserSchema, SettingsSchema ]
			});
		}).toThrow();
	});
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

	it('Should create typedefs where obj key has base and external keys', async () => {
		expect(TransformedTypedefs).toHaveProperty('obj.External');
		expect(TransformedTypedefs).toHaveProperty('obj.Base');
	});
});

describe('Multiple schema Typedefs generation', () => {
	const UserSchema = new mongoose.Schema({
		name: String
	});

	UserSchema.mongql = {
		resource: 'User'
	};

	const SettingsSchema = new mongoose.Schema({
		created_at: {
			type: Date,
			mongql: {
				scalar: 'Date'
			}
		}
	});

	SettingsSchema.mongql = {
		resource: 'Settings'
	};

	const mongql = new Mongql({
		Schemas: [ UserSchema, SettingsSchema ]
	});

	let TransformedTypedefs;

	beforeEach(async () => {
		const res = await mongql.generate();
		TransformedTypedefs = res.TransformedTypedefs;
	});

	it('Should create typedefs with both obj and arr properties', async () => {
		expect(TransformedTypedefs).toHaveProperty('obj');
		expect(TransformedTypedefs).toHaveProperty('arr');
	});

	it('Should create typedefs where obj key has user and settings key and not any others', async () => {
		expect(TransformedTypedefs).toHaveProperty('obj.User');
		expect(TransformedTypedefs).toHaveProperty('obj.Settings');
		expect(TransformedTypedefs).not.toHaveProperty('obj.Folder');
	});

	it('Should create typedefs where obj key has Base and External keys', async () => {
		expect(TransformedTypedefs).toHaveProperty('obj.Base');
		expect(TransformedTypedefs).toHaveProperty('obj.External');
	});
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
		expect(TransformedResolvers.arr.length).toBe(3);
	});

	it('Should create resolvers where both arr and object are same', async () => {
		expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
		expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
	});
});

describe('Multiple schema Resolvers generation', () => {
	const UserSchema = new mongoose.Schema({
		name: String
	});

	UserSchema.mongql = {
		resource: 'User'
	};

	const SettingsSchema = new mongoose.Schema({
		created_at: {
			type: Date,
			mongql: {
				scalar: 'Date'
			}
		}
	});

	SettingsSchema.mongql = {
		resource: 'Settings'
	};

	const mongql = new Mongql({
		Schemas: [ UserSchema, SettingsSchema ]
	});

	let TransformedResolvers;

	beforeEach(async () => {
		const res = await mongql.generate();
		TransformedResolvers = res.TransformedResolvers;
	});

	it('Should create resolvers with both obj and arr properties', async () => {
		expect(TransformedResolvers).toHaveProperty('obj');
		expect(TransformedResolvers).toHaveProperty('arr');
	});

	it('Should create resolvers where obj key has user and settings key and not any others', async () => {
		expect(TransformedResolvers).toHaveProperty('obj.User');
		expect(TransformedResolvers).toHaveProperty('obj.Settings');
		expect(TransformedResolvers).not.toHaveProperty('obj.Folder');
	});

	it('Should create resolvers where arr key has only user and settings', async () => {
		expect(TransformedResolvers.arr.length).toBe(4);
	});

	it('Should create resolvers where both arr and object are same', async () => {
		expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
		expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
		expect(TransformedResolvers.arr[1]).toBe(TransformedResolvers.obj.Settings);
	});
});

describe('Proper typedef generation', () => {
	let TransformedTypedefs;

	const DocumentAPI = {},
		SchemaFields = {},
		Schemas = {},
		resources = [ 'User', 'Settings' ];

	const UserSchema = new mongoose.Schema({
		name: String,
		ROLE: {
			type: String,
			enum: [ 'ADMIN', 'ORGANIZER', 'ATTENDEE' ]
		}
	});

	UserSchema.mongql = {
		resource: 'User'
	};

	const SettingsSchema = new mongoose.Schema({
		created_at: {
			type: Date,
			mongql: {
				scalar: 'Date'
			}
		},
		ROLE: {
			type: String,
			enum: [ 'BASIC', 'INTERMEDIATE', 'ADVANCED' ]
		}
	});

	const InitUserTypedef = gql`
		type UserData {
			name: String!
		}
	`;

	const initSettingsTypedef = gql`
		type SettingsData {
			name: String!
		}
	`;

	SettingsSchema.mongql = {
		resource: 'Settings'
	};

	const mongql = new Mongql({
		Schemas: [ UserSchema, SettingsSchema ],
		Typedefs: {
			init: {
				User: InitUserTypedef,
				Settings: initSettingsTypedef
			}
		}
	});

	Schemas.User = UserSchema;
	Schemas.Settings = SettingsSchema;

	resources.forEach((resource) => {
		SchemaFields[resource] = Object.keys(Schemas[resource].paths).filter((key) => key !== '_id');
		SchemaFields[resource].push('id');
	});

	beforeEach(async () => {
		const res = await mongql.generate();
		TransformedTypedefs = res.TransformedTypedefs;
		resources.forEach((resource) => {
			DocumentAPI[resource] = documentApi().addSDL(TransformedTypedefs.obj[resource]);
		});
	});

	describe('Document generation', () => {
		it('Should create document node', () => {
			expect(isDocumentNode(TransformedTypedefs.obj.User)).toBe(true);
			expect(isDocumentNode(TransformedTypedefs.obj.Settings)).toBe(true);
		});
	});

	describe('Interface generation', () => {
		it('Should create interface node', () => {
			resources.forEach((resource) => {
				expect(DocumentAPI[resource].getInterfaceType(resource).node).toBeTruthy();
			});
		});

		it('Should create interface with appropriate fields', () => {
			resources.forEach((resource) => {
				SchemaFields[resource].forEach((field) => {
					expect(DocumentAPI[resource].getInterfaceType(resource).hasField(field)).toBe(true);
				});
			});
		});
	});

	describe('Type generation', () => {
		it('Should create auth based resource', () => {
			[ 'Self', 'Others', 'Mixed' ].forEach((auth) => {
				resources.forEach((resource) => {
					expect(DocumentAPI[resource].hasType(`${auth}${resource}Type`)).toBe(true);
				});
			});
		});

		it('Should have all fields on created auth based resource', () => {
			[ 'Self', 'Others', 'Mixed' ].forEach((auth) => {
				resources.forEach((resource) => {
					SchemaFields[resource].forEach((field) => {
						expect(DocumentAPI[resource].getObjectType(`${auth}${resource}Type`).hasField(field)).toBe(true);
					});
				});
			});
		});

		it('Should contain pre existing types', () => {
			resources.forEach((resource) => {
				expect(DocumentAPI[resource].hasType(`${resource}Data`)).toBeTruthy();
			});
		});
	});

	// Input generation
	describe('Input generation', () => {
		it('Should create inputs', () => {
			resources.forEach((resource) => {
				expect(DocumentAPI[resource].getInputType(`${resource}Input`)).toBeTruthy();
			});
		});

		it('Should have all keys in created inputs', () => {
			resources.forEach((resource) => {
				SchemaFields[resource].slice(0, SchemaFields[resource].length - 1).forEach((field) => {
					expect(DocumentAPI[resource].getInputType(`${resource}Input`).hasField(field)).toBe(true);
				});
			});
		});
	});

	// Enum generation
	describe('Enum generation', () => {
		it('Should generate enums', () => {
			expect(DocumentAPI.User.getEnumType(`USER_ROLE`)).toBeTruthy();
			expect(DocumentAPI.Settings.getEnumType(`SETTINGS_ROLE`)).toBeTruthy();
		});
	});
});
