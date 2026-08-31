import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import openapi from "../docs/openapi.json" assert { type: "json" };

const router = Router();

router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

export default router;
