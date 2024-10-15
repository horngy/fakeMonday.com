<template>
  <div>
    <!-- Add the canvas element and ensure it's properly referenced -->
    <canvas ref="burndownChart" width="400" height="200"></canvas>
  </div>
</template>

<script>
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js';
import { Timestamp } from 'firebase/firestore';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export default {
  props: {
    sprintId: {
      type: String,
      required: true
    },
    tasks: {
      type: Array,
      required: true
    },
    deadlineRange: {
      type: Array,
      required: true
    }
  },
  name: "BurndownChart",
  data() {
    return {
      chart: null,
      chartData: {
        labels: [], // Will be populated based on deadlineRange
        datasets: [
          {
            label: 'Ideal Progress',
            data: [], // Will be populated dynamically
            borderColor: '#3d87a6',
            fill: false,
          },
          {
            label: 'Actual Progress',
            data: [], // Will be populated dynamically
            borderColor: 'red',
            fill: false,
          },
        ],
      },
      completedTasks: [] // New array to store completed tasks
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.prepareChartData();
      this.createChart();
    });
  },
  methods: {
    prepareChartData() {
      // Save completed tasks into completedTasks array
      this.completedTasks = this.tasks.filter(task => task.status === "completed");

      this.completedTasks.sort((a, b) => new Date(a.completionDate) - new Date(b.completionDate));

      // Generate labels based on the deadline range
      this.chartData.labels = this.generateDayLabels();

      // Calculate total story points for the Y-axis max value
      const totalStoryPoints = this.calculateTotalStoryPoints();

      // Generate ideal progress line (linear burn-down from totalStoryPoints to 0)
      const days = this.chartData.labels.length;
      this.chartData.datasets[0].data = this.generateIdealProgress(totalStoryPoints, days);

      // Generate actual progress line based on tasks (for now use placeholder data or customize it as needed)
      this.chartData.datasets[1].data = this.generateActualProgress(totalStoryPoints);
    },

    // Generate labels for each day between start and end date
    generateDayLabels() {
      const startDate = this.convertToDate(this.deadlineRange[0]);
      const endDate = this.convertToDate(this.deadlineRange[1]);

      const dayLabels = [];
      let currentDate = startDate;

      const options = { day: '2-digit', month: '2-digit', year: 'numeric' }; // Format as day/month/year

      while (currentDate <= endDate) {
        dayLabels.push(currentDate.toLocaleDateString('en-GB', options)); // 'en-GB' for dd/mm/yyyy format
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      return dayLabels;
    },

    // Calculate total story points from the tasks
    calculateTotalStoryPoints() {
      return this.tasks.reduce((total, task) => total + (parseInt(task.storyPoint, 10) || 0), 0);
    },

    // Generate the ideal progress line
    generateIdealProgress(totalStoryPoints, days) {
      const progress = [];
      const decrementPerDay = totalStoryPoints / (days - 1); // Ideal decrement per day

      for (let i = 0; i < days; i++) {
        progress.push(totalStoryPoints - i * decrementPerDay);
      }

      return progress;
    },

    // The actual progress according to when tasks are completed
    generateActualProgress(totalStoryPoints) {
      const actualProgress = [];
      const startDate = this.convertToDate(this.deadlineRange[0]);
      const endDate = this.convertToDate(this.deadlineRange[1]);
      let currentDate = this.convertToDate(startDate); // Ensure it's a new Date object to manipulate
      const completeByStart = this.completedTasks.filter(task => this.convertToDate(task.completionDate) <= startDate);
      const completeAfterEnd = this.completedTasks.filter(task => this.convertToDate(task.completionDate) >= endDate);
      let currentStoryPoints = 0;
      let total = totalStoryPoints;

      // Add story points completed before or at the start date
      completeByStart.forEach(task => {
        currentStoryPoints += parseInt(task.storyPoint, 10);
      });
      
      total -= currentStoryPoints;
      actualProgress.push(total);
      currentStoryPoints = 0;
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      
      // Iterate through each day between after start date and before end date
      while (currentDate < endDate) {

        // Stop if currentDate is passed today's date
        if (this.convertToDate(Timestamp.now()) < currentDate) {
          return actualProgress
        }

        const tasksCompleted = this.completedTasks.filter(task => this.convertToDate(task.completionDate).toLocaleDateString() === this.convertToDate(currentDate).toLocaleDateString());

        tasksCompleted.forEach(task => {
          currentStoryPoints += parseInt(task.storyPoint, 10);
        });

        total -= currentStoryPoints;
        actualProgress.push(total);
        currentStoryPoints = 0;
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      // Add story points completed at or after the end date
      completeAfterEnd.forEach(task => {
        currentStoryPoints += parseInt(task.storyPoint, 10);
      });

      total -= currentStoryPoints;
      actualProgress.push(total);
      currentStoryPoints = 0;

      return actualProgress;
    },

    // converts the timestamp into date to be used for CountdownTimer
    convertToDate(timestamp) {
      let date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate(); // Convert to Date
      } else {
        date = new Date(timestamp); // Fallback to just return the Date if it's already a Date
      }
      
      // Set time to midnight to ignore time part
      date.setHours(0, 0, 0, 0); 
      return date;
    },

    createChart() {
      const canvas = this.$refs.burndownChart;

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
          const legendWidth = 200;
          const legendHeight = 60;
          const legendX = chartArea.right - legendWidth - 10; // 10px from the right side
          const legendY = chartArea.top + 10; // 10px from the top

          // Draw background rectangle for the legend (semi-transparent)
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Black with 80% opacity
          ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

          // Draw "Ideal Progress" line and text
          const lineHeight = 20;
          const lineSpacing = 10;
          ctx.strokeStyle = '#3d87a6'; // Line color for "Ideal Progress"
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(legendX + 10, legendY + lineHeight);
          ctx.lineTo(legendX + 50, legendY + lineHeight); // Line length for the legend item
          ctx.stroke();
          ctx.fillStyle = '#3d87a6';
          ctx.font = 'bold 16px Arial';
          ctx.fillText('Ideal Progress', legendX + 60, legendY + lineHeight + 5); // Text next to the line

          // Draw "Actual Progress" line and text
          ctx.strokeStyle = 'red'; // Line color for "Actual Progress"
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(legendX + 10, legendY + lineHeight + lineSpacing + 10);
          ctx.lineTo(legendX + 50, legendY + lineHeight + lineSpacing + 10); // Line length for the legend item
          ctx.stroke();
          ctx.fillStyle = 'red';
          ctx.fillText('Actual Progress', legendX + 60, legendY + lineHeight + lineSpacing + 15); // Text next to the line

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
              text: `Burndown Chart for ${this.sprintId}`,
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
                text: 'Sprint Days',
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
                text: 'Story Points',
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
                stepSize: 5, // Ensure the steps are whole numbers
                callback: function(value) {
                  if (Number.isInteger(value)) {
                    return value; // Only return integer values
                  }
                }
              },
              min: 0,
              max: this.calculateTotalStoryPoints(), // Max based on total story points
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
