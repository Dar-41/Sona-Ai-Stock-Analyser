const { useState, useEffect, useRef, useMemo } = React;
const { createChart } = LightweightCharts;
// Icons are handled via data-lucide attributes and lucide.createIcons()

// Helper Component for TradingView Heatmap
// Helper Component for TradingView Heatmap
const TradingViewHeatmap = ({ theme, dataSource }) => {
    const container = useRef();

    useEffect(() => {
        if (!container.current) return;

        // Clean up previous script if any (though React usually handles re-renders, script injection manual needs care)
        container.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "exchanges": [],
            "dataSource": dataSource, // Dynamic Data Source
            "grouping": "sector",
            "blockSize": "market_cap_basic",
            "blockColor": "change",
            "locale": "in",
            "symbolUrl": "",
            "colorTheme": theme === 'dark' ? "dark" : "light",
            "hasTopBar": true,
            "isDataSetEnabled": true,
            "isZoomEnabled": true,
            "hasSymbolTooltip": true,
            "width": "100%",
            "height": "100%"
        });
        container.current.appendChild(script);
    }, [theme, dataSource]); // Re-render if theme or dataSource changes

    return (
        <div className="tradingview-widget-container h-full w-full" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
    );
};

const App = () => {
    const [status, setStatus] = useState('System Ready');
    const [theme, setTheme] = useState('light'); // Default to light
    const [ticker, setTicker] = useState('');
    const [timeframe, setTimeframe] = useState('1D');
    const [marketData, setMarketData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [currency, setCurrency] = useState('$');
    const [showInsights, setShowInsights] = useState(false);
    const [insightResults, setInsightResults] = useState(null);
    const [insightLoading, setInsightLoading] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapSource, setHeatmapSource] = useState('NIFTY50'); // Default to Indian Market
    const [showScreener, setShowScreener] = useState(false);
    const [screenerTicker, setScreenerTicker] = useState('');
    const [screenerData, setScreenerData] = useState(null);
    const [screenerLoading, setScreenerLoading] = useState(false);
    const [screenerError, setScreenerError] = useState(null);
    const [showScreenerSuggestions, setShowScreenerSuggestions] = useState(false);
    const [filteredScreenerSuggestions, setFilteredScreenerSuggestions] = useState([]);

    // Feature States
    const [newsData, setNewsData] = useState(null);
    const [showPortfolio, setShowPortfolio] = useState(false);
    const [portfolioData, setPortfolioData] = useState(null);
    const [portfolioAmount, setPortfolioAmount] = useState(100000);
    const [portfolioRisk, setPortfolioRisk] = useState("Moderate");
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [heatmapData, setHeatmapData] = useState([]);
    const [heatmapLoading, setHeatmapLoading] = useState(false);

    // Risk Calculator State
    const [accountBalance, setAccountBalance] = useState(10000);
    const [riskPercent, setRiskPercent] = useState(1);
    const [stopLoss, setStopLoss] = useState(0);

    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const searchRef = useRef(null);
    const screenerSearchRef = useRef(null);

    // Popular symbols organized by category
    const [popularSymbols, setPopularSymbols] = useState([
        // Forex & Commodities
        { symbol: 'XAUUSD', name: 'Gold / U.S. Dollar', category: 'Forex', icon: '🥇' },
        { symbol: 'XAGUSD', name: 'Silver / U.S. Dollar', category: 'Commodities', icon: '🥈' },
        { symbol: 'EURUSD', name: 'Euro / U.S. Dollar', category: 'Forex', icon: '💱' },
        { symbol: 'GBPUSD', name: 'British Pound / U.S. Dollar', category: 'Forex', icon: '💱' },
        { symbol: 'USDJPY', name: 'U.S. Dollar / Japanese Yen', category: 'Forex', icon: '💱' },
        { symbol: 'XTIUSD', name: 'WTI Crude Oil', category: 'Commodities', icon: '🛢️' },

        // Crypto
        { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Crypto', icon: '₿' },
        { symbol: 'ETHUSD', name: 'Ethereum', category: 'Crypto', icon: '⟠' },

        // US Stocks
        { symbol: 'AAPL', name: 'Apple Inc.', category: 'US Stocks', icon: '🇺🇸' },
        { symbol: 'TSLA', name: 'Tesla Inc.', category: 'US Stocks', icon: '🇺🇸' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'US Stocks', icon: '🇺🇸' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'US Stocks', icon: '🇺🇸' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'US Stocks', icon: '🇺🇸' },

        // Indices
        { symbol: 'SPX500', name: 'S&P 500 Index', category: 'Indices', icon: '📊' },
        { symbol: 'US30', name: 'Dow Jones Industrial', category: 'Indices', icon: '📊' },
        { symbol: 'NIFTY50', name: 'NIFTY 50', category: 'Indices', icon: '📊' },

        // Indian Stocks - Banking & Financial Services
        { symbol: 'HDFCBANK', name: 'HDFC Bank', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'SBIN', name: 'State Bank of India', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'AXISBANK', name: 'Axis Bank', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'JIOFIN', name: 'Jio Financial Services', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - IT & Technology
        { symbol: 'TCS', name: 'Tata Consultancy Services', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'INFY', name: 'Infosys', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'WIPRO', name: 'Wipro', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'HCLTECH', name: 'HCL Technologies', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'TECHM', name: 'Tech Mahindra', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'LTIM', name: 'LTIMindtree', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Energy & Oil
        { symbol: 'RELIANCE', name: 'Reliance Industries', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'BPCL', name: 'Bharat Petroleum', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'IOC', name: 'Indian Oil Corporation', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'POWERGRID', name: 'Power Grid Corporation', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'NTPC', name: 'NTPC Limited', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Telecom
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - FMCG & Consumer
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ITC', name: 'ITC Limited', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'NESTLEIND', name: 'Nestle India', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'BRITANNIA', name: 'Britannia Industries', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'DABUR', name: 'Dabur India', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'MARICO', name: 'Marico Limited', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Automotive
        { symbol: 'MARUTI', name: 'Maruti Suzuki India', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'TATAMOTORS', name: 'Tata Motors', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'M&M', name: 'Mahindra & Mahindra', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'EICHERMOT', name: 'Eicher Motors', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Pharma & Healthcare
        { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'CIPLA', name: 'Cipla Limited', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Infrastructure & Construction
        { symbol: 'LT', name: 'Larsen & Toubro', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'GRASIM', name: 'Grasim Industries', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Metals & Mining
        { symbol: 'TATASTEEL', name: 'Tata Steel', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'HINDALCO', name: 'Hindalco Industries', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'COALINDIA', name: 'Coal India', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Adani Group
        { symbol: 'ADANIENT', name: 'Adani Enterprises', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ADANIPORTS', name: 'Adani Ports', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ADANIGREEN', name: 'Adani Green Energy', category: 'Indian Stocks', icon: '🇮🇳' },

        // Indian Stocks - Others
        { symbol: 'TITAN', name: 'Titan Company', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'ASIANPAINT', name: 'Asian Paints', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank', category: 'Indian Stocks', icon: '🇮🇳' },
        { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', category: 'Indian Stocks', icon: '🇮🇳' },
    ]);

    useEffect(() => {
        fetch('/static/indian_stocks.json')
            .then(res => res.json())
            .then(data => {
                setPopularSymbols(prev => {
                    const existing = new Set(prev.map(s => s.symbol));
                    const newStocks = data.filter(s => !existing.has(s.symbol));
                    return [...prev, ...newStocks];
                });
            })
            .catch(err => console.error("Failed to load NSE stocks:", err));
    }, []);

    useEffect(() => {
        // Set theme attribute
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        // Initialize Lucide icons with a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            if (window.lucide && window.lucide.createIcons) {
                window.lucide.createIcons();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [marketData, analysis, theme]);

    // Re-init Lucide for screener modal to prevent removeChild errors
    useEffect(() => {
        if (!showScreener) return;
        const t = setTimeout(() => {
            if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
        }, 300);
        return () => clearTimeout(t);
    }, [showScreener, screenerData]);

    useEffect(() => {
        if (showHeatmap && heatmapSource === 'NIFTY50') {
            fetchHeatmapData();
        }
    }, [showHeatmap, heatmapSource]);

    useEffect(() => {
        if (showPortfolio || showInsights || showHeatmap) {
            const t = setTimeout(() => {
                if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
            }, 300);
            return () => clearTimeout(t);
        }
    }, [showPortfolio, showInsights, showHeatmap, portfolioData, heatmapData]);

    // Initialize Chart
    useEffect(() => {
        if (!marketData || !chartContainerRef.current) return;

        // Clean up existing chart
        if (chartInstanceRef.current) {
            try {
                // Only remove if chart element still exists in DOM
                const chartElement = chartInstanceRef.current.chartElement?.();
                if (chartElement && chartContainerRef.current?.contains(chartElement)) {
                    chartInstanceRef.current.remove();
                }
                chartInstanceRef.current = null;
            } catch (e) {
                console.log('Chart cleanup:', e);
                chartInstanceRef.current = null;
            }
        }

        // Clear container safely
        if (chartContainerRef.current) {
            while (chartContainerRef.current.firstChild) {
                chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
            }
        }

        // Create new chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: theme === 'dark' ? '#1E293B' : '#ffffff' },
                textColor: theme === 'dark' ? '#94A3B8' : '#334155',
            },
            grid: {
                vertLines: { color: theme === 'dark' ? '#334155' : '#e2e8f0' },
                horzLines: { color: theme === 'dark' ? '#334155' : '#e2e8f0' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            },
            rightPriceScale: {
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            },
        });

        const series = chart.addCandlestickSeries({
            upColor: '#10B981',
            downColor: '#EF4444',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });

        series.setData(marketData);
        chartInstanceRef.current = chart;

        // Add Markers and Price Lines
        if (analysis) {
            const markers = [];
            analysis.smc.order_blocks.forEach(ob => {
                if (ob.index < marketData.length) {
                    markers.push({
                        time: marketData[ob.index].time,
                        position: ob.type === 'bullish' ? 'belowBar' : 'aboveBar',
                        color: ob.type === 'bullish' ? '#10B981' : '#EF4444',
                        shape: ob.type === 'bullish' ? 'arrowUp' : 'arrowDown',
                        text: 'OB',
                    });
                }
            });
            series.setMarkers(markers);

            // Add Price Lines
            if (analysis.trade_levels) {
                series.createPriceLine({
                    price: analysis.trade_levels.entry,
                    color: '#38BDF8',
                    lineWidth: 2,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: 'ENTRY',
                });

                series.createPriceLine({
                    price: analysis.trade_levels.stop_loss,
                    color: '#EF4444',
                    lineWidth: 2,
                    lineStyle: 0,
                    axisLabelVisible: true,
                    title: 'STOP',
                });

                analysis.trade_levels.targets.forEach((target) => {
                    series.createPriceLine({
                        price: target.price,
                        color: '#10B981',
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: true,
                        title: target.level,
                    });
                });
            }
        }

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current && chartInstanceRef.current) {
                chartInstanceRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartInstanceRef.current) {
                try {
                    const chartElement = chartInstanceRef.current.chartElement?.();
                    if (chartElement && chartContainerRef.current?.contains(chartElement)) {
                        chartInstanceRef.current.remove();
                    }
                    chartInstanceRef.current = null;
                } catch (e) {
                    console.log('Cleanup:', e);
                    chartInstanceRef.current = null;
                }
            }
        };
    }, [marketData, analysis, theme]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setStatus('Please upload a valid image file (PNG, JPG)');
            return;
        }

        setIsUploading(true);
        setStatus('Uploading and analyzing chart...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText} `);
            }

            const result = await response.json();

            if (result.status === 'success') {
                setTicker(result.symbol);
                setMarketData(result.data);
                setAnalysis(result.analysis);
                setStatus(`✓ Identified: ${result.symbol} `);
                if (result.analysis && result.analysis.trade_levels) {
                    setStopLoss(result.analysis.trade_levels.stop_loss);
                }
            } else if (result.status === 'partial') {
                setStatus(result.message || 'Upload successful - enter ticker manually');
                if (result.symbol) {
                    setTicker(result.symbol);
                }
            } else {
                setStatus(result.message || 'Upload failed - try manual entry');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('Upload error - please use manual search instead');
        } finally {
            setIsUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleSearchInput = (e) => {
        const value = e.target.value.toUpperCase();
        setTicker(value);

        if (value.length > 0) {
            const filtered = popularSymbols.filter(item =>
                item.symbol.includes(value) ||
                item.name.toUpperCase().includes(value)
            );
            setFilteredSuggestions(filtered.slice(0, 50));
            setShowSuggestions(true);
        } else {
            setFilteredSuggestions(popularSymbols.slice(0, 10));
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (symbol) => {
        setTicker(symbol);
        setShowSuggestions(false);
        handleManualSearch({ preventDefault: () => { } });
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (screenerSearchRef.current && !screenerSearchRef.current.contains(event.target)) {
                setShowScreenerSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleManualSearch = async (e) => {
        e.preventDefault();
        if (!ticker) return;

        setLoading(true);
        setStatus(`Fetching ${timeframe} data for ${ticker}...`);
        try {
            const response = await fetch(`/api/market/${ticker}?timeframe=${timeframe}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.data && result.analysis) {
                setMarketData(result.data);
                setAnalysis(result.analysis);
                setCurrency(result.currency || '$');
                setStatus(`✓ Loaded ${ticker.toUpperCase()} - ${timeframe}`);
                if (result.analysis.trade_levels) {
                    setStopLoss(result.analysis.trade_levels.stop_loss);
                }

                // Fetch news in background
                setNewsData(null);
                fetch(`/api/news/${ticker}`)
                    .then(res => res.json())
                    .then(data => setNewsData(data))
                    .catch(err => console.log('News fetch error:', err));
            } else {
                setStatus('No data found for this symbol');
                setMarketData(null);
                setAnalysis(null);
            }
        } catch (error) {
            setStatus(`Error: ${error.message || 'Failed to fetch data'}`);
            setMarketData(null);
            setAnalysis(null);
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPortfolio = async () => {
        setPortfolioLoading(true);
        try {
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: portfolioAmount, risk_profile: portfolioRisk })
            });
            const data = await response.json();
            setPortfolioData(data);
        } catch (error) {
            console.error('Portfolio fetch error:', error);
        } finally {
            setPortfolioLoading(false);
        }
    };

    const fetchHeatmapData = async () => {
        setHeatmapLoading(true);
        try {
            const response = await fetch('/api/heatmap/nifty');
            const data = await response.json();
            setHeatmapData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Heatmap fetch error:', error);
        } finally {
            setHeatmapLoading(false);
        }
    };

    // Fetch Insights
    const handleInsights = async () => {
        setShowInsights(true);
        if (insightResults) return; // Don't refetch if already loaded

        setInsightLoading(true);
        setStatus("Scanning Quality Universe...");

        try {
            const response = await fetch('/api/insights');
            if (response.ok) {
                const data = await response.json();
                setInsightResults(data.data);
                setStatus("Insights Generated");
            } else {
                setStatus("Failed to generate insights");
            }
        } catch (e) {
            console.error(e);
            setStatus("Error fetching insights");
        } finally {
            setInsightLoading(false);
        }
    };

    const handleScreenerSearchInput = (e) => {
        const value = e.target.value.toUpperCase();
        setScreenerTicker(value);

        if (value.length > 0) {
            const filtered = popularSymbols.filter(item =>
                item.symbol.includes(value) ||
                item.name.toUpperCase().includes(value)
            );
            setFilteredScreenerSuggestions(filtered.slice(0, 50));
            setShowScreenerSuggestions(true);
        } else {
            setFilteredScreenerSuggestions(popularSymbols.slice(0, 10));
            setShowScreenerSuggestions(false);
        }
    };

    const handleSelectScreenerSuggestion = (symbol) => {
        if (typeof symbol === 'string') {
            setScreenerTicker(symbol);
            setShowScreenerSuggestions(false);
            handleScreenerSearch(symbol);
        }
    };

    const handleScreenerSearch = async (symbol) => {
        const target = typeof symbol === 'string' ? symbol : screenerTicker;
        if (!target) return;

        setScreenerLoading(true);
        setScreenerError(null);
        setStatus(`Fetching Fundamentals for ${target}...`);

        try {
            const response = await fetch(`/api/screener/${target}`);
            const data = await response.json();

            if (response.ok && data && (data.symbol || data.display_symbol)) {
                setScreenerData(data);
                setStatus(`Screener: ${target} Data Loaded`);
            } else {
                const errorMsg = data.detail || `Failed to screen ${target}`;
                setScreenerError(errorMsg);
                setStatus(`Screener: ${errorMsg}`);
            }
        } catch (error) {
            console.error("Screener error:", error);
            setScreenerError("Screener connection failed");
            setStatus("Screener connection failed");
        } finally {
            setScreenerLoading(false);
        }
    };

    // Timeframe change handler
    const handleTimeframeChange = async (newTf) => {
        setTimeframe(newTf);
        if (ticker && marketData) {
            // Refetch data with new timeframe
            setLoading(true);
            setStatus(`Switching to ${newTf}...`);
            try {
                const response = await fetch(`/api/market/${ticker}?timeframe=${newTf}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }

                const result = await response.json();
                if (result.data) {
                    setMarketData(result.data);
                    setAnalysis(result.analysis);
                    setStatus(`✓ Loaded ${ticker} (${newTf})`);
                    if (result.analysis && result.analysis.trade_levels) {
                        setStopLoss(result.analysis.trade_levels.stop_loss);
                    }
                } else {
                    setStatus(`No data available for ${newTf} timeframe`);
                }
            } catch (error) {
                setStatus(`Error switching timeframe: ${error.message}`);
                console.error('Timeframe change error:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Auto-load default ticker on mount - REMOVED per user request
    // useEffect(() => {
    //     handleManualSearch({ preventDefault: () => { } });
    // }, []);

    // Auto-refresh data every 60 seconds
    useEffect(() => {
        if (!ticker) return;

        const intervalId = setInterval(async () => {
            console.log(`[Auto-Refresh] Fetching update for ${ticker}...`);
            try {
                const response = await fetch(`/api/market/${ticker}?timeframe=${timeframe}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.data) {
                        setMarketData(result.data);
                        setAnalysis(result.analysis);
                        // Don't update status or loading state to avoid disruption
                    }
                }
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }, [ticker, timeframe]);

    // Risk Calculation
    const currentPrice = marketData ? marketData[marketData.length - 1].close : 0;
    const riskAmount = accountBalance * (riskPercent / 100);
    const priceDiff = Math.abs(currentPrice - stopLoss);
    const positionSize = priceDiff > 0 ? Math.floor(riskAmount / priceDiff) : 0;
    const positionValue = positionSize * currentPrice;

    return (
        <div className="min-h-screen px-4 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 fade-in-up">
                <div className="flex items-center gap-3">
                    <img src="/static/logo.png?v=4" alt="Sona AI" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-xl font-bold text-primary">
                            Sona AI
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">Stock Analyser</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="dark-card px-3 py-2 rounded-full flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 pulse' : 'bg-green-400 pulse'}`}></div>
                        <span className="text-xs text-secondary font-medium">{status}</span>
                        {marketData && (
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                {analysis?.data_source || 'Live'}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"
                        title="Toggle Theme"
                    >
                        <span><i data-lucide={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5 text-secondary"></i></span>
                    </button>
                    <button
                        onClick={handleInsights}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showInsights ? 'btn-purple' : 'btn-dark'}`}
                    >
                        <span><i data-lucide="sparkles" className="w-4 h-4"></i></span>
                        Insights
                    </button>
                    <button
                        onClick={() => setShowHeatmap(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showHeatmap ? 'btn-purple' : 'btn-dark'}`}
                    >
                        <span><i data-lucide="grid" className="w-4 h-4"></i></span>
                        Market Map
                    </button>
                    <button
                        onClick={() => { setShowPortfolio(true); if (!portfolioData) fetchPortfolio(); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showPortfolio ? 'btn-purple' : 'btn-dark'}`}
                    >
                        <span><i data-lucide="pie-chart" className="w-4 h-4"></i></span>
                        Portfolio
                    </button>
                    <button
                        onClick={() => setShowScreener(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showScreener ? 'btn-purple' : 'btn-dark'}`}
                    >
                        <span><i data-lucide="search" className="w-4 h-4"></i></span>
                        Screener
                    </button>
                </div>
            </header>

            {/* Heatmap Modal */}
            {showHeatmap && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-7xl h-[85vh] rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-card z-10">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <span><i data-lucide="grid" className="text-blue-400"></i></span>
                                    Market Heatmap
                                </h2>
                                {/* Source Selector */}
                                <div className="flex bg-slate-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => setHeatmapSource('NIFTY50')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${heatmapSource === 'NIFTY50' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Indian (NIFTY 50)
                                    </button>
                                    <button
                                        onClick={() => setHeatmapSource('SPX500')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${heatmapSource === 'SPX500' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Global (S&P 500)
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowHeatmap(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-2"
                            >
                                <span><i data-lucide="arrow-left" className="w-4 h-4"></i></span>
                                Back to Dashboard
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/20">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-primary">Nifty 50 Performance</h3>
                                    <p className="text-xs text-secondary font-bold uppercase tracking-widest">Real-time Sector Strength</p>
                                </div>
                                <button 
                                    onClick={fetchHeatmapData}
                                    className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                    title="Refresh Data"
                                >
                                    <span><i data-lucide="refresh-cw" className={`w-4 h-4 ${heatmapLoading ? 'animate-spin' : ''}`}></i></span>
                                </button>
                            </div>

                            {heatmapLoading && heatmapData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-secondary font-bold animate-pulse">Scanning Nifty 50...</p>
                                </div>
                            ) : heatmapSource === 'NIFTY50' ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {heatmapData.map((stock) => (
                                        <button
                                            key={stock.symbol}
                                            onClick={() => { setTicker(stock.symbol + '.NS'); handleManualSearch({ preventDefault: () => { } }); setShowHeatmap(false); }}
                                            className={`p-4 rounded-2xl flex flex-col justify-between aspect-square transition-all hover:scale-105 hover:shadow-xl ${
                                                stock.change > 1.5 ? 'bg-green-600/90 text-white shadow-green-500/10' :
                                                stock.change > 0 ? 'bg-green-900/40 text-green-300 border border-green-700/50' :
                                                stock.change < -1.5 ? 'bg-red-600/90 text-white shadow-red-500/10' :
                                                stock.change < 0 ? 'bg-red-900/40 text-red-300 border border-red-700/50' :
                                                'bg-slate-800 border border-border text-slate-400'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start w-full">
                                                <span className="font-black text-lg leading-none">{stock.symbol}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                                            </div>
                                            <div className="text-right w-full">
                                                <div className="text-2xl font-black tracking-tighter leading-none mb-1">
                                                    {stock.change > 0 ? '+' : ''}{stock.change}%
                                                </div>
                                                <div className="text-[10px] font-bold opacity-70">₹{stock.price}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full bg-black rounded-2xl overflow-hidden">
                                    <iframe
                                        src={`https://s.tradingview.com/embed-widget/stock-heatmap/?locale=en#${encodeURIComponent(JSON.stringify({
                                            "exchanges": [],
                                            "dataSource": "S&P500",
                                            "grouping": "sector",
                                            "blockSize": "market_cap_basic",
                                            "blockColor": "change",
                                            "symbolUrl": "",
                                            "colorTheme": theme,
                                            "hasTopBar": false,
                                            "isDataSetEnabled": false,
                                            "isZoomEnabled": true,
                                            "hasSymbolTooltip": true,
                                            "width": "100%",
                                            "height": "100%"
                                        }))}`}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Portfolio Architect Modal */}
            {showPortfolio && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-border flex flex-col overflow-hidden fade-in-up">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-border flex justify-between items-center bg-card">
                            <div>
                                <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                                    <span><i data-lucide="pie-chart" className="text-purple-400 w-8 h-8"></i></span>
                                    AI Portfolio Architect
                                </h2>
                                <p className="text-sm text-secondary font-medium">Algorithmic asset allocation based on risk-reward profiling</p>
                            </div>
                            <button
                                onClick={() => setShowPortfolio(false)}
                                className="p-3 rounded-full hover:bg-slate-500/10 text-secondary hover:text-primary transition-all"
                            >
                                <span><i data-lucide="x" className="w-6 h-6"></i></span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Configuration Sidebar */}
                                <div className="space-y-6">
                                    <div className="dark-card rounded-3xl p-6 space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Investment Capital</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-secondary font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={portfolioAmount}
                                                    onChange={(e) => setPortfolioAmount(Number(e.target.value))}
                                                    className="w-full bg-slate-900 border border-border rounded-2xl pl-10 pr-4 py-4 text-xl font-black text-white focus:border-purple-500 outline-none transition-all placeholder-slate-600"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Risk Appetite</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {['Conservative', 'Moderate', 'Aggressive'].map(risk => (
                                                    <button
                                                        key={risk}
                                                        onClick={() => setPortfolioRisk(risk)}
                                                        className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all text-left flex justify-between items-center ${
                                                            portfolioRisk === risk 
                                                            ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                                                            : 'bg-slate-900 border-transparent text-secondary hover:border-slate-700'
                                                        }`}
                                                    >
                                                        {risk}
                                                        {portfolioRisk === risk && <span><i data-lucide="check-circle" className="w-4 h-4"></i></span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={fetchPortfolio}
                                            disabled={portfolioLoading}
                                            className="w-full btn-purple py-4 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {portfolioLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Generate Plan ⚡'}
                                        </button>
                                    </div>

                                    {portfolioData && (
                                        <div className="bg-purple-600/10 border border-purple-500/30 rounded-3xl p-6 text-center">
                                            <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Projected Annual Return</div>
                                            <div className="text-3xl font-black text-purple-400">{portfolioData.projected_annual_return}</div>
                                            <p className="text-[10px] text-slate-500 mt-2 italic">*Based on historical sector performance</p>
                                        </div>
                                    )}
                                </div>

                                {/* Results Area */}
                                <div className="lg:col-span-2">
                                    {portfolioData ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {portfolioData.allocations.map((item, idx) => (
                                                    <div key={idx} className="dark-card rounded-[2rem] p-6 hover:shadow-xl transition-all border border-border/50">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl">
                                                                {idx === 0 ? '🏆' : idx === 1 ? '🚀' : '💎'}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-primary">{item.percentage}%</div>
                                                                <div className="text-xs text-secondary font-bold uppercase tracking-widest">Allocation</div>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-lg font-black text-primary mb-1">{item.category}</h4>
                                                        <div className="text-xl font-bold text-purple-400 mb-4">₹{item.amount.toLocaleString()}</div>
                                                        
                                                        <div className="space-y-2">
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suggested Tickers</div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {item.suggested_stocks.map(stock => (
                                                                    <button 
                                                                        key={stock}
                                                                        onClick={() => { setTicker(stock + '.NS'); handleManualSearch({ preventDefault: () => {} }); setShowPortfolio(false); }}
                                                                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-black text-primary hover:border-purple-500 transition-all"
                                                                    >
                                                                        {stock}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Allocation Donut Chart Placeholder */}
                                            <div className="dark-card rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8">
                                                <div className="relative w-48 h-48 flex-shrink-0">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1E293B" strokeWidth="20" />
                                                        {(() => {
                                                            let currentOffset = 0;
                                                            const colors = ['#8b5cf6', '#3b82f6', '#10b981'];
                                                            return portfolioData.allocations.map((item, i) => {
                                                                const strokeDasharray = `${item.percentage} 100`;
                                                                const dashOffset = -currentOffset;
                                                                currentOffset += item.percentage;
                                                                return (
                                                                    <circle 
                                                                        key={i} 
                                                                        cx="50" cy="50" r="40" 
                                                                        fill="transparent" 
                                                                        stroke={colors[i % colors.length]} 
                                                                        strokeWidth="20" 
                                                                        strokeDasharray={strokeDasharray} 
                                                                        strokeDashoffset={dashOffset} 
                                                                    />
                                                                );
                                                            });
                                                        })()}
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <div className="text-xs text-secondary font-bold uppercase tracking-widest">Total</div>
                                                        <div className="text-lg font-black text-primary">100%</div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-4 w-full">
                                                    <h4 className="text-xl font-black text-primary">Allocation Mix</h4>
                                                    <div className="space-y-3">
                                                        {portfolioData.allocations.map((item, i) => (
                                                            <div key={i} className="flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                                                    <span className="text-sm font-bold text-secondary">{item.category}</span>
                                                                </div>
                                                                <span className="text-sm font-black text-primary">{item.percentage}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-50">
                                            <div className="w-24 h-24 mb-6 rounded-full bg-slate-900 flex items-center justify-center">
                                                <span><i data-lucide="layout" className="w-12 h-12 text-slate-700"></i></span>
                                            </div>
                                            <h3 className="text-xl font-black text-primary">Ready to Architect</h3>
                                            <p className="text-sm text-secondary max-w-xs mt-2 font-medium">Adjust your capital and risk appetite then hit Generate to build your institutional-grade portfolio.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Screener Modal */}
            {showScreener && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border border-border flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10 backdrop-blur-xl">
                            <div>
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <span className="text-xl">📊</span>
                                    Stock Screener
                                </h2>
                                <p className="text-xs text-secondary mt-0.5">Fundamental analysis at a glance</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setShowScreener(false); setScreenerData(null); setScreenerTicker(''); }}
                                    className="px-4 py-2 rounded-full hover:bg-slate-500/10 text-secondary hover:text-primary transition-colors text-sm font-bold flex items-center gap-2"
                                    title="Back to Dashboard"
                                >
                                    <span className="text-sm">🏠</span> Home
                                </button>
                                <button onClick={() => { setShowScreener(false); setScreenerData(null); setScreenerTicker(''); }}
                                    className="p-2 rounded-full hover:bg-slate-500/10 text-secondary hover:text-primary transition-colors text-xl" title="Close Screener">
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="p-5 border-b border-border">
                            <div ref={screenerSearchRef} className="relative">
                                <form onSubmit={(e) => { e.preventDefault(); handleScreenerSearch(); }} className="flex gap-3 relative">
                                    <input type="text" value={screenerTicker}
                                        onChange={handleScreenerSearchInput}
                                        onFocus={() => setShowScreenerSuggestions(true)}
                                        placeholder="Enter stock symbol (e.g. RELIANCE, TCS, AAPL)"
                                        className="flex-1 input-modern rounded-2xl px-5 py-3 text-sm font-medium" autoComplete="off" />
                                    <button type="submit" className="btn-purple px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                                        <span className="text-sm">🔎</span> Screen
                                    </button>
                                </form>
                                {/* Suggestions Dropdown */}
                                {showScreenerSuggestions && filteredScreenerSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 glass-card rounded-2xl shadow-2xl max-h-80 overflow-hidden slide-in" style={{ width: 'calc(100% - 130px)' }}>
                                        <div className="overflow-y-auto max-h-80">
                                            {filteredScreenerSuggestions.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleSelectScreenerSuggestion(item.symbol)}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-border last:border-0"
                                                >
                                                    <span className="text-xl">{item.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="text-primary font-semibold text-sm">{item.symbol}</div>
                                                        <div className="text-slate-500 text-xs">{item.name}</div>
                                                    </div>
                                                    <span className="text-xs text-purple-400 font-bold">{item.category}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'AAPL', 'NVDA', 'TATAMOTORS'].map(s => (
                                    <button key={s} onClick={() => { setScreenerTicker(s); handleScreenerSearch(s); }}
                                        className="px-3 py-1 rounded-lg btn-dark text-[11px] font-bold text-secondary hover:text-primary">{s}</button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {screenerLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-lg font-bold text-primary animate-pulse">Fetching Fundamentals...</h3>
                                    <p className="text-sm text-secondary mt-2">Analyzing financial data for {screenerTicker}</p>
                                </div>
                            ) : !screenerData ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-6">
                                        <span className="text-4xl">📈</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-primary mb-2">Search any stock</h3>
                                    <p className="text-sm text-secondary max-w-md">Enter a ticker symbol to see PE, ROE, Book Value, Growth Metrics, Shareholding Patterns and more.</p>
                                </div>
                            ) : (
                                <div className="space-y-5 fade-in-up">
                                    {/* Overview Row */}
                                    <div className="dark-card rounded-2xl p-5">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-2xl font-black text-primary">{screenerData.display_symbol}</h3>
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 font-bold">{screenerData.sector}</span>
                                                </div>
                                                <p className="text-sm text-secondary">{screenerData.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">{screenerData.industry}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-primary">{screenerData.currency}{screenerData.current_price}</div>
                                                <div className={`text-sm font-bold ${screenerData.price_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {screenerData.price_change >= 0 ? '+' : ''}{screenerData.price_change} ({screenerData.price_change_pct}%)
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    52W: {screenerData.currency}{screenerData.fifty_two_week_low} — {screenerData.currency}{screenerData.fifty_two_week_high}
                                                </div>
                                            </div>
                                        </div>
                                        {/* 52W Range Bar */}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>{screenerData.currency}{screenerData.fifty_two_week_low}</span>
                                                <span>{screenerData.currency}{screenerData.fifty_two_week_high}</span>
                                            </div>
                                            <div className="w-full bg-slate-700/50 rounded-full h-2 relative">
                                                <div className="absolute h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" style={{ width: '100%' }}></div>
                                                {screenerData.fifty_two_week_high > screenerData.fifty_two_week_low && (
                                                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-purple-500 shadow-lg"
                                                        style={{ left: `${Math.min(100, Math.max(0, ((screenerData.current_price - screenerData.fifty_two_week_low) / (screenerData.fifty_two_week_high - screenerData.fifty_two_week_low)) * 100))}%`, transform: 'translate(-50%, -50%)' }}></div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Sparkline */}
                                        {screenerData.sparkline && screenerData.sparkline.length > 2 && (
                                            <div className="mt-4 h-16">
                                                <svg viewBox={`0 0 ${screenerData.sparkline.length} 50`} className="w-full h-full" preserveAspectRatio="none">
                                                    <defs><linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={screenerData.price_change >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0.3" /><stop offset="100%" stopColor={screenerData.price_change >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0" /></linearGradient></defs>
                                                    {(() => {
                                                        const mn = Math.min(...screenerData.sparkline); const mx = Math.max(...screenerData.sparkline); const rng = mx - mn || 1;
                                                        const pts = screenerData.sparkline.map((v, i) => `${i},${50 - ((v - mn) / rng) * 48}`).join(' ');
                                                        const area = `0,50 ${pts} ${screenerData.sparkline.length - 1},50`;
                                                        return (<g><polygon points={area} fill="url(#spkGrad)" /><polyline points={pts} fill="none" stroke={screenerData.price_change >= 0 ? '#10B981' : '#EF4444'} strokeWidth="1.5" /></g>);
                                                    })()}
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Key Metrics Grid */}
                                    <div>
                                        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Valuation & Fundamentals</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {[
                                                { l: 'Market Cap', v: screenerData.market_cap_fmt, c: 'text-primary' },
                                                { l: 'PE Ratio', v: screenerData.pe_ratio || 'N/A', c: screenerData.pe_ratio > 0 && screenerData.pe_ratio < 25 ? 'text-green-400' : screenerData.pe_ratio > 40 ? 'text-red-400' : 'text-primary' },
                                                { l: 'Forward PE', v: screenerData.forward_pe || 'N/A', c: 'text-primary' },
                                                { l: 'PB Ratio', v: screenerData.pb_ratio || 'N/A', c: screenerData.pb_ratio > 0 && screenerData.pb_ratio < 3 ? 'text-green-400' : 'text-primary' },
                                                { l: 'EV/EBITDA', v: screenerData.ev_ebitda || 'N/A', c: 'text-primary' },
                                                { l: 'Book Value', v: `${screenerData.currency}${screenerData.book_value}`, c: 'text-primary' },
                                                { l: 'EPS (TTM)', v: `${screenerData.currency}${screenerData.eps}`, c: screenerData.eps > 0 ? 'text-green-400' : 'text-red-400' },
                                                { l: 'ROE', v: `${screenerData.roe}%`, c: screenerData.roe > 15 ? 'text-green-400' : screenerData.roe > 10 ? 'text-yellow-400' : 'text-red-400' },
                                                { l: 'ROCE', v: `${screenerData.roce}%`, c: screenerData.roce > 15 ? 'text-green-400' : screenerData.roce > 10 ? 'text-yellow-400' : 'text-red-400' },
                                                { l: 'Div Yield', v: `${screenerData.dividend_yield}%`, c: screenerData.dividend_yield > 2 ? 'text-green-400' : 'text-primary' },
                                            ].map((m, i) => (
                                                <div key={i} className="dark-card rounded-xl p-3 hover:scale-[1.02] transition-transform">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">{m.l}</div>
                                                    <div className={`text-lg font-black ${m.c}`}>{m.v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Financial Health */}
                                    <div>
                                        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Financial Health</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { l: 'D/E Ratio', v: screenerData.debt_to_equity, c: screenerData.debt_to_equity < 50 ? 'text-green-400' : screenerData.debt_to_equity < 100 ? 'text-yellow-400' : 'text-red-400' },
                                                { l: 'Current Ratio', v: screenerData.current_ratio, c: screenerData.current_ratio >= 1.5 ? 'text-green-400' : screenerData.current_ratio >= 1 ? 'text-yellow-400' : 'text-red-400' },
                                                { l: 'Net Margin', v: `${screenerData.net_profit_margin}%`, c: screenerData.net_profit_margin > 15 ? 'text-green-400' : 'text-primary' },
                                                { l: 'Op. Margin', v: `${screenerData.operating_margin}%`, c: screenerData.operating_margin > 20 ? 'text-green-400' : 'text-primary' },
                                            ].map((m, i) => (
                                                <div key={i} className="dark-card rounded-xl p-3">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">{m.l}</div>
                                                    <div className={`text-lg font-black ${m.c}`}>{m.v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Growth + Shareholding Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Growth */}
                                        <div className="dark-card rounded-2xl p-5">
                                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Growth Metrics</h4>
                                            <div className="space-y-4">
                                                {[
                                                    { l: 'Sales CAGR (5Y)', v: screenerData.sales_cagr_5yr },
                                                    { l: 'Profit CAGR (5Y)', v: screenerData.profit_cagr_5yr },
                                                    { l: 'Revenue Growth (YoY)', v: screenerData.revenue_growth },
                                                    { l: 'Earnings Growth (YoY)', v: screenerData.earnings_growth },
                                                ].map((g, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-secondary">{g.l}</span>
                                                            <span className={`font-bold ${g.v > 10 ? 'text-green-400' : g.v > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {g.v > 0 ? '+' : ''}{g.v}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-700/40 rounded-full h-2 overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-700 ${g.v > 10 ? 'bg-green-500' : g.v > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(100, Math.max(5, Math.abs(g.v) * 2))}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Shareholding */}
                                        <div className="dark-card rounded-2xl p-5">
                                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Shareholding Pattern</h4>
                                            <div className="space-y-4">
                                                {[
                                                    { l: 'FII / Institutional', v: screenerData.institutional_holding, color: 'bg-blue-500', tc: 'text-blue-400' },
                                                    { l: 'Promoter / Insider', v: screenerData.insider_holding, color: 'bg-purple-500', tc: 'text-purple-400' },
                                                    { l: 'Public / Others', v: screenerData.public_holding, color: 'bg-slate-500', tc: 'text-slate-400' },
                                                ].map((s, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-secondary">{s.l}</span>
                                                            <span className={`font-bold ${s.tc}`}>{s.v}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-700/40 rounded-full h-3 overflow-hidden">
                                                            <div className={`h-full rounded-full ${s.color} transition-all duration-700`}
                                                                style={{ width: `${Math.min(100, s.v)}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quarterly Results */}
                                    {screenerData.quarterly && screenerData.quarterly.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Quarterly Performance</h4>
                                            <div className="dark-card rounded-2xl overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-border text-xs text-secondary uppercase">
                                                            <th className="px-4 py-3 text-left font-bold">Quarter</th>
                                                            <th className="px-4 py-3 text-right font-bold">Revenue</th>
                                                            <th className="px-4 py-3 text-right font-bold">Net Income</th>
                                                            <th className="px-4 py-3 text-right font-bold">Margin</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {screenerData.quarterly.map((q, i) => (
                                                            <tr key={i} className="hover:bg-slate-500/5">
                                                                <td className="px-4 py-3 font-bold text-primary">{q.quarter}</td>
                                                                <td className="px-4 py-3 text-right text-secondary font-mono">{q.revenue_fmt}</td>
                                                                <td className={`px-4 py-3 text-right font-mono font-bold ${q.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>{q.net_income_fmt}</td>
                                                                <td className={`px-4 py-3 text-right font-bold ${q.margin > 0 ? 'text-green-400' : 'text-red-400'}`}>{q.margin}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action */}
                                    <div className="flex justify-center pt-2 pb-2">
                                        <button onClick={() => { setTicker(screenerData.display_symbol); setShowScreener(false); setScreenerData(null); handleManualSearch({ preventDefault: () => { } }); }}
                                            className="btn-purple px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                                            <span>📈</span> Full Technical Analysis
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Insights Modal/Overlay */}
            {showInsights && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-border flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10 backdrop-blur-xl">
                            <div>
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <span><i data-lucide="sparkles" className="text-purple-400"></i></span>
                                    Quality-Growth Scanner
                                </h2>
                                <p className="text-sm text-secondary">Filtering for high-quality stocks with consistent growth</p>
                            </div>
                            <button
                                onClick={() => setShowInsights(false)}
                                className="p-2 rounded-full hover:bg-slate-500/10 text-secondary hover:text-primary transition-colors"
                            >
                                <span><i data-lucide="x" className="w-6 h-6"></i></span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {insightLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-lg font-bold text-primary animate-pulse">Scanning Market Universe...</h3>
                                    <p className="text-sm text-secondary mt-2">Analyzing Financials, CAGRs, and Management Quality</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-border text-xs text-secondary uppercase tracking-wider">
                                                <th className="px-4 py-3 font-bold">Rank</th>
                                                <th className="px-4 py-3 font-bold">Stock</th>
                                                <th className="px-4 py-3 font-bold">Score</th>
                                                <th className="px-4 py-3 font-bold text-right">Last Price</th>
                                                <th className="px-4 py-3 font-bold">Promoter %</th>
                                                <th className="px-4 py-3 font-bold">Sales 5Y</th>
                                                <th className="px-4 py-3 font-bold">Profit 5Y</th>
                                                <th className="px-4 py-3 font-bold">ROC (Avg)</th>
                                                <th className="px-4 py-3 font-bold">Cash Flow</th>
                                                <th className="px-4 py-3 font-bold">Management Note</th>
                                                <th className="px-4 py-3 font-bold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {insightResults?.map((stock, idx) => (
                                                <tr key={stock.ticker} className="hover:bg-slate-500/5 transition-colors">
                                                    <td className="px-4 py-4 font-bold text-purple-400">#{idx + 1}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold text-primary">{stock.ticker}</div>
                                                        <div className="text-xs text-secondary">{stock.name}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{stock.sector}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-black text-lg text-primary">{stock.score}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-mono text-primary font-bold">
                                                        {stock.currency}{stock.last_price}
                                                    </td>
                                                    <td className="px-4 py-4 text-secondary">
                                                        {stock.promoter_holding}%
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className={`font-bold ${stock.sales_cagr_5yr > 10 ? 'text-green-400' : 'text-secondary'}`}>
                                                            {stock.sales_cagr_5yr}%
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">{stock.unit_sales_trend}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className={`font-bold ${stock.profit_cagr_5yr > 10 ? 'text-green-400' : 'text-secondary'}`}>
                                                            {stock.profit_cagr_5yr}%
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-secondary">
                                                        {stock.avg_roc_5yr}%
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {stock.ocf_positive_3yr ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-bold">
                                                                <span><i data-lucide="check-circle" className="w-3 h-3"></i></span> Positive
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-bold">
                                                                Mixed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-secondary max-w-xs leading-relaxed">
                                                        {stock.integrity_note}
                                                        <div className="mt-1 text-[10px] text-slate-500">
                                                            D/E: {stock.debt_to_equity} • Net Debt: {stock.net_debt}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            onClick={() => {
                                                                setTicker(stock.ticker);
                                                                handleManualSearch({ preventDefault: () => { } });
                                                                setShowInsights(false);
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg bg-secondary/10 hover:bg-purple-500 hover:text-white text-secondary text-xs uppercase font-bold transition-all"
                                                        >
                                                            Analyze
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Left Panel */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Search Card */}
                    <div className="glass-card rounded-3xl p-5 fade-in-up">
                        <h3 className="text-xs font-bold mb-4 text-secondary uppercase tracking-wider">Search Symbol</h3>

                        <div ref={searchRef} className="relative mb-4">
                            <form onSubmit={handleManualSearch} className="relative">
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={handleSearchInput}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search stocks, crypto, forex..."
                                    className="w-full input-modern rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none text-primary placeholder-slate-600 font-medium"
                                    autoComplete="off"
                                />
                                <span><i data-lucide="search" className="w-5 h-5 text-secondary absolute left-3 top-3"></i></span>
                            </form>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 glass-card rounded-2xl shadow-2xl max-h-80 overflow-hidden slide-in">
                                    <div className="overflow-y-auto max-h-80">
                                        {filteredSuggestions.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleSelectSuggestion(item.symbol)}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-border last:border-0"
                                            >
                                                <span className="text-xl">{item.icon}</span>
                                                <div className="flex-1">
                                                    <div className="text-primary font-semibold text-sm">{item.symbol}</div>
                                                    <div className="text-slate-500 text-xs">{item.name}</div>
                                                </div>
                                                <span className="text-xs text-purple-400 font-bold">{item.category}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeframe Selector */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-3 uppercase tracking-wider font-bold">Timeframe</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['1M', '5M', '15M', '1H', '4H', '1D', '1W'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => handleTimeframeChange(tf)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${timeframe === tf
                                            ? 'btn-purple text-white'
                                            : 'btn-dark text-secondary hover:text-primary'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Welcome Dashboard - Show when no data */}
                    {!marketData && (
                        <div className="glass-card rounded-3xl p-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black text-primary mb-2">Welcome to Sona AI</h2>
                                <p className="text-secondary text-sm">Advanced Stock Analysis with Smart Money Concepts</p>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <span><i data-lucide="trending-up" className="w-5 h-5" style={{ color: 'white' }}></i></span>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">Smart Signals</h3>
                                    <p className="text-xs text-slate-500">AI-powered BUY/SELL signals</p>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <span><i data-lucide="moon" className="w-5 h-5" style={{ color: 'white' }}></i></span>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">Moon Phase</h3>
                                    <p className="text-xs text-slate-500">Lunar cycle trading strategy</p>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <span><i data-lucide="layers" className="w-5 h-5" style={{ color: 'white' }}></i></span>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">SMC Analysis</h3>
                                    <p className="text-xs text-slate-500">Order blocks & FVG detection</p>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <span><i data-lucide="shield" className="w-5 h-5" style={{ color: 'white' }}></i></span>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">Risk Manager</h3>
                                    <p className="text-xs text-slate-500">Position sizing calculator</p>
                                </div>
                            </div>

                            {/* Quick Start */}
                            <div className="border-t border-slate-800 pt-4">
                                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Popular Symbols</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['AAPL', 'TSLA', 'RELIANCE.NS', 'BTC-USD', 'EURUSD=X'].map(symbol => (
                                        <button
                                            key={symbol}
                                            onClick={() => {
                                                setTicker(symbol);
                                                handleManualSearch({ preventDefault: () => { } });
                                            }}
                                            className="px-3 py-1.5 rounded-lg btn-dark text-xs font-bold text-secondary hover:text-primary transition-all"
                                        >
                                            {symbol}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Signal Card */}
                    {analysis && (
                        <div className="glass-card rounded-3xl p-6 relative overflow-hidden fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${analysis.signal === 'BUY' ? 'bg-gradient-to-b from-green-400 to-green-600' : analysis.signal === 'SELL' ? 'bg-gradient-to-b from-red-400 to-red-600' : 'bg-slate-500'} `}></div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Trade Signal</h2>
                                    <div className={`text-5xl font-black tracking-tight ${analysis.signal === 'BUY' ? 'text-green-400' : analysis.signal === 'SELL' ? 'text-red-400' : 'text-secondary'}`}>
                                        {analysis.signal}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-secondary mb-1 font-semibold">Confidence</div>
                                    <div className="text-2xl font-black text-primary">{analysis.score}<span className="text-slate-500">/10</span></div>
                                </div>
                            </div>

                            <div className="space-y-2.5 mb-6">
                                {analysis.reasons.map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5 text-sm text-secondary">
                                        <span className="text-purple-400 mt-0.5 font-bold">{reason.startsWith('✓') ? '✓' : reason.startsWith('✗') ? '✗' : reason.includes('🌑') || reason.includes('🌒') || reason.includes('🌓') || reason.includes('🌔') || reason.includes('🌕') || reason.includes('🌖') || reason.includes('🌗') || reason.includes('🌘') ? '' : '○'}</span>
                                        <span className="leading-relaxed">{reason.replace(/^[✓✗○]\s*/, '')}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Entry & Targets Section */}
                            {analysis.trade_levels && (
                                <div className="accent-gradient rounded-2xl p-6 mb-4 smooth-shadow">
                                    <div className="text-center pb-4 border-b border-border">
                                        <div className="text-xs text-primary/70 uppercase tracking-wider mb-2 font-bold">Optimal Entry</div>
                                        <div className="text-5xl font-black text-primary drop-shadow-lg">
                                            {currency}{analysis.trade_levels.entry}
                                        </div>
                                        <div className="text-xs text-primary/60 mt-2">Dynamic AI-Adjusted Price</div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-1">
                                        <span className="text-secondary flex items-center gap-1">
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                            Stop Loss
                                        </span>
                                        <span className="text-red-400 font-bold">{currency}{analysis.trade_levels.stop_loss}</span>
                                    </div>
                                    {analysis.trade_levels.targets.map((target, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm py-1">
                                            <span className="text-secondary flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                {target.level} <span className="text-xs text-slate-500">({target.rr})</span>
                                            </span>
                                            <span className="text-green-400 font-bold">{currency}{target.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-3 border-t border-border text-sm">
                                        <span className="text-secondary font-semibold">Risk per Trade</span>
                                        <span className="text-orange-400 font-bold text-base">{currency}{analysis.trade_levels.risk_amount}</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">RSI (14)</div>
                                    <div className="text-lg font-bold text-primary">{analysis.indicators.rsi}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">ATR</div>
                                    <div className="text-lg font-bold text-primary">{analysis.indicators.atr}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Moon Phase Card */}
                    {analysis && analysis.moon_phase && (
                        <div className="glass-card rounded-3xl p-5 fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <h3 className="text-xs font-bold mb-4 text-secondary uppercase tracking-wider">Lunar Strategy</h3>

                            <div className="text-center mb-4">
                                <div className="text-6xl mb-2">{analysis.moon_phase.emoji}</div>
                                <div className="text-lg font-bold text-primary mb-1">{analysis.moon_phase.phase_name}</div>
                                <div className={`text-xs font-bold uppercase px-3 py-1 rounded-full inline-block ${analysis.moon_phase.bias === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                                    analysis.moon_phase.bias === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                                        'bg-slate-500/20 text-secondary'
                                    }`}>
                                    {analysis.moon_phase.bias}
                                </div>
                            </div>

                            <div className="text-sm text-secondary text-center mb-4 leading-relaxed">
                                {analysis.moon_phase.description}
                            </div>

                            <div className="bg-slate-500/10 rounded-xl p-3">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-500">Cycle Progress</span>
                                    <span className="text-purple-400 font-bold">{analysis.moon_phase.cycle_percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-500/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full purple-gradient transition-all duration-500"
                                        style={{ width: `${analysis.moon_phase.cycle_percentage}% ` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 text-center">
                                    Day {analysis.moon_phase.days_in_cycle} of 29.53
                                </div>
                            </div>
                        </div>
                    )}

                    {/* News Sentiment Card */}
                    {newsData && (newsData.news || newsData.sentiment) && (
                        <div className="glass-card rounded-3xl p-5 fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <h3 className="text-xs font-bold mb-4 text-secondary uppercase tracking-wider flex items-center gap-2">
                                <span className="text-sm">📰</span> Live AI Sentiment
                            </h3>
                            
                            <div className="flex items-center gap-4 mb-4 bg-slate-500/10 p-4 rounded-2xl">
                                <div className="flex-1">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Overall Sentiment</div>
                                    <div className={`text-lg font-black ${
                                        newsData.sentiment?.includes('Bullish') ? 'text-green-400' :
                                        newsData.sentiment?.includes('Bearish') ? 'text-red-400' : 'text-slate-400'
                                    }`}>
                                        {newsData.sentiment || 'Neutral'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-primary drop-shadow-md">
                                        {newsData.score > 0 ? '+' : ''}{newsData.score || 0}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">AI Score</div>
                                </div>
                            </div>
                            
                            {newsData.news && newsData.news.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {newsData.news.slice(0, 5).map((item, idx) => (
                                        <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl hover:bg-slate-500/5 border border-transparent hover:border-border transition-all">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <div className="text-xs font-semibold text-primary line-clamp-2 leading-tight">{item.title}</div>
                                                {item.sentiment === 'Bullish' && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1"></span>}
                                                {item.sentiment === 'Bearish' && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></span>}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                                                <span>{item.publisher}</span>
                                                <span>{item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString() : ''}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-secondary italic">No recent news headlines available for this symbol.</div>
                            )}
                        </div>
                    )}

                    {/* Risk Calculator */}
                    {marketData && (
                        <div className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span><i data-lucide="shield" className="w-4 h-4"></i></span>
                                Risk Management
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Account Balance</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-500">{currency}</span>
                                        <input
                                            type="number"
                                            value={accountBalance}
                                            onChange={(e) => setAccountBalance(Number(e.target.value))}
                                            className="w-full bg-input-bg border border-border rounded-lg pl-8 pr-4 py-2 text-sm text-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Risk %</label>
                                        <input
                                            type="number"
                                            value={riskPercent}
                                            onChange={(e) => setRiskPercent(Number(e.target.value))}
                                            className="w-full bg-input-bg border border-border rounded-lg px-4 py-2 text-sm text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Stop Loss ({currency})</label>
                                        <input
                                            type="number"
                                            value={stopLoss}
                                            onChange={(e) => setStopLoss(Number(e.target.value))}
                                            className="w-full bg-input-bg border border-border rounded-lg px-4 py-2 text-sm text-primary"
                                        />
                                    </div>
                                </div>

                                <div className="bg-input-bg rounded-lg p-4 mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Position Size</span>
                                        <span className="text-primary font-bold">{positionSize} shares</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Total Value</span>
                                        <span className="text-primary">{currency}{positionValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Risk Amount</span>
                                        <span className="text-red-400">-{currency}{riskAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>


                {/* Right Panel: Charts */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Chart */}
                    <div className="glass-card rounded-3xl p-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Price Chart</h3>
                            {marketData && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 pulse"></div>
                                    <span className="text-xs text-secondary">Live Data</span>
                                </div>
                            )}
                        </div>

                        {!marketData ? (
                            <div className="chart-container flex flex-col items-center justify-center" style={{ height: '500px' }}>
                                <div className="text-center max-w-md">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl purple-gradient flex items-center justify-center">
                                        <span><i data-lucide="bar-chart-3" className="w-10 h-10" style={{ color: 'white' }}></i></span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-primary mb-3">Start Your Analysis</h3>
                                    <p className="text-secondary text-sm mb-6">Search for any stock, crypto, or forex pair to view advanced technical analysis with Smart Money Concepts</p>

                                    <div className="flex flex-wrap gap-2 justify-center">
                                        <div className="px-3 py-1.5 rounded-lg dark-card text-xs text-secondary">
                                            <span className="text-green-400 font-bold">📈</span> Stocks
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg dark-card text-xs text-secondary">
                                            <span className="text-yellow-400 font-bold">₿</span> Crypto
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg dark-card text-xs text-secondary">
                                            <span className="text-blue-400 font-bold">💱</span> Forex
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg dark-card text-xs text-secondary">
                                            <span className="text-purple-400 font-bold">🌙</span> Moon Phase
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div ref={chartContainerRef} className="chart-container" style={{ height: '500px' }}></div>
                        )}
                    </div>

                    {/* Market Insights Panel */}
                    {marketData && analysis && (
                        <div className="glass-card rounded-3xl p-6 fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Market Insights</h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="text-xs text-slate-500 mb-1">Order Blocks</div>
                                    <div className="text-2xl font-bold text-primary">{analysis.smc?.order_blocks?.length || 0}</div>
                                    <div className="text-xs text-secondary mt-1">Detected</div>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="text-xs text-slate-500 mb-1">Fair Value Gaps</div>
                                    <div className="text-2xl font-bold text-primary">{analysis.smc?.fvgs?.length || 0}</div>
                                    <div className="text-xs text-secondary mt-1">Identified</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500">EMA Trend</span>
                                        <span className={`text-sm font-bold ${analysis.ema_trend === 'BULLISH' ? 'text-green-400' : analysis.ema_trend === 'BEARISH' ? 'text-red-400' : 'text-secondary'}`}>
                                            {analysis.ema_trend}
                                        </span>
                                    </div>
                                </div>

                                <div className="dark-card rounded-2xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500">RSI</span>
                                        <span className={`text-sm font-bold ${analysis.rsi > 70 ? 'text-red-400' : analysis.rsi < 30 ? 'text-green-400' : 'text-primary'}`}>
                                            {analysis.rsi?.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                        <div
                                            className={`h-1.5 rounded-full ${analysis.rsi > 70 ? 'bg-red-400' : analysis.rsi < 30 ? 'bg-green-400' : 'bg-purple-400'}`}
                                            style={{ width: `${Math.min(analysis.rsi, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="dark-card rounded-2xl p-4">
                                    <div className="text-xs text-slate-500 mb-2">Timeframe</div>
                                    <div className="text-sm font-bold text-primary">{timeframe}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SMC Details Panel (Order Blocks & FVGs) */}
                    {marketData && analysis && (
                        <div className="glass-card rounded-3xl p-6 fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Smart Money Concepts</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Order Blocks */}
                                <div className="dark-card rounded-2xl p-4">
                                    <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">Order Blocks</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {analysis.smc?.order_blocks?.length > 0 ? (
                                            analysis.smc.order_blocks.map((ob, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className={`font-semibold ${ob.type === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {ob.type.toUpperCase()}
                                                    </span>
                                                    <span className="text-secondary">{currency}{ob.price.toFixed(2)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 text-xs">None detected</span>
                                        )}
                                    </div>
                                </div>

                                {/* Fair Value Gaps */}
                                <div className="dark-card rounded-2xl p-4">
                                    <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">Fair Value Gaps</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {analysis.smc?.fvgs?.length > 0 ? (
                                            analysis.smc.fvgs.map((fvg, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className={`font-semibold ${fvg.type === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {fvg.type.toUpperCase()}
                                                    </span>
                                                    <span className="text-secondary text-xs">{currency}{fvg.bottom.toFixed(2)} - {currency}{fvg.top.toFixed(2)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 text-xs">None detected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
