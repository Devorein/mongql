const mongoose = require('mongoose');

/**
 * Calculate the depth of a mongoose field
 * @param {Object} InitSchema initital mongooseSchema to merge to 
 * @param {Object} AdditionalSchema Additional mongooseSchema to merge to
 * @returns {MongooseSchema} newly generated mongooseSchema
 */
function extendSchema(InitSchema, AdditionalSchema, options) {
  return new mongoose.Schema(
    {
      ...InitSchema.obj,
      ...AdditionalSchema,
    },
    options
  );
}

/**
 * Calculate the depth of a mongoose field
 * @param {MongooseField} MongooseField MongooseField to calculate depth of
 * @returns {int} Depth of the mongoose field
 */
function calculateFieldDepth(MongooseField) {
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

module.exports = {
  calculateFieldDepth,
  extendSchema
};