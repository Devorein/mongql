
module.exports = function (transformedSchema) {
  let { Types: { objects } } = transformedSchema;
  const result = {};

  objects.forEach(object => {
    Object.entries(object).forEach(([object_key, value]) => {
      result[object_key] = {};
      Object.entries(value.fields).forEach(([field, field_configs]) => {
        const { generic_type, base_type, arrayDepth } = field_configs;
        if (generic_type.match(/(ref|refs)/)) {
          result[object_key][field] = async function (parent, _, ctx) {
            const model = ctx[base_type];
            const id = parent[field];
            let result = null;
            if (arrayDepth > 0) {
              result = [];
              for (let i = 0; i < id.length; i++)
                result.push(await model.findById(id[i]));
            } else
              result = await model.findById(id)
            return result;
          };
        } else if (generic_type.match(/(enum|object)/))
          result[object_key][field] = (parent) => parent[field];
      })
    });
  })
  return result;
};
