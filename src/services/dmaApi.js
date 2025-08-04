/**
 * DMA API Service
 * Interacts with Python API server for DMA20 calculations
 */

const DMA_API_BASE_URL = 'http://localhost:5000/api';

class DMAApiService {
    constructor() {
        this.baseUrl = DMA_API_BASE_URL;
    }

    /**
     * Test connection to DMA API server
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'success',
                    message: 'DMA API server is running',
                    data: data
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            return {
                status: 'error',
                message: `DMA API server not available: ${error.message}`
            };
        }
    }

    /**
     * Get DMA20 for a single symbol
     */
    async getDMA20(symbol) {
        try {
            console.log(`📊 Fetching DMA20 for ${symbol}...`);
            
            const response = await fetch(`${this.baseUrl}/dma20/${encodeURIComponent(symbol)}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Not logged in. Please login first.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 DMA20 response for ${symbol}:`, data);
            
            return data;
        } catch (error) {
            console.error(`❌ DMA20 fetch failed for ${symbol}:`, error);
            return {
                status: 'error',
                symbol: symbol,
                message: error.message
            };
        }
    }

    /**
     * Get DMA20 for multiple symbols
     */
    async getMultipleDMA20(symbols) {
        try {
            console.log(`📊 Fetching DMA20 for ${symbols.length} symbols...`);
            
            const response = await fetch(`${this.baseUrl}/dma20/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbols })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Not logged in. Please login first.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 Batch DMA20 response:`, data);
            
            return data;
        } catch (error) {
            console.error(`❌ Batch DMA20 fetch failed:`, error);
            return {
                status: 'error',
                message: error.message,
                results: {}
            };
        }
    }

    /**
     * Update ETF with DMA20 data
     */
    async updateETFWithDMA20(etf) {
        try {
            const dmaResult = await this.getDMA20(etf.symbol);
            
            if (dmaResult.status === 'success' && dmaResult.dma20) {
                return {
                    ...etf,
                    dma20: dmaResult.dma20,
                    dma20Updated: new Date().toISOString(),
                    dma20Source: 'Python API'
                };
            } else {
                console.warn(`⚠️ Failed to get DMA20 for ${etf.symbol}:`, dmaResult.message);
                return etf; // Return original ETF if DMA20 fetch fails
            }
        } catch (error) {
            console.error(`❌ Error updating ETF with DMA20:`, error);
            return etf; // Return original ETF on error
        }
    }

    /**
     * Update multiple ETFs with DMA20 data
     */
    async updateMultipleETFsWithDMA20(etfs) {
        try {
            const symbols = etfs.map(etf => etf.symbol);
            const dmaResults = await this.getMultipleDMA20(symbols);
            
            if (dmaResults.status === 'success' && dmaResults.results) {
                return etfs.map(etf => {
                    const dmaResult = dmaResults.results[etf.symbol];
                    if (dmaResult && dmaResult.status === 'success' && dmaResult.dma20) {
                        return {
                            ...etf,
                            dma20: dmaResult.dma20,
                            dma20Updated: new Date().toISOString(),
                            dma20Source: 'Python API'
                        };
                    } else {
                        console.warn(`⚠️ Failed to get DMA20 for ${etf.symbol}`);
                        return etf;
                    }
                });
            } else {
                console.warn(`⚠️ Batch DMA20 fetch failed:`, dmaResults.message);
                return etfs; // Return original ETFs if batch fetch fails
            }
        } catch (error) {
            console.error(`❌ Error updating ETFs with DMA20:`, error);
            return etfs; // Return original ETFs on error
        }
    }
}

// Export singleton instance
const dmaApiService = new DMAApiService();
export default dmaApiService; 