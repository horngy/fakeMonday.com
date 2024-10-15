<template>
  <div>
    <!-- Add the canvas element and ensure it's properly referenced -->
    <canvas ref="barChart" width="800" height="800"></canvas>
  </div>
</template>

<script>
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title } from 'chart.js';
import { Timestamp } from 'firebase/firestore';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title);

export default {
props: {
  logTime: {
    type: Array,
    required: true
  },
},
name: "BarChart",
data() {
  return {
    chart: null,
    chartData: {
      labels: [], // Will be populated based on timestamps
      datasets: [
        {
          label: 'Time Contribution',
          data: [], // Will be populated dynamically
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    },
  };
},
mounted() {
  this.$nextTick(() => {
    this.prepareGraphData();
    this.createGraph();
  });
},
methods: {
  prepareGraphData() {
    if (!this.logTime || this.logTime.length === 0) {
      console.error('logTime array is empty or undefined');
      return;
    }

    const startDate = this.convertToDate(this.logTime[0].timestamp);
    const endDate = this.convertToDate(this.logTime[this.logTime.length - 1].timestamp);
    endDate.setHours(23, 59, 59, 999);

    const dayLabels = this.generateDayLabels(startDate, endDate);
    this.chartData.labels = dayLabels;

    const timeSpentPerDay = this.generateTimeSpentPerDay(startDate, endDate);
    this.chartData.datasets[0].data = timeSpentPerDay;
  },

  generateDayLabels(startDate, endDate) {
    const dayLabels = [];
    let currentDate = new Date(startDate);

    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };

    while (currentDate <= endDate) {
      dayLabels.push(currentDate.toLocaleDateString('en-GB', options));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dayLabels;
  },

  generateTimeSpentPerDay(startDate, endDate) {
    const timeSpentPerDay = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toLocaleDateString('en-GB');

      const logEntries = this.logTime.filter(entry =>
        this.convertToDate(entry.timestamp).toLocaleDateString('en-GB') === dateString
      );

      if (logEntries.length > 0) {
        const totalTimeSpent = logEntries.reduce((total, entry) => total + entry.timeSpent, 0);
        timeSpentPerDay.push(totalTimeSpent);
      } else {
        timeSpentPerDay.push(0);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.maxValue = Math.max(...timeSpentPerDay);
    this.finalValueIsDecimal = !Number.isInteger(this.maxValue);

    return timeSpentPerDay;
  },

  convertToDate(timestamp) {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  },

  createGraph() {
    const canvas = this.$refs.barChart;

    if (!canvas) {
      console.error('Canvas element is missing!');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context is null!');
      return;
    }

    if (this.chart) {
      this.chart.stop();
      this.chart.destroy();
      this.chart = null;
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Time Contribution Graph`,
            font: {
              size: 20,
              weight: 'bold',
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Days',
              font: {
                size: 16,
                weight: 'bold',
              },
            },
            ticks: {
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            beginAtZero: true,
            min: 0,
            max: 6, // Initially show a week, can be adjusted dynamically
            autoSkip: false, // Prevent skipping ticks
            overflow: 'scroll', // Allow horizontal scrolling
          },
          y: {
            title: {
              display: true,
              text: 'Time Contribution (Hours)',
              font: {
                size: 16,
                weight: 'bold',
              },
            },
            ticks: {
              font: {
                size: 14,
                weight: 'bold',
              },
              beginAtZero: true,
              stepSize: 0.5,
              callback: (value) => {
                if (Number.isInteger(value)) {
                  return value;
                }
                if (value === this.maxValue && this.finalValueIsDecimal) {
                  return value.toFixed(1);
                }
                return '';
              },
              autoSkip: false,
            },
            min: 0,
            max: this.maxValue,
          },
        },
      },
    });
  }
},
beforeUnmount() {
  if (this.chart) {
    this.chart.stop();
    this.chart.destroy();
    this.chart = null;
  }
},
};
</script>
