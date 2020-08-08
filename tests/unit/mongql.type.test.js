const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const { outputToString, enumToString } = require('../../dist/utils/AST/transformASTToString');

const { Mongql } = require('../../dist');

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

describe('Proper typedef types generation', () => {
	const mongql = new Mongql({
		Schemas: [ BaseSchema ]
	});

	it('Interface type Validation', async () => {
		const { TransformedTypedefs } = await mongql.generate();
		const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
		const InterfaceFields = [
			[ `UserInterface`, [ 'ID!', '[String!]!', 'USER_FIELD2!', 'UserField3Union!', 'PositiveInt!' ] ],
			[ `UserField3Interface`, [ 'Int!', '[UserField3Field32Union!]!', 'USER_FIELD3_FIELD33!' ] ],
			[ `UserField3Field32Interface`, [ '[Int!]!' ] ]
		];

		InterfaceFields.forEach(([ interfaceStr, FieldsMatchers ]) => {
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
		const { TransformedTypedefs } = await mongql.generate();
		const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
		const Enums = [ [ `USER_FIELD2`, 'enum1,enum2,enum3' ], [ `USER_FIELD3_FIELD33`, 'enum21,enum22,enum23' ] ];
		Enums.forEach(([ EnumStr, EnumValues ]) => {
			const EnumApi = DocumentApi.getEnumType(EnumStr);
			expect(EnumApi).toBeTruthy();
			expect(enumToString(EnumApi.node.values)).toBe(EnumValues);
		});
	});

	it('Object type validation', async () => {
		const { TransformedTypedefs } = await mongql.generate();
		const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
		[ 'User', 'UserField3', 'UserField3Field32' ].forEach((object_type) => {
			[ 'Mixed', 'Others', 'Self' ].forEach((auth) => {
				expect(DocumentApi.getObjectType(`${auth}${object_type}Object`)).toBeTruthy();
			});
		});
	});

	it('Input type validation', async () => {
		const { TransformedTypedefs } = await mongql.generate();
		const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
		[ 'User', 'UserField3', 'UserField3Field32' ].forEach((object_type) => {
			[ 'Create', 'Update' ].forEach((action) => {
				expect(DocumentApi.getInputType(`${action}${object_type}Input`)).toBeTruthy();
			});
		});
	});

	it('Union type validation', async () => {
		const { TransformedTypedefs } = await mongql.generate();
		const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
		[ 'User', 'UserField3', 'UserField3Field32' ].forEach((object_type) => {
			expect(DocumentApi.getUnionType(`${object_type}Union`)).toBeTruthy();
		});
	});
});
