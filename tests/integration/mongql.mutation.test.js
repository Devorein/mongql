const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');

const Mongql = require('../../src/MonGql');

const actions = [ 'create', 'update', 'delete' ];

async function mongqlGenerate (schema, mongql) {
	const Schema = new mongoose.Schema(
		schema !== null
			? schema
			: {
					name: String
				}
	);
	Schema.mongql = mongql;
	return await new Mongql({
		Schemas: [ Schema ]
	}).generate();
}

function generateExlucded (excludedMutationOps) {
	const mutationOps = [ 'createUser', 'createUsers', 'updateUser', 'updateUsers', 'deleteUser', 'deleteUsers' ];
	const generate = { mutation: { create: true, update: true, delete: true } };

	actions.forEach((action) => {
		if (excludedMutationOps.includes(action + 'User') && excludedMutationOps.includes(action + 'Users'))
			generate.mutation[action] = false;
		else if (excludedMutationOps.includes(action + 'User')) generate.mutation[action] = [ false, true ];
		else if (excludedMutationOps.includes(action + 'Users')) generate.mutation[action] = [ true, false ];
	});

	const includedMutationOps = mutationOps.filter((mutationOp) => !excludedMutationOps.includes(mutationOp));

	return {
		generate,
		includedMutationOps
	};
}

async function mutationTypedefChecker (excludedMutationOps) {
	const { generate, includedMutationOps } = generateExlucded(excludedMutationOps);
	const { TransformedTypedefs } = await mongqlGenerate(null, {
		resource: 'user',
		generate
	});

	includedMutationOps.forEach((includedMutationOp) => {
		expect(documentApi().addSDL(TransformedTypedefs.obj.user).getExt('Mutation').hasField(includedMutationOp)).toBe(
			true
		);
	});

	excludedMutationOps.forEach((excludedMutationOp) => {
		expect(documentApi().addSDL(TransformedTypedefs.obj.user).getExt('Mutation').hasField(excludedMutationOp)).toBe(
			false
		);
	});
}

async function mutationResolverChecker (excludedMutationOps) {
	const { generate, includedMutationOps } = generateExlucded(excludedMutationOps);
	const { TransformedResolvers } = await mongqlGenerate(null, {
		resource: 'user',
		generate
	});

	includedMutationOps.forEach((includedMutationOp) => {
		expect(TransformedResolvers.obj.user.Mutation[includedMutationOp]).toBeTruthy();
	});

	excludedMutationOps.forEach((includedMutationOp) => {
		expect(TransformedResolvers.obj.user.Mutation[includedMutationOp]).not.toBeTruthy();
	});
}

describe('Mutation option checker', () => {
	describe('Transformed typedefs checker', () => {
		it('Should not contain mutation related typedefs', async () => {
			const { TransformedTypedefs } = await mongqlGenerate(null, {
				resource: 'user',
				generate: {
					mutation: false
				}
			});

			expect(documentApi().addSDL(TransformedTypedefs.obj.user).hasType('Mutation')).toBe(false);
		});

		actions.forEach((action) => {
			describe('Typedefs', () => {
				it(`Should not create, ${action} mutation typedefs when false`, async () => {
					await mutationTypedefChecker([ `${action}User`, `${action}Users` ]);
				});

				it(`Should not create, ${action} mutation typedefs when [false,true]`, async () => {
					await mutationTypedefChecker([ `${action}User` ]);
				});

				it(`Should not create, ${action} mutation typedefs when [true,false]`, async () => {
					await mutationTypedefChecker([ `${action}Users` ]);
				});
			});

			describe('Resolvers', () => {
				it(`Should not create, ${action} mutation resolvers when false`, async () => {
					await mutationResolverChecker([ `${action}User`, `${action}Users` ]);
				});

				it(`Should not create, ${action} mutation resolvers when [false,true]`, async () => {
					await mutationResolverChecker([ `${action}User` ]);
				});

				it(`Should not create, ${action} mutation resolvers when [true,false]`, async () => {
					await mutationResolverChecker([ `${action}Users` ]);
				});
			});
		});
	});
});
