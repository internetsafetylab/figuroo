import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import productsRouter from "./products";
import inventoryRouter from "./inventory";
import analyticsRouter from "./analytics";
import authRouter from "./auth";
import tokensRouter from "./tokens";

const router: IRouter = Router();

router.use(authRouter);
router.use(tokensRouter);
router.use(healthRouter);
router.use(ordersRouter);
router.use(productsRouter);
router.use(inventoryRouter);
router.use(analyticsRouter);

export default router;
