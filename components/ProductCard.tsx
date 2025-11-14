
import React from 'react';
import type { Product } from '../types';
import { CartIcon } from './icons';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700/50 transform hover:scale-105 hover:border-sky-500 transition-all duration-300 ease-in-out flex flex-col">
      <div className="relative h-48 w-full bg-gray-700">
        <img
          className="h-full w-full object-cover"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
        <div className="absolute top-0 right-0 bg-sky-500 text-white font-bold px-3 py-1 m-2 rounded-full text-sm">
          ${product.price.toFixed(2)}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider">{product.category}</p>
        <div className="text-xs text-gray-500 mt-1">
            <span>SKU: {product.sku} | Item Code: {product.itemCode}</span>
        </div>
        <h3 className="text-md font-semibold text-gray-100 mt-1 flex-grow">{product.name}</h3>
        <div className="mt-4 space-y-2">
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center bg-gray-700 text-gray-200 hover:bg-sky-600 hover:text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            View on Store
          </a>
          <a
            href={product.ebayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            View on eBay
          </a>
          <a
            href={product.addToCartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            aria-label="Add to cart"
          >
            <CartIcon className="mr-2 h-5 w-5" />
            <span>Add to Cart</span>
          </a>
        </div>
      </div>
    </div>
  );
};