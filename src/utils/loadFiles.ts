import fs from 'fs';
import path from 'path';
import { capitalize } from '../utils';
import gql from "graphql-tag";

/**
 * Loads typedefs and resolvers from a path
 * **WARNING** This part of the API might be replaced with `@graphql-tools/load-files`
 * @param _path Path to load files from
 */
export default function (_path: string) {
  const res: Record<string, any> = {};
  fs.readdirSync(_path).forEach((file) => {
    const extension = path.extname(file)
    const filename = path.basename(file, extension);
    const filepath = path.join(_path, file);
    if (extension.endsWith('.js') || extension.endsWith('.ts')) {
      if (filename !== 'index') {
        const extractedExport = require(filepath);
        res[capitalize(filename)] = extractedExport;
        if (extractedExport) {
          if (extractedExport.typeDefs && extractedExport.resolvers)
            res[capitalize(filename)] = extractedExport;

          if (extractedExport.typeDef)
            res[capitalize(filename)] = extractedExport.typeDef;

          if (extractedExport.typeDefs)
            res[capitalize(filename)] = extractedExport.typeDefs;

          if (extractedExport.resolver)
            res[capitalize(filename)] = extractedExport.resolver;

          if (extractedExport.resolvers)
            res[capitalize(filename)] = extractedExport.resolvers;
        }
      }
    } else if (extension.endsWith('graphql') || extension.endsWith('gql')) {
      const gqlcontent = fs.readFileSync(filepath, { encoding: 'utf-8' })
      res[capitalize(filename)] = gqlcontent ? gql(gqlcontent) : undefined;
    }
  });
  return res;
}
