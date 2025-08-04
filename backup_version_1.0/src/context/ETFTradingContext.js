import React, { createContext, useContext, useReducer, useEffect } from 'react';
import mstocksApiService from '../services/mstocksApi';
// Removed demo data service import
import { sampleSoldItems } from '../data/complete_sold_items.js';

// Sample ETF data
const sampleETFs = [
  { id: 'etf_001', symbol: 'NIFTYBEES', name: 'NIFTY 50 ETF', sector: 'Nifty 50', currentPrice: 245.50, change: 1.2, cmp: 245.50, dma20: 248.20, volume: 1250000 },
  { id: 'etf_002', symbol: 'BANKBEES', name: 'NIFTY Bank ETF', sector: 'Bank', currentPrice: 456.78, change: -0.8, cmp: 456.78, dma20: 462.30, volume: 890000 },
  { id: 'etf_003', symbol: 'ITBEES', name: 'NIFTY IT ETF', sector: 'IT', currentPrice: 38.45, change: 2.1, cmp: 38.45, dma20: 37.80, volume: 2100000 },
  { id: 'etf_004', symbol: 'GOLDBEES', name: 'Gold ETF', sector: 'Gold', currentPrice: 52.30, change: 0.5, cmp: 52.30, dma20: 52.10, volume: 450000 },
  { id: 'etf_005', symbol: 'SILVERBEES', name: 'Silver ETF', sector: 'Silver', currentPrice: 75.20, change: -1.2, cmp: 75.20, dma20: 76.15, volume: 320000 },
  { id: 'etf_006', symbol: 'JUNIORBEES', name: 'NIFTY Next 50 ETF', sector: 'Next 50', currentPrice: 485.60, change: 1.8, cmp: 485.60, dma20: 477.20, volume: 680000 },
  { id: 'etf_007', symbol: 'PHARMABEES', name: 'NIFTY Pharma ETF', sector: 'Healthcare', currentPrice: 16.80, change: 0.9, cmp: 16.80, dma20: 16.65, volume: 1800000 },
  { id: 'etf_008', symbol: 'CONSUMBEES', name: 'NIFTY Consumer ETF', sector: 'Consumer', currentPrice: 95.40, change: 1.5, cmp: 95.40, dma20: 94.00, volume: 420000 },
  { id: 'etf_009', symbol: 'MASPTOP50', name: 'S&P 500 Top 50 ETF', sector: 'International', currentPrice: 32.15, change: 0.7, cmp: 32.15, dma20: 31.90, volume: 150000 },
  { id: 'etf_010', symbol: 'MON100', name: 'Nasdaq 100 ETF', sector: 'International', currentPrice: 125.80, change: 1.3, cmp: 125.80, dma20: 124.20, volume: 280000 },
  { id: 'etf_011', symbol: 'HEALTHY', name: 'NIFTY Healthcare ETF', sector: 'Healthcare', currentPrice: 10.25, change: 0.4, cmp: 10.25, dma20: 10.20, volume: 950000 },
  { id: 'etf_012', symbol: 'MOM100', name: 'NIFTY Midcap 100 ETF', sector: 'Midcap', currentPrice: 42.60, change: 1.7, cmp: 42.60, dma20: 41.90, volume: 1100000 },
  { id: 'etf_013', symbol: 'KOTAKNV20', name: 'NIFTY 50 Value 20 ETF', sector: 'Value', currentPrice: 115.30, change: 0.8, cmp: 115.30, dma20: 114.40, volume: 180000 },
  { id: 'etf_014', symbol: 'NSE:ESG', name: 'NIFTY 100 ESG ETF', sector: 'ESG', currentPrice: 34.75, change: 1.1, cmp: 34.75, dma20: 34.40, volume: 320000 },
  { id: 'etf_015', symbol: 'NSE:MAFANG', name: 'NYSE FANG+ ETF', sector: 'International', currentPrice: 68.90, change: 2.3, cmp: 68.90, dma20: 67.40, volume: 120000 },
  { id: 'etf_016', symbol: 'PSUBANKICI', name: 'NIFTY PSU Bank ETF', sector: 'PSU Bank', currentPrice: 48.20, change: 0.6, cmp: 48.20, dma20: 47.90, volume: 850000 },
  { id: 'etf_017', symbol: 'KOTAKPSUBK', name: 'NIFTY PSU Bank ETF', sector: 'PSU Bank', currentPrice: 520.40, change: 1.4, cmp: 520.40, dma20: 513.20, volume: 95000 },
  { id: 'etf_018', symbol: 'MID150BEES', name: 'NIFTY Midcap 150 ETF', sector: 'Midcap', currentPrice: 158.70, change: 1.9, cmp: 158.70, dma20: 155.80, volume: 380000 },
  { id: 'etf_019', symbol: 'AUTOBEES', name: 'NIFTY Auto ETF', sector: 'Auto', currentPrice: 178.90, change: 0.3, cmp: 178.90, dma20: 178.40, volume: 220000 },
  { id: 'etf_020', symbol: 'ICICICONSU', name: 'NIFTY India Consumption ETF', sector: 'Consumer', currentPrice: 88.45, change: 1.6, cmp: 88.45, dma20: 87.10, volume: 180000 },
  { id: 'etf_021', symbol: 'SETFGOLD', name: 'Gold ETF', sector: 'Gold', currentPrice: 53.80, change: 0.2, cmp: 53.80, dma20: 53.70, volume: 280000 },
  { id: 'etf_022', symbol: 'ICICIPHARM', name: 'NIFTY Healthcare ETF', sector: 'Healthcare', currentPrice: 108.60, change: 0.8, cmp: 108.60, dma20: 107.80, volume: 85000 },
  { id: 'etf_023', symbol: 'UTINEXT50', name: 'NIFTY Next 50 ETF', sector: 'Next 50', currentPrice: 49.25, change: 1.2, cmp: 49.25, dma20: 48.70, volume: 420000 },
  { id: 'etf_024', symbol: 'HDFCSILVER', name: 'Silver ETF', sector: 'Silver', currentPrice: 76.40, change: -0.5, cmp: 76.40, dma20: 76.80, volume: 180000 },
  { id: 'etf_025', symbol: 'ICICINV20', name: 'NIFTY 50 Value 20 ETF', sector: 'Value', currentPrice: 118.90, change: 0.9, cmp: 118.90, dma20: 117.90, volume: 120000 },
  { id: 'etf_026', symbol: 'KOTAKLOVOL', name: 'NIFTY 100 Low Vol 30 ETF', sector: 'Quality', currentPrice: 16.45, change: 0.7, cmp: 16.45, dma20: 16.35, volume: 650000 },
  { id: 'etf_027', symbol: 'KOTAKGOLD', name: 'Gold ETF', sector: 'Gold', currentPrice: 54.20, change: 0.4, cmp: 54.20, dma20: 54.00, volume: 220000 },
  { id: 'etf_028', symbol: 'DSPQ50ETF', name: 'NIFTY Midcap 150 Quality 50 ETF', sector: 'Quality', currentPrice: 195.60, change: 1.8, cmp: 195.60, dma20: 192.20, volume: 85000 },
  { id: 'etf_029', symbol: 'SETFNIFBK', name: 'NIFTY Bank ETF', sector: 'Bank', currentPrice: 468.30, change: 0.5, cmp: 468.30, dma20: 466.10, volume: 320000 },
  { id: 'etf_030', symbol: 'NSE:BFSI', name: 'NIFTY Financial Services ETF', sector: 'Financial Services', currentPrice: 21.85, change: 1.1, cmp: 21.85, dma20: 21.60, volume: 580000 },
  { id: 'etf_031', symbol: 'PSUBNKBEES', name: 'NIFTY PSU Bank ETF', sector: 'PSU Bank', currentPrice: 58.90, change: 0.8, cmp: 58.90, dma20: 58.40, volume: 420000 },
  { id: 'etf_032', symbol: 'ICICIBANKP', name: 'NIFTY Private Bank ETF', sector: 'Bank', currentPrice: 248.70, change: 1.3, cmp: 248.70, dma20: 245.50, volume: 180000 },
  { id: 'etf_033', symbol: 'KOTAKIT', name: 'NIFTY IT ETF', sector: 'IT', currentPrice: 36.80, change: 2.2, cmp: 36.80, dma20: 36.00, volume: 850000 },
  { id: 'etf_034', symbol: 'FMCGIETF', name: 'NIFTY FMCG ETF', sector: 'Consumer', currentPrice: 580.40, change: 0.6, cmp: 580.40, dma20: 576.90, volume: 45000 },
  { id: 'etf_035', symbol: 'MONQ50', name: 'Nasdaq Q-50 ETF', sector: 'International', currentPrice: 58.90, change: 1.4, cmp: 58.90, dma20: 58.10, volume: 95000 },
  { id: 'etf_036', symbol: 'NSE:PHARMABEES', name: 'NIFTY Pharma ETF', sector: 'Healthcare', currentPrice: 17.25, change: 0.9, cmp: 17.25, dma20: 17.10, volume: 1200000 },
  { id: 'etf_037', symbol: 'NSE:HEALTHY', name: 'NIFTY Healthcare ETF', sector: 'Healthcare', currentPrice: 10.85, change: 0.5, cmp: 10.85, dma20: 10.80, volume: 750000 },
  { id: 'etf_038', symbol: 'NSE:HEALTHIETF', name: 'NIFTY Healthcare ETF', sector: 'Healthcare', currentPrice: 112.40, change: 0.7, cmp: 112.40, dma20: 111.60, volume: 65000 },
  { id: 'etf_039', symbol: 'NSE:ITBEES', name: 'NIFTY IT ETF', sector: 'IT', currentPrice: 39.60, change: 2.5, cmp: 39.60, dma20: 38.60, volume: 680000 },
  { id: 'etf_040', symbol: 'NSE:KOTAKIT', name: 'NIFTY IT ETF', sector: 'IT', currentPrice: 39.20, change: 2.1, cmp: 39.20, dma20: 38.40, volume: 420000 },
  { id: 'etf_041', symbol: 'NSE:MON100', name: 'Nasdaq 100 ETF', sector: 'International', currentPrice: 138.50, change: 1.6, cmp: 138.50, dma20: 136.40, volume: 180000 },
  { id: 'etf_042', symbol: 'NSE:MOMOMENTUM', name: 'NIFTY 200 Momentum 30 ETF', sector: 'Momentum', currentPrice: 59.80, change: 1.9, cmp: 59.80, dma20: 58.70, volume: 220000 },
  { id: 'etf_043', symbol: 'NSE:HDFCSML250', name: 'NIFTY Smallcap 250 ETF', sector: 'Smallcap', currentPrice: 152.40, change: 2.3, cmp: 152.40, dma20: 149.00, volume: 280000 },
  { id: 'etf_044', symbol: 'NSE:CONSUMIETF', name: 'NIFTY India Consumption ETF', sector: 'Consumer', currentPrice: 96.80, change: 1.7, cmp: 96.80, dma20: 95.20, volume: 120000 },
  { id: 'etf_045', symbol: 'NSE:CONSUMBEES', name: 'NIFTY India Consumption ETF', sector: 'Consumer', currentPrice: 104.60, change: 1.4, cmp: 104.60, dma20: 103.20, volume: 95000 },
  { id: 'etf_046', symbol: 'NSE:GOLDBEES', name: 'Gold ETF', sector: 'Gold', currentPrice: 55.90, change: 0.3, cmp: 55.90, dma20: 55.70, volume: 380000 },
  { id: 'etf_047', symbol: 'NSE:SETFGOLD', name: 'Gold ETF', sector: 'Gold', currentPrice: 57.80, change: 0.4, cmp: 57.80, dma20: 57.60, volume: 220000 },
  { id: 'etf_048', symbol: 'NSE:KOTAKGOLD', name: 'Gold ETF', sector: 'Gold', currentPrice: 56.40, change: 0.2, cmp: 56.40, dma20: 56.30, volume: 180000 },
  { id: 'etf_049', symbol: 'NSE:MONQ50', name: 'Nasdaq Q-50 ETF', sector: 'International', currentPrice: 61.50, change: 1.8, cmp: 61.50, dma20: 60.40, volume: 85000 },
  { id: 'etf_050', symbol: 'NSE:GOLDIETF', name: 'Gold ETF', sector: 'Gold', currentPrice: 58.20, change: 0.6, cmp: 58.20, dma20: 57.90, volume: 150000 },
  { id: 'etf_051', symbol: 'NSE:SILVERIETF', name: 'Silver ETF', sector: 'Silver', currentPrice: 77.90, change: -0.3, cmp: 77.90, dma20: 78.10, volume: 120000 },
  { id: 'etf_052', symbol: 'NSE:CPSEETF', name: 'CPSE ETF', sector: 'CPSE', currentPrice: 82.40, change: 1.2, cmp: 82.40, dma20: 81.50, volume: 280000 },
  { id: 'etf_053', symbol: 'NSE:BSE500IETF', name: 'S&P BSE 500 ETF', sector: 'BSE', currentPrice: 34.80, change: 1.5, cmp: 34.80, dma20: 34.30, volume: 420000 },
  { id: 'etf_054', symbol: 'NSE:PSUBANK', name: 'NIFTY PSU Bank ETF', sector: 'PSU Bank', currentPrice: 725.60, change: 0.9, cmp: 725.60, dma20: 718.90, volume: 85000 },
  { id: 'etf_055', symbol: 'NSE:ALPHA', name: 'NIFTY Alpha 50 ETF', sector: 'Alpha', currentPrice: 48.90, change: 1.3, cmp: 48.90, dma20: 48.30, volume: 180000 },
  { id: 'etf_056', symbol: 'NSE:SETFNIFBK', name: 'NIFTY Bank ETF', sector: 'Bank', currentPrice: 492.30, change: 0.7, cmp: 492.30, dma20: 489.10, volume: 220000 },
  { id: 'etf_057', symbol: 'NSE:BANKBEES', name: 'NIFTY Bank ETF', sector: 'Bank', currentPrice: 498.40, change: 0.8, cmp: 498.40, dma20: 494.60, volume: 180000 },
  { id: 'etf_058', symbol: 'NSE:HDFCMID150', name: 'NIFTY Midcap 150 ETF', sector: 'Midcap', currentPrice: 18.90, change: 1.6, cmp: 18.90, dma20: 18.60, volume: 850000 },
  { id: 'etf_059', symbol: 'NSE:HDFCSML250', name: 'NIFTY Smallcap 250 ETF', sector: 'Smallcap', currentPrice: 158.70, change: 2.1, cmp: 158.70, dma20: 155.50, volume: 220000 },
  { id: 'etf_060', symbol: 'NSE:BFSI', name: 'NIFTY Financial Services ETF', sector: 'Financial Services', currentPrice: 22.40, change: 1.2, cmp: 22.40, dma20: 22.10, volume: 480000 },
  { id: 'etf_061', symbol: 'NSE:MIDSELIETF', name: 'S&P BSE Midcap Select ETF', sector: 'Midcap', currentPrice: 161.20, change: 1.8, cmp: 161.20, dma20: 158.40, volume: 180000 },
  { id: 'etf_062', symbol: 'NSE:HNGSNGBEES', name: 'Hang Seng ETF', sector: 'International', currentPrice: 278.90, change: 0.9, cmp: 278.90, dma20: 276.50, volume: 85000 },
  { id: 'etf_063', symbol: 'NSE:MAHKTECH', name: 'Hang Seng TECH ETF', sector: 'International', currentPrice: 14.80, change: 1.1, cmp: 14.80, dma20: 14.60, volume: 280000 },
  { id: 'etf_064', symbol: 'NSE:MIDQ50ADD', name: 'NIFTY Midcap 150 Quality 50 ETF', sector: 'Quality', currentPrice: 228.40, change: 1.7, cmp: 228.40, dma20: 224.60, volume: 65000 },
  { id: 'etf_065', symbol: 'NSE:MIDCAPIETF', name: 'NIFTY Midcap 150 ETF', sector: 'Midcap', currentPrice: 20.10, change: 1.9, cmp: 20.10, dma20: 19.70, volume: 680000 },
  { id: 'etf_066', symbol: 'NSE:MOM100', name: 'NIFTY Midcap 100 ETF', sector: 'Midcap', currentPrice: 56.80, change: 2.2, cmp: 56.80, dma20: 55.60, volume: 420000 },
  { id: 'etf_067', symbol: 'NSE:PSUBNKBEES', name: 'NIFTY PSU Bank ETF', sector: 'PSU Bank', currentPrice: 81.20, change: 0.8, cmp: 81.20, dma20: 80.50, volume: 280000 },
  { id: 'etf_068', symbol: 'NSE:PSUBANK', name: 'NIFTY PSU Bank ETF', sector: 'PSU Bank', currentPrice: 740.80, change: 1.1, cmp: 740.80, dma20: 732.50, volume: 65000 },
  { id: 'etf_069', symbol: 'NSE:SILVERBEES', name: 'Silver ETF', sector: 'Silver', currentPrice: 74.60, change: -0.2, cmp: 74.60, dma20: 74.80, volume: 220000 },
  { id: 'etf_070', symbol: 'NSE:SILVERIETF', name: 'Silver ETF', sector: 'Silver', currentPrice: 78.40, change: 0.1, cmp: 78.40, dma20: 78.30, volume: 120000 }
];

// Sample holdings data
const sampleHoldings = [
  {
    "id": "holding_036",
    "symbol": "NSE:HDFCPVTBAN",
    "name": "Nifty Private Bank Index",
    "sector": "Banking",
    "buyDate": "2025-Jul-29",
    "buyPrice": 27.54,
    "quantity": 500,
    "totalInvested": 13770,
    "avgPrice": 27.54,
    "currentPrice": 27.17,
    "currentValue": 13585,
    "profitLoss": -185,
    "profitPercentage": -1.3435003631082063,
    "lastBuyPrice": 27.54,
    "lastBuyDate": "2025-Jul-29"
  },
  {
    "id": "holding_035",
    "symbol": "NSE:HDFCSML250",
    "name": "NIFTY Smallcap 250 ETF",
    "sector": "Smallcap",
    "buyDate": "2025-Jul-28",
    "buyPrice": 174.6,
    "quantity": 102,
    "totalInvested": 17809,
    "avgPrice": 174.6,
    "currentPrice": 170.39,
    "currentValue": 17379.78,
    "profitLoss": -429.22,
    "profitPercentage": -2.4110000000000003,
    "lastBuyPrice": 174.6,
    "lastBuyDate": "2025-Jul-28"
  },
  {
    "id": "holding_034",
    "symbol": "NSE:NIFTYQLITY",
    "name": "Nifty 200 Quality 30 ETF",
    "sector": "Quality",
    "buyDate": "2025-Jul-24",
    "buyPrice": 21.25,
    "quantity": 882,
    "totalInvested": 18743,
    "avgPrice": 21.25,
    "currentPrice": 20.86,
    "currentValue": 18398.52,
    "profitLoss": -344.48,
    "profitPercentage": -1.84,
    "lastBuyPrice": 21.25,
    "lastBuyDate": "2025-Jul-24"
  },
  {
    "id": "holding_033",
    "symbol": "NSE:DIVOPPBEES",
    "name": "Nifty Dividend Opportunities 50 TRI",
    "sector": "Dividend",
    "buyDate": "2025-Jul-22",
    "buyPrice": 78.62,
    "quantity": 254,
    "totalInvested": 19969,
    "avgPrice": 78.62,
    "currentPrice": 76.24,
    "currentValue": 19364.96,
    "profitLoss": -604.04,
    "profitPercentage": -3.03,
    "lastBuyPrice": 78.62,
    "lastBuyDate": "2025-Jul-22"
  },
  {
    "id": "holding_032",
    "symbol": "NSE:ITBEES",
    "name": "NIFTY IT Index",
    "sector": "IT",
    "buyDate": "2025-Jul-16",
    "buyPrice": 41.0,
    "quantity": 365,
    "totalInvested": 14965,
    "avgPrice": 41.0,
    "currentPrice": 38.0,
    "currentValue": 13870,
    "profitLoss": -1095,
    "profitPercentage": -7.32,
    "lastBuyPrice": 41.0,
    "lastBuyDate": "2025-Jul-16"
  },
  {
    "id": "holding_031",
    "symbol": "NSE:ITIETF",
    "name": "NIFTY IT Index",
    "sector": "IT",
    "buyDate": "2025-Jul-14",
    "buyPrice": 40.3,
    "quantity": 335,
    "totalInvested": 13501,
    "avgPrice": 40.3,
    "currentPrice": 37.8,
    "currentValue": 12663,
    "profitLoss": -838,
    "profitPercentage": -6.2,
    "lastBuyPrice": 40.3,
    "lastBuyDate": "2025-Jul-14"
  },
  {
    "id": "holding_030",
    "symbol": "NSE:MOM30IETF",
    "name": "Nifty 200 Momentum 30 ETF",
    "sector": "Momentum",
    "buyDate": "2025-Jul-07",
    "buyPrice": 32.0,
    "quantity": 588,
    "totalInvested": 18816,
    "avgPrice": 32.0,
    "currentPrice": 30.55,
    "currentValue": 17963.4,
    "profitLoss": -852.6,
    "profitPercentage": -4.53,
    "lastBuyPrice": 32.0,
    "lastBuyDate": "2025-Jul-07"
  },
  {
    "id": "holding_029",
    "symbol": "NSE:MOMOMENTUM",
    "name": "Nifty 200 Momentum 30 Total Return Index",
    "sector": "Momentum",
    "buyDate": "2025-Jul-04",
    "buyPrice": 63.85,
    "quantity": 221,
    "totalInvested": 14111,
    "avgPrice": 63.85,
    "currentPrice": 61.07,
    "currentValue": 13496.47,
    "profitLoss": -614.53,
    "profitPercentage": -4.35,
    "lastBuyPrice": 63.85,
    "lastBuyDate": "2025-Jul-04"
  },
  {
    "id": "holding_028",
    "symbol": "NSE:SETFGOLD",
    "name": "Gold",
    "sector": "Gold",
    "buyDate": "2025-Jul-03",
    "buyPrice": 83.67,
    "quantity": 200,
    "totalInvested": 16734,
    "avgPrice": 83.67,
    "currentPrice": 84.41,
    "currentValue": 16882,
    "profitLoss": 148,
    "profitPercentage": 0.88,
    "lastBuyPrice": 83.67,
    "lastBuyDate": "2025-Jul-03"
  },
  {
    "id": "holding_027",
    "symbol": "NSE:GOLD1",
    "name": "Gold",
    "sector": "Gold",
    "buyDate": "2025-Jul-02",
    "buyPrice": 81.55,
    "quantity": 210,
    "totalInvested": 17126,
    "avgPrice": 81.55,
    "currentPrice": 82.42,
    "currentValue": 17308.2,
    "profitLoss": 182.2,
    "profitPercentage": 1.07,
    "lastBuyPrice": 81.55,
    "lastBuyDate": "2025-Jul-02"
  },
  {
    "id": "holding_026",
    "symbol": "NSE:GOLDBEES",
    "name": "Gold",
    "sector": "Gold",
    "buyDate": "2025-Jun-30",
    "buyPrice": 79.65,
    "quantity": 265,
    "totalInvested": 21107,
    "avgPrice": 79.65,
    "currentPrice": 81.85,
    "currentValue": 21690.25,
    "profitLoss": 583.25,
    "profitPercentage": 2.76,
    "lastBuyPrice": 79.65,
    "lastBuyDate": "2025-Jun-30"
  },
  {
    "id": "holding_025",
    "symbol": "NSE:NV20IETF",
    "name": "Nifty50 Value 20",
    "sector": "Value",
    "buyDate": "2025-Jun-03",
    "buyPrice": 14.37,
    "quantity": 1100,
    "totalInvested": 15807,
    "avgPrice": 14.37,
    "currentPrice": 14.14,
    "currentValue": 15554,
    "profitLoss": -253,
    "profitPercentage": -1.6,
    "lastBuyPrice": 14.37,
    "lastBuyDate": "2025-Jun-03"
  },
  {
    "id": "holding_024",
    "symbol": "NSE:IT",
    "name": "NIFTY IT Index",
    "sector": "IT",
    "buyDate": "2025-Feb-24",
    "buyPrice": 42.29,
    "quantity": 380,
    "totalInvested": 16070,
    "avgPrice": 42.29,
    "currentPrice": 37.91,
    "currentValue": 14405.8,
    "profitLoss": -1664.2,
    "profitPercentage": -10.36,
    "lastBuyPrice": 42.29,
    "lastBuyDate": "2025-Feb-24"
  },
  {
    "id": "holding_023",
    "symbol": "NSE:HEALTHY",
    "name": "Nifty Healthcare TRI",
    "sector": "Healthcare",
    "buyDate": "2024-Dec-12",
    "buyPrice": 14.68,
    "quantity": 1150,
    "totalInvested": 16882,
    "avgPrice": 14.68,
    "currentPrice": 14.92,
    "currentValue": 17158,
    "profitLoss": 276,
    "profitPercentage": 1.63,
    "lastBuyPrice": 14.68,
    "lastBuyDate": "2024-Dec-12"
  },
  {
    "id": "holding_022",
    "symbol": "NSE:NEXT50IETF",
    "name": "Nifty Next 50",
    "sector": "Next 50",
    "buyDate": "2024-Oct-23",
    "buyPrice": 73.3,
    "quantity": 185,
    "totalInvested": 13561,
    "avgPrice": 73.3,
    "currentPrice": 69.4,
    "currentValue": 12839,
    "profitLoss": -722,
    "profitPercentage": -5.32,
    "lastBuyPrice": 73.3,
    "lastBuyDate": "2024-Oct-23"
  },
  {
    "id": "holding_021",
    "symbol": "NSE:ALPHA",
    "name": "NIFTY Alpha 50 Index",
    "sector": "Alpha",
    "buyDate": "2025-Jun-18",
    "buyPrice": 50.3,
    "quantity": 300,
    "totalInvested": 15090,
    "avgPrice": 52.54,
    "currentPrice": 49.6,
    "currentValue": 14880,
    "profitLoss": -210,
    "profitPercentage": -1.39,
    "lastBuyPrice": 50.3,
    "lastBuyDate": "2025-Jun-18"
  },
  {
    "id": "holding_020",
    "symbol": "NSE:ALPHA",
    "name": "NIFTY Alpha 50 Index",
    "sector": "Alpha",
    "buyDate": "2024-Oct-22",
    "buyPrice": 54.85,
    "quantity": 290,
    "totalInvested": 15907,
    "avgPrice": 54.85,
    "currentPrice": 49.6,
    "currentValue": 14384,
    "profitLoss": -1523,
    "profitPercentage": -9.58,
    "lastBuyPrice": 54.85,
    "lastBuyDate": "2024-Oct-22"
  },
  {
    "id": "holding_019",
    "symbol": "NSE:CONSUMBEES",
    "name": "Nifty India Consumption Index",
    "sector": "Consumer",
    "buyDate": "2024-Oct-18",
    "buyPrice": 133.0,
    "quantity": 113,
    "totalInvested": 15029,
    "avgPrice": 133.0,
    "currentPrice": 129.69,
    "currentValue": 14654.97,
    "profitLoss": -374.03,
    "profitPercentage": -2.49,
    "lastBuyPrice": 133.0,
    "lastBuyDate": "2024-Oct-18"
  },
  {
    "id": "holding_018",
    "symbol": "NSE:AUTOBEES",
    "name": "Nifty Auto TRI",
    "sector": "Auto",
    "buyDate": "2024-Oct-17",
    "buyPrice": 256.5,
    "quantity": 62,
    "totalInvested": 15903,
    "avgPrice": 256.5,
    "currentPrice": 241.0,
    "currentValue": 14942,
    "profitLoss": -961,
    "profitPercentage": -6.04,
    "lastBuyPrice": 256.5,
    "lastBuyDate": "2024-Oct-17"
  },
  {
    "id": "holding_017",
    "symbol": "NSE:CONSUMIETF",
    "name": "Nifty India Consumption Index",
    "sector": "Consumer",
    "buyDate": "2024-Oct-16",
    "buyPrice": 127.0,
    "quantity": 140,
    "totalInvested": 17780,
    "avgPrice": 127.0,
    "currentPrice": 120.33,
    "currentValue": 16846.2,
    "profitLoss": -933.8,
    "profitPercentage": -5.25,
    "lastBuyPrice": 127.0,
    "lastBuyDate": "2024-Oct-16"
  },
  {
    "id": "holding_016",
    "symbol": "NSE:LOWVOLIETF",
    "name": "Nifty 100 Low Volatility 30 Index",
    "sector": "Low Volatility",
    "buyDate": "2024-Oct-15",
    "buyPrice": 22.6,
    "quantity": 620,
    "totalInvested": 14012,
    "avgPrice": 22.6,
    "currentPrice": 21.6,
    "currentValue": 13392,
    "profitLoss": -620,
    "profitPercentage": -4.42,
    "lastBuyPrice": 22.6,
    "lastBuyDate": "2024-Oct-15"
  },
  {
    "id": "holding_015",
    "symbol": "NSE:LOWVOL1",
    "name": "Nifty 100 Low Vol 30 ETF",
    "sector": "Low Volatility",
    "buyDate": "2024-Oct-10",
    "buyPrice": 21.4,
    "quantity": 861,
    "totalInvested": 18425,
    "avgPrice": 21.4,
    "currentPrice": 20.6,
    "currentValue": 17736.6,
    "profitLoss": -688.4,
    "profitPercentage": -3.74,
    "lastBuyPrice": 21.4,
    "lastBuyDate": "2024-Oct-10"
  },
  {
    "id": "holding_014",
    "symbol": "NSE:FMCGIETF",
    "name": "Nifty FMCG Index",
    "sector": "FMCG",
    "buyDate": "2025-Jun-09",
    "buyPrice": 59.55,
    "quantity": 251,
    "totalInvested": 14947,
    "avgPrice": 62.54,
    "currentPrice": 60.0,
    "currentValue": 15060,
    "profitLoss": 113,
    "profitPercentage": 0.76,
    "lastBuyPrice": 59.55,
    "lastBuyDate": "2025-Jun-09"
  },
  {
    "id": "holding_013",
    "symbol": "NSE:FMCGIETF",
    "name": "Nifty FMCG Index",
    "sector": "FMCG",
    "buyDate": "2024-Oct-09",
    "buyPrice": 65.65,
    "quantity": 241,
    "totalInvested": 15822,
    "avgPrice": 65.65,
    "currentPrice": 60.0,
    "currentValue": 14460,
    "profitLoss": -1362,
    "profitPercentage": -8.6,
    "lastBuyPrice": 65.65,
    "lastBuyDate": "2024-Oct-09"
  },
  {
    "id": "holding_012",
    "symbol": "NSE:MIDSELIETF",
    "name": "S&P BSE Midcap Select Index",
    "sector": "Midcap",
    "buyDate": "2024-Oct-03",
    "buyPrice": 18.7,
    "quantity": 950,
    "totalInvested": 17765,
    "avgPrice": 18.7,
    "currentPrice": 17.11,
    "currentValue": 16254.5,
    "profitLoss": -1510.5,
    "profitPercentage": -8.5,
    "lastBuyPrice": 18.7,
    "lastBuyDate": "2024-Oct-03"
  },
  {
    "id": "holding_011",
    "symbol": "NSE:NV20",
    "name": "Nifty50 Value 20",
    "sector": "Value",
    "buyDate": "2025-May-13",
    "buyPrice": 148.3,
    "quantity": 120,
    "totalInvested": 17796,
    "avgPrice": 155.32,
    "currentPrice": 143.89,
    "currentValue": 17266.8,
    "profitLoss": -529.2,
    "profitPercentage": -2.97,
    "lastBuyPrice": 148.3,
    "lastBuyDate": "2025-May-13"
  },
  {
    "id": "holding_010",
    "symbol": "NSE:NV20",
    "name": "Nifty50 Value 20",
    "sector": "Value",
    "buyDate": "2024-Oct-01",
    "buyPrice": 164.0,
    "quantity": 97,
    "totalInvested": 15908,
    "avgPrice": 164.0,
    "currentPrice": 143.89,
    "currentValue": 13957.33,
    "profitLoss": -1950.67,
    "profitPercentage": -12.26,
    "lastBuyPrice": 164.0,
    "lastBuyDate": "2024-Oct-01"
  },
  {
    "id": "holding_009",
    "symbol": "NSE:PHARMABEES",
    "name": "Nifty Pharma TRI",
    "sector": "Healthcare",
    "buyDate": "2024-Sep-25",
    "buyPrice": 23.63,
    "quantity": 812,
    "totalInvested": 19188,
    "avgPrice": 23.63,
    "currentPrice": 22.8,
    "currentValue": 18513.6,
    "profitLoss": -674.4,
    "profitPercentage": -3.51,
    "lastBuyPrice": 23.63,
    "lastBuyDate": "2024-Sep-25"
  },
  {
    "id": "holding_008",
    "symbol": "NSE:HDFCMID150",
    "name": "Nifty Midcap 150",
    "sector": "Midcap",
    "buyDate": "2024-Sep-02",
    "buyPrice": 22.0,
    "quantity": 675,
    "totalInvested": 14850,
    "avgPrice": 22.0,
    "currentPrice": 21.3,
    "currentValue": 14377.5,
    "profitLoss": -472.5,
    "profitPercentage": -3.18,
    "lastBuyPrice": 22.0,
    "lastBuyDate": "2024-Sep-02"
  },
  {
    "id": "holding_007",
    "symbol": "NSE:CPSEETF",
    "name": "CPSE ETF",
    "sector": "CPSE",
    "buyDate": "2024-Dec-11",
    "buyPrice": 92.32,
    "quantity": 201,
    "totalInvested": 18556,
    "avgPrice": 96.97,
    "currentPrice": 89.65,
    "currentValue": 18019.65,
    "profitLoss": -536.35,
    "profitPercentage": -2.89,
    "lastBuyPrice": 92.32,
    "lastBuyDate": "2024-Dec-11"
  },
  {
    "id": "holding_006",
    "symbol": "NSE:CPSEETF",
    "name": "CPSE ETF",
    "sector": "CPSE",
    "buyDate": "2024-Aug-22",
    "buyPrice": 102.46,
    "quantity": 170,
    "totalInvested": 17418,
    "avgPrice": 102.46,
    "currentPrice": 102.46,
    "currentValue": 17418.2,
    "profitLoss": 0.2000000000007276,
    "profitPercentage": 0.0011482374555099757,
    "lastBuyPrice": 102.46,
    "lastBuyDate": "2024-Aug-22"
  },
  {
    "id": "holding_005",
    "symbol": "NSE:PSUBNKIETF",
    "name": "Nifty PSU Bank",
    "sector": "Banking",
    "buyDate": "2024-Jul-08",
    "buyPrice": 73.5,
    "quantity": 220,
    "totalInvested": 16170,
    "avgPrice": 74.23,
    "currentPrice": 69.25,
    "currentValue": 15235,
    "profitLoss": -935,
    "profitPercentage": -5.78,
    "lastBuyPrice": 73.5,
    "lastBuyDate": "2024-Jul-08"
  },
  {
    "id": "holding_004",
    "symbol": "NSE:PSUBNKIETF",
    "name": "Nifty PSU Bank",
    "sector": "Banking",
    "buyDate": "2024-Jul-01",
    "buyPrice": 74.5,
    "quantity": 213,
    "totalInvested": 15869,
    "avgPrice": 74.5,
    "currentPrice": 69.25,
    "currentValue": 14750.25,
    "profitLoss": -1118.75,
    "profitPercentage": -7.05,
    "lastBuyPrice": 74.5,
    "lastBuyDate": "2024-Jul-01"
  },
  {
    "id": "holding_003",
    "symbol": "NSE:PSUBNKIETF",
    "name": "Nifty PSU Bank",
    "sector": "Banking",
    "buyDate": "2024-Jun-21",
    "buyPrice": 74.75,
    "quantity": 203,
    "totalInvested": 15174,
    "avgPrice": 74.75,
    "currentPrice": 69.25,
    "currentValue": 14057.75,
    "profitLoss": -1116.25,
    "profitPercentage": -7.35,
    "lastBuyPrice": 74.75,
    "lastBuyDate": "2024-Jun-21"
  },
  {
    "id": "holding_002",
    "symbol": "NSE:PSUBNKBEES",
    "name": "Nifty PSU Bank",
    "sector": "Banking",
    "buyDate": "2024-Jun-07",
    "buyPrice": 80.5,
    "quantity": 180,
    "totalInvested": 14490,
    "avgPrice": 80.5,
    "currentPrice": 72.50,
    "currentValue": 13050,
    "profitLoss": -1440,
    "profitPercentage": -9.94,
    "lastBuyPrice": 80.5,
    "lastBuyDate": "2024-Jun-07"
  },
  {
    "id": "holding_001",
    "symbol": "NSE:PSUBANK",
    "name": "Nifty PSU Bank",
    "sector": "Banking",
    "buyDate": "2024-Jun-06",
    "buyPrice": 721,
    "quantity": 20,
    "totalInvested": 14420,
    "avgPrice": 721,
    "currentPrice": 685,
    "currentValue": 13700,
    "profitLoss": -720,
    "profitPercentage": -4.99,
    "lastBuyPrice": 721,
    "lastBuyDate": "2024-Jun-06"
  }
];



