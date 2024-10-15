<template>
    <div id="login-view">  
      <form id="login-form" @submit.prevent="handleLogin" class="auth-form">
        <h2>Log In</h2>
        <input type="email" v-model="email" placeholder="Email" required class="input-field" />
        <input type="password" v-model="password" placeholder="Password" required class="input-field" />
        <button type="submit" class="submit-btn">Log In</button>
      </form>
    </div>
  </template>
  
  <script>
  import { loginUser } from '@/firebase/auth.js';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
  
  export default {
    name: 'LoginView',
    setup() {
      const email = ref('');
      const password = ref('');
      const router = useRouter(); // Get the router instance
  
      const handleLogin = async () => {
        try {
          await loginUser(email.value, password.value);
          alert('Login successful!');
          router.push('/product');
        } catch (error) {
          console.error('Error during login:', error);
          alert('Login failed: ' + error.message);
        }
      };
  
      return {
        email,
        password,
        handleLogin,
      };
    },
  };
  </script>
  
  <style>
  html, body {
  height: 100%; /* Set height to 100% for html and body */
  margin: 0; /* Remove default margin */
  overflow: hidden; /* Prevent overflow */
    }

    #login-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* Center items vertically */
    height: 100vh; /* Full viewport height */
    background-color: #f9f9f9; /* Light background color */
    }

    .auth-form {
    background-color: white; /* White background for the form */
    border-radius: 8px; /* Rounded corners */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow */
    padding: 40px; /* Keep padding for spacing inside the form */
    width: 800px; /* Fixed width for the form */
    max-width: 90%; /* Ensure responsiveness on smaller screens */
    box-sizing: border-box; /* Include padding in width calculation */
    }

    h2 {
    text-align: center; /* Center align heading */
    margin-bottom: 30px; /* Increased space below the heading */
    color: #333; /* Dark text color */
    }

    .input-field {
    width: 100%; /* Full width */
    padding: 15px; /* Increased padding inside input */
    margin-bottom: 20px; /* Space below inputs */
    border: 1px solid #ccc; /* Light gray border */
    border-radius: 4px; /* Rounded corners */
    font-size: 16px; /* Font size */
    }

    .input-field:focus {
    border-color: #007bff; /* Change border color on focus */
    outline: none; /* Remove default outline */
    }

    .submit-btn {
    width: 100%; /* Full width */
    padding: 15px; /* Increased padding inside button */
    background-color: #007bff; /* Bootstrap primary color */
    color: white; /* White text color */
    border: none; /* No border */
    border-radius: 4px; /* Rounded corners */
    font-size: 18px; /* Increased font size */
    cursor: pointer; /* Pointer cursor on hover */
    }

    .submit-btn:hover {
    background-color: #0056b3; /* Darker shade on hover */
    }

  </style>
  
  
  
  