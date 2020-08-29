import mongoose from 'mongoose';
import { documentApi } from 'graphql-extra';
import { IMongqlMongooseSchemaPartial, MutableDocumentNode, flattenDocumentNode, capitalize } from '../../dist';

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

type MutationOpt = {
  field: string,
  excludedMutations: string[],
  mutation: boolean
};
const mutationOpts: MutationOpt[] = [];

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
  excludedMutations: MutationFields,
  mutation: false
});

mixObjectProp(flattenObject(MutationOptions)).sort().forEach((excludeMutation: string) => {
  const mutation = setNestedFields({}, excludeMutation, false);
  const excludedMutations = matchFlattenedObjProps(excludeMutation, MutationFields);
  mutationOpts.push({
    field: excludeMutation,
    mutation,
    excludedMutations
  });
});

function MutationChecker(target: any, { excludedMutations }: any, type: any) {
  function checker(fields: string[], against: boolean) {
    fields.forEach((field) => {
      const [action, part] = field.split('.');
      const mutationname = `${action}${part === 'multi' ? 'Users' : 'User'}`;
      if (type === 'typedef') {
        expect(target.hasField(mutationname)).toBe(against);
        if (against) {
          expect(MutationMap[mutationname][0]).toBe(argumentsToString(target.getField(mutationname).node.arguments));
          expect(MutationMap[mutationname][1]).toBe(outputToString(target.getField(mutationname).node.type));
        }
      } else expect(Boolean(target[mutationname])).toBe(against);
    });
  }
  if (excludedMutations.length === MutationMapLength) {
    if (type === 'typedef') expect(documentApi().addSDL(target).hasExt('Mutation')).toBe(false);
    if (type === 'resolver') expect(target.Mutation).toBeFalsy();
  } else {
    target = type === 'typedef' ? documentApi().addSDL(target).getExt('Mutation') : target;
    const includedFields = Arraydiff(MutationFields, excludedMutations);
    checker(excludedMutations, false);
    checker(includedFields, true);
  }
}

function OperationChecker(OperationNodes: MutableDocumentNode, { excludedMutations }: MutationOpt) {
  const FlattenedDocumentNode = flattenDocumentNode(OperationNodes);
  const includedMutations = Arraydiff(MutationFields, excludedMutations);
  function checker(arr: string[], against: boolean) {
    arr.forEach(query => {
      const [action, part] = query.split('.');
      const mutationname = `${capitalize(action)}${part === 'multi' ? 'Users' : 'User'}`;
      ['RefsNone', 'ObjectsNone', 'ScalarsOnly'].forEach(fragment_name => {
        const opname = `${mutationname}${fragment_name ? "_" + fragment_name : ''}`;
        expect(Boolean(FlattenedDocumentNode.OperationDefinition[opname])).toBe(against)
      })
    })
  }
  checker(excludedMutations, false);
  checker(includedMutations, true);
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
          mutationOpt.excludedMutations = Array.from(
            new Set(mutationOpt.excludedMutations.concat(GlobalMutationOtps.excludedMutations))
          );
        }
        const mongql = new Mongql({
          Schemas: [Schema],
          generate
        });
        const { TransformedTypedefs, TransformedResolvers, OperationNodes } = await mongql.generate();
        MutationChecker(TransformedTypedefs.obj.User, mutationOpt, 'typedef');
        MutationChecker(TransformedResolvers.obj.User.Mutation, mutationOpt, 'resolver');
        OperationChecker(OperationNodes, mutationOpt)
      });
    });
  });
});
