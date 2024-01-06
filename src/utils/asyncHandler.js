export const asyncHandler=(fun)=>async(req,res,next)=>{
    try {
        
        await fun(req,res,next)

    } catch (error) {
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}


export const aHandler=(fun2)=>{
     const fun3=async()=>{
        try {
        
            await fun2(req,res,next)
    
        } catch (error) {
            res.status(err.code || 500).json({
                success:false,
                message:err.message
            })
        }
    }
}