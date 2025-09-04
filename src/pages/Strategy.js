import React from 'react';
import { useETFTrading } from '../context/ETFTradingContext';
import { BookOpen, TrendingDown, TrendingUp, Target, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

const Strategy = () => {
  const { targetProfit, averagingThreshold, maxETFsPerSector } = useETFTrading();

  const strategySteps = [
    {
      step: 1,
      title: "ETF Selection",
      description: "We have a list of ETFs with high daily volume",
      details: "FIRE sheet has only 60 ETFs as I have only kept max 3 ETFs from a sector, so that we can avoid over investing in a particular Asset",
      icon: TrendingDown
    },
    {
      step: 2,
      title: "Calculate % Difference",
      description: "Find the % difference between CMP and 20 DMA of all ETFs",
      details: "This helps identify ETFs that have fallen the most from their 20-day moving average",
      icon: TrendingDown
    },
    {
      step: 3,
      title: "First Day Purchase",
      description: "Buy the ETF coming on rank 1, because it has comparatively fallen the most from its 20 DMA",
      details: "I have given ETFs till rank 5, so that we have more choices to choose from",
      icon: TrendingUp
    },
    {
      step: 4,
      title: "Daily Purchase Limit",
      description: "Purchase max 1 ETF in a day (on some days we may not purchase any ETF if the criteria are not fulfilled)",
      details: "This ensures disciplined trading and prevents over-investment",
      icon: Target
    },
    {
      step: 5,
      title: "Next Day Rules",
      description: "Use the following rules to find the next ETF for purchasing or averaging an existing one",
      details: "Follow the systematic approach for continued investment",
      icon: BookOpen
    }
  ];

  const nextDayRules = [
    {
      rule: "5.1",
      title: "New ETF at Top Rank",
      description: "If a new ETF is listed in top ranks, buy the one at the top most rank (new ETF means that you are not holding it already)",
      icon: CheckCircle
    },
    {
      rule: "5.2",
      title: "Existing ETF at Rank 1",
      description: "If an existing ETF comes at rank 1, then check rank 2-5 ETFs, and buy the one which you are not already holding (select the lowest rank)",
      details: "Existing ETFs will not show up under 'New ETFs' in this sheet, so this will remove the hassle of manually keeping a track of which ETF we own and which we don't",
      icon: CheckCircle
    },
    {
      rule: "5.3",
      title: "Averaging Existing ETFs",
      description: `If you are holding all top ranked ETFs, then check the existing ETFs and buy the one which has fallen more than ${averagingThreshold}% below its previous purchase price (buy max 1 ETF in a day)`,
      details: "If we are holding all top ranked ETFs that were supposed to show under 'New ETF' category, then sheet will not show any ETF in that category, it will rather show the existing ETFs from our holding which have fallen more than 2.5% from their previous purchase price",
      icon: TrendingDown
    },
    {
      rule: "5.4",
      title: "No Purchase Day",
      description: "If none of the ETFs (new or already holding) do not fulfil the above criteria, do not buy any ETF on that day and postpone the above process to next day",
      icon: AlertTriangle
    }
  ];

  const sellingRules = [
    {
      title: "LIFO Selling Strategy",
      description: "Sell the ETF lot in LIFO (Last In First Out) style, which has gone above 6% profit (sell max 1 ETF in a day)",
      details: "This sheet will automatically show all ETFs which have crossed your set threshold target for selling",
      icon: TrendingUp
    }
  ];

  const features = [
    {
      title: "Kharida hua maal (Holdings) Sheet",
      features: [
        "Recording multiple buys of same ETF when averaging is done. It tracks the Total quantity bought, total invested money and average buying price",
        "It tracks notional profit for each ETF that we are holding. It is colour coded to show the notional profit in green color if it has exceeded the set target (6% target is also customisable)",
        "It tracks the fall of CMP from last purchase price of every ETF. It is colour coded to show the ETFs % in red color which have fallen more than 2.5%"
      ]
    },
    {
      title: "Bika hua maal (Sold Items) Sheet",
      features: [
        "Recording profits for each ETF individually",
        "A pivot table to automatically show the monthly profits",
        "Keep a manual track of max invested amount after every selling",
        "It automatically tracks the Average and Maximum Invested amount and the profit% on that amount"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-upstox-primary text-upstox-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-blue to-accent-blue-light rounded-xl flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-upstox-primary mb-4">ETF Trading Strategy</h1>
            <p className="text-lg text-upstox-secondary max-w-3xl mx-auto">
              This application implements the LIFO (Last In First Out) ETF trading strategy based on percentage difference from 20-day moving average.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="card-upstox p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-upstox-primary mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-upstox-primary mb-2">Important Disclaimer</h3>
                <p className="text-upstox-secondary">
                  This strategy is for educational purposes only. Anyone using it for their investment will be fully responsible for the profits or losses incurred. 
                  Past performance does not guarantee future results. Please consult with a financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Current Settings */}
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
              <h2 className="text-xl font-semibold text-upstox-primary">Current Strategy Settings</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-upstox-tertiary rounded-xl">
                  <Target className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Target Profit</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{targetProfit}%</p>
                </div>
                <div className="text-center p-6 bg-upstox-tertiary rounded-xl">
                  <TrendingDown className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Averaging Threshold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{averagingThreshold}%</p>
                </div>
                <div className="text-center p-6 bg-upstox-tertiary rounded-xl">
                  <BookOpen className="w-8 h-8 text-green-500 dark:text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Max ETFs per Sector</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{maxETFsPerSector}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Steps */}
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
              <h2 className="text-xl font-semibold text-upstox-primary">Strategy Steps</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {strategySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{step.description}</p>
                        {step.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">{step.details}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Next Day Rules */}
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
              <h2 className="text-xl font-semibold text-upstox-primary">Next Day Rules</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {nextDayRules.map((rule) => {
                  const Icon = rule.icon;
                  return (
                    <div key={rule.rule} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rule.rule}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{rule.title}</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{rule.description}</p>
                        {rule.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">{rule.details}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selling Rules */}
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
              <h2 className="text-xl font-semibold text-upstox-primary">Selling Rules</h2>
            </div>
            <div className="p-6">
              {sellingRules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{rule.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{rule.description}</p>
                      {rule.details && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">{rule.details}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <div className="card-upstox overflow-hidden">
            <div className="px-6 py-4 border-b border-upstox-primary bg-upstox-tertiary">
              <h2 className="text-xl font-semibold text-upstox-primary">Application Features</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{feature.title}</h3>
                    <ul className="space-y-3">
                      {feature.features.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card-upstox p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pro Tips</h3>
            </div>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Always check the ETF ranking before making any purchase decision</li>
              <li>• Stick to the 6% profit target for selling (LIFO method)</li>
              <li>• Use averaging only when ETFs fall more than 2.5% from last purchase</li>
              <li>• Maximum 3 ETFs per sector to avoid over-concentration</li>
              <li>• Monitor your holdings regularly for profit targets</li>
              <li>• Keep track of monthly performance to analyze strategy effectiveness</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Strategy; 