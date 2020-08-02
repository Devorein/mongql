import { ISchemaInfo, FieldFullInfo } from "../types";

export default function (SchemaInfo: ISchemaInfo) {
  const { Types: { objects } } = SchemaInfo;
  const result: { [key: string]: any } = {};

  objects.forEach(object => {
    Object.entries(object).forEach(([object_key, value]) => {
      result[object_key] = {};
      Object.entries(value.fields).forEach((entry) => {
        const field: string = entry[0];
        const field_info: FieldFullInfo = entry[1];

        const { generic_type, ref_type, fieldDepth } = field_info;
        if (generic_type.match(/(ref|refs)/)) {
          result[object_key][field] = async function (parent: any, _: any, ctx: any) {
            const model = ctx[ref_type];
            const id = parent[field];
            let result = null;
            if (fieldDepth > 0) {
              result = [];
              for (let i = 0; i < id.length; i++)
                result.push(await model.findById(id[i]));
            } else
              result = await model.findById(id)
            return result;
          };
        } else if (generic_type.match(/(enum|object)/))
          result[object_key][field] = (parent: any) => parent[field];
      })
    });
  })
  return result;
}
