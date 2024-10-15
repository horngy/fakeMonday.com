<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand vsion-brand" href="#" @click="navigateHome">VSION</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item mx-lg-3">
            <a class="nav-link" href="#" @click="navigateTo('/product')">Product Backlog</a>
          </li>
          <li class="nav-item mx-lg-3">
            <a class="nav-link" href="#" @click="navigateTo('/sprint')">Sprint Backlog</a>
          </li>
        </ul>
        <div class="d-flex align-items-center">
          <div class="d-flex align-items-center">
          <div v-if="isLoggedIn" class="navbar-text ms-2 user-email">
            Logged in as: <strong>{{ username }}</strong> | <strong>{{ userRole }}</strong>
          </div>
          <Timezone />
        </div>
          <div class="icons-container ms-3">
            <a class="navbar-brand" href="#" v-if="isLoggedIn" @click="showHistory = true">
              <img src="@/assets/image.png" alt="Time" width="30" height="30" />
            </a>
            <div v-else class="navbar-text text-muted icon-placeholder">X</div>

            <div class="dropdown">
              <a class="navbar-brand dropdown-toggle" href="#" role="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="@/assets/image2.png" alt="User" width="30" height="30" />
              </a>
              <ul class="dropdown-menu" aria-labelledby="userDropdown">
                <li v-if="!isLoggedIn">
                  <router-link class="dropdown-item" to="/login">Login</router-link>
                </li>
                <li v-if="!isLoggedIn">
                  <router-link class="dropdown-item" to="/signupadmin">Sign up (Admin)</router-link>
                </li>
                <li v-if="isLoggedIn">
                  <router-link class="dropdown-item" to="/ChangePassword">Change Password</router-link>
                </li>
                <li v-if="isLoggedIn">
                  <a class="dropdown-item" href="#" @click="logout">Log Out</a>
                </li>
              </ul>
            </div>
            <a v-if="isAdmin" class="navbar-brand" href="#">
              <div @click="navigateTo({ name: 'AdminPage' })" style="cursor: pointer;">
                Admin
              </div>
            </a>
            
            <div v-if="!isAdmin" class="navbar-brand">
              Dev
            </div>
          
          </div>
        </div>
      </div>
    </div>

    <div v-if="showHistory" class="modal-overlay" @click="showHistory = false">
      <div class="modal-content" @click.stop>
        <h2>History Log</h2>
        <ul class="history-list">
          <li v-for="(edit, index) in localHistory" :key="index">
            {{ edit.timestamp }}: {{ edit.action }} - {{ edit.details }}
          </li>
        </ul>
        <button @click="showHistory = false">Close</button>
      </div>
    </div>
  </nav>
</template>

<script>
import { historyRef } from "@/firebase/init.js";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore"; // Import necessary Firestore functions
import { useRouter } from 'vue-router';
import { useCollection } from "vuefire";
import Timezone from "./Timezone.vue";

export default {
  name: 'NavBar',
  components: {
    Timezone
  },

  data() {
    return {
      showHistory: false,
      localHistory: [],
      isLoggedIn: false, 
      username: '',
      userEmail: '', // To store the email
      userRole: '', // To store the role
      router: useRouter(), // Get the router instance
      isAdmin: false,
    };
  },

  async mounted() {

    await this.fetchTasksFromDatabase();
    this.checkLoginStatus(); 
  },
  
  watch: {
    // Watch for route changes
    $route() {
      this.checkLoginStatus(); // Check login status on route change
    }
  },

  methods: {
    async navigateHome() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // If logged in, navigate to the home page
      this.$router.push('/accountDetails');
    } else {
      // If not logged in, navigate to the login page
      this.$router.push('/login');
    }
  },
    async fetchTasksFromDatabase() {
      try {
        const hisCollection = await useCollection(historyRef);
        this.localHistory = hisCollection;
        this.sortHistory();
      } catch (error) {
        console.error("Error fetching history:", error);
        alert("Error fetching history logs");
      }
    },

    sortHistory() {
      this.localHistory.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
      });
    },

    async checkLoginStatus() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        this.isLoggedIn = true;
        await this.fetchUsername(user.uid); // Store the user's email
        await this.fetchUserRole(user.uid);
      } else {
        this.isLoggedIn = false;
        this.userEmail = ''; // Clear the email if not logged in
        this.userRole = '';
      }
    },

    async fetchUserRole(uid) {
      const db = getFirestore();
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          this.userRole = userDoc.data().role; // Get user role from Firestore
          console.log("User role fetched:", this.userRole); // Log fetched role
          if (this.userRole === 'admin'){
            this.isAdmin = true
          }else{
            this.isAdmin = false
          }
        } else {
          console.error("No such document!"); // Log if the document doesn't exist
        }
      } catch (error) {
        console.error("Error fetching user role:", error); // Log any errors
      }
    },

    async fetchUsername(uid) {
      const db = getFirestore();
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          this.username = userDoc.data().username; // Get username from Firestore
          console.log("Username fetched:", this.username); // Log fetched username
        } else {
          console.error("No such document!"); // Log if the document doesn't exist
        }
      } catch (error) {
        console.error("Error fetching username:", error); // Log any errors
      }
    },

    async navigateTo(route) {
      const auth = getAuth();
      const user = auth.currentUser; 
      
      if (user) {
        this.$router.push(route);
      } else {
        alert("You need to log in to access this page.");
      }
    },

    async logout() {
      const auth = getAuth();
      try {
        await auth.signOut();
        this.isLoggedIn = false; 
        alert("Logged out successfully.");
        this.router.push('/')
      } catch (error) {
        console.error("Error logging out:", error);
        alert("Error logging out: " + error.message);
      }
    },
  }
};
</script>

<style scoped>
/* Navbar and modal styling remains the same */
.navbar {
  height: 80px;
  padding: 0 1rem;
}

.vsion-brand {
  font-size: 3rem;
  font-weight: bold;
  margin-right: 2rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.nav-item {
  font-size: 1.5rem;
  margin-right: 1rem;
}

@media (min-width: 992px) {
  .nav-item {
    margin-right: 2rem;
  }
}

.icons-container {
  display: flex;
  align-items: center;
}

.icon-placeholder {
  width: 30px; 
  height: 30px; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  font-size: 24px; 
  margin-right: 20px;
}

.icon-placeholder {
  width: 30px; 
  height: 30px; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  font-size: 24px; 
  margin-right: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 800px;
  height: 800px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.modal-content button {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

.modal-content button:hover {
  background-color: #0056b3;
}

.history-list {
  list-style-type: none;
  padding: 0;
  overflow-y: auto;
  max-height: 650px;
}

.history-list li {
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
}

.active-link {
  font-weight: bold;
  color: black;
}
.user-email {
  margin-right: 100px; /* Add margin to create space between login details and timezone */
}
.dropdown{
  position: relative;
}
.dropdown-menu {
  position: absolute;
  top: 60px; /* Adjust the top position as needed */
  left: 20px; /* Move it to the left as needed */
  transform: translateX(-50%); /* Center it horizontally (optional) */
}
</style>
