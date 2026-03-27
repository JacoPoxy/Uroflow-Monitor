import { Router, type IRouter } from "express";
import healthRouter from "./health";
import voidingsRouter from "./voidings";
import fluidIntakeRouter from "./fluidIntake";
import reportRouter from "./report";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/voidings", voidingsRouter);
router.use("/fluid-intake", fluidIntakeRouter);
router.use("/report", reportRouter);

export default router;