// Initial state
const initialState = {
  holdings: sampleHoldings,
  soldItems: sampleSoldItems,
  etfs: sampleETFs,
  strategy: {
    profitTarget: 6,
    averagingThreshold: 2.5,
    maxEtfsPerSector: 3,
    dailySellLimit: 1 // Only one ETF per day
  },
  livePrices: {},
  marketStatus: false,
  lastPriceUpdate: null,
  dailySellCount: 0,
  lastSellDate: null,
  // New trading state
  pendingOrders: [],
  orderHistory: [],
  accountDetails: null,
  isTradingEnabled: false,
  tradingStatus: 'idle', // idle, loading, success, error
  tradingMessage: '' // Ensure this is always a string
};

// Action types
const actionTypes = {
  ADD_HOLDING: 'ADD_HOLDING',
  UPDATE_HOLDING: 'UPDATE_HOLDING',
  REMOVE_HOLDING: 'REMOVE_HOLDING',
  ADD_SOLD_ITEM: 'ADD_SOLD_ITEM',
  UPDATE_STRATEGY: 'UPDATE_STRATEGY',
  LOAD_DATA: 'LOAD_DATA',
  UPDATE_LIVE_PRICES: 'UPDATE_LIVE_PRICES',
  SET_MARKET_STATUS: 'SET_MARKET_STATUS',
  SET_DAILY_SELL_LIMIT: 'SET_DAILY_SELL_LIMIT',
  RESET_DAILY_SELL_LIMIT: 'RESET_DAILY_SELL_LIMIT',
  // New trading action types
  SET_TRADING_STATUS: 'SET_TRADING_STATUS',
  ADD_PENDING_ORDER: 'ADD_PENDING_ORDER',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  REMOVE_PENDING_ORDER: 'REMOVE_PENDING_ORDER',
  ADD_ORDER_TO_HISTORY: 'ADD_ORDER_TO_HISTORY',
  SET_ACCOUNT_DETAILS: 'SET_ACCOUNT_DETAILS',
  SET_TRADING_ENABLED: 'SET_TRADING_ENABLED',
  FETCH_ORDER_HISTORY: 'FETCH_ORDER_HISTORY'
};

