const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');

const rimrafAsync = async function (path) {
  return new Promise((resolve) => {
    rimraf(path, () => {
      resolve(true);
    });
  });
};

const { Mongql } = require('../../dist');

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

async function output(key, Schemas) {
  await cleanOutputs();
  const dirkey = key === 'AST' ? 'AST' : 'SDL';
  const mongql = new Mongql({
    Schemas,
    output: {
      [key]: OutputDir[dirkey]
    }
  });

  await mongql.generate();
  const resources = mongql.getResources();
  const sdls = await fs.readdir(OutputDir[dirkey]);
  await expect(sdls.length).toBe(2);
  resources.forEach((resource) => {
    expect(sdls.includes(`${resource}.${dirkey === 'SDL' ? 'graphql' : 'json'}`)).toBe(true);
  });
}

const UserSchema = new mongoose.Schema({
  name: String
});
UserSchema.mongql = { resource: 'user' };

const SettingsSchema = new mongoose.Schema({
  name: String
});
SettingsSchema.mongql = { resource: 'settings' };

describe('Correct SDL output', () => {
  it("Shouldn't output SDL when option not provided", async () => {
    new Mongql({
      Schemas: [UserSchema]
    });
    await expect(fs.readdir(OutputDir.SDL)).rejects.toThrow();
  });

  it('Should create multiple output SDL when option dir is provided', async () => {
    await output('dir', [UserSchema, SettingsSchema]);
  });

  it('Should create multiple output SDL when option SDL is provided', async () => {
    await output('SDL', [UserSchema, SettingsSchema]);
  });
});

describe('Correct AST output', () => {
  it("Shouldn't output AST when option not provided", async () => {
    new Mongql({
      Schemas: [UserSchema]
    });
    await expect(fs.readdir(OutputDir.AST)).rejects.toThrow();
  });

  it('Should create multiple output AST when option AST is provided', async () => {
    await output('AST', [UserSchema, SettingsSchema]);
  });
});

describe('Correct outputSDL', () => {
  const mongql = new Mongql({
    Schemas: [UserSchema]
  });

  it('Should create SDL using outputSDL', async () => {
    await cleanOutputs();
    const { TransformedTypedefs } = await mongql.generate();
    await Mongql.outputSDL(OutputDir.SDL, TransformedTypedefs.obj.User, 'User');
    const sdls = await fs.readdir(OutputDir.SDL);
    await expect(sdls.length).toBe(1);
    expect(sdls.includes(`User.graphql`)).toBe(true);
  });
});
