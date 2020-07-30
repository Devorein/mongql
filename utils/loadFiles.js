const fs = require('fs-extra');
const path = require('path');
const S = require('voca');
const gql = require("graphql-tag")

module.exports = function (_path) {
  const res = {};
  fs.readdirSync(_path).forEach((file) => {
    const extension = path.extname(file)
    const filename = path.basename(file, extension);
    const filepath = path.join(_path, file);
    if (extension.endsWith('.js') || extension.endsWith('.ts')) {
      if (filename !== 'index') {
        const extractedExport = require(filepath);
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

        res[S.capitalize(filename)] = extractedExport;
      }
    } else
      res[S.capitalize(filename)] = gql(fs.readFileSync(filepath, { encoding: 'utf-8' }));
  });
  return res;
};
