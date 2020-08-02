/**
 * Checks whether the parameter is a POJO or not
 * @param {any} arg Parameter to evalaute
 * @returns {boolean} Whether or not the parameter is a POJO
 */
function isPOJO(arg: any): boolean {
  if (arg == null || typeof arg !== 'object') return false;
  const proto = Object.getPrototypeOf(arg);
  if (proto == null) return true;
  return proto === Object.prototype;
}

/**
 * Set all the deeply nested properties of an object to a specific value 
 * @param {Object} obj Object to populate 
 * @param {any} setvalue Value to set to 
 * @returns {Object} Newly Manipulated object 
 */
function populateNestedFields(obj: object, setvalue: any) {
  const temp: { [key: string]: any } = { ...obj };
  function traverser(obj: object) {
    Object.entries(obj).forEach(([key, value]) => {
      if (!isPOJO(value)) temp[key] = setvalue;
      else traverser(value);
    });
  }
  traverser(temp);
  return temp;
}

/**
 * Converts a dot separated object prop to nested fields
 * @param {Object} object Root object
 * @param {string} path The nested path to populate
 * @param {any} value Value to set to the nested path
 * @returns {Object} Object with nested props set
 */
const setNestedProps = (object: any, path: string, value: any): object => {
  const root = object;
  const pathArray = path.split('.');
  for (let i = 0; i < pathArray.length; i++) {
    const p = pathArray[i];
    if (!isPOJO(object[p])) object[p] = {};
    if (i === pathArray.length - 1) object[p] = value;
    object = object[p];
  }
  return root;
};

/**
 * Flattens all deeply nested properties of an object 
 * @param {Object} obj Object to flatten
 * @returns {Object} Flattened object
 */
function flattenObject(obj: any): any {
  function objectVisitor(obj: any, parents: string[] = []) {
    let res: { [key: string]: any } = {};
    const entries = Object.entries(obj);
    if (entries.length > 0)
      entries.forEach(([key, value]) => {
        if (!isPOJO(value)) res[`${parents.join('.')}${parents.length > 0 ? '.' : ''}${key}`] = value;
        else res = { ...res, ...objectVisitor(value, parents.concat(key)) };
      });
    else res[parents.join('.')] = {}
    return res;
  }
  return objectVisitor(obj);
}

function matchFlattenedObjProps(flattened_query_prop: any, flattened_merger_props: any): any[] {
  const flattened_query_prop_parts = flattened_query_prop.split('.');
  const match_queries = flattened_merger_props.filter((flattened_merger_prop: any) => {
    const flattened_merger_prop_parts = flattened_merger_prop.split('.');
    let prevIndex = 0;
    for (let i = 0; i < flattened_query_prop_parts.length; i++) {
      const flattened_query_prop_part = flattened_query_prop_parts[i];
      prevIndex = flattened_merger_prop_parts.indexOf(flattened_query_prop_part, prevIndex);
      if (prevIndex === -1) break;
    }
    return prevIndex !== -1;
  });
  return match_queries;
}

/**
 * Ovewrites the deeply nested properties of init with merger
 * @param {Object} init Initital object to flatten 
 * @param {Object} merger Object to merge with init
 * @returns {Object} Flattened, nested props populated and merged object
 */
function nestedObjPopulation(init: any = {}, merger: any) {
  merger = { ...merger };
  if (init === false) init = populateNestedFields(merger, false);
  const flattened_merger = flattenObject(merger);
  const flattened_init = flattenObject(init);
  const flattened_init_props = Object.keys(flattened_init);
  const flattened_merger_props = Object.keys(flattened_merger);
  flattened_init_props.forEach((flattened_init_prop) => {
    matchFlattenedObjProps(flattened_init_prop, flattened_merger_props).forEach(
      (match_init) => (flattened_merger[match_init] = flattened_init[flattened_init_prop])
    );
  });
  Object.entries(flattened_merger).forEach(([key, value]) => {
    if (isPOJO(value)) {
      setNestedProps(flattened_merger, key, value);
      delete flattened_merger[key];
    }
  });
  return flattened_merger;
}

function scrambler(key: string) {
  const arr: string[] = [];
  const keys = key.split('.');

  function wrapper(keys: string[], parent = []) {
    const arr = [];
    const first_key = keys[0];
    if (keys.length > 0) arr.push(keys.join('.'));
    arr.push(first_key);
    for (let i = 1; i < keys.length; i++) {
      const _arr = [];
      if (parent.length > 0) _arr.push(parent);
      _arr.push(first_key, keys[i]);
      arr.push(_arr.join('.'));
    }
    return arr;
  }

  keys.forEach((_, i) => {
    arr.push(...wrapper(keys.slice(i)));
  });

  return arr;
}

function mixObjectProp(obj: any) {
  const set = new Set();
  Object.entries(obj).forEach(([key]) => {
    scrambler(key).forEach((scramble) => set.add(scramble));
  });
  return Array.from(set);
}

function populateObjDefaultValue(Initial: any, Defaults: any) {
  Initial = { ...Initial };
  Defaults = { ...Defaults };
  const flattened_initial = flattenObject(Initial);
  const flattened_default = flattenObject(Defaults);
  const res = { ...flattened_default, ...flattened_initial };
  const reversed_keys = Object.keys(res).sort();
  reversed_keys.forEach((key) => {
    if (key.split(".").length > 1) {
      setNestedProps(res, key, res[key]);
      delete res[key];
    }
  })
  return res;
}

function checkDeepNestedProps(object: any, check_against: any) {
  const temp = { ...object };
  let res = false;
  function traverser(obj: any) {
    Object.entries(obj).forEach(([key, value]) => {
      if (!isPOJO(value)) res = temp[key] === check_against;
      else if (!res) traverser(value);
      else return;
    });
  }
  traverser(temp);
  return res;
}

export {
  setNestedProps,
  mixObjectProp,
  flattenObject,
  matchFlattenedObjProps,
  nestedObjPopulation,
  populateObjDefaultValue,
  isPOJO,
  checkDeepNestedProps
};
