import React, { useMemo } from 'react';
import { useETFTrading } from '../context/ETFTradingContext';

const TickerTape = ({ className = '' }) => {
	const { etfs } = useETFTrading();

	const items = useMemo(() => {
		if (!etfs || etfs.length === 0) return [];
		return etfs
			.filter(e => Number(e.cmp ?? e.currentPrice ?? 0) > 0)
			.map(e => {
				const price = Number(e.cmp ?? e.currentPrice ?? 0);
				const dma = Number(e.dma20 ?? 0);
				const changePct = dma > 0 ? ((price - dma) / dma) * 100 : null;
				return {
					symbol: e.symbol,
					price,
					changePct
				};
			});
	}, [etfs]);

	if (!items || items.length === 0) return null;

	return (
		<div className={`ticker-upstox ${className}`}>
			<div className="ticker-track">
				{[...items, ...items].map((it, idx) => {
					const pos = typeof it.changePct === 'number' ? it.changePct >= 0 : null;
					return (
						<div key={idx} className="ticker-item">
							<span className="ticker-symbol">{it.symbol}</span>
							<span className="ticker-price">₹{it.price.toFixed(2)}</span>
							{pos !== null && (
								<span className={`ticker-change ${pos ? 'text-positive' : 'text-negative'}`}>
									{pos ? '+' : ''}{it.changePct.toFixed(2)}%
								</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default TickerTape;


