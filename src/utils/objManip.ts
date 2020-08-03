/**
 * Checks whether the parameter is a POJO or not
 * @param arg Parameter to evalaute
 * @returns Whether or not the parameter is a POJO
 */
function isPOJO(arg: any): boolean {
  if (arg == null || typeof arg !== 'object') return false;
  const proto = Object.getPrototypeOf(arg);
  if (proto == null) return true;
  return proto === Object.prototype;
}

/**
 * Set all the deeply nested properties of an object to a specific value 
 * @param obj Object to populate 
 * @param setvalue Value to set to 
 * @returns Newly Populated object 
 */
function populateNestedFields(obj: Record<string, any>, setvalue: any) {
  const temp: { [key: string]: any } = { ...obj };
  function traverser(obj: Record<string, any>) {
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
 * @param object Root object
 * @param path The nested path to populate
 * @param value Value to set to the nested path
 * @returns Object with nested props set
 */
const setNestedFields = (object: Record<string, any>, path: string, value: any): Record<string, any> => {
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
 * @param obj Object to flatten
 * @returns Flattened object
 */
function flattenObject(obj: Record<string, any>) {
  function objectVisitor(obj: any, parents: string[] = []) {
    let res: Record<string, any> = {};
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

/**
 * Matches the properties of a flattened object
 * @param flattened_query_prop FLattened prop query object
 * @param flattened_merger_props Flattened merger object
 * @returns 
 */
function matchFlattenedObjProps(flattened_query_prop: string, flattened_merger_props: string[]): string[] {
  const flattened_query_prop_parts = flattened_query_prop.split('.');
  const match_queries = flattened_merger_props.filter((flattened_merger_prop: string) => {
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
 * Ovewrites the deeply nested properties of init with merger using query matcher
 * @param init Initital object to flatten 
 * @param merger Object to merge with init
 * @returns Flattened, nested props populated and merged object
 */
function nestedObjPopulation(init: boolean | Record<string, any> = {}, merger: Record<string, any>) {
  merger = { ...merger };
  if (init === false) init = populateNestedFields(merger, false);
  const flattened_merger = flattenObject(merger);
  const flattened_init = flattenObject(init as Record<string, any>);
  const flattened_init_props = Object.keys(flattened_init);
  const flattened_merger_props = Object.keys(flattened_merger);
  flattened_init_props.forEach((flattened_init_prop) => {
    matchFlattenedObjProps(flattened_init_prop, flattened_merger_props).forEach(
      (match_init) => (flattened_merger[match_init] = flattened_init[flattened_init_prop])
    );
  });
  Object.entries(flattened_merger).forEach(([key, value]) => {
    if (isPOJO(value)) {
      setNestedFields(flattened_merger, key, value);
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

function mixObjectProp(obj: Record<string, any>) {
  const set = new Set();
  Object.entries(obj).forEach(([key]) => {
    scrambler(key).forEach((scramble) => set.add(scramble));
  });
  return Array.from(set);
}

/**
 * Sets the user passed object configuration over the default configuration
 * @param Initial Initital configuration object
 * @param Defaults Default configuration object
 * @returs newly generated object
 */
function populateObjDefaultValue(Initial: Record<string, any>, Defaults: Record<string, any>) {
  Initial = { ...Initial };
  Defaults = { ...Defaults };
  const flattened_initial = flattenObject(Initial);
  const flattened_default = flattenObject(Defaults);
  const res: any = { ...flattened_default, ...flattened_initial };
  const reversed_keys = Object.keys(res).sort();
  reversed_keys.forEach((key) => {
    if (key.split(".").length > 1) {
      setNestedFields(res, key, res[key]);
      delete res[key];
    }
  })
  return res;
}

/**
 * Checks if all the nested properties of an object has a specific value
 * @param object Object to check
 * @param check_against value to check
 * @returns Whether or not all nested props contain a passed value 
 */
function checkDeepNestedProps(object: Record<string, any>, check_against: any) {
  const temp = { ...object };
  let res = false;
  function traverser(obj: Record<string, any>) {
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
  setNestedFields,
  mixObjectProp,
  flattenObject,
  matchFlattenedObjProps,
  nestedObjPopulation,
  populateObjDefaultValue,
  isPOJO,
  checkDeepNestedProps
};
