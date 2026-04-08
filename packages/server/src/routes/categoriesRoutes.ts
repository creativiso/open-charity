import express from 'express';

import { getCategories } from '../controllers/categoriesContoller';

const categoriesRouter = express.Router();

categoriesRouter.get('/', getCategories);

export default categoriesRouter;
