const { useState, useEffect, useRef, useMemo } = React;
const { createChart } = LightweightCharts;
// Icons are handled via data-lucide attributes and lucide.createIcons()

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

    // Risk Calculator State
    const [accountBalance, setAccountBalance] = useState(10000);
    const [riskPercent, setRiskPercent] = useState(1);
    const [stopLoss, setStopLoss] = useState(0);

    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const searchRef = useRef(null);

    // Popular symbols organized by category
    const popularSymbols = [
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
    ];

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
            setFilteredSuggestions(filtered);
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
                        <i data-lucide={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5 text-secondary"></i>
                    </button>
                </div>
            </header>

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
                                <i data-lucide="search" className="w-5 h-5 text-secondary absolute left-3 top-3"></i>
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
                                        <i data-lucide="trending-up" className="w-5 h-5" style={{ color: 'white' }}></i>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">Smart Signals</h3>
                                    <p className="text-xs text-slate-500">AI-powered BUY/SELL signals</p>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <i data-lucide="moon" className="w-5 h-5" style={{ color: 'white' }}></i>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">Moon Phase</h3>
                                    <p className="text-xs text-slate-500">Lunar cycle trading strategy</p>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <i data-lucide="layers" className="w-5 h-5" style={{ color: 'white' }}></i>
                                    </div>
                                    <h3 className="text-sm font-bold text-primary mb-1">SMC Analysis</h3>
                                    <p className="text-xs text-slate-500">Order blocks & FVG detection</p>
                                </div>
                                <div className="dark-card rounded-2xl p-4">
                                    <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center mb-3">
                                        <i data-lucide="shield" className="w-5 h-5" style={{ color: 'white' }}></i>
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

                    {/* Risk Calculator */}
                    {marketData && (
                        <div className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                                <i data-lucide="shield" className="w-4 h-4"></i>
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
                                        <i data-lucide="bar-chart-3" className="w-10 h-10" style={{ color: 'white' }}></i>
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
