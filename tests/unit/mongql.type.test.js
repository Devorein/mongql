const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const { outputToString, enumToString, unionToString } = require('../../dist/utils/AST/transformASTToString');

const { Mongql } = require('../../dist');

function CheckInputType (InputType, Inputs, DocumentApi) {
	Inputs.forEach(([ InputStr, InputFields ]) => {
		const InputApi = DocumentApi.getInputType(`${InputType}${InputStr}Input`);
		const fieldNodes = InputApi.getFields().map((api) => api.node);
		InputFields.reduce((acc, InputField) => {
			return acc.concat(outputToString(fieldNodes[acc.length]) === InputField);
		}, []).forEach((match) => expect(match).toBe(true));
		expect(InputApi).toBeTruthy();
	});
}

describe('Proper typedef types generation', () => {
	let mongql = null,
		DocumentApi = null;

	beforeEach(async () => {
		const NestedSchema12 = new mongoose.Schema({
			field321: {
				type: [ Number ]
			}
		});

		const NestedSchema1 = new mongoose.Schema({
			field31: {
				type: Number
			},
			field32: [ NestedSchema12 ],
			field33: {
				type: String,
				enum: [ 'enum21', 'enum22', 'enum23' ]
			}
		});

		const BaseSchema = new mongoose.Schema({
			field1: [ String ],
			field2: {
				type: String,
				enum: [ 'enum1', 'enum2', 'enum3' ]
			},
			field3: NestedSchema1,
			field4: {
				type: Number,
				mongql: {
					scalar: 'PositiveInt'
				}
			}
		});

		BaseSchema.mongql = {
			resource: 'User'
		};
		mongql = new Mongql({
			Schemas: [ BaseSchema ]
		});
		const { TransformedTypedefs } = await mongql.generate();
		DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
	});

	it('Interface type Validation', async () => {
		[
			[ `UserInterface`, [ 'ID!', '[String!]!', 'USER_FIELD2!', 'UserField3Union!', 'PositiveInt!' ] ],
			[ `UserField3Interface`, [ 'Int!', '[UserField3Field32Union!]!', 'USER_FIELD3_FIELD33!' ] ],
			[ `UserField3Field32Interface`, [ '[Int!]!' ] ]
		].forEach(([ interfaceStr, FieldsMatchers ]) => {
			const interfaceApi = DocumentApi.getInterfaceType(interfaceStr);
			const fieldNodes = interfaceApi.getFields().map((api) => api.node);
			FieldsMatchers.reduce(
				(acc, FieldsMatcher) => acc.concat(outputToString(fieldNodes[acc.length]) === FieldsMatcher),
				[]
			).forEach((match) => expect(match).toBe(true));
			expect(interfaceApi).toBeTruthy();
		});
	});

	it('Enum type validation', async () => {
		[
			[ `USER_FIELD2`, 'enum1,enum2,enum3' ],
			[ `USER_FIELD3_FIELD33`, 'enum21,enum22,enum23' ]
		].forEach(([ EnumStr, EnumValues ]) => {
			const EnumApi = DocumentApi.getEnumType(EnumStr);
			expect(EnumApi).toBeTruthy();
			expect(enumToString(EnumApi.node.values)).toBe(EnumValues);
		});
	});

	it('Object type validation', async () => {
		[ 'User', 'UserField3', 'UserField3Field32' ].forEach((object_type) => {
			[ 'Mixed', 'Others', 'Self' ].forEach((auth) => {
				expect(DocumentApi.getObjectType(`${auth}${object_type}Object`)).toBeTruthy();
			});
		});
	});

	it('Input type validation', async () => {
		CheckInputType(
			'Create',
			[
				[ 'User', [ '[String!]!', 'USER_FIELD2!', 'CreateUserField3Input!', 'PositiveInt!' ] ],
				[ 'UserField3', [ 'Int!', '[CreateUserField3Field32Input!]!', 'USER_FIELD3_FIELD33!' ] ],
				[ 'UserField3Field32', [ '[Int!]!' ] ]
			],
			DocumentApi
		);
		CheckInputType(
			'Update',
			[
				[ 'User', [ 'ID!', '[String]!', 'USER_FIELD2', 'UpdateUserField3Input', 'PositiveInt' ] ],
				[ 'UserField3', [ 'Int', '[UpdateUserField3Field32Input]!', 'USER_FIELD3_FIELD33' ] ],
				[ 'UserField3Field32', [ '[Int]!' ] ]
			],
			DocumentApi
		);
	});

	it('Union type validation', async () => {
		[ 'User', 'UserField3', 'UserField3Field32' ].forEach((UnionStr) => {
			const UnionApi = DocumentApi.getUnionType(`${UnionStr}Union`);
			expect(UnionApi).toBeTruthy();
			const UnionValue = [ 'Mixed', 'Others', 'Self' ]
				.reduce((prev, next) => prev.concat(`${next}${UnionStr}Object`), [])
				.join('|');
			expect(unionToString(UnionApi.node.types)).toBe(UnionValue);
		});
	});
});
