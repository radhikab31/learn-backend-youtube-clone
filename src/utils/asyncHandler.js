const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(req, res, next).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     console.error("Something went wrong", err);
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
