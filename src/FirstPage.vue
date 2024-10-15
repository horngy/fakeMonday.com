<template>
  <div class="page-container">
    <div class="section left-outer">
      <div class="left-inner">
        <h2>All Tasks</h2>
        <div v-if="allTasks.length">
          <TaskCard
            v-for="task in allTasks"
            :key="task.id"
            :task="task"
            @update-task="updateTask"
            @delete-task="deleteTask"
            @update-history="updateHistory"
            :class="{ selected: isSelected(task) }"
            @task-expanded="handleTaskExpand(task)"
            @task-edit="handleTaskEdit(task)"
            v-on:click="selectTask(task)"
          />
        </div>
        <div v-else>
          <p>No tasks available.</p>
        </div>
      </div>
      <button @click="addSelectedTasks" :disabled="!selectedTasks.length">Add Selected Tasks</button>
    </div>

    <div class="section right-outer">
      <div class="right-inner">
        <h2>Tasks for {{ sprint.name }}</h2>
        <div v-if="sprintTasks.length">
          <TaskCard
            v-for="task in sprintTasks"
            :key="task.id"
            :task="task"
            @update-task="updateTask"
            @delete-task="deleteTask"
            @update-history="updateHistory"
            :class="{ selected: isSelected(task) }"
            @task-expanded="handleTaskExpand(task)"
            @task-edit="handleTaskEdit(task)"
            v-on:click="selectTask(task)"
          />
        </div>
        <div v-else>
          <p>No tasks for this sprint.</p>
        </div>
      </div>
      <button @click="removeSelectedTasks" :disabled="!selectedTasks.length">Move Back Selected Tasks</button>
    </div>
  </div>
    <button class="close-button" @click="goBackToSprint">
          <img src="@/assets/image-4.png" alt="Close" class="close-icon">
    </button>
</template>



<script>
import TaskCard from '@/components/FirstPageTaskCard.vue'; // Import your TaskCard component
import { db } from "@/firebase/init.js";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, setDoc, addDoc } from "firebase/firestore";

export default {
  components: {
    TaskCard, // Register the TaskCard component
  },
  data() {
    return {
      sprint: {},
      allTasks: [],
      sprintTasks: [],
      selectedTasks: [],
    };
  },
  async created() {
    const sprintName = this.$route.params.name; // Get sprint name from route params
    await this.fetchSprintTasks(sprintName); // Fetch sprint tasks
    await this.fetchAllTasks(); // Fetch all tasks
  },
  methods: {
    goBackToSprint() {
      this.$router.push({ name: 'SprintView' }); // Make sure to replace 'SprintPage' with the actual route name of your sprint page
    },
    async updateTask(updatedTask) {
      try {
        // Check if the task is in the general task collection (left-inner) or sprint (right-inner)
        const isSprintTask = this.sprintTasks.some(task => task.identity === updatedTask.identity);
        
        if (isSprintTask) {
          // If it's a sprint task, update the task within the sprint document
          const sprintRef = doc(db, 'sprints', this.sprint.id);
          
          // Find the index of the task to update within the sprint tasks array
          const taskIndex = this.sprintTasks.findIndex(task => task.identity === updatedTask.identity);
          
          if (taskIndex !== -1) {
            // Update the task in the sprint tasks array
            const updatedSprintTasks = [...this.sprintTasks];
            updatedSprintTasks[taskIndex] = updatedTask;
            const newHis = { action: 'SPRINT BACKLOG updated TASK', timestamp: new Date().toLocaleString(), details:`${this.sprint.name} - ${updatedTask.name}` };
            const hisRef = collection(db, "history");
            await addDoc(hisRef, newHis);
            
            // Update the sprint document with the modified tasks array
            await updateDoc(sprintRef, { tasks: updatedSprintTasks });
          }
        } else {  
          // Otherwise, it's a task in the general task collection (left-inner)
          const newHis = { action: 'PRODUCT BACKLOG updated TASK', timestamp: new Date().toLocaleString(), details: updatedTask.name };
          const hisRef = collection(db, "history");
          await addDoc(hisRef, newHis);
          const taskRef = doc(db, 'tasks', updatedTask.identity);
          await updateDoc(taskRef, updatedTask);
        }

        // Fetch updated tasks for both sections
        await this.fetchAllTasks();
        await this.fetchSprintTasks(this.sprint.name);

      } catch (error) {
        console.error('Error updating task:', error);
      }
    },
    async deleteTask(taskToDelete) {
      try {
        // Check if the task is part of the sprint tasks (right-inner)
        const isSprintTask = this.sprintTasks.some(task => task.identity === taskToDelete.identity);

        if (isSprintTask) {
          // If it's a sprint task, update the task within the sprint document
          const sprintRef = doc(db, 'sprints', this.sprint.id);
          
          // Filter out the task to delete from the sprint tasks array
          const updatedSprintTasks = this.sprintTasks.filter(task => task.identity !== taskToDelete.identity);
          const newHis = { action: 'SPRINT BACKLOG deleted TASK', timestamp: new Date().toLocaleString(), details: `${this.sprint.name} - ${taskToDelete.name}` };
          const hisRef = collection(db, "history");
          await addDoc(hisRef, newHis);
          
          // Update the sprint document with the modified tasks array
          await updateDoc(sprintRef, { tasks: updatedSprintTasks });
        } else {
          // Otherwise, it's a task in the general task collection (left-inner)
          const newHis = { action: 'PRODUCT BACKLOG deleted TASK', timestamp: new Date().toLocaleString(), details: taskToDelete.name };
          const hisRef = collection(db, "history");
          await addDoc(hisRef, newHis);
          const taskRef = doc(db, 'tasks', taskToDelete.identity);
          await deleteDoc(taskRef); // Delete the task from the tasks collection
        }

        // Fetch updated tasks for both sections
        await this.fetchAllTasks();
        await this.fetchSprintTasks(this.sprint.name);

      } catch (error) {
        console.error('Error deleting task:', error);
      }
    },
    async fetchSprintTasks(sprintName) {
      try {
        const sprintCollection = collection(db, 'sprints');
        const q = query(sprintCollection, where('name', '==', sprintName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const sprintDoc = querySnapshot.docs[0];
          this.sprint = { id: sprintDoc.id, ...sprintDoc.data() };
          this.sprintTasks = this.sprint.tasks || [];
        } else {
          console.log('No such sprint!');
        }
      } catch (error) {
        console.error('Error fetching sprint tasks:', error);
      }
    },
    async fetchAllTasks() {
      try {
        const taskCollection = collection(db, 'tasks'); // Assume 'tasks' is your general tasks collection
        const querySnapshot = await getDocs(taskCollection);

        this.allTasks = querySnapshot.docs.map(doc => ({
          identity: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching all tasks:', error);
      }
    },
    handleTaskExpand(expandedTask) {
      // Simply update the task's `isExpanded` property or handle it however you want.
      expandedTask.isExpanded = !expandedTask.isExpanded;
    },
    handleTaskEdit(expandedTask) {
      // Simply update the task's `isExpanded` property or handle it however you want.
      expandedTask.isEditing = !expandedTask.isEditing;
    },
    selectTask(task) {
      // Prevent task selection if it's expanded
      if (!task.isExpanded) {
        const index = this.selectedTasks.findIndex(t => t.id === task.id);
        if (index === -1) {
          // If not selected, add the task to the selectedTasks array
          this.selectedTasks.push(task);
        } else {
          // If already selected, remove it from the array
          this.selectedTasks.splice(index, 1);
        }
      }
    },
    isSelected(task) {
      return this.selectedTasks.some(t => t.id === task.id);
    },
    async addSelectedTasks() {
      try {
        if (!this.sprint.id) {
          throw new Error('Sprint ID is not available.');
        }

        // Update the sprint with new tasks
        const sprintRef = doc(db, 'sprints', this.sprint.id); // Use sprint.id
        const newSprintTasks = [...this.sprintTasks, ...this.selectedTasks];
        await updateDoc(sprintRef, { tasks: newSprintTasks });

        // Remove selected tasks from the general tasks collection
        for (const task of this.selectedTasks) {
          const taskRef = doc(db, 'tasks', task.identity);
          await deleteDoc(taskRef);
        }
        const newHis = { action: 'SPRINT BACKLOG added TASK', timestamp: new Date().toLocaleString(), details: this.sprint.name };
        const hisRef = collection(db, "history");
        await addDoc(hisRef, newHis);

        // Refresh the tasks lists
        await this.fetchAllTasks();
        await this.fetchSprintTasks(this.sprint.name);

        // Clear selected tasks
        this.selectedTasks = [];
      } catch (error) {
        console.error('Error adding selected tasks:', error);
      }
    },
    async removeSelectedTasks() {
      try {
        if (!this.sprint.id) {
          throw new Error('Sprint ID is not available.');
        }

        // Remove tasks from the sprint
        const sprintRef = doc(db, 'sprints', this.sprint.id);
        const updatedSprintTasks = this.sprintTasks.filter(task => !this.selectedTasks.some(selected => selected.id === task.id));
        await updateDoc(sprintRef, { tasks: updatedSprintTasks });

        // Add removed tasks back to the general tasks collection
        for (const task of this.selectedTasks) {
          const taskRef = doc(db, 'tasks', task.identity);
          await setDoc(taskRef, task); // Use setDoc to add or update the task
        }

        const newHis = { action: 'SPRINT BACKLOG removed TASK', timestamp: new Date().toLocaleString(), details: this.sprint.name };
        const hisRef = collection(db, "history");
        await addDoc(hisRef, newHis);

        // Refresh the tasks lists
        await this.fetchAllTasks();
        await this.fetchSprintTasks(this.sprint.name);

        // Clear selected tasks
        this.selectedTasks = [];
      } catch (error) {
        console.error('Error removing selected tasks:', error);
      }
    }
  }
};
</script>


<style scoped>
.page-container {
  position: relative; /* Set the container to relative for absolute positioning of the button */
}
.close-button {
  position: absolute; /* Position the button absolutely within the container */
  top: 10px; /* Adjust this value to move the button vertically */
  right: 20px; /* Adjust this value to move the button horizontally */
  padding: 10px 15px;
  background-color: transparent; /* Red color for close button */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}


.close-icon {
  width: 30px;  /* Adjust size as needed */
  height: 30px;
}

.page-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.section {
  margin-top: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 800px; /* Fixed height for sections */
}

.left-outer, .right-outer {
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Distribute space between inner content and buttons */
}

.left-inner, .right-inner {
  flex: 1;
  overflow-y: auto; /* Scroll if content exceeds height */
  padding: 20px;
}

.task-item {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 15px;
  margin: 10px 0;
  cursor: pointer;
}

.task-item.selected {
  background-color: #d0f0c0; /* Highlight selected tasks */
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  align-self: center; /* Center the button horizontally */
  margin: 10px 0; /* Add gap above and below the button */
}

button:disabled {
  background-color: #a5d6a7;
}
</style>