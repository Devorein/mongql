import mongoose, { Schema } from 'mongoose';

/**
 * Calculate the depth of a mongoose field
 * @param InitSchema initital mongooseSchema to merge to 
 * @param AdditionalSchema Additional mongooseSchema to merge to
 * @param option option to pass to mongoose.schema
 * @returns newly generated mongooseSchema
 */
function extendSchema(InitSchema: { [key: string]: any }, AdditionalSchema: { [key: string]: any }, options: any): Schema {
  return new mongoose.Schema(
    Object.assign({}, InitSchema.obj, AdditionalSchema),
    options
  );
}

/**
 * Calculate the depth of a mongoose field and extract it
 * @param MongooseField MongooseField to calculate depth of
 * @returns Depth of the mongoose field and the nested mongoose field
 */
function calculateFieldDepth(MongooseField: any): [number, any] {
  let fieldDepth = 0;
  while (Array.isArray(MongooseField)) {
    fieldDepth++;
    MongooseField = MongooseField[0]
  }
  let type = MongooseField.type
  while (Array.isArray(type)) {
    type = type[0]
    fieldDepth++
  }
  return [fieldDepth, MongooseField];
}

export {
  calculateFieldDepth,
  extendSchema
};