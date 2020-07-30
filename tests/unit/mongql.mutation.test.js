const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');

const Mongql = require('../../src/MonGql');

const { setNestedProps, mixObjectProp, flattenObject, matchFlattenedObjProps } = require('../../utils/objManip');
const { mutation: { options: MutationOptions, fields: MutationFields } } = require('../../utils/generateOptions');
const { argumentsToString, outputToString } = require('../../utils/AST/transformASTToString');

const mutationOpts = [];

const MutationMap = {
  createUser: ['data:CreateUserInput!', 'SelfUserObject!'],
  createUsers: ['data:[CreateUserInput!]!', '[SelfUserObject!]!'],
  updateUser: ['data:UpdateUserInput!,id:ID!', 'SelfUserObject!'],
  updateUsers: ['data:[UpdateUserInput!]!,ids:[ID!]!', '[SelfUserObject!]!'],
  deleteUser: ['id:ID!', 'SelfUserObject!'],
  deleteUsers: ['ids:[ID!]!', '[SelfUserObject!]!']
};

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

function MutationChecker(target, { field, excludedMutation }, type) {
  function checker(fields, against) {
    fields.forEach((field) => {
      const [action, part] = field.split('.');
      const typename = `${action}${part === 'multi' ? 'Users' : 'User'}`;
      if (type === 'typedef') {
        expect(target.hasField(typename)).toBe(against);
        if (against) expect(MutationMap[typename][0]).toBe(argumentsToString(target.getField(typename).node.arguments));
        if (against) expect(MutationMap[typename][1]).toBe(outputToString(target.getField(typename).node.type));
      } else expect(Boolean(target[typename])).toBe(against);
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
  ['global', 'local'].forEach((partition) => {
    mutationOpts.forEach((mutationOpt, index) => {
      const { mutation, field } = mutationOpt;
      it(`Should output correct mutation when ${field} is false in ${partition} config`, async () => {
        const Schema = new mongoose.Schema({
          name: String
        });
        Schema.mongql = { resource: 'user' };
        if (partition === 'local') Schema.mongql.generate = { mutation };
        const mongql = new Mongql({
          Schemas: [Schema],
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
