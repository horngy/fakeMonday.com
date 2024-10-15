<template>
    <div v-if="!isDateRangeSelected" class="datepicker-container">
      <!-- VueDatePicker component to select the date range -->
      <VueDatePicker
        v-model="dateRange"
        range
        placeholder="Select date range"
        :inline="{ input: false }"
        :enable-time-picker="false"
        class="bigger-datepicker" 
      />
  
      <!-- Display a message until the user selects both start and end dates -->
      <div v-if="!isDateRangeSelected" class="select-dates-message">
        Please select a start and end date to proceed.
      </div>
    </div>

    <div v-if="isDateRangeSelected" class="table-wrapper">
        <!-- Section to display selected start and end dates -->
        <div class="date-range-display">
          <strong>Selected Date Range: </strong>
          <span>{{ formatDate(dateRange[0]) }} - {{ formatDate(dateRange[1]) }}</span>
        </div>
        
        <!-- TableComponent to show users -->
        <TableComponent
            :headers="tableHeaders"
            :data="users"
        />
    </div>
    
  </template>
  
  <script>
  import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { collection, getDocs } from 'firebase/firestore';
import TableComponent from './components/TableComponent.vue';
import { db } from './firebase/init';
import { getAuth } from 'firebase/auth';
  
  export default {
    name: 'AverageContribution',
    components: {
      VueDatePicker,
      TableComponent,
    },
    data() {
      return {
        today: new Date(),
        dateRange: [new Date(), null], // default range starts with today as the start date
        isDateRangeSelected: false, // flag to check if both dates are selected
        tableHeaders: ['username', 'email', 'role', 'average contribution (hours/day)'],
        users: [],
      };
    },
    watch: {
      // Watcher on the dateRange to check if both start and end dates are selected
      async dateRange(newRange) {
        if (newRange[0] && newRange[1]) {
            // Fetch users when the component is mounted
            await this.fetchUsers();
            this.isDateRangeSelected = true; // set flag to true when both dates are selected
        }
      },
    },

    async mounted() {
        const auth = getAuth();

        const checkAdminRole = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return false;

        const idTokenResult = await currentUser.getIdTokenResult();
        return idTokenResult.claims.admin === true;
        };

        const isAdmin = await checkAdminRole();
        if (!isAdmin) {
          throw new Error("Only admin accounts can view this page.");
        }
    },
    
    methods: {
        formatDate(date) {
            if (!date) return '';

            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options); 
        },

        async fetchUsers() {
            try {
                const userCollection = collection(db, 'users'); // Reference to the users collection
                const userSnapshot = await getDocs(userCollection);
                const userIDs = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map documents to an array

                this.users = []; // Initialize an empty array to store user data with average time spent

                // Convert startDate and endDate to Date objects for comparison
                const start = this.dateRange[0];
                const end = this.dateRange[1];

                // Calculate the number of days between start and end date
                const timeDiff = Math.abs(end - start);
                const daysBetween = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

                // Iterate through each user
                userIDs.forEach(user => {
                    let totalTimeSpent = 0;

                    // Check if logtime exists and is an array
                    if (Array.isArray(user?.logTime)) {

                        // Filter log entries by the date range
                        const filteredLogTime = user.logTime.filter(log => {
                            const logDate = new Date(log.timestamp); // Assuming 'date' is a field in the log
                            return logDate >= start && logDate <= end;
                        });

                        // Sum the timeSpent within the filtered logs
                        totalTimeSpent = filteredLogTime.reduce((sum, log) => {
                            const timeSpent = log?.timeSpent || 0;
                            return sum + timeSpent;
                        }, 0);

                    }

                    // Calculate average time spent per day within the date range
                    let averageTimeSpentPerDay = daysBetween > 0 ? totalTimeSpent / daysBetween : 0;
                    
                    if (averageTimeSpentPerDay > 0) {
                        averageTimeSpentPerDay = averageTimeSpentPerDay.toFixed(4);
                    }

                    // Add user details and average time spent to the this.users array
                    this.users.push({
                        username: user.username || 'N/A', 
                        email: user.email || 'N/A', 
                        role: user.role || 'N/A', 
                        averageTimeSpentPerDay
                    });
                });

            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        },

        },

  };
  </script>
  
  <style scoped>
  .datepicker-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed; /* Fixed positioning ensures it stays in the middle even when scrolling */
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh; /* Full height of the viewport */
    background-color: rgb(47, 47, 47); /* Black background */
    color: white; /* Make text white to ensure visibility */
  }
  
  .bigger-datepicker {
    --dp-main-width: 400px; /* Adjust width of the entire datepicker */
    --dp-main-height: 300px; /* Adjust height of the entire datepicker */
    --dp-cell-size: 45px; /* Makes the individual date cells larger */
    --dp-font-size: 1.5rem; /* Increase the font size */
    width: 350px; /* Make the datepicker wider */
    font-size: 1.2rem; /* Increase font size inside the datepicker */
    padding: 15px; /* Add padding for a larger feel */
  }
  
  .select-dates-message {
    margin-top: 20px;
    font-size: 20px;
    font-weight: bold;
    color: rgb(240, 83, 83);
    text-align: center;
  }

  .table-wrapper {
    background-color: rgb(47, 47, 47); /* Set the same background color as the datepicker */
    color: white; /* Ensure the text is white to make it readable */
    padding: 20px;
    border-radius: 8px;
    width: 100%;
    max-width: 1200px;
    position: relative;
    margin: 40px auto; /* Center the table wrapper itself */
    top: 50px;
    overflow-y:auto;
    height: 100vh; /* Full height of the viewport */
}

.table-wrapper table {
    margin: 0 auto; /* Center the table horizontally */
    width: 100%; /* Optional: Make the table full-width */
}

.date-range-display {
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 15px;
    text-align: center;
}
  </style>
