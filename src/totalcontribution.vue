<template>
    <div class="total-contribution-page">
        <h1>Total Contribution</h1>

        <div class="table-wrapper">
        <!-- TableComponent to show users -->
        <TableComponent
            :key="tableKey"
            :headers="tableHeaders"
            :data="users"
            :buttonLabel="'Show Bar Chart'"
            :is-buttons="true"
            @row-data="showBarChart"
        />
        </div>
        
        <div v-if="revealBarChart" class="modal-overlay">
            <div class="modal-content">
                <button class="close-modal-button" @click="revealBarChart = false">X</button>
                <div class="chart-container">
                    <BarChartComponent :logTime="logTime" v-if="revealBarChart" />
                </div>
            </div>
        </div>

    </div>
</template>
  
<script>
import BarChartComponent from './components/BarChartComponent.vue';
import TableComponent from './components/TableComponent.vue';
import { db } from './firebase/init';
import { getDocs, collection } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
  
export default {
    name: 'TotalContributionPage', // Updated component name to multi-word
    components: {
        TableComponent,
        BarChartComponent,
    },
    data() {
        return {
            tableKey: 0,
            tableHeaders: ['username', 'email', 'role', 'total contribution (hours)'],
            users: [],
            revealBarChart: false,
            logTime: [],
        };
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

        // Fetch users when the component is mounted
        await this.fetchUsers();
    },

    methods: {

        async fetchUsers() {
            try {
                const userCollection = collection(db, 'users'); // Reference to the users collection
                const userSnapshot = await getDocs(userCollection);
                const userIDs = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map documents to an array

                this.users = []; // Initialize an empty array to store user data with total time spent

                // Iterate through each user
                userIDs.forEach(user => {
                    let totalTimeSpent = 0;

                    // Check if logtime exists and is an array, with logging for debugging
                    if (Array.isArray(user?.logTime)) {

                        totalTimeSpent = user.logTime.reduce((sum, log) => {
                            const timeSpent = log?.timeSpent || 0;
                            return sum + timeSpent;
                        }, 0);
                    } 

                    // Add user details and total time spent to the this.users array
                    this.users.push({
                        username: user.username || 'N/A', 
                        email: user.email || 'N/A', 
                        role: user.role || 'N/A', 
                        totalTimeSpent
                    });
                });

            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        },

        async findUserLogTime(email) {
        try {
            const userCollection = collection(db, 'users'); // Reference to the assignees collection
            const userSnapshot = await getDocs(userCollection);
            const userIDs = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map documents to an array
            const user = userIDs.filter(user => user.email === email)

            // Check if logTime exists and return it, or return an empty array if it's undefined
            return user[0]?.logTime ?? [];

        } catch (error) {
            console.error("Error fetching users: ", error);
        }
        },

        async showBarChart(user) {
            this.logTime = await this.findUserLogTime(user.email);
            this.revealBarChart = true;
        },
    },

    };
</script>

<style scoped>
.total-contribution-page {
    text-align: center;
    padding-top: 100px; /* Adjust this value to move the page content down */
    margin: 20px;
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
    overflow-y:auto;
    height: 100vh; /* Full height of the viewport */
}

.table-wrapper table {
    margin: 0 auto; /* Center the table horizontally */
    width: 100%; /* Optional: Make the table full-width */
}

/* Modal overlay styling for the fullscreen graph */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent black background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Ensure it's on top of everything */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 800px;
  height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* Make the chart container flexible */
.chart-container {
  width: 100%;
  height: 100%;
}

/* Full width and height for the canvas */
canvas {
  width: 100% !important;
  height: 100% !important;
}

.close-modal-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: red;
  color: white;
  border: none;
  width: 40px; /* Set equal width and height */
  height: 40px; /* Set equal width and height */
  border-radius: 50%; /* Make it a perfect circle */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px; /* Adjust font size for 'X' */
  cursor: pointer;
  line-height: 0; /* Remove default line height */
  padding: 0; /* Remove padding */
}

.close-modal-button:hover {
  background-color: darkred;
}

</style>
