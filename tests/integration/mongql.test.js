const mongoose = require('mongoose');
const { isDocumentNode, documentApi } = require('graphql-extra');
const gql = require('graphql-tag');

const { Mongql } = require('../../dist');

// describe('Errors', () => {
//   const UserSchema = new mongoose.Schema({
//     name: String
//   });

//   const SettingsSchema = new mongoose.Schema({
//     created_at: {
//       type: Date,
//       mongql: {
//         scalar: 'Date'
//       }
//     }
//   });

//   SettingsSchema.mongql = {
//     resource: 'Settings'
//   };

//   test('Should throw without a resource key in schema', () => {
//     expect(() => {
//       new Mongql({
//         Schemas: [UserSchema]
//       });
//     }).toThrow();
//   });

//   test('Should throw even if a single schema doesnt have resource key', () => {
//     expect(() => {
//       new Mongql({
//         Schemas: [UserSchema, SettingsSchema]
//       });
//     }).toThrow();
//   });
// });

// describe('Single schema Typedefs generation', () => {
//   const UserSchema = new mongoose.Schema({
//     name: String
//   });

//   UserSchema.mongql = {
//     resource: 'User'
//   };

//   const mongql = new Mongql({
//     Schemas: [UserSchema]
//   });

//   let TransformedTypedefs;

//   beforeEach(async () => {
//     const res = await mongql.generate();
//     TransformedTypedefs = res.TransformedTypedefs;
//   });

//   it('Should create typedefs from schema', async () => {
//     expect(TransformedTypedefs).not.toBe(null);
//     expect(TransformedTypedefs).not.toBe(undefined);
//   });

//   it('Should create typedefs with both obj and arr properties', async () => {
//     expect(TransformedTypedefs).toHaveProperty('obj');
//     expect(TransformedTypedefs).toHaveProperty('arr');
//   });

//   it('Should create typedefs where obj key has user key and not any others', async () => {
//     expect(TransformedTypedefs).toHaveProperty('obj.User');
//     expect(TransformedTypedefs).not.toHaveProperty('obj.Settings');
//   });

//   it('Should create typedefs where obj key has base and external keys', async () => {
//     expect(TransformedTypedefs).toHaveProperty('obj.External');
//     expect(TransformedTypedefs).toHaveProperty('obj.Base');
//   });
// });

// describe('Multiple schema Typedefs generation', () => {
//   const UserSchema = new mongoose.Schema({
//     name: String
//   });

//   UserSchema.mongql = {
//     resource: 'User'
//   };

//   const SettingsSchema = new mongoose.Schema({
//     created_at: {
//       type: Date,
//       mongql: {
//         scalar: 'Date'
//       }
//     }
//   });

//   SettingsSchema.mongql = {
//     resource: 'Settings'
//   };

//   const mongql = new Mongql({
//     Schemas: [UserSchema, SettingsSchema]
//   });

//   let TransformedTypedefs;

//   beforeEach(async () => {
//     const res = await mongql.generate();
//     TransformedTypedefs = res.TransformedTypedefs;
//   });

//   it('Should create typedefs with both obj and arr properties', async () => {
//     expect(TransformedTypedefs).toHaveProperty('obj');
//     expect(TransformedTypedefs).toHaveProperty('arr');
//   });

//   it('Should create typedefs where obj key has user and settings key and not any others', async () => {
//     expect(TransformedTypedefs).toHaveProperty('obj.User');
//     expect(TransformedTypedefs).toHaveProperty('obj.Settings');
//     expect(TransformedTypedefs).not.toHaveProperty('obj.Folder');
//   });

//   it('Should create typedefs where obj key has Base and External keys', async () => {
//     expect(TransformedTypedefs).toHaveProperty('obj.Base');
//     expect(TransformedTypedefs).toHaveProperty('obj.External');
//   });
// });

// describe('Single schema Resolvers generation', () => {
//   const UserSchema = new mongoose.Schema({
//     name: String
//   });

//   UserSchema.mongql = {
//     resource: 'User'
//   };

//   const mongql = new Mongql({
//     Schemas: [UserSchema]
//   });

//   let TransformedResolvers;

//   beforeEach(async () => {
//     const res = await mongql.generate();
//     TransformedResolvers = res.TransformedResolvers;
//   });

//   it('Should create resolvers from schema', async () => {
//     expect(TransformedResolvers).not.toBe(null);
//     expect(TransformedResolvers).not.toBe(undefined);
//   });

//   it('Should create resolvers with both obj and arr properties', async () => {
//     expect(TransformedResolvers).toHaveProperty('obj');
//     expect(TransformedResolvers).toHaveProperty('arr');
//   });

//   it('Should create resolvers where obj key has user key and not any others', async () => {
//     expect(TransformedResolvers).toHaveProperty('obj.User');
//     expect(TransformedResolvers).not.toHaveProperty('obj.Settings');
//   });

//   it('Should create resolvers where arr key has only user', async () => {
//     expect(TransformedResolvers.arr.length).toBe(3);
//   });

//   it('Should create resolvers where both arr and object are same', async () => {
//     expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
//     expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
//   });
// });

// describe('Multiple schema Resolvers generation', () => {
//   const UserSchema = new mongoose.Schema({
//     name: String
//   });

//   UserSchema.mongql = {
//     resource: 'User'
//   };

//   const SettingsSchema = new mongoose.Schema({
//     created_at: {
//       type: Date,
//       mongql: {
//         scalar: 'Date'
//       }
//     }
//   });

//   SettingsSchema.mongql = {
//     resource: 'Settings'
//   };

//   const mongql = new Mongql({
//     Schemas: [UserSchema, SettingsSchema]
//   });

//   let TransformedResolvers;

//   beforeEach(async () => {
//     const res = await mongql.generate();
//     TransformedResolvers = res.TransformedResolvers;
//   });

//   it('Should create resolvers with both obj and arr properties', async () => {
//     expect(TransformedResolvers).toHaveProperty('obj');
//     expect(TransformedResolvers).toHaveProperty('arr');
//   });

//   it('Should create resolvers where obj key has user and settings key and not any others', async () => {
//     expect(TransformedResolvers).toHaveProperty('obj.User');
//     expect(TransformedResolvers).toHaveProperty('obj.Settings');
//     expect(TransformedResolvers).not.toHaveProperty('obj.Folder');
//   });

//   it('Should create resolvers where arr key has only user and settings', async () => {
//     expect(TransformedResolvers.arr.length).toBe(4);
//   });

//   it('Should create resolvers where both arr and object are same', async () => {
//     expect(TransformedResolvers.arr.length).toBe(Object.keys(TransformedResolvers.obj).length);
//     expect(TransformedResolvers.arr[0]).toBe(TransformedResolvers.obj.User);
//     expect(TransformedResolvers.arr[1]).toBe(TransformedResolvers.obj.Settings);
//   });
// });

