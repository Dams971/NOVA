'use client';

import React from 'react';
import { DashboardWidget, CabinetKPIs } from '@/lib/models/performance';

interface ChartWidgetProps {
  widget: DashboardWidget;
  kpis: CabinetKPIs;
}

export default function ChartWidget({ widget, kpis: _kpis }: ChartWidgetProps) {
  // Generate mock chart data based on the time range
  const generateChartData = () => {
    const timeRange = widget.config.timeRange || 'week';
    const dataPoints = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    const data = [];
    for (let i = 0; i < dataPoints; i++) {
      // Generate realistic mock data with some variation
      const baseValue = widget.title.includes('Chiffre') ? 
        Math.floor(Math.random() * 500 + 200) : 
        Math.floor(Math.random() * 20 + 5);
      
      data.push({
        label: timeRange === 'day' ? `${i}h` : 
               timeRange === 'week' ? `J${i + 1}` :
               timeRange === 'month' ? `${i + 1}` : `S${Math.floor(i / 7) + 1}`,
        value: baseValue
      });
    }
    return data;
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  const renderLineChart = () => {
    const width = 300;
    const height = 150;
    const padding = 20;
    
    const xStep = (width - 2 * padding) / (chartData.length - 1);
    const yScale = (height - 2 * padding) / (maxValue - minValue);
    
    const pathData = chartData.map((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (point.value - minValue) * yScale;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg width={width} height={height} className="w-full h-32">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1={padding}
              y1={padding + ratio * (height - 2 * padding)}
              x2={width - padding}
              y2={padding + ratio * (height - 2 * padding)}
              stroke="neutral-200"
              strokeWidth="1"
            />
          ))}
          
          {/* Area under curve */}
          <path
            d={`${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#gradient)"
          />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => {
            const x = padding + index * xStep;
            const y = height - padding - (point.value - minValue) * yScale;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#3B82F6"
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500 px-5">
          {chartData.filter((_, index) => index % Math.ceil(chartData.length / 5) === 0).map((point, index) => (
            <span key={index}>{point.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxBarValue = Math.max(...chartData.map(d => d.value));
    
    return (
      <div className="space-y-2">
        {chartData.slice(0, 8).map((point, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-8 text-xs text-gray-600">{point.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(point.value / maxBarValue) * 100}%` }}
              />
            </div>
            <div className="w-12 text-xs text-gray-900 text-right">{point.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    const radius = 60;
    const centerX = 80;
    const centerY = 80;
    
    const colors = ['#3B82F6', '#10B981', 'warning-600', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    return (
      <div className="flex items-center space-x-4">
        <svg width="160" height="160" className="flex-shrink-0">
          {chartData.slice(0, 6).map((point, index) => {
            const percentage = point.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        <div className="space-y-1">
          {chartData.slice(0, 6).map((point, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-gray-600">{point.label}</span>
              <span className="font-medium">{point.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (widget.config.chartType) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'area':
      case 'line':
      default:
        return renderLineChart();
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="capitalize">{widget.config.timeRange || 'semaine'}</span>
          <span>•</span>
          <span className="capitalize">{widget.config.chartType || 'ligne'}</span>
        </div>
      </div>
      
      <div className="flex-1">
        {renderChart()}
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{maxValue}</div>
            <div className="text-xs text-gray-500">Max</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length)}
            </div>
            <div className="text-xs text-gray-500">Moyenne</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{minValue}</div>
            <div className="text-xs text-gray-500">Min</div>
          </div>
        </div>
      </div>
    </div>
  );
}