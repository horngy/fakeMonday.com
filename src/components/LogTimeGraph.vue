<template>
    <div>
      <!-- Add the canvas element and ensure it's properly referenced -->
      <canvas ref="logTimeGraph" width="400" height="200"></canvas>
    </div>
  </template>
  
<script>
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js';
import { Timestamp } from 'firebase/firestore';
  
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export default {
props: {
    logTime: {
    type: Array,
    required: true
    },
},
name: "LogTimeGraph",
data() {
    return {
        chart: null,
        chartData: {
            labels: [], // Will be populated based on timestamps
            datasets: [
                {
                    label: 'Time Contribution',
                    data: [], // Will be populated dynamically
                    borderColor: 'red',
                    fill: false,
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
            return; // Exit early if the logTime array is empty or undefined
        }
  
        const startDate = this.convertToDate(this.logTime[0].timestamp); // First timestamp
        const endDate = this.convertToDate(this.logTime[this.logTime.length - 1].timestamp); // Last timestamp
        endDate.setHours(23, 59, 59, 999); // Set to 11:59:59 PM

        const dayLabels = this.generateDayLabels(startDate, endDate); // Generate daily labels between startDate and endDate
        this.chartData.labels = dayLabels;

        const timeSpentPerDay = this.generateTimeSpentPerDay(startDate, endDate); // Generate Y-axis data
        this.chartData.datasets[0].data = timeSpentPerDay;
    },


    // Generate labels for each day between start and end date
    generateDayLabels(startDate, endDate) {
      const dayLabels = [];
      let currentDate = new Date(startDate); // Clone startDate

      const options = { day: '2-digit', month: '2-digit', year: 'numeric' }; // Format: dd/mm/yyyy

      while (currentDate <= endDate) {
        dayLabels.push(currentDate.toLocaleDateString('en-GB', options)); // 'en-GB' for dd/mm/yyyy format'
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      return dayLabels;
    },

    generateTimeSpentPerDay(startDate, endDate) {
        const timeSpentPerDay = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateString = currentDate.toLocaleDateString('en-GB'); // Format date for comparison

            // Find all logTime entries that match the currentDate
            const logEntries = this.logTime.filter(entry => 
            this.convertToDate(entry.timestamp).toLocaleDateString('en-GB') === dateString
            );

            if (logEntries.length > 0) {
            // Sum the timeSpent for all entries on the same day
            const totalTimeSpent = logEntries.reduce((total, entry) => total + entry.timeSpent, 0);
            timeSpentPerDay.push(totalTimeSpent); // Add the total timeSpent for this date
            } else {
            timeSpentPerDay.push(0); // No log for this date, so push 0
            }

            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }

        // Find the maximum value from timeSpentPerDay
        this.maxValue = Math.max(...timeSpentPerDay);
        this.finalValueIsDecimal = !Number.isInteger(this.maxValue); // Check if the max value is a decimal

        return timeSpentPerDay;
    },


    // converts the timestamp into date to be used for CountdownTimer
    convertToDate(timestamp) {
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate(); // Convert to Date
        }
        return new Date(timestamp); // Fallback to just return the Date if it's already a Date
    },

    createGraph() {
        const canvas = this.$refs.logTimeGraph;

        if (!canvas) {
            console.error('Canvas element is missing!');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context is null!');
            return;
        }

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.stop();
            this.chart.destroy();
            this.chart = null;
        }

        // Custom plugin to place the legend in the top-right of the chart area
        const customLegendPlugin = {
            id: 'customLegendPlugin',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;

                // Legend dimensions and position
                const legendWidth = 220;
                const legendHeight = 40;
                const legendX = chartArea.right - legendWidth - 10; // 10px from the right side
                const legendY = chartArea.top + 70; // 10px from the top

                // Draw background rectangle for the legend (semi-transparent)
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Black with 80% opacity
                ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

                // Draw line and text
                const lineHeight = 20;
                const lineSpacing = 0;
                ctx.strokeStyle = 'red'; 
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(legendX + 10, legendY + lineHeight + lineSpacing);
                ctx.lineTo(legendX + 50, legendY + lineHeight + lineSpacing); // Line length for the legend item
                ctx.stroke();
                ctx.fillStyle = 'red';
                ctx.fillText('Contribution per Day', legendX + 60, legendY + lineHeight + lineSpacing + 5); // Text next to the line

                ctx.restore();
            }
        };
    
    // Initialize new chart
    this.chart = new Chart(ctx, {
        type: 'line',
        data: this.chartData,
        options: {
        responsive: true,
        plugins: {
            title: {
            display: true,
            text: `Time Contribution Graph`,
            font: {
                size: 20, // Set title font size
                weight: 'bold', // Make title font bold
            },
            },
        },
        scales: {
            x: {
            title: {
                display: true,
                text: 'Days',
                font: {
                size: 16, // Set X-axis label font size
                weight: 'bold', // Make X-axis label bold
                },
            },
            ticks: {
                font: {
                size: 14, // Set X-axis ticks font size
                weight: 'bold', // Make X-axis ticks bold
                },
            },
            },
            y: {
            title: {
                display: true,
                text: 'Time Contribution (Hours)',
                font: {
                size: 16, // Set Y-axis label font size
                weight: 'bold', // Make Y-axis label bold
                },
            },
            ticks: {
                font: {
                size: 14,
                weight: 'bold',
                },
                beginAtZero: true, // Start Y-axis at 0
                stepSize: 0.5, 
                callback: (value) => {
                    // Always show whole numbers
                    if (Number.isInteger(value)) {
                        return value; // Display whole numbers like 1, 2, 3
                    }

                    // Show the decimal value if it is the final (maximum) value
                    if (value === this.maxValue && this.finalValueIsDecimal) {
                        return value.toFixed(1); // Display decimal value as the final value (e.g., 3.5)
                    }

                    return ''; // Hide other values
                },
                autoSkip: false, // Prevent Chart.js from skipping ticks
            },
            min: 0,
            max: this.maxValue, 
            },
        },
        },
        plugins: [customLegendPlugin], // Register the custom plugin
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
