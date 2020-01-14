import {MongoObservable} from "meteor-rxjs";
import { Product } from '../models/product.model';

export const Products = new MongoObservable.Collection<Product>('products');