const mongoose = require('mongoose');
const { documentApi } = require('graphql-extra');

const { Mongql } = require('../../dist');

const NestedSchema12 = new mongoose.Schema({
  field321: {
    type: [Number]
  },
});

const NestedSchema1 = new mongoose.Schema({
  field31: {
    type: Number,
  },
  field32: [NestedSchema12],
  field33: {
    type: String,
    enum: ['enum1', 'enum2', 'enum3']
  },
});

const BaseSchema = new mongoose.Schema({
  field1: String,
  field2: {
    type: String,
    enum: ['enum1', 'enum2', 'enum3']
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
    Schemas: [BaseSchema]
  });

  it('Interface type Validation', async () => {
    const { TransformedTypedefs } = await mongql.generate();
    const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
    expect(DocumentApi.getInterfaceType(`UserInterface`)).toBeTruthy();
    expect(DocumentApi.getInterfaceType(`UserField3Interface`)).toBeTruthy();
    expect(DocumentApi.getInterfaceType(`UserField3Field32Interface`)).toBeTruthy();
  });

  it('Enum type validation', async () => {
    const { TransformedTypedefs } = await mongql.generate();
    const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
    expect(DocumentApi.getEnumType(`USER_FIELD2`)).toBeTruthy();
    expect(DocumentApi.getEnumType(`USER_FIELD3_FIELD33`)).toBeTruthy();
  });

  it('Object type validation', async () => {
    const { TransformedTypedefs } = await mongql.generate();
    const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
    ['User', 'UserField3', 'UserField3Field32'].forEach(object_type => {
      ['Mixed', 'Others', 'Self'].forEach(auth => {
        expect(DocumentApi.getObjectType(`${auth}${object_type}Object`)).toBeTruthy();
      })
    })
  });

  it('Input type validation', async () => {
    const { TransformedTypedefs } = await mongql.generate();
    const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
    ['User', 'UserField3', 'UserField3Field32'].forEach(object_type => {
      ['Create', 'Update'].forEach(action => {
        expect(DocumentApi.getInputType(`${action}${object_type}Input`)).toBeTruthy();
      })
    })
  });

  it('Union type validation', async () => {
    const { TransformedTypedefs } = await mongql.generate();
    const DocumentApi = documentApi().addSDL(TransformedTypedefs.obj.User);
    ['User', 'UserField3', 'UserField3Field32'].forEach(object_type => {
      expect(DocumentApi.getUnionType(`${object_type}Union`)).toBeTruthy();
    })
  });
});