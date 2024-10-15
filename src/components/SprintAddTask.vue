<template>
  <div>
    <button @click="openModal" class="add-task-button">Add Task</button>
    <!-- Modal for selecting sprint and adding tasks -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <button @click="closeModal" class="close-button">X</button>
        <div class="select-group">
          <label for="sprint-select">Select Sprint:</label>
          <select id="sprint-select" v-model="selectedSprint" class="select-dropdown">
            <option v-for="sprint in sprintTasks" :key="sprint.id" :value="sprint">{{ sprint.name }}</option>
          </select>
        </div>
        <div class="task-group">
          <label>Select Tasks:</label>
          <div class="task-list">
            <div v-for="task in allTasks" :key="task.id" class="task-item">
              <input type="checkbox" :id="'task-' + task.id" :value="task" v-model="selectedTasks" />
              <label :for="'task-' + task.id">{{ task.name }}</label>
            </div>
          </div>
        </div>
        <button @click="addTasksToSprint" class="submit-button">Add Selected Tasks</button>
      </div>
    </div>
  </div>
</template>

<script>
import { collection, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/init.js';

export default {
  name: 'SprintAddTaskButton',
  data() {
    return {
      sprintTasks: [], // Array to hold sprints
      allTasks: [], // Array to hold all tasks
      showModal: false,
      selectedSprint: null,
      selectedTasks: [] // Array to hold selected tasks
    };
  },
  methods: {
    async fetchSprints() {
      try {
        const sprintCollection = collection(db, 'sprints');
        const sprintSnapshot = await getDocs(sprintCollection);
        this.sprintTasks = sprintSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
      } catch (error) {
        console.error("Error fetching sprints:", error);
      }
    },
    async fetchTasks() {
      try {
        const tasksCollection = collection(db, 'tasks'); // Adjust collection name if needed
        const tasksSnapshot = await getDocs(tasksCollection);
        this.allTasks = tasksSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    },
    openModal() {
      this.showModal = true;
      this.fetchSprints();
      this.fetchTasks();
    },
    closeModal() {
      this.showModal = false;
      this.selectedSprint = null;
      this.selectedTasks = [];
    },
    async addTasksToSprint() {
      if (!this.selectedSprint) {
        alert("Please select a sprint.");
        return;
      }

      if (this.selectedTasks.length === 0) {
        alert("Please select at least one task.");
        return;
      }

      const sprintDocRef = doc(db, 'sprints', this.selectedSprint.id);
      const updatedTasks = [...this.selectedSprint.tasks, ...this.selectedTasks];

      await updateDoc(sprintDocRef, {
        tasks: updatedTasks
      });

      this.closeModal();
    }
  }
};
</script>

<style scoped>
.add-task-button {
  position: fixed;
  bottom: 80px;
  left: 20px;
  background-color: #4CAF50;
  border: none;
  padding: 10px 20px;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  outline: none;
  height: 45px;
  width: 135px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: black;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.select-group,
.task-group {
  margin-bottom: 20px;
}

.select-dropdown {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
}

.submit-button {
padding: 8px 16px; /* Smaller padding for a smaller button */
background-color: #4B69B5;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
font-size: 16px; /* Smaller font size */
height: 45px; /* Smaller height */
width: 200px; /* Auto width to fit content */
display: block; /* Ensure it behaves as a block element for centering */
margin: 20px auto 0; /* Center horizontally with auto margin */
}
</style>
