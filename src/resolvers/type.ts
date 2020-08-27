import { FieldFullInfo, TParsedSchemaInfo, IMongqlBaseSchemaConfigsFull } from "../types";
import { capitalize } from "../utils";

/**
 * Generates type (except query and mutation) resolvers from the Schemainfo
 * 1. For types that are related ie `mongoose.ref` it gets the resource by its id
 * 2. For types that are not related, it just gets the same type from its parent 
 * @param SchemaInfo Schema related info
 */
export default function (SchemaInfo: TParsedSchemaInfo, InitResolver: Record<string, any>) {
  const { Types: { objects } } = SchemaInfo;
  const result: { [key: string]: any } = InitResolver;
  const { resource } = Object.values(SchemaInfo.Schemas[0])[0] as IMongqlBaseSchemaConfigsFull;
  const cr = capitalize(resource);

  objects.forEach(object => {
    Object.entries(object).forEach(([object_key, value]) => {
      result[object_key] = {};
      Object.entries(value.fields).forEach((entry) => {
        const field: string = entry[0];
        const field_info: FieldFullInfo = entry[1];

        const { generic_type, ref_type, fieldDepth } = field_info;
        if (!result[object_key][field]) {
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
        }
      })
    });
  });
  ['Self', 'Others', 'Mixed'].forEach(auth => {
    InitResolver[`${auth}${cr}PaginationObject`] = {
      pagination: (parent: any) => parent.pagination,
      data: (parent: any) => parent.data
    };
  })
}