// Reducer function
const etfTradingReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_HOLDING:
      return {
        ...state,
        holdings: [...state.holdings, action.payload]
      };
    
    case actionTypes.UPDATE_HOLDING:
      return {
        ...state,
        holdings: state.holdings.map(holding =>
          holding.id === action.payload.id ? action.payload : holding
        )
      };
    
    case actionTypes.REMOVE_HOLDING:
      return {
        ...state,
        holdings: state.holdings.filter(holding => holding.id !== action.payload)
      };
    
    case actionTypes.ADD_SOLD_ITEM:
      return {
        ...state,
        soldItems: [...state.soldItems, action.payload],
        dailySellCount: state.dailySellCount + 1,
        lastSellDate: new Date().toISOString().split('T')[0]
      };
    
    case actionTypes.UPDATE_STRATEGY:
      return {
        ...state,
        strategy: { ...state.strategy, ...action.payload }
      };
    
    case actionTypes.UPDATE_LIVE_PRICES:
      return {
        ...state,
        livePrices: { ...state.livePrices, ...action.payload },
        lastPriceUpdate: new Date().toISOString()
      };
    
    case actionTypes.SET_MARKET_STATUS:
      return {
        ...state,
        marketStatus: action.payload
      };
    
    case actionTypes.SET_DAILY_SELL_LIMIT:
      return {
        ...state,
        dailySellCount: action.payload
      };
    
    case actionTypes.RESET_DAILY_SELL_LIMIT:
      return {
        ...state,
        dailySellCount: 0,
        lastSellDate: null
      };
    
    case actionTypes.LOAD_DATA:
      // Ensure tradingMessage is always a string
      let safeTradingMessage = '';
      if (action.payload.tradingMessage) {
        if (typeof action.payload.tradingMessage === 'string') {
          safeTradingMessage = action.payload.tradingMessage;
        } else if (typeof action.payload.tradingMessage === 'object') {
          safeTradingMessage = JSON.stringify(action.payload.tradingMessage);
        } else {
          safeTradingMessage = String(action.payload.tradingMessage);
        }
      }
      
      return {
        ...state,
        ...action.payload,
        tradingMessage: safeTradingMessage
      };
    
    // New trading cases
    case actionTypes.SET_TRADING_STATUS:
      // Debug logging to see what's being passed
      console.log('SET_TRADING_STATUS payload:', action.payload);
      console.log('Message type:', typeof action.payload.message);
      console.log('Message value:', action.payload.message);
      
      let safeMessage = '';
      
      if (typeof action.payload.message === 'string') {
        safeMessage = action.payload.message;
      } else if (action.payload.message && typeof action.payload.message === 'object') {
        safeMessage = JSON.stringify(action.payload.message);
      } else if (action.payload.message) {
        safeMessage = String(action.payload.message);
      } else {
        safeMessage = '';
      }
      
      console.log('Safe message:', safeMessage);
      
      return {
        ...state,
        tradingStatus: action.payload.status,
        tradingMessage: safeMessage
      };
    
    case actionTypes.ADD_PENDING_ORDER:
      return {
        ...state,
        pendingOrders: [...state.pendingOrders, action.payload]
      };
    
    case actionTypes.UPDATE_ORDER_STATUS:
      return {
        ...state,
        pendingOrders: state.pendingOrders.map(order =>
          order.orderId === action.payload.orderId
            ? { ...order, ...action.payload }
            : order
        )
      };
    
    case actionTypes.REMOVE_PENDING_ORDER:
      return {
        ...state,
        pendingOrders: state.pendingOrders.filter(order => order.orderId !== action.payload)
      };
    
    case actionTypes.ADD_ORDER_TO_HISTORY:
      return {
        ...state,
        orderHistory: [...state.orderHistory, action.payload]
      };
    
    case actionTypes.SET_ACCOUNT_DETAILS:
      return {
        ...state,
        accountDetails: action.payload
      };
    
    case actionTypes.SET_TRADING_ENABLED:
      return {
        ...state,
        isTradingEnabled: action.payload
      };
    
    case actionTypes.FETCH_ORDER_HISTORY:
      return {
        ...state,
        orderHistory: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const ETFTradingContext = createContext();

// Provider component
export const ETFTradingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(etfTradingReducer, initialState);

    // Load data from localStorage on mount
  useEffect(() => {
    console.log('🔍 Checking for object tradingMessage...');
    console.log('Current state.tradingMessage:', state.tradingMessage);
    console.log('Type of tradingMessage:', typeof state.tradingMessage);
    
    // Force clear any cached tradingMessage that might be an object
    if (state.tradingMessage && typeof state.tradingMessage === 'object') {
      console.log('❌ Found object tradingMessage, clearing it:', state.tradingMessage);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'idle', message: '' } 
      });
    }
    
    // Clear any problematic data and start fresh
    console.log('🧹 Clearing localStorage...');
    localStorage.removeItem('etfTradingData');
    
    // Load data from localStorage (if any)
    const savedData = localStorage.getItem('etfTradingData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📦 Loaded data:', parsedData);
        // Ensure tradingMessage is always a string in loaded data
        if (parsedData.tradingMessage && typeof parsedData.tradingMessage === 'object') {
          console.log('🔄 Converting object tradingMessage to string:', parsedData.tradingMessage);
          parsedData.tradingMessage = JSON.stringify(parsedData.tradingMessage);
        }
        dispatch({ type: actionTypes.LOAD_DATA, payload: parsedData });
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    } else {
      console.log('📭 No saved data found in localStorage');
    }
  }, []);

  // Force tradingMessage to always be a string on every render
  useEffect(() => {
    if (state.tradingMessage && typeof state.tradingMessage === 'object') {
      console.log('🚨 EMERGENCY: Found object tradingMessage in render, fixing immediately:', state.tradingMessage);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'idle', message: JSON.stringify(state.tradingMessage) } 
      });
    }
  });

  // Save data to localStorage whenever state changes (only in real mode)
  useEffect(() => {
    const isDemoMode = true; // Demo mode is enabled
    
    if (!isDemoMode) {
      localStorage.setItem('etfTradingData', JSON.stringify(state));
    }
  }, [state]);

  // Reset daily sell limit if it's a new day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastSellDate && state.lastSellDate !== today) {
      dispatch({ type: actionTypes.RESET_DAILY_SELL_LIMIT });
    }
  }, [state.lastSellDate]);

  // Fetch live prices periodically
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        // Get unique symbols from holdings
        const symbols = [...new Set(state.holdings.map(h => h.symbol))];
        
        if (symbols.length > 0) {
          const livePrices = await mstocksApiService.getLivePrices(symbols);
          dispatch({ type: actionTypes.UPDATE_LIVE_PRICES, payload: livePrices });
          
          // Update holdings with live prices
          const updatedHoldings = state.holdings.map(holding => {
            const livePrice = livePrices[holding.symbol];
            if (livePrice && livePrice.currentPrice) {
              return {
                ...holding,
                currentPrice: livePrice.currentPrice
              };
            }
            return holding;
          });
          
          // Update holdings in state
          updatedHoldings.forEach(holding => {
            dispatch({ type: actionTypes.UPDATE_HOLDING, payload: holding });
          });
        }
      } catch (error) {
        console.error('Error fetching live prices:', error);
      }
    };

    // Fetch prices immediately
    fetchLivePrices();

    // Set up interval for periodic updates (every 2 minutes during market hours)
    const interval = setInterval(() => {
      if (state.marketStatus) {
        fetchLivePrices();
      }
    }, 120000); // Changed from 30000 to 120000

    return () => clearInterval(interval);
  }, [state.holdings, state.marketStatus]);

  // Check market status periodically
  useEffect(() => {
    const checkMarketStatus = async () => {
      try {
        const isOpen = await mstocksApiService.getMarketStatus();
        dispatch({ type: actionTypes.SET_MARKET_STATUS, payload: isOpen });
      } catch (error) {
        console.error('Error checking market status:', error);
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate derived values
  const totalInvested = state.holdings.reduce((total, holding) => {
    return total + (holding.avgPrice * holding.quantity);
  }, 0);

  const totalProfit = state.soldItems.reduce((total, item) => {
    return total + item.profit;
  }, 0);

  const targetProfit = state.strategy.profitTarget;

  // Smart selling logic - prioritize by absolute profit amount
  const getSmartSellRecommendation = () => {
    const readyToSell = state.holdings.filter(holding => {
      if (!holding.currentPrice || !holding.buyPrice) return false;
      const profitPercent = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
      return profitPercent >= targetProfit;
    });

    if (readyToSell.length === 0) return null;

    // Calculate absolute profit for each holding
    const holdingsWithProfit = readyToSell.map(holding => {
      const profitPercent = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
      const absoluteProfit = (holding.currentPrice - holding.buyPrice) * holding.quantity;
      
      return {
        ...holding,
        profitPercent,
        absoluteProfit
      };
    });

    // Sort by absolute profit (highest first)
    holdingsWithProfit.sort((a, b) => b.absoluteProfit - a.absoluteProfit);

    return holdingsWithProfit[0]; // Return the one with highest absolute profit
  };

  // Check if we can sell today
  const canSellToday = () => {
    return state.dailySellCount < state.strategy.dailySellLimit;
  };

  // Trading functions
  const placeBuyOrder = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing buy order...' } 
      });

      const result = await mstocksApiService.placeBuyOrder(orderData);
      
      // Add to pending orders
      const pendingOrder = {
        ...result,
        type: 'BUY',
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
      
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'success', message: `Buy order placed successfully! Order ID: ${result.orderId}` } 
      });

      return result;
    } catch (error) {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: error.message } 
      });
      throw error;
    }
  };

  const placeSellOrder = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing sell order...' } 
      });

      const result = await mstocksApiService.placeSellOrder(orderData);
      
      // Add to pending orders
      const pendingOrder = {
        ...result,
        type: 'SELL',
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: actionTypes.ADD_PENDING_ORDER, payload: pendingOrder });
      
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'success', message: `Sell order placed successfully! Order ID: ${result.orderId}` } 
      });

      return result;
    } catch (error) {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: error.message } 
      });
      throw error;
    }
  };

  // New lifecycle management functions
  const placeBuyOrderWithLifecycle = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing buy order and managing lifecycle...' } 
      });
      
      const result = await mstocksApiService.placeBuyOrderWithLifecycle(orderData);
      
      if (result.success && result.holdingEntry) {
        // Add the new holding to the state
        dispatch({ type: actionTypes.ADD_HOLDING, payload: result.holdingEntry });
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'success', message: 'Buy order completed and added to holdings!' } 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'warning', message: result.message } 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in buy order lifecycle:', error);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: `Error in buy order lifecycle: ${error.message}` } 
      });
      throw error;
    }
  };

  const placeSellOrderWithLifecycle = async (orderData) => {
    try {
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'loading', message: 'Placing sell order and managing lifecycle...' } 
      });
      
      const result = await mstocksApiService.placeSellOrderWithLifecycle(orderData);
      
      if (result.success && result.soldItemEntry) {
        // Remove the holding from state
        if (orderData.holdingId) {
          dispatch({ type: actionTypes.REMOVE_HOLDING, payload: orderData.holdingId });
        }
        
        // Add the sold item to sold items
        dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: result.soldItemEntry });
        
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'success', message: 'Sell order completed and processed!' } 
        });
      } else {
        dispatch({ 
          type: actionTypes.SET_TRADING_STATUS, 
          payload: { status: 'warning', message: result.message } 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in sell order lifecycle:', error);
      dispatch({ 
        type: actionTypes.SET_TRADING_STATUS, 
        payload: { status: 'error', message: `Error in sell order lifecycle: ${error.message}` } 
      });
      throw error;
    }
  };

  const checkOrderStatus = async (orderId) => {
    try {
      const status = await mstocksApiService.getOrderStatus(orderId);
      
      dispatch({ type: actionTypes.UPDATE_ORDER_STATUS, payload: status });
      
      // If order is complete, move to history and update holdings
      if (status.status === 'COMPLETE') {
        const pendingOrder = state.pendingOrders.find(order => order.orderId === orderId);
        if (pendingOrder) {
          // Move to order history
          dispatch({ type: actionTypes.ADD_ORDER_TO_HISTORY, payload: pendingOrder });
          dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: orderId });
          
          // Update holdings based on order type
          if (pendingOrder.type === 'BUY') {
            // Add new holding
            const newHolding = {
              id: `holding_${Date.now()}`,
              symbol: pendingOrder.symbol,
              name: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.name || pendingOrder.symbol,
              sector: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.sector || 'Unknown',
              buyDate: new Date().toISOString().split('T')[0],
              buyPrice: status.averagePrice || pendingOrder.price,
              quantity: status.filledQuantity || pendingOrder.quantity,
              totalInvested: (status.averagePrice || pendingOrder.price) * (status.filledQuantity || pendingOrder.quantity),
              avgPrice: status.averagePrice || pendingOrder.price,
              currentPrice: status.averagePrice || pendingOrder.price,
              currentValue: (status.averagePrice || pendingOrder.price) * (status.filledQuantity || pendingOrder.quantity),
              profitLoss: 0,
              profitPercentage: 0,
              lastBuyPrice: status.averagePrice || pendingOrder.price,
              lastBuyDate: new Date().toISOString().split('T')[0]
            };
            dispatch({ type: actionTypes.ADD_HOLDING, payload: newHolding });
          } else if (pendingOrder.type === 'SELL') {
            // Add to sold items
            const soldItem = {
              id: `sold_${Date.now()}`,
              symbol: pendingOrder.symbol,
              name: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.name || pendingOrder.symbol,
              sector: state.etfs.find(etf => etf.symbol === pendingOrder.symbol)?.sector || 'Unknown',
              buyDate: new Date().toISOString().split('T')[0], // This should come from the original holding
              sellDate: new Date().toISOString().split('T')[0],
              buyPrice: 0, // This should come from the original holding
              sellPrice: status.averagePrice || pendingOrder.price,
              quantity: status.filledQuantity || pendingOrder.quantity,
              profit: 0, // This should be calculated from original holding
              reason: 'Target achieved'
            };
            dispatch({ type: actionTypes.ADD_SOLD_ITEM, payload: soldItem });
          }
        }
      }
      
      return status;
    } catch (error) {
      console.error('Error checking order status:', error);
      throw error;
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const result = await mstocksApiService.cancelOrder(orderId);
      dispatch({ type: actionTypes.REMOVE_PENDING_ORDER, payload: orderId });
      return result;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  const fetchAccountDetails = async () => {
    try {
      const details = await mstocksApiService.getAccountDetails();
      dispatch({ type: actionTypes.SET_ACCOUNT_DETAILS, payload: details });
      return details;
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  };

  const checkTradingEnabled = () => {
    const isEnabled = mstocksApiService.isConfigured();
    dispatch({ type: actionTypes.SET_TRADING_ENABLED, payload: isEnabled });
    return isEnabled;
  };

  const fetchOrderHistory = async () => {
    try {
      const history = await mstocksApiService.getOrderHistory();
      dispatch({ type: actionTypes.FETCH_ORDER_HISTORY, payload: history });
      return history;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  };

  const fetchBrokerHoldings = async () => {
    try {
      const brokerHoldings = await mstocksApiService.getBrokerHoldings();
      console.log('Broker holdings fetched:', brokerHoldings);
      return brokerHoldings;
    } catch (error) {
      console.error('Error fetching broker holdings:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    totalInvested,
    totalProfit,
    targetProfit,
    dispatch,
    actionTypes,
    getSmartSellRecommendation,
    canSellToday,
    // Trading functions
    placeBuyOrder,
    placeSellOrder,
    placeBuyOrderWithLifecycle,
    placeSellOrderWithLifecycle,
    checkOrderStatus,
    cancelOrder,
    fetchAccountDetails,
    checkTradingEnabled,
    mstocksApi: mstocksApiService,
    fetchLivePrices: async () => {
      try {
        const symbols = [...new Set(state.holdings.map(h => h.symbol))];
        const livePrices = await mstocksApiService.getLivePrices(symbols);
        dispatch({ type: actionTypes.UPDATE_LIVE_PRICES, payload: livePrices });
        return livePrices;
      } catch (error) {
        console.error('Error fetching live prices:', error);
        return {};
      }
    },
    fetchOrderHistory,
    fetchBrokerHoldings
  };

  return (
    <ETFTradingContext.Provider value={value}>
      {children}
    </ETFTradingContext.Provider>
  );
};

// Custom hook to use the context
export const useETFTrading = () => {
  const context = useContext(ETFTradingContext);
  if (!context) {
    throw new Error('useETFTrading must be used within an ETFTradingProvider');
  }
  return context;
}; 