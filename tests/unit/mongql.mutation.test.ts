import mongoose from 'mongoose';
import { documentApi } from 'graphql-extra';
import { IMongqlMongooseSchemaPartial } from '../../dist';

const {
  generateOptions,
  Mongql,
  argumentsToString,
  outputToString,
  setNestedFields,
  mixObjectProp,
  flattenObject,
  matchFlattenedObjProps
} = require('../../dist/index');

const { mutation: { options: MutationOptions, fields: MutationFields } } = generateOptions();

const mutationOpts: {
  field: string,
  excludedMutation: string[],
  mutation: boolean
}[] = [];

const MutationMap: Record<string, string[]> = {
  createUser: ['data:CreateUserInput!', 'SelfUserObject!'],
  createUsers: ['datas:[CreateUserInput!]!', '[SelfUserObject!]!'],
  updateUser: ['data:UpdateUserInput!', 'SelfUserObject!'],
  updateUsers: ['datas:[UpdateUserInput!]!', '[SelfUserObject!]!'],
  deleteUser: ['id:ID!', 'SelfUserObject!'],
  deleteUsers: ['ids:[ID!]!', '[SelfUserObject!]!']
};

const MutationMapLength = Object.keys(MutationMap).length;

const Arraydiff = (target: any[], a: any) => {
  return target.filter((i: any) => a.indexOf(i) < 0);
};

mutationOpts.push({
  field: 'mutation',
  excludedMutation: MutationFields,
  mutation: false
});

mixObjectProp(flattenObject(MutationOptions)).sort().forEach((excludeMutation: string) => {
  const mutation = setNestedFields({}, excludeMutation, false);
  const excludedMutation = matchFlattenedObjProps(excludeMutation, MutationFields);
  mutationOpts.push({
    field: excludeMutation,
    mutation,
    excludedMutation
  });
});

function MutationChecker(target: any, { excludedMutation }: any, type: any) {
  function checker(fields: string[], against: boolean) {
    fields.forEach((field) => {
      const [action, part] = field.split('.');
      const typename = `${action}${part === 'multi' ? 'Users' : 'User'}`;
      if (type === 'typedef') {
        expect(target.hasField(typename)).toBe(against);
        if (against) {
          expect(MutationMap[typename][0]).toBe(argumentsToString(target.getField(typename).node.arguments));
          expect(MutationMap[typename][1]).toBe(outputToString(target.getField(typename).node.type));
        }
      } else expect(Boolean(target[typename])).toBe(against);
    });
  }
  if (excludedMutation.length === MutationMapLength) {
    if (type === 'typedef') expect(documentApi().addSDL(target).hasExt('Mutation')).toBe(false);
    if (type === 'resolver') expect(target.Mutation).toBeFalsy();
  } else {
    target = type === 'typedef' ? documentApi().addSDL(target).getExt('Mutation') : target;
    const includedFields = Arraydiff(MutationFields, excludedMutation);
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
        }) as IMongqlMongooseSchemaPartial;
        Schema.mongql = { resource: 'user' };
        const generate = {
          mutation
        };
        if (partition === 'local') {
          Schema.mongql.generate = { mutation };
          const GlobalMutationOtps = mutationOpts[index !== mutationOpts.length - 1 ? index + 1 : 1];
          generate.mutation = GlobalMutationOtps.mutation;
          mutationOpt.excludedMutation = Array.from(
            new Set(mutationOpt.excludedMutation.concat(GlobalMutationOtps.excludedMutation))
          );
        }
        const mongql = new Mongql({
          Schemas: [Schema],
          generate
        });
        const { TransformedTypedefs, TransformedResolvers } = await mongql.generate();
        MutationChecker(TransformedTypedefs.obj.User, mutationOpt, 'typedef');
        MutationChecker(TransformedResolvers.obj.User.Mutation, mutationOpt, 'resolver');
      });
    });
  });
});
