<template>
    <div id="app">
      <div class="account-details" v-if="userDetails">
        <h2>Account Details</h2>
        <p><strong>Username:</strong> {{ userDetails.username }}</p>
        <p><strong>Email:</strong> {{ userDetails.email }}</p>
        <p><strong>Role:</strong> {{ userDetails.role }}</p>
      </div>
      <router-view></router-view>
    </div>
  </template>
  
  <script>
  import { doc, getDoc, getFirestore } from 'firebase/firestore';
  import { onMounted, ref } from 'vue';
  import { getAuth } from 'firebase/auth';
  
  export default {
    name: 'AccountDetails',
    setup() {
      const userDetails = ref(null); // For storing user details
      const isPasswordVisible = ref(false); // For toggling password visibility
  
      const fetchUserDetails = async (uid) => {
        const db = getFirestore();
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            userDetails.value = userDoc.data(); // Store user data
            console.log("User details fetched:", userDetails.value); // Debug log
          } else {
            console.error("No such user document!");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      };
  
      const fetchCurrentUser = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (user) {
          await fetchUserDetails(user.uid); // Fetch user details if logged in
        } else {
          console.log("No user is logged in.");
        }
      };
  
      const togglePasswordVisibility = () => {
        isPasswordVisible.value = !isPasswordVisible.value; // Toggle the password visibility
      };
  
      onMounted(() => {
        fetchCurrentUser(); // Fetch user details on component mount
      });
  
      return {
        userDetails, // Return user details to template
        isPasswordVisible, // Return password visibility state
        togglePasswordVisibility // Return toggle function
      };
    },
  };
  </script>
  
  <style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
    position: relative;
  }
  
  /* Flexbox layout for account details */
  .account-details {
    margin-top: 20px; /* Add some space above */
    padding: 20px;
    border: 1px solid #ddd; /* Add border for better separation */
    border-radius: 8px; /* Rounded corners */
    background-color: #f9f9f9; /* Light background color */
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Add shadow for depth */
  }
  
  .toggle-password {
    margin-left: 10px; /* Space between password and button */
    background-color: #007bff; /* Button color */
    color: white; /* Button text color */
    border: none;
    border-radius: 5px; /* Rounded corners */
    padding: 5px 10px; /* Button padding */
    cursor: pointer; /* Pointer cursor */
  }
  
  .toggle-password:hover {
    background-color: #0056b3; /* Darker shade on hover */
  }
  </style>
  