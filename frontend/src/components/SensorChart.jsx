import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SensorChart({
  title,
  labels = [],
  datasets = [],
  type = 'line',
  height = 260,
  yAxisLabel = '',
}) {
  const chartData = {
    labels,
    datasets: datasets.map((ds) => ({
      tension: 0.35,
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      fill: ds.fill !== undefined ? ds.fill : true,
      ...ds,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 12,
            weight: '600',
          },
          color: '#334155',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: "'Outfit', sans-serif", size: 13, weight: '700' },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
        },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          color: '#64748b',
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
        },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          color: '#64748b',
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
          color: '#64748b',
        },
      },
    },
  };

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      {type === 'bar' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
}
