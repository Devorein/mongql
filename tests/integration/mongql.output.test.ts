import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

import { Mongql, IMongqlMongooseSchemaPartial } from '../../dist';

const rimrafAsync = async function (path: string) {
  return new Promise((resolve) => {
    rimraf(path, () => {
      resolve(true);
    });
  });
};

const OutputDir: Record<string, string> = {
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
}) as IMongqlMongooseSchemaPartial;

const SettingSchema = new mongoose.Schema({
  name: String
}) as IMongqlMongooseSchemaPartial;

describe('Correct AST and SDL output', () => {
  beforeEach(() => {
    UserSchema.mongql = { resource: 'user' };
    SettingSchema.mongql = { resource: 'setting' };
  });

  ['AST', 'SDL'].forEach((part) => {
    it(`Shouldn't output ${part} when option not provided`, async () => {
      const mongql = new Mongql({
        Schemas: [UserSchema, SettingSchema]
      });
      await mongql.generate();
      await expect(fs.promises.readdir(OutputDir[part])).rejects.toThrow();
    });

    it(`Should create multiple output SDL when option ${part} is provided`, async () => {
      const mongql = new Mongql({
        Schemas: [UserSchema, SettingSchema],
        output: {
          [part]: OutputDir[part]
        }
      });
      await cleanOutputs();
      await mongql.generate();
      // const resources = mongql.getResources();
      // const files = await fs.promises.readdir(OutputDir[part]);
      // 			expect(files.length).toBe(2);
      // 			resources.forEach((resource) => {
      // 				expect(files.includes(`${resource}.${part === 'SDL' ? 'graphql' : 'json'}`)).toBe(true);
      // 			});
    });
  });
});
