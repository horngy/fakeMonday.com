<template>
  <div class="signup-container">
    <form @submit.prevent="signup" class="auth-form">
      <h2>Add Account</h2>
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
      <div class="password-field">
        <input
          :type="passwordVisible ? 'text' : 'password'"
          v-model="password"
          placeholder="Password"
          required
          class="input-field"
        />
      </div>
      <input type="hidden" v-model="role" value="developer" />
      <button type="submit" class="submit-btn" :disabled="isLoading">{{ isLoading ? 'Adding...' : 'Add Account' }}</button>
    </form>
    <div v-if="isSignedUp" class="success-message" aria-live="assertive">Account added successfully!</div>
    <div v-if="errorMessage" class="error" aria-live="assertive">{{ errorMessage }}</div>
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { ref } from 'vue';

export default {
  name: 'SignupDeveloper',
  setup() {
    const email = ref('');
    const password = ref('');
    const passwordVisible = ref(false);
    const role = ref('developer');
    const errorMessage = ref('');
    const username = ref('');
    const isSignedUp = ref(false);
    const isLoading = ref(false);
    const auth = getAuth();
    const db = getFirestore();

    const checkAdminRole = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const idTokenResult = await currentUser.getIdTokenResult();
      return idTokenResult.claims.admin === true;
    };

    const signup = async () => {
      errorMessage.value = '';
      isLoading.value = true;

      // Regular expression to validate password strength
      const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

      // Validate password strength
      if (!passwordRegex.test(password.value)) {
        errorMessage.value = 'Password must be at least 8 characters long, contain one uppercase letter, and one special character.';
        isLoading.value = false;
        return;
      }

      try {
        const isAdmin = await checkAdminRole();
        if (!isAdmin) {
          throw new Error("Only admin accounts can create new accounts.");
        }

        const response = await fetch('http://localhost:5000/createUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.value,
              password: password.value,
            }),
          });

          if (!response.ok) throw new Error('Failed to create user');

          const data = await response.json();
          console.log('User created:', data.uid);
          
        // Save the user to Firestore with their role
        const userRef = doc(db, "users", data.uid); // Create a document reference
        await setDoc(userRef, {
          username: username.value,
          email: data.email,
          role: role.value
        });

          isSignedUp.value = true;

          email.value = '';
          password.value = '';
          username.value = '';

      } catch (error) {
        console.error("Error creating user:", error);
        errorMessage.value = error.message;
      } finally {
        isLoading.value = false; // Reset loading state
      }
    };

    return {
      email,
      password,
      username,
      passwordVisible,
      role,
      errorMessage,
      isSignedUp,
      isLoading,
      signup
    };
  }
};
</script>

<style scoped>
html,
body {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

.signup-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f9f9f9;
}

.auth-form {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 800px;
  max-width: 90%;
  box-sizing: border-box;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.input-field {
  width: 100%;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.input-field:focus {
  border-color: #007bff;
  outline: none;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #0056b3;
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
