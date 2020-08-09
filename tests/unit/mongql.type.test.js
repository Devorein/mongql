const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');
const { outputToString, enumToString, unionToString } = require('../../dist/utils/AST/transformASTToString');

const { Mongql } = require('../../dist');

function CheckTypeFields (Inputs, TypeApiCb) {
	Inputs.forEach(([ InputStr, InputFields ]) => {
		const TypeApi = TypeApiCb(InputStr);
		const fieldNodes = TypeApi.getFields().map((api) => api.node);
		InputFields.reduce((acc, InputField) => {
			return acc.concat(outputToString(fieldNodes[acc.length]) === InputField);
		}, []).forEach((match) => expect(match).toBe(true));
		expect(TypeApi).toBeTruthy();
	});
}

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
const mongql = new Mongql({
	Schemas: [ BaseSchema ]
});

const { TransformedTypedefs, SchemasInfo } = mongql.generateSync();
const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);

describe('Proper typedef types generation', () => {
	/* 	SchemasInfo.User.Fields.forEach((Fields) => {
		Object.entries(Fields).forEach(([ FieldKey, FieldValue ]) => {
			console.log(FieldValue.path[FieldValue.path.length - 1].object_type);
		});
	}); */
	it('Interface type Validation', async () => {
		CheckTypeFields(
			[
				[ ``, [ 'ID!', '[String!]!', 'USER_FIELD2!', 'UserField3Union!', 'PositiveInt!' ] ],
				[ `Field3`, [ 'Int!', '[UserField3Field32Union!]!', 'USER_FIELD3_FIELD33!' ] ],
				[ `Field3Field32`, [ '[Int!]!' ] ]
			],
			(Type) => DocumentApi.getInterfaceType(`User${Type}Interface`)
		);
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
		[ 'Mixed', 'Others', 'Self' ].forEach((auth) => {
			CheckTypeFields(
				[
					[ `User`, [ 'ID!', '[String!]!', 'USER_FIELD2!', `${auth}UserField3Object!`, 'PositiveInt!' ] ],
					[ `UserField3`, [ 'Int!', `[${auth}UserField3Field32Object!]!`, 'USER_FIELD3_FIELD33!' ] ],
					[ `UserField3Field32`, [ '[Int!]!' ] ]
				],
				(Type) => DocumentApi.getObjectType(`${auth}${Type}Object`)
			);
		});
	});

	it('Input type validation', async () => {
		CheckTypeFields(
			[
				[ 'User', [ '[String!]!', 'USER_FIELD2!', 'CreateUserField3Input!', 'PositiveInt!' ] ],
				[ 'UserField3', [ 'Int!', '[CreateUserField3Field32Input!]!', 'USER_FIELD3_FIELD33!' ] ],
				[ 'UserField3Field32', [ '[Int!]!' ] ]
			],
			(Type) => DocumentApi.getInputType(`Create${Type}Input`)
		);
		CheckTypeFields(
			[
				[ 'User', [ 'ID!', '[String]!', 'USER_FIELD2', 'UpdateUserField3Input', 'PositiveInt' ] ],
				[ 'UserField3', [ 'Int', '[UpdateUserField3Field32Input]!', 'USER_FIELD3_FIELD33' ] ],
				[ 'UserField3Field32', [ '[Int]!' ] ]
			],
			(Type) => DocumentApi.getInputType(`Update${Type}Input`)
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
