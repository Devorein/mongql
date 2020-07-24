const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');

const Mongql = require('../../src/MonGql');

const { setNestedProps, mixObjectProp, flattenObject, matchFlattenedObjProps } = require('../../utils/objManip');
const { mutation: { options: MutationOptions, fields: MutationFields } } = require('../../utils/generateOptions');

const mutationOpts = [];

Array.prototype.diff = function (a) {
	return this.filter((i) => a.indexOf(i) < 0);
};

mutationOpts.push({
	field: 'mutation',
	excludedMutation: MutationFields,
	mutation: false
});

mixObjectProp(flattenObject(MutationOptions)).sort().forEach((excludeMutation) => {
	const mutation = setNestedProps({}, excludeMutation, false);
	const excludedMutation = matchFlattenedObjProps(excludeMutation, MutationFields);
	mutationOpts.push({
		field: excludeMutation,
		mutation,
		excludedMutation
	});
});

function MutationChecker (target, { field, excludedMutation }, type) {
	function checker (fields, against) {
		fields.forEach((field) => {
			const [ action, part ] = field.split('.');
			const typename = `${action}${part === 'multi' ? 'Users' : 'User'}`;
			expect(type === 'typedef' ? target.hasField(typename) : Boolean(target[typename])).toBe(against);
		});
	}
	if (field === 'mutation' && type === 'typedef') expect(documentApi().addSDL(target).hasExt('Mutation')).toBe(false);
	else {
		target = type === 'typedef' ? documentApi().addSDL(target).getExt('Mutation') : target;
		const includedFields = MutationFields.diff(excludedMutation);
		checker(excludedMutation, false);
		checker(includedFields, true);
	}
}

describe('Mutation option checker', () => {
	[ 'global', 'local' ].forEach((partition) => {
		mutationOpts.forEach((mutationOpt, index) => {
			const { mutation, field } = mutationOpt;
			it(`Should output correct mutation when ${field} is false in ${partition} config`, async () => {
				const Schema = new mongoose.Schema({
					name: String
				});
				Schema.mongql = { resource: 'user' };
				if (partition === 'local') Schema.mongql.generate = { mutation };
				const mongql = new Mongql({
					Schemas: [ Schema ],
					generate: {
						mutation:
							partition === 'local'
								? mutationOpts[index !== mutationOpts.length - 1 ? index + 1 : 0].mutation
								: mutation
					}
				});
				const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
				MutationChecker(TransformedTypedefs.obj.User, mutationOpt, 'typedef');
				MutationChecker(TransformedResolvers.obj.User.Mutation, mutationOpt, 'resolver');
			});
		});
	});
});
