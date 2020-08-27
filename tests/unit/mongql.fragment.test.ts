import { flattenDocumentNode } from '../../dist/utils';
import { Mongql, IMongqlMongooseSchemaPartial } from '../../dist/index';
import mongoose from 'mongoose';
import gql from "graphql-tag"

it('Regular Schema Fragment generation checker', () => {
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

  const mongql = new Mongql({
    Schemas: [Schema1]
  });

  const { OperationNodes } = mongql.generateSync();
  const FlattenedDocumentNode = flattenDocumentNode(OperationNodes);
  ['Self', 'Others', 'Mixed'].forEach(auth => {
    ['Schema1Object', 'Schema1Field2Object'].forEach(schema => {
      ['RefsNone', 'ObjectsNone', 'ScalarsOnly'].forEach(fragment => {
        expect(FlattenedDocumentNode.FragmentDefinition[auth + schema + fragment + "Fragment"]).toBeTruthy();
      });
    })
  })
});

it('Regular Schema with InitTypedef Fragment generation checker', () => {
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

  const mongql = new Mongql({
    Schemas: [Schema1],
    Typedefs: {
      base: gql`
          type InitSchema1Field2Object{
            field21: String!
          }
          type InitSchema1Object{
            field1: SelfSchema1Object
            field2: InitSchema1Field2Object
          }
        `
    }
  });

  const { OperationNodes } = mongql.generateSync();
  const FlattenedDocumentNode = flattenDocumentNode(OperationNodes);
  ['Init'].forEach(auth => {
    ['Schema1Object', 'Schema1Field2Object'].forEach(schema => {
      ['RefsNone', 'ObjectsNone', 'ScalarsOnly'].forEach(fragment => {
        expect(FlattenedDocumentNode.FragmentDefinition[auth + schema + fragment + "Fragment"]).toBeTruthy();
      });
    })
  })
});


it('Regular Schema with additional fragments Fragment generation checker', () => {
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
    resource: 'Schema1',
    Fragments: {
      Info1: ['field1', 'field2'],
      Info2: [['field1', 'ObjectsNone'], 'field2']
    }
  };

  const mongql = new Mongql({
    Schemas: [Schema1],
  });

  const { OperationNodes } = mongql.generateSync();
  const FlattenedDocumentNode = flattenDocumentNode(OperationNodes);
  ['Self', 'Others', 'Mixed'].forEach(auth => {
    ['Schema1Object'].forEach(schema => {
      ['Info1', 'Info2'].forEach(fragment => {
        expect(FlattenedDocumentNode.FragmentDefinition[auth + schema + fragment + "Fragment"]).toBeTruthy();
      });
    })
  })
});