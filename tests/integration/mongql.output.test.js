const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');

const { Mongql } = require('../../dist');

const rimrafAsync = async function (path) {
  return new Promise((resolve) => {
    rimraf(path, () => {
      resolve(true);
    });
  });
};

const OutputDir = {
  SDL: path.resolve(__dirname, '../../outputs/SDL'),
  AST: path.resolve(__dirname, '../../outputs/AST')
};

rimraf.sync(OutputDir.SDL);
rimraf.sync(OutputDir.AST);

async function cleanOutputs() {
  await rimrafAsync(OutputDir.SDL);
  await rimrafAsync(OutputDir.AST);
}

const UserSchema = new mongoose.Schema({
  name: String
});


const SettingSchema = new mongoose.Schema({
  name: String
});

UserSchema.mongql = { resource: 'user' };
SettingSchema.mongql = { resource: 'setting' };

async function output(dirkey, Schemas) {
  const mongql = new Mongql({
    Schemas,
    output: {
      [dirkey]: OutputDir[dirkey]
    }
  });
  await cleanOutputs();
  await mongql.generate();
  const resources = mongql.getResources();
  const files = await fs.readdir(OutputDir[dirkey]);
  expect(files.length).toBe(2);
  resources.forEach((resource) => {
    expect(files.includes(`${resource}.${dirkey === 'SDL' ? 'graphql' : 'json'}`)).toBe(true);
  });
}

describe('Correct SDL output', () => {
  beforeAll(() => {
    UserSchema.mongql = { resource: 'user' };
    SettingSchema.mongql = { resource: 'setting' };
  })

  it("Shouldn't output SDL when option not provided", async () => {
    new Mongql({
      Schemas: [UserSchema, SettingSchema]
    });
    await expect(fs.readdir(OutputDir.SDL)).rejects.toThrow();
  });

  it('Should create multiple output SDL when option SDL is provided', async () => {
    await output('SDL', [UserSchema, SettingSchema]);
  });
});

describe('Correct AST output', () => {
  beforeAll(() => {
    UserSchema.mongql = { resource: 'user' };
    SettingSchema.mongql = { resource: 'setting' };
  })

  it("Shouldn't output AST when option not provided", async () => {
    new Mongql({
      Schemas: [UserSchema, SettingSchema]
    });
    await expect(fs.readdir(OutputDir.AST)).rejects.toThrow();
  });

  it('Should create multiple output AST when option AST is provided', async () => {
    await output('AST', [UserSchema, SettingSchema]);
  });
});

describe('Correct outputSDL', () => {
  it('Should create SDL using outputSDL', async () => {
    UserSchema.mongql = { resource: 'user' };
    const mongql = new Mongql({
      Schemas: [UserSchema]
    });
    await cleanOutputs();
    const { TransformedTypedefs } = await mongql.generate();
    await Mongql.outputSDL(OutputDir.SDL, TransformedTypedefs.obj.User, 'User');
    const sdls = await fs.readdir(OutputDir.SDL);
    expect(sdls.length).toBe(1);
    expect(sdls.includes(`User.graphql`)).toBe(true);
  });
});
