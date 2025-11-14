
import React, { useState, useCallback } from 'react';
import type { Product } from './types';
import { fetchEbayProducts } from './services/geminiService';
import { ProductCard } from './components/ProductCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SearchIcon, DownloadIcon, AlertTriangleIcon, CopyIcon, CheckIcon } from './components/icons';
import { Pagination } from './components/Pagination';

// Make SheetJS library available in the window scope
declare const XLSX: any;

interface SearchCriteriaState {
  minPrice: string;
  maxPrice: string;
  length: string;
  width: string;
  height: string;
  timeframe: string;
  website: string;
}

const WEBSITES = [
  "eBay.com", "Adidas.com", "Nike.com", "Puma.com", "Kohls.com", "Footlocker.com",
  "Finishline.com", "DicksSportingGoods.com", "Champssports.com", "Rackroomshoes.com",
  "ASOS.com", "Soccer.com", "Reebok.com", "JCPenney.com", "Shopwss.com", "Macys.com",
  "Scheels.com", "Dtlr.com", "Goingoinggone.com", "Skechers.com", "Walgreens.com",
  "Columbia.com", "jockey.com", "aeropostale.com", "keenfootwear.com", "timberland.com",
  "Diesel.com", "FreePeople.com", "ToryBurch.com", "Orvis.com", "Heydude.com",
  "teva.com", "brooksrunning.com", "dansko.com", "stafford.com", "bombas.com",
  "and1.com", "Famousfootwear.com", "Fanatics.com", "als.com", "32degrees.com",
  "Hanes.com", "Fruit.com", "Loungefly.com", "Ariat.com", "Rothco.com", "Cobian.com",
  "Fashionnova.com", "altrarunning.com"
];

const PRODUCTS_PER_PAGE = 20;

export default function App(): React.ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [criteria, setCriteria] = useState<SearchCriteriaState>({
    minPrice: '0',
    maxPrice: '100',
    length: '30',
    width: '18',
    height: '10',
    timeframe: 'Last 3 months',
    website: 'eBay.com',
  });

  const handleCriteriaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setCurrentPage(1); // Reset to first page on new search
    try {
      const result = await fetchEbayProducts(criteria);
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [criteria]);

  const handleExport = useCallback(() => {
    if (products.length === 0) return;

    const worksheetData = products.map(p => ({
      'SKU': p.sku,
      'Item Code': p.itemCode,
      'Product Name': p.name,
      'Category': p.category,
      'Price ($)': p.price,
      'Product URL': p.productUrl,
      'eBay URL': p.ebayUrl,
      'Add to Cart URL': p.addToCartUrl,
      'Image URL': p.imageUrl
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Products');

    // Auto-size columns for better readability
    const max_width = worksheetData.reduce((w, r) => Math.max(w, r['Product Name'].length), 10);
    worksheet["!cols"] = [ 
        { wch: 15 }, // SKU
        { wch: 15 }, // Item Code
        { wch: max_width }, // Product Name
        { wch: 20 }, // Category
        { wch: 10 }, // Price
        { wch: 40 }, // Product URL
        { wch: 40 }, // eBay URL
        { wch: 40 }, // Add to Cart URL
        { wch: 40 }  // Image URL
    ];

    XLSX.writeFile(workbook, `Best_Sellers_${criteria.website}.xlsx`);
  }, [products, criteria.website]);

  const handleCopy = useCallback(() => {
    if (products.length === 0) return;

    const jsonString = JSON.stringify(products, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  }, [products]);

  // Pagination logic
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                Best-Seller Finder
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Discover the top 100 best-selling items based on your criteria and export the results to Excel.
            </p>
        </header>
        
        <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white mb-3">Search Criteria</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                        <label htmlFor="website" className="font-bold text-sky-400 block">Website</label>
                        <select 
                            id="website" 
                            name="website" 
                            value={criteria.website} 
                            onChange={handleCriteriaChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        >
                            {WEBSITES.map(site => <option key={site} value={site}>{site}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="timeframe" className="font-bold text-sky-400 block">Timeframe</label>
                        <select 
                            id="timeframe" 
                            name="timeframe" 
                            value={criteria.timeframe} 
                            onChange={handleCriteriaChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option>Last 30 days</option>
                            <option>Last 3 months</option>
                            <option>Last 6 months</option>
                            <option>Last year</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold text-sky-400 block">Price Range ($)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                name="minPrice" 
                                placeholder="Min" 
                                value={criteria.minPrice}
                                onChange={handleCriteriaChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                                type="number" 
                                name="maxPrice" 
                                placeholder="Max" 
                                value={criteria.maxPrice}
                                onChange={handleCriteriaChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-3">
                        <label className="font-bold text-sky-400 block">Max Dimensions (cm)</label>
                        <div className="flex items-center gap-2 max-w-sm">
                            <input type="number" name="length" placeholder="L" value={criteria.length} onChange={handleCriteriaChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                            <span className="text-gray-400">x</span>
                            <input type="number" name="width" placeholder="W" value={criteria.width} onChange={handleCriteriaChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                            <span className="text-gray-400">x</span>
                            <input type="number" name="height" placeholder="H" value={criteria.height} onChange={handleCriteriaChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="w-full flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isLoading ? (
                      <>
                        <LoadingSpinner />
                        Searching...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="mr-3 h-5 w-5" />
                        Find Products
                      </>
                    )}
                </button>
                <button
                    onClick={handleExport}
                    disabled={products.length === 0 || isLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-emerald-900 bg-emerald-400 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                    <DownloadIcon className="mr-3 h-5 w-5" />
                    Export to Excel
                </button>
                <button
                    onClick={handleCopy}
                    disabled={products.length === 0 || isLoading || copyStatus === 'copied'}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-900 bg-indigo-400 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {copyStatus === 'copied' ? (
                        <>
                            <CheckIcon className="mr-3 h-5 w-5" /> 
                            Copied!
                        </>
                    ) : (
                        <>
                            <CopyIcon className="mr-3 h-5 w-5" />
                            Copy as JSON
                        </>
                    )}
                </button>
            </div>
        </div>

        <div className="mt-12">
          {error && (
            <div className="max-w-4xl mx-auto bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                <div className="flex items-center">
                    <AlertTriangleIcon className="h-5 w-5 mr-3"/>
                    <div>
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                </div>
            </div>
          )}

          {products.length > 0 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-8">Found {products.length} Products on {criteria.website}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {products.length > PRODUCTS_PER_PAGE && (
                <Pagination
                  productsPerPage={PRODUCTS_PER_PAGE}
                  totalProducts={products.length}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              )}
            </>
          )}

          {!isLoading && !error && products.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p>Click "Find Products" to start the workflow.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
