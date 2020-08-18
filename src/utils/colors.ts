export const cyan=(arg: any) => {
  console.log('\x1b[36m%s\x1b[0m', arg);
  return arg;
}
export const yellow=(arg: any) => {
  console.log('\x1b[33m%s\x1b[0m', arg);
  return arg;
}
export const red=(arg: any) => {
  console.log('\x1b[31m%s\x1b[0m', arg);
  return arg;
}
export const green=(arg: any) => {
  console.log('\x1b[32m%s\x1b[0m', arg);
  return arg;
}
export const blue=(arg: any) => {
  console.log('\x1b[34m%s\x1b[0m', arg);
  return arg;
}