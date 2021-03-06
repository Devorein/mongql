/**
 * Authentication resolver composer middleware to check if user exists on the context object
 */
const isAuthenticated = () => (next: any) => async (root: any, args: any, context: any, info: any) => {
  if (!context.user)
    throw new Error('You are not authenticated!');

  return next(root, args, context, info);
};

export default isAuthenticated;
