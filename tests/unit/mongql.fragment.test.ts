import { flattenDocumentNode } from '../../dist/utils';
import { Mongql, IMongqlMongooseSchemaPartial } from '../../dist/index';
import mongoose from 'mongoose';

const Schema2 = new mongoose.Schema({
  field31: {
    type: String,
    enum: ['enum1', 'enum2']
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}) as IMongqlMongooseSchemaPartial;

Schema1.mongql = {
  resource: 'Schema1'
};

describe('Fragment generation checker', () => {
  const mongql = new Mongql({
    Schemas: [Schema1]
  });

  const { SchemasInfo, OperationNodes } = mongql.generateSync();
  const FlattenedDocumentNode = flattenDocumentNode(OperationNodes);
  it('Should output correct fragments', () => {
    expect(OperationNodes).not.toBe(null);
  });
});
