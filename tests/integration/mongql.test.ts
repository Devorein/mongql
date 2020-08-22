import mongoose from 'mongoose';

import { Mongql, IMongqlMongooseSchemaPartial } from '../../dist';

describe('Errors', () => {
  const UserSchema = new mongoose.Schema({
    name: String
  }) as IMongqlMongooseSchemaPartial;

  const SettingsSchema = new mongoose.Schema({
    created_at: {
      type: Date,
      mongql: {
        scalar: 'Date'
      }
    }
  }) as IMongqlMongooseSchemaPartial;

  SettingsSchema.mongql = {
    resource: 'Settings'
  };

  test('Should throw without a resource key in schema', () => {
    expect(() => {
      new Mongql({
        Schemas: [UserSchema]
      });
    }).toThrow();
  });

  test('Should throw even if a single schema doesnt have resource key', () => {
    expect(() => {
      new Mongql({
        Schemas: [UserSchema, SettingsSchema]
      });
    }).toThrow();
  });
});

describe('Single schema generation', () => {
  const UserSchema = new mongoose.Schema({
    name: String
  }) as IMongqlMongooseSchemaPartial;

  UserSchema.mongql = {
    resource: 'User'
  };

  const mongql = new Mongql({
    Schemas: [UserSchema]
  });
  const res = mongql.generateSync();

  const TransformedTypedefs = res.TransformedTypedefs, TransformedResolvers = res.TransformedResolvers;

  it('Should create typedefs and resolvers from schema', async () => {
    expect(TransformedTypedefs).toBeTruthy();
    expect(TransformedResolvers).toBeTruthy();
  });

  it('Should create typedefs and resolvers with both obj and arr properties', async () => {
    expect(TransformedTypedefs).toHaveProperty('obj');
    expect(TransformedTypedefs).toHaveProperty('DocumentNode');
    expect(TransformedResolvers).toHaveProperty('obj');
    expect(TransformedResolvers).toHaveProperty('arr');
  });

  it('Should create typedefs and resolvers where obj key has user key and not any others', async () => {
    expect(TransformedTypedefs).toHaveProperty('obj.User');
    expect(TransformedTypedefs).not.toHaveProperty('obj.Settings');
    expect(TransformedResolvers).toHaveProperty('obj.User');
    expect(TransformedResolvers).not.toHaveProperty('obj.Settings');
  });

  it('Should create typedefs where obj key has base and external keys', async () => {
    expect(TransformedTypedefs).toHaveProperty('obj.External');
    expect(TransformedTypedefs).toHaveProperty('obj.Base');
    expect(TransformedResolvers.arr.length).toBe(3);
  });

  it('Should create resolvers where both arr and object are same', async () => {
    expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
    expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
  });
});

describe('Multiple schema generation', () => {
  const UserSchema = new mongoose.Schema({
    name: String
  }) as IMongqlMongooseSchemaPartial;

  UserSchema.mongql = {
    resource: 'User'
  };

  const SettingSchema = new mongoose.Schema({
    created_at: {
      type: Date,
      mongql: {
        scalar: 'Date'
      }
    }
  }) as IMongqlMongooseSchemaPartial;

  SettingSchema.mongql = {
    resource: 'Setting'
  };

  const mongql = new Mongql({
    Schemas: [UserSchema, SettingSchema]
  });
  const res = mongql.generateSync();
  const TransformedTypedefs = res.TransformedTypedefs;
  const TransformedResolvers = res.TransformedResolvers;

  it('Should create typedefs and resolvers where obj key has user and settings key and not any others', async () => {
    expect(TransformedTypedefs).toHaveProperty('obj.User');
    expect(TransformedTypedefs).toHaveProperty('obj.Setting');
    expect(TransformedTypedefs).not.toHaveProperty('obj.Folder');
    expect(TransformedResolvers).toHaveProperty('obj.User');
    expect(TransformedResolvers).toHaveProperty('obj.Setting');
    expect(TransformedResolvers).not.toHaveProperty('obj.Folder');
  });

  it('Should create typedefs where obj key has Base and External keys', async () => {
    expect(TransformedTypedefs).toHaveProperty('obj.Base');
    expect(TransformedTypedefs).toHaveProperty('obj.External');
    expect(TransformedResolvers.arr.length).toBe(4);
  });

  it('Should create resolvers where both arr and object are same', async () => {
    expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
    expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
    expect(TransformedResolvers.arr[1]).toBe(TransformedResolvers.obj.Setting);
  });
});
