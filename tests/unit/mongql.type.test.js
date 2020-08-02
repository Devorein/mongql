const mongoose = require('mongoose');
const { isDocumentNode, documentApi } = require('graphql-extra');
const gql = require('graphql-tag');

const { Mongql } = require('../../dist');

describe.skip('Proper typedef generation', () => {
  let TransformedTypedefs;

  const DocumentAPI = {},
    SchemaFields = {},
    Schemas = {},
    resources = ['User', 'Settings'];

  const UserSchema = new mongoose.Schema({
    name: String,
    ROLE: {
      type: String,
      enum: ['ADMIN', 'ORGANIZER', 'ATTENDEE']
    }
  });

  UserSchema.mongql = {
    resource: 'User'
  };

  const SettingsSchema = new mongoose.Schema({
    created_at: {
      type: Date,
      mongql: {
        scalar: 'Date'
      }
    },
    ROLE: {
      type: String,
      enum: ['BASIC', 'INTERMEDIATE', 'ADVANCED']
    }
  });

  const InitUserTypedef = gql`
		type UserData {
			name: String!
		}
	`;

  const InitSettingsTypedef = gql`
		type SettingsData {
			name: String!
		}
	`;

  SettingsSchema.mongql = {
    resource: 'Settings'
  };

  const mongql = new Mongql({
    Schemas: [UserSchema, SettingsSchema],
    Typedefs: {
      init: {
        User: InitUserTypedef,
        Settings: InitSettingsTypedef
      }
    }
  });

  Schemas.User = UserSchema;
  Schemas.Settings = SettingsSchema;

  resources.forEach((resource) => {
    SchemaFields[resource] = Object.keys(Schemas[resource].paths).filter((key) => key !== '_id');
    SchemaFields[resource].push('id');
  });

  beforeEach(async () => {
    const res = await mongql.generate();
    TransformedTypedefs = res.TransformedTypedefs;
    resources.forEach((resource) => {
      DocumentAPI[resource] = documentApi().addSDL(TransformedTypedefs.obj[resource]);
    });
  });

  describe('Document generation', () => {
    it('Should create document node', () => {
      expect(isDocumentNode(TransformedTypedefs.obj.User)).toBe(true);
      expect(isDocumentNode(TransformedTypedefs.obj.Settings)).toBe(true);
    });
  });

  describe('Interface generation', () => {
    it('Should create interface node', () => {
      resources.forEach((resource) => {
        expect(DocumentAPI[resource].getInterfaceType(resource).node).toBeTruthy();
      });
    });

    it('Should create interface with appropriate fields', () => {
      resources.forEach((resource) => {
        SchemaFields[resource].forEach((field) => {
          expect(DocumentAPI[resource].getInterfaceType(resource).hasField(field)).toBe(true);
        });
      });
    });
  });

  describe('Type generation', () => {
    it('Should create auth based resource', () => {
      ['Self', 'Others', 'Mixed'].forEach((auth) => {
        resources.forEach((resource) => {
          expect(DocumentAPI[resource].hasType(`${auth}${resource}Type`)).toBe(true);
        });
      });
    });

    it('Should have all fields on created auth based resource', () => {
      ['Self', 'Others', 'Mixed'].forEach((auth) => {
        resources.forEach((resource) => {
          SchemaFields[resource].forEach((field) => {
            expect(DocumentAPI[resource].getObjectType(`${auth}${resource}Type`).hasField(field)).toBe(true);
          });
        });
      });
    });

    it('Should contain pre existing types', () => {
      resources.forEach((resource) => {
        expect(DocumentAPI[resource].hasType(`${resource}Data`)).toBeTruthy();
      });
    });
  });

  // Input generation
  describe('Input generation', () => {
    it('Should create inputs', () => {
      resources.forEach((resource) => {
        expect(DocumentAPI[resource].getInputType(`${resource}Input`)).toBeTruthy();
      });
    });

    it('Should have all keys in created inputs', () => {
      resources.forEach((resource) => {
        SchemaFields[resource].slice(0, SchemaFields[resource].length - 1).forEach((field) => {
          expect(DocumentAPI[resource].getInputType(`${resource}Input`).hasField(field)).toBe(true);
        });
      });
    });
  });

  // Enum generation
  describe('Enum generation', () => {
    it('Should generate enums', () => {
      expect(DocumentAPI.User.getEnumType(`USER_ROLE`)).toBeTruthy();
      expect(DocumentAPI.Settings.getEnumType(`SETTINGS_ROLE`)).toBeTruthy();
    });
  });
});