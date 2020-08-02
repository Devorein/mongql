import fs from 'fs-extra';
import path from 'path';
import S from 'voca';
import gql from "graphql-tag";
import { DocumentNode } from 'graphql';

export default function (_path: string) {
  const res: { [key: string]: DocumentNode } = {};
  fs.readdirSync(_path).forEach((file) => {
    const extension = path.extname(file)
    const filename = path.basename(file, extension);
    const filepath = path.join(_path, file);
    if (extension.endsWith('.js') || extension.endsWith('.ts')) {
      if (filename !== 'index') {
        const extractedExport = require(filepath);
        res[S.capitalize(filename)] = extractedExport;
        if (extractedExport.typeDefs && extractedExport.resolvers)
          res[S.capitalize(filename)] = extractedExport;

        if (extractedExport.typeDef)
          res[S.capitalize(filename)] = extractedExport.typeDef;

        if (extractedExport.typeDefs)
          res[S.capitalize(filename)] = extractedExport.typeDefs;

        if (extractedExport.resolver)
          res[S.capitalize(filename)] = extractedExport.resolver;

        if (extractedExport.resolvers)
          res[S.capitalize(filename)] = extractedExport.resolvers;
      }
    } else if (extension.endsWith('graphql') || extension.endsWith('gql'))
      res[S.capitalize(filename)] = gql(fs.readFileSync(filepath, { encoding: 'utf-8' }));
  });
  return res;
}
