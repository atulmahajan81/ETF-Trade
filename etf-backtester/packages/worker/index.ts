// Cloudflare Worker for ETF backtesting API
import { BacktestController } from '../do/BacktestController';
import { 
  CreateBacktestRequest, 
  CreateBacktestResponse, 
  StepBacktestRequest, 
  StepBacktestResponse,
  GetStatusResponse,
  GetArtifactsResponse,
  BacktestError
} from '../../common/types';

// Environment interface
interface Env {
  BACKTEST_DO: DurableObjectNamespace;
  R2_BUCKET?: R2Bucket;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  return null;
}

/**
 * Create error response
 */
function createErrorResponse(error: string, status: number = 400): Response {
  const errorResponse: BacktestError = {
    code: 'BACKTEST_ERROR',
    message: error
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Validate backtest parameters
 */
function validateBacktestParams(params: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.startDate || !params.endDate) {
    errors.push('startDate and endDate are required');
  }

  if (!params.initialCapital || params.initialCapital <= 0) {
    errors.push('initialCapital must be positive');
  }

  if (!params.profitTarget || params.profitTarget <= 0) {
    errors.push('profitTarget must be positive');
  }

  if (!params.averagingThreshold || params.averagingThreshold <= 0) {
    errors.push('averagingThreshold must be positive');
  }

  if (!params.maxETFsPerSector || params.maxETFsPerSector <= 0) {
    errors.push('maxETFsPerSector must be positive');
  }

  if (!params.topK || params.topK <= 0) {
    errors.push('topK must be positive');
  }

  if (!params.capitalMode || !['chunk_global_pool', 'chunk_independent'].includes(params.capitalMode)) {
    errors.push('capitalMode must be chunk_global_pool or chunk_independent');
  }

  if (!params.compoundingMode || !['fixed_chunk_progression', 'fixed_fractional', 'kelly_fractional'].includes(params.compoundingMode)) {
    errors.push('compoundingMode must be fixed_chunk_progression, fixed_fractional, or kelly_fractional');
  }

  if (new Date(params.startDate) >= new Date(params.endDate)) {
    errors.push('startDate must be before endDate');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate unique backtest ID
 */
function generateBacktestId(): string {
  return `backtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route: POST /backtests - Create new backtest
      if (request.method === 'POST' && path === '/backtests') {
        const body: CreateBacktestRequest = await request.json();
        
        // Validate parameters
        const validation = validateBacktestParams(body.params);
        if (!validation.isValid) {
          return createErrorResponse(`Invalid parameters: ${validation.errors.join(', ')}`);
        }

        // Generate backtest ID
        const backtestId = generateBacktestId();

        // Get Durable Object
        const durableObjectId = env.BACKTEST_DO.idFromName(backtestId);
        const durableObject = env.BACKTEST_DO.get(durableObjectId);

        // Start backtest
        const startResponse = await durableObject.fetch('https://backtest.internal/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            params: body.params,
            dataSource: body.dataSource || 'http',
            dataUrl: body.dataUrl
          })
        });

        const status = await startResponse.json();

        const response: CreateBacktestResponse = {
          id: backtestId,
          status: status.status
        };

        return createSuccessResponse(response, 201);
      }

      // Route: POST /backtests/:id/step - Step backtest forward
      if (request.method === 'POST' && path.match(/^\/backtests\/([^\/]+)\/step$/)) {
        const match = path.match(/^\/backtests\/([^\/]+)\/step$/);
        if (!match) {
          return createErrorResponse('Invalid backtest ID', 400);
        }

        const backtestId = match[1];
        const body: StepBacktestRequest = await request.json();

        // Get Durable Object
        const durableObjectId = env.BACKTEST_DO.idFromName(backtestId);
        const durableObject = env.BACKTEST_DO.get(durableObjectId);

        // Step backtest
        const stepResponse = await durableObject.fetch('https://backtest.internal/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            days: body.days || 1
          })
        });

        const status = await stepResponse.json();

        const response: StepBacktestResponse = {
          status: status.status,
          currentDate: status.currentDate,
          equity: status.equity,
          trades: status.trades || []
        };

        return createSuccessResponse(response);
      }

      // Route: GET /backtests/:id/status - Get backtest status
      if (request.method === 'GET' && path.match(/^\/backtests\/([^\/]+)\/status$/)) {
        const match = path.match(/^\/backtests\/([^\/]+)\/status$/);
        if (!match) {
          return createErrorResponse('Invalid backtest ID', 400);
        }

        const backtestId = match[1];

        // Get Durable Object
        const durableObjectId = env.BACKTEST_DO.idFromName(backtestId);
        const durableObject = env.BACKTEST_DO.get(durableObjectId);

        // Get status
        const statusResponse = await durableObject.fetch('https://backtest.internal/status', {
          method: 'GET'
        });

        const status: GetStatusResponse = await statusResponse.json();

        return createSuccessResponse(status);
      }

      // Route: GET /backtests/:id/artifacts/:file - Get backtest artifacts
      if (request.method === 'GET' && path.match(/^\/backtests\/([^\/]+)\/artifacts\/([^\/]+)$/)) {
        const match = path.match(/^\/backtests\/([^\/]+)\/artifacts\/([^\/]+)$/);
        if (!match) {
          return createErrorResponse('Invalid path', 400);
        }

        const backtestId = match[1];
        const file = match[2];

        // Get Durable Object
        const durableObjectId = env.BACKTEST_DO.idFromName(backtestId);
        const durableObject = env.BACKTEST_DO.get(durableObjectId);

        // Get artifacts
        const artifactsResponse = await durableObject.fetch('https://backtest.internal/export', {
          method: 'GET'
        });

        const artifacts: GetArtifactsResponse = await artifactsResponse.json();

        // Return specific file
        switch (file) {
          case 'trades.csv':
            return createCSVResponse(artifacts.trades || [], 'trades.csv');
          
          case 'equity.csv':
            return createCSVResponse(artifacts.equity || [], 'equity.csv');
          
          case 'holdings.csv':
            return createCSVResponse(artifacts.holdings || [], 'holdings.csv');
          
          case 'metrics.json':
            return createSuccessResponse(artifacts.metrics || {});
          
          default:
            return createErrorResponse('Unknown artifact file', 404);
        }
      }

      // Route: GET /backtests/:id/artifacts - Get all artifacts
      if (request.method === 'GET' && path.match(/^\/backtests\/([^\/]+)\/artifacts$/)) {
        const match = path.match(/^\/backtests\/([^\/]+)\/artifacts$/);
        if (!match) {
          return createErrorResponse('Invalid backtest ID', 400);
        }

        const backtestId = match[1];

        // Get Durable Object
        const durableObjectId = env.BACKTEST_DO.idFromName(backtestId);
        const durableObject = env.BACKTEST_DO.get(durableObjectId);

        // Get artifacts
        const artifactsResponse = await durableObject.fetch('https://backtest.internal/export', {
          method: 'GET'
        });

        const artifacts: GetArtifactsResponse = await artifactsResponse.json();

        return createSuccessResponse(artifacts);
      }

      // Route: GET /health - Health check
      if (request.method === 'GET' && path === '/health') {
        return createSuccessResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      }

      // Route: GET / - API documentation
      if (request.method === 'GET' && path === '/') {
        const documentation = {
          name: 'ETF Backtesting API',
          version: '1.0.0',
          description: 'Serverless ETF backtesting system using Cloudflare Workers and Durable Objects',
          endpoints: {
            'POST /backtests': 'Create a new backtest',
            'POST /backtests/:id/step': 'Step a backtest forward by N days',
            'GET /backtests/:id/status': 'Get backtest status and progress',
            'GET /backtests/:id/artifacts': 'Get all backtest artifacts',
            'GET /backtests/:id/artifacts/:file': 'Get specific artifact file (trades.csv, equity.csv, holdings.csv, metrics.json)',
            'GET /health': 'Health check endpoint'
          },
          examples: {
            createBacktest: {
              method: 'POST',
              url: '/backtests',
              body: {
                params: {
                  startDate: '2024-01-01',
                  endDate: '2024-12-31',
                  initialCapital: 1000000,
                  profitTarget: 6,
                  averagingThreshold: 2.5,
                  maxETFsPerSector: 3,
                  topK: 5,
                  executionPrice: 'close',
                  capitalMode: 'chunk_global_pool',
                  compoundingMode: 'fixed_chunk_progression',
                  chunkConfig: {
                    numberOfChunks: 50,
                    baseChunkSize: 20000,
                    progressionFactor: 1.06
                  }
                },
                dataSource: 'http',
                dataUrl: 'https://example.com/etf-data.csv'
              }
            }
          }
        };

        return createSuccessResponse(documentation);
      }

      // 404 for unknown routes
      return createErrorResponse('Not Found', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
};

/**
 * Create CSV response
 */
function createCSVResponse(data: any[], filename: string): Response {
  if (data.length === 0) {
    return new Response('', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...corsHeaders
      }
    });
  }

  // Convert data to CSV
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  const csv = csvRows.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...corsHeaders
    }
  });
}

// Export the Durable Object class
export { BacktestController };
