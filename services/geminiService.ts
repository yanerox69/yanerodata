
import { GoogleGenAI, Type } from "@google/genai";
import type { Product } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function fetchEbayProducts(criteria: {
  minPrice: string;
  maxPrice: string;
  length: string;
  width: string;
  height: string;
  timeframe: string;
  website: string;
}): Promise<Product[]> {
  try {
    const { minPrice, maxPrice, length, width, height, timeframe, website } = criteria;

    const prompt = `Generate a list of 100 fictional best-selling products on ${website} from the ${timeframe}. Each product must have a price between $${minPrice} and $${maxPrice} and have approximate dimensions that would fit in a ${length}x${width}x${height} cm box. For each product, provide a unique ID, a unique SKU (e.g., 'ELEC-12345'), a unique 8-digit numeric item code, a name, a category, a price, a high-resolution placeholder image URL from 'https://picsum.photos/800/600', a fictional ${website} URL, a fictional 'add to cart' URL, and a fictional eBay.com URL. Ensure the price is a number and is strictly between ${minPrice} and ${maxPrice}.`;

    const productSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER, description: "Unique identifier for the product." },
        sku: { type: Type.STRING, description: "A unique Stock Keeping Unit (SKU) for the product, e.g., 'ELEC-12345'." },
        itemCode: { type: Type.STRING, description: "A unique 8-digit numeric item code for the product." },
        name: { type: Type.STRING, description: "The full name of the product." },
        category: { type: Type.STRING, description: "The product category, e.g., 'Electronics', 'Home Goods'." },
        price: { type: Type.NUMBER, description: `The price of the product, must be between ${minPrice} and ${maxPrice}.` },
        imageUrl: { type: Type.STRING, description: "A high-resolution placeholder image URL from picsum.photos, e.g., 'https://picsum.photos/800/600'." },
        productUrl: { type: Type.STRING, description: `A placeholder URL to the fictional ${website} listing.` },
        addToCartUrl: { type: Type.STRING, description: "A placeholder URL to add the item to a shopping cart." },
        ebayUrl: { type: Type.STRING, description: "A placeholder URL to the fictional eBay.com listing." }
      },
      required: ['id', 'sku', 'itemCode', 'name', 'category', 'price', 'imageUrl', 'productUrl', 'addToCartUrl', 'ebayUrl']
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              description: "An array of 100 product objects.",
              items: productSchema
            }
          }
        },
      },
    });

    const jsonText = response.text;
    const parsedJson = JSON.parse(jsonText);
    
    if (parsedJson && parsedJson.products && Array.isArray(parsedJson.products)) {
        // Add a random query parameter to image URLs to prevent caching
        return parsedJson.products.map((p: Product) => ({
            ...p,
            imageUrl: `${p.imageUrl}?random=${p.id}`
        }));
    } else {
        throw new Error("Invalid data structure received from API.");
    }

  } catch (error) {
    console.error("Error fetching data from Gemini API:", error);
    throw new Error("Failed to fetch product data. The API may be unavailable or the request failed.");
  }
}