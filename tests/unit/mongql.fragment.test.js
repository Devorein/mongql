const { flattenDocumentNode } = require('../../dist/utils');
const { Mongql } = require('../../dist/index');
const mongoose = require('mongoose');

const Schema2 = new mongoose.Schema({
	field31: {
		type: String,
		enum: [ 'enum1', 'enum2' ]
	}
});
const Schema1 = new mongoose.Schema({
	field1: String,
	field2: Schema2,
	field3: {
		type: Number
	},
	field4: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		}
	]
});

Schema1.mongql = {
	resource: 'Schema1'
};

describe('Fragment generation checker', () => {
	const mongql = new Mongql({
		Schemas: [ Schema1 ]
	});

	const { TransformedTypedefs } = mongql.generateSync();
	const FlattenedDocumentNode = flattenDocumentNode(TransformedTypedefs.DocumentNode);
	it('Should output correct fragments', () => {
		expect(TransformedTypedefs).not.toBe(null);
	});
});
