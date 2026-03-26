import { Router, type IRouter } from "express";
import healthRouter from "./health";
import voidingsRouter from "./voidings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/voidings", voidingsRouter);

export default router;
