export const asyncHandler=(fun)=>async(req,res,next)=>{
    try {
        
      return  await fun(req,res,next)

    } catch (error) {
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}

// export const asyncHandler=(reqHandler)=>{
//     return (req,res,next)=>{
//         Promise.resolve(reqHandler(req,res,next))
//         .catch((error)=>next(error))
//     }
// }