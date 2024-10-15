<template>
  <div class="signup-container">
    <form @submit.prevent="signup" class="auth-form">
      <h2>Admin Sign Up</h2>
      <input
        type="text"
        v-model="username"
        placeholder="Username"
        required
        class="input-field"
      />
      <input
        type="email"
        v-model="email"
        placeholder="Email"
        required
        class="input-field"
      />
      <input
        type="password"
        v-model="password"
        placeholder="Password"
        required
        class="input-field"
      />
      <input type="hidden" v-model="role" value="admin" />
      <button type="submit" class="submit-btn">Sign Up</button>
    </form>
    <div v-if="isSignedUp" class="success-message">Done</div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<script>
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'SignupAdmin',
  setup() {
    const email = ref('');
    const password = ref('');
    const username = ref('');
    const role = ref('admin');
    const errorMessage = ref('');
    const isSignedUp = ref(false);
    const router = useRouter();

    const auth = getAuth();
    const db = getFirestore();

    const signup = async () => {
      errorMessage.value = ''; // Clear previous error messages
      try {
        // Check if an admin already exists
        const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
        const querySnapshot = await getDocs(adminsQuery);

        if (!querySnapshot.empty) {
          errorMessage.value = 'An admin already exists. You cannot create another admin account.';
          return;
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        // Regular expression to validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

        if (!passwordRegex.test(password.value)) {
          errorMessage.value = 'Password must be at least 8 characters long, contain one uppercase letter, and one special character.';
          return;
        }

        // Save the user to Firestore with their role and username
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: role.value,
          username: username.value
        });

        console.log('Admin account created:', user);
        isSignedUp.value = true;
        router.push('/product');
      } catch (error) {
        console.error("Error creating user:", error);
        errorMessage.value = error.message; // Display error message
      }
    };

    return {
      email,
      password,
      username,
      role,
      errorMessage,
      isSignedUp,
      signup
    };
  }
};
</script>
  
  <style scoped>
  html,
  body {
    height: 100%; /* Set height to 100% for html and body */
    margin: 0; /* Remove default margin */
    overflow: hidden; /* Prevent overflow */
  }
  
  .signup-container {
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
  
  .error {
    color: red;
    text-align: center;
  }
  
  .success-message {
    color: green;
    text-align: center;
    font-weight: bold;
  }
  </style>
  