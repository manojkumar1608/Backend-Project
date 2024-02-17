const asyncHandler = (fn) => {
    return (res,req,next) => {
        Promise.resolve(fn(res,req,next)).catch((err) => next(err))

}}

export {asyncHandler}