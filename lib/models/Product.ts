import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  sku: string;
  barcode?: string;
  categoryId: ObjectId;
  companyId: ObjectId;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface Category {
  _id?: ObjectId;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  parentId?: ObjectId;
  companyId: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}