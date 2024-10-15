<template>
  <div class="change-credentials-container">
    <h2>Change Account Details</h2>
    <!-- Buttons to select Username, Password, or Both -->
    <div class="button-group">
      <button 
        @click="selectOption('username')" 
        :class="{ selected: changeOption === 'username' }"
      >
        Change Username
      </button>
      <button 
        @click="selectOption('password')" 
        :class="{ selected: changeOption === 'password' }"
      >
        Change Password
      </button>
      <button 
        @click="selectOption('both')" 
        :class="{ selected: changeOption === 'both' }"
      >
        Change Both
      </button>
    </div>

    <!-- Username Change Section -->
    <div v-if="changeOption === 'username' || changeOption === 'both'" class="form-group">
      <label for="newUsername">New Username</label>
      <input
        type="text"
        id="newUsername"
        v-model="newUsername"
        required
      />
    </div>

    <!-- Password Change Section -->
    <div v-if="changeOption === 'password' || changeOption === 'both'" class="form-group">
      <label for="newPassword">New Password</label>
      <input
        type="password"
        id="newPassword"
        v-model="newPassword"
        required
      />
    </div>
    <div v-if="changeOption === 'password' || changeOption === 'both'" class="form-group">
      <label for="confirmPassword">Confirm Password</label>
      <input
        type="password"
        id="confirmPassword"
        v-model="confirmPassword"
        required
      />
    </div>

    <!-- Submit Button -->
    <button type="submit" @click="changeCredentials" :disabled="isChanging">Submit</button>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script>
import { getAuth, updatePassword } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

export default {
  data() {
    return {
      newUsername: "",
      newPassword: "",
      confirmPassword: "",
      changeOption: "", // State to track what user wants to change
      isChanging: false,
      errorMessage: "",
    };
  },
  methods: {
    selectOption(option) {
      this.changeOption = option;
      this.errorMessage = ""; // Clear any previous error messages
    },
    async changeCredentials() {
      this.errorMessage = "";
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;

      if (!this.changeOption) {
        this.errorMessage = "Please select an option to change.";
        return;
      }

      if (user) {
        try {
          this.isChanging = true;

          // Handle Username change
          if (this.changeOption === "username" || this.changeOption === "both") {
            if (this.newUsername) {
              const userDocRef = doc(db, "users", user.uid);
              await updateDoc(userDocRef, { username: this.newUsername });
              try {
                await auth.signOut();
                this.isLoggedIn = false; 
                alert("Logged out successfully.");
              } catch (error) {
                console.error("Error logging out:", error);
                alert("Error logging out: " + error.message);
              }
            } else {
              this.errorMessage = "Username cannot be empty.";
              return;
            }
          }

          // Handle Password change
          if (this.changeOption === "password" || this.changeOption === "both") {
            const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(this.newPassword)) {
              this.errorMessage = "Password must be at least 8 characters long, contain one uppercase letter, and one special character.";
              return;
            }
            if (this.newPassword !== this.confirmPassword) {
              this.errorMessage = "Passwords do not match.";
              return;
            }
            await updatePassword(user, this.newPassword);
            try {
                await auth.signOut();
                this.isLoggedIn = false; 
                alert("Logged out successfully.");
              } catch (error) {
                console.error("Error logging out:", error);
                alert("Error logging out: " + error.message);
              }
          }

          alert("Credentials updated successfully!");
          this.$router.push("/");
        } catch (error) {
          this.errorMessage = error.message || "Error updating credentials.";
        } finally {
          this.isChanging = false;
        }
      } else {
        this.errorMessage = "No user is logged in.";
      }
    },
  },
};
</script>

<style scoped>
.change-credentials-container {
  margin-left: 40%;
  margin-top: 400px;
  max-width: 400px;
  padding: 20px 20px;
  background-color: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  margin-right: 10px;
}

button.selected {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
}

.form-group {
  margin-bottom: 20px;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>
