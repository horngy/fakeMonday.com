<template>
  <div class="page-container">
    <div class="content-container">
      <div v-if="isKanbanView" class="kanban-view">
        <!-- Kanban View -->
        <div class="section not-started">
          <h2>Not Started</h2>
          <div v-if="notStartedTasks.length">
            <SprintTaskCard
              v-for="task in notStartedTasks"
              :key="task.id"
              :task="task"
              @update-task="updateTask"
              @log-time="handleLogTime"
            />
          </div>
          <div v-else>
            <p>No tasks in this status.</p>
          </div>
        </div>
        <div class="section in-progress">
          <h2>In Progress</h2>
          <div v-if="inProgressTasks.length">
            <SprintTaskCard
              v-for="task in inProgressTasks"
              :key="task.id"
              :task="task"
              @update-task="updateTask"
              @log-time="handleLogTime"
            />
          </div>
          <div v-else>
            <p>No tasks in this status.</p>
          </div>
        </div>
        <div class="section completed">
          <h2>Completed</h2>
          <div v-if="completedTasks.length">
            <SprintTaskCard
              v-for="task in completedTasks"
              :key="task.id"
              :task="task"
              @update-task="updateTask"
              @log-time="handleLogTime"
            />
          </div>
          <div v-else>
            <p>No tasks in this status.</p>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="list-view">
        <br>

        <h3><strong>In Progress</strong></h3>
        <div v-if="inProgressTasks.length">
          <SprintTaskCardList
            v-for="task in inProgressTasks"
            :key="task.id"
            :task="task"
            @update-task="updateTask"
            @log-time="handleLogTime"
          />
        </div>
        <div v-else>
          <p>No tasks in this status.</p>
        </div>
        
        <br>
        <br>
        
        <h3><strong>Not Started</strong></h3>
        <div v-if="notStartedTasks.length">
          <SprintTaskCardList
            v-for="task in notStartedTasks"
            :key="task.id"
            :task="task"
            @update-task="updateTask"
            @log-time="handleLogTime"
          />
        </div>
        <div v-else>
          <p>No tasks in this status.</p>
        </div>

          <br>
          <br>

          <h3><strong>Completed</strong></h3>
          <div v-if="completedTasks.length">
            <SprintTaskCardList
              v-for="task in completedTasks"
              :key="task.id"
              :task="task"
              @update-task="updateTask"
              @log-time="handleLogTime"
            />
          </div>
          <div v-else>
            <p>No tasks in this status.</p>
          </div>

      </div>
    </div>

    <div class="button-container">
      <button class="view-toggle" @click="toggleView">
        {{ isKanbanView ? '=' : '||' }}
      </button>
      <button class="close-button" @click="goBackToSprint">X</button>
    </div>
  </div>
</template>

<script>
import SprintTaskCard from "@/components/SprintTaskCard.vue";
import SprintTaskCardList from "@/components/SprintTaskCardList.vue";
import { db } from "@/firebase/init.js";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";

export default {
  components: {
    SprintTaskCard,
    SprintTaskCardList
  },
  data() {
    return {
      sprint: {},
      notStartedTasks: [],
      inProgressTasks: [],
      completedTasks: [],
      isKanbanView: true // This determines whether the Kanban or List view is displayed
    };
  },
  computed: {
    allTasks() {
      // Combine all tasks into one array for list view
      return [...this.notStartedTasks, ...this.inProgressTasks, ...this.completedTasks];
    }
  },
  async created() {
    const sprintName = this.$route.params.name;
    await this.fetchSprintTasks(sprintName);
  },
  methods: {
    async updateTask(updatedTask) {
      try {

        // Check if the task status has been changed to 'completed' and there is no completion date
        if (updatedTask.status === 'completed' && (!updatedTask.completionDate || updatedTask.completionDate === null)) {
          // Stamp the current date using Firestore's Timestamp
          updatedTask.completionDate = Timestamp.now();
        }
        
        if (!(updatedTask.status === 'completed')) {
          updatedTask.completionDate = null;
        }

        const sprintDocRef = doc(db, 'sprints', this.sprint.id);

        const updatedTasks = this.sprint.tasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        );

        await updateDoc(sprintDocRef, {
          tasks: updatedTasks
        });

        await this.fetchSprintTasks(this.sprint.name);

        console.log('Task updated successfully in Firestore');
      } catch (error) {
        console.error('Error updating task in Firestore:', error);
      }
    },
    goBackToSprint() {
      this.$router.push({ name: 'SprintView' });
    },
    async fetchSprintTasks(sprintName) {
      try {
        const sprintCollection = collection(db, 'sprints');
        const q = query(sprintCollection, where('name', '==', sprintName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const sprintDoc = querySnapshot.docs[0];
          this.sprint = { id: sprintDoc.id, ...sprintDoc.data() };
          const tasks = this.sprint.tasks || [];
          this.notStartedTasks = tasks.filter(task => task.status === 'not-started');
          this.inProgressTasks = tasks.filter(task => task.status === 'in-progress');
          this.completedTasks = tasks.filter(task => task.status === 'completed');
        } else {
          console.log('No such sprint!');
        }
      } catch (error) {
        console.error('Error fetching sprint tasks:', error);
      }
    },
    toggleView() {
      this.isKanbanView = !this.isKanbanView;
    },

    async handleLogTime(task, timeSpent) {
      const auth = getAuth();
      const user = auth.currentUser; // Get the current authenticated user
      const userEmail = user.email;
      const assigneesCollection = collection(db, 'users'); // Reference to the assignees collection
      const assigneesSnapshot = await getDocs(assigneesCollection);
      const users = assigneesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map documents to an array
      const currentUser = users.find(user => user.email === userEmail);
      const username = currentUser.username; // Get the username

      if (!user) {
        alert("User is not authenticated. Please log in.");
        return;
      }

      // Check if the task and logTime are defined
      if (!task || !task.id) {
        alert("Task is not defined.");
        return;
      }

      // Check if the user is the assignee
      if (task.assignee !== username) {
        alert("You are not the assigned user for this task.");
        return;
      }

      // Create a new log entry with the time spent and the user's email
      const logEntry = {
        timeSpent: parseFloat(timeSpent), // Ensure it's a number
        user: username, // Use the username
        timestamp: new Date().toLocaleString(), // Optional: include timestamp
      };

      // Initialize logTime array if it doesn't exist
      const updatedTask = { ...task };
      updatedTask.logTime = updatedTask.logTime ? [...updatedTask.logTime] : []; // Initialize if undefined
      updatedTask.logTime.push(logEntry); // Add the new log entry to the logTime array

      try {
        if (!this.sprint || !this.sprint.id) {
          console.error("Sprint ID is missing or invalid.");
          return;
        }

        // Reference to the sprint document where the task is located
        const sprintDocRef = doc(db, 'sprints', this.sprint.id);
        const sprintDocSnapshot = await getDoc(sprintDocRef);
        if (!sprintDocSnapshot.exists()) {
          console.error("Sprint document does not exist.");
          return;
        }

        if (sprintDocSnapshot.exists()) {
          const sprintData = sprintDocSnapshot.data();
          const tasks = sprintData.tasks || [];

          if (tasks.length === 0) {
            console.error("No tasks found in the sprint document.");
            return;
          }

          // Find the task within the sprint's tasks array
          const taskIndex = tasks.findIndex(t => t.id === task.id);
          if (taskIndex === -1) {
            alert("Task not found in sprint.");
            return;
          }

          // Update the logTime for the task
          tasks[taskIndex].logTime = tasks[taskIndex].logTime || [];
          tasks[taskIndex].logTime.push(logEntry); // Add the new log entry

          // Update the tasks array in the sprint document
          await updateDoc(sprintDocRef, { tasks });

          // Optionally, add to history
          const historyEntry = {
            action: "Logged time",
            details: `User ${username} logged ${timeSpent} hours`,
            timestamp: new Date().toLocaleString(),
            taskId: task.id,
          };
          await addDoc(collection(db, "history"), historyEntry);

          // Fetch the updated tasks to refresh the view
          // await this.fetchTasksFromDatabase();

          // Now also log the time in the user's document
          const userDocRef = doc(db, 'users', currentUser.id);
          const userDocSnapshot = await getDoc(userDocRef);

          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            const userLogTime = userData.logTime ? [...userData.logTime] : []; // Initialize if undefined
            userLogTime.push(logEntry); // Add the new log entry to the user's logTime

            // Update the user's logTime in their document
            await updateDoc(userDocRef, { logTime: userLogTime });

            console.log("Log time added to user document as well.");
          } else {
            console.error("User document does not exist.");
            await setDoc(userDocRef, { logTime: [logEntry] }); // Create the document with the logTime array
            console.log("User document created with initial logTime.");
          }

          // Show success message
          alert("Time logged successfully!");

          console.log("Time logged successfully!");
        } else {
          alert("Sprint not found.");
        }
      } catch (error) {
        console.error("Error logging time: ", error.message || error);
        alert("Error logging time.");
      }
    },

  }
};
</script>

<style scoped>
.page-container {
  display: grid;
  grid-template-columns: 1fr auto; /* Main content in 1st column, buttons in the 2nd */
  gap: 20px;
  padding: 20px;
  position: relative;
}

.content-container {
  display: grid;
  grid-template-rows: auto 1fr;
}

.button-container {
  display: flex;
  flex-direction: column; /* Stack buttons vertically */
  gap: 10px;
  align-items: flex-end; /* Align buttons to the right */
  margin-top: 10px;
}

.view-toggle,
.close-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 50px;
  height: 45px;
}

.view-toggle:hover,
.close-button:hover {
  background-color: #45a049;
}

.kanban-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.section {
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  height: 840px;
  display: flex;
  flex-direction: column;
}

.section h2 {
  margin-top: 0;
}

.section > div {
  gap: 10px;
  overflow-y: auto;
  height: 800px;
}

.section > div::-webkit-scrollbar {
  width: 8px;
}

.section > div::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

.list-view {
  display: flex;
  flex-direction: column; /* Stack sections vertically */
  align-items: flex-start; /* Align all sections to the left */
  gap: 10px; /* Space between sections */
}
.list-view h3 {
  margin: 0; /* Remove default margin from headers */
  padding-left: 30px; /* Keep indentation for the header */
  margin-bottom: -25px; /* Add a small margin below the header */
}

.list-view > div {
  width: 100%; /* Ensure each section takes full width */
  margin-top: 0; /* Remove top margin to reduce space */
}


@media (max-width: 768px) {
  .kanban-view {
    grid-template-columns: 1fr; /* Stack sections vertically on smaller screens */
  }

  .page-container {
    grid-template-columns: 1fr; /* Stack content and buttons vertically */
  }

  .button-container {
    flex-direction: row; /* Align buttons horizontally */
    justify-content: center;
    align-items: center;
    margin-top: 20px;
  }
}

</style>
