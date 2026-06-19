import CustomApiError from "../common/errors/customApiError.js";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

const GENERIC_ERROR_MESSAGE = "Something went wrong try again later";

 const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    let customError = {
        // set default
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        msg: GENERIC_ERROR_MESSAGE,
      }
    
      if(err instanceof CustomApiError){
        customError.statusCode = err.statusCode;
        customError.msg = err.message;
      }
    if (err instanceof ZodError) {
        customError.msg = err.issues
          .map((item) => `${item.path.join('.')}: ${item.message}`)
          .join(', ')
        customError.statusCode = StatusCodes.BAD_REQUEST
      }
    return res.status(customError.statusCode).json({ success: false, message: customError.msg });
}
export default errorMiddleware;
