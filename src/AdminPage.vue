<template>
  <div class="admin-page">
    <h1>Admin Page</h1>
    
    <div class="button-container">
      <router-link to="/addaccount">
        <button>Add Developer Account</button>
      </router-link>

      <router-link to='/DeleteUsers'>
        <button>Remove Accounts</button>
      </router-link>
      
      <router-link to="totalcontribution">
        <button>View Total Contributions of Team Members</button>
      </router-link>

      <router-link to="averagecontribution">
        <button>View Average Contributions of Team Members</button>
      </router-link>

    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPage',

  data() {
    return {
      users: [],
      tableHeaders: ["username", "email", "role"],
      showRemoveTable: false,
      tableKey: 0,
      showContributionDateRange: false,
    };
  },
  
  methods: {
    addDeveloperAccount() {
      console.log('Add Developer Account clicked');
    },
    
    viewTotalContributions() {
      console.log('View Total Contributions clicked');
    },
    
    viewAverageContributions() {
      this.showContributionDateRange = true; // Show the ContributionDateRange component
      console.log('View Average Contributions clicked');
    },

    handleOverlayClick() {
      this.showContributionDateRange = false; // Hide the overlay when clicked
    },

    handleDateRangeSelected() {
      this.showContributionDateRange = false; // Hide the component when a date range is selected
    },
  }
};
</script>
  
<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 50px;
}

button {
  width: 300px;
  padding: 20px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  background-color: #4CAF50;
  color: white;
  border: none;
}

button:hover {
  background-color: #45a049;
}

</style>
