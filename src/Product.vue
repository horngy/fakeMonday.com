<template>
  <div id="product">
    <div class="main-content">
      <!-- Left side: Task Cards -->
      <div class="task-section">
        <!-- Add Task Button -->
        <AddTaskButton class="add-task-button" @create-task="addTask" />

        <!-- Task Container -->
        <div v-if="filteredTasks.length > 0" class="task-container">
          <div v-for="task in filteredTasks" :key="task.id">
            <TaskCard 
              :task="task" 
              @delete-task="removeTask" 
              @update-task="updateTaskDetails"  
            />
          </div>
        </div>
      </div>

      <!-- Vertical Divider with its own background -->
      <div class="divider-section">
        <div class="vertical-divider"></div>
      </div>

      <!-- Right side: Filter and Sort -->
      <div class="top-bar">
        <div class="dropdown">
          <button class="dropdown-btn" @click="toggleFilters">
            Filters & Sort Options
          </button>

          <transition name="dropdown">
            <div v-if="showFilters" class="filters-container">
              <button class="sort-btn" @click="sortTasksByPriority">
                Sort by Priority ({{ isAscendingPriority ? 'Ascending' : 'Descending' }})
              </button>

              <button class="sort-btn" @click="sortTasksByDateAdded">
                Sort by Date Added ({{ isAscendingDate ? 'Ascending' : 'Descending' }})
              </button>

              <div class="filter-container">
                <h5>Filter by Tag</h5>
                <div class="tag-list">
                  <label v-for="tag in tags" :key="tag">
                    <input type="checkbox" :value="tag" v-model="selectedTags" />
                    {{ tag }}
                  </label>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Vertical Divider with its own background -->
    <div class="divider-section">
      <div class="vertical-divider"></div>
    </div>

    <!-- Right side: Filter and Sort -->
    <div class="top-bar">
      <div class="dropdown">
        <button class="dropdown-btn" @click="toggleFilters">
          Filters & Sort Options
        </button>

        <transition name="dropdown">
          <div v-if="showFilters" class="filters-container">
            <button class="sort-btn" @click="sortTasksByPriority">
              Sort by Priority ({{ isAscendingPriority ? 'Ascending' : 'Descending' }})
            </button>

            <button class="sort-btn" @click="sortTasksByDateAdded">
              Sort by Date Added ({{ isAscendingDate ? 'Ascending' : 'Descending' }})
            </button>

            <div class="filter-container">
              <h5>Filter by Tag</h5>
              <div class="tag-list">
                <label v-for="tag in tags" :key="tag">
                  <input type="checkbox" :value="tag" v-model="selectedTags" />
                  {{ tag }}
                </label>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
    <AddTaskButton class="add-task-button" @create-task="addTask" />
  </div>
</template>

<script>
import { cardRef, db, historyRef } from "@/firebase/init.js";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useCollection } from "vuefire";
import AddTaskButton from './components/Button.vue';
import TaskCard from './components/TaskCard.vue';

export default {
  name: 'ProductView',
  components: {
    TaskCard,
    AddTaskButton
  },

  data() {
    return {
      tasks: [],
      tags: ['UX', 'UI', 'API', 'Front End', 'Database', 'Testing', 'BackEnd', 'Framework'], // Available tags
      selectedTags: [], // Tags selected for filtering
      isAscendingPriority: true, // Track the sorting order for priority
      isAscendingDate: true, // Track the sorting order for date added
      showFilters: false, // Boolean to toggle visibility of filters
      history: [], // Array to store history logs
    };
  },

  computed: {
    filteredTasks() {
      if (this.selectedTags.length === 0) {
        return this.tasks;
      }
      return this.tasks.filter(task => 
        this.selectedTags.every(tag => task.tags.includes(tag))
      );
    }
  },

  async mounted(){
    await this.fetchTasksFromDatabase();
  },

  methods: {  
    toggleHistorySortOrder() {
      this.isAscendingHistory = !this.isAscendingHistory;
      this.sortHistory();
    },

    sortHistory() {
      this.history.sort((a, b) => {
        // Convert the timestamp strings into Date objects
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);

        return this.isAscendingHistory
          ? dateA - dateB // Ascending order
          : dateB - dateA; // Descending order
      });
    },

    toggleFilters() {
      this.showFilters = !this.showFilters;
    },

    async fetchTasksFromDatabase(){
      try{
        const cardCollection = useCollection(cardRef);
        this.tasks = cardCollection;
        const hisCollection = useCollection(historyRef);
        this.history = hisCollection;
        this.sortHistory();
      } catch (error){
        alert("Error fetching tasks");
      }
    },

    async addTask(task) {
      if (task) {
        const newTask = { ...task, id: Date.now(), dateAdded: new Date().getTime(), completionDate: null, logTime: [] };

        try {
          const tasksRef = collection(db, "tasks");
          await addDoc(tasksRef, newTask);

          const newHis = { action: 'PRODUCT BACKLOG created task', timestamp: new Date().toLocaleString(), details: newTask.name };
          const hisRef = collection(db, "history");
          await addDoc(hisRef, newHis);

          await this.fetchTasksFromDatabase();
        } catch (error) {
          alert(`Error creating task: ${error.message}`);
        }

        this.sortTasksByPriority();
      }
    },

    async removeTask(taskId, taskName) {
      try {
        const newHis = { action: 'PRODUCT BACKLOG deleted task', timestamp: new Date().toLocaleString(), details: taskName };
        await deleteDoc(doc(db, "tasks", taskId));
      
        const hisRef = collection(db, "history");
        await addDoc(hisRef, newHis);

        await this.fetchTasksFromDatabase();   
      } catch (error) {
        alert("Error deleting task");
      }
    },

    async updateTaskDetails(updatedTask) {
      try {
        const taskDetails = doc(db, "tasks", updatedTask.id);
        await updateDoc(taskDetails, updatedTask);

        const newHis = { action: 'PRODUCT BACKLOG updated task', timestamp: new Date().toLocaleString(), details: updatedTask.name };
        const hisRef = collection(db, "history");
        await addDoc(hisRef, newHis);

        await this.fetchTasksFromDatabase();
      } catch (error) {
        alert("Error updating the task");
      }
    },

    async sortTasksByPriority() {
      const priorityMap = {
        'Urgent': 1,
        'Important': 2,
        'Medium': 3,
        'Low': 4,
      };

      if (this.isAscendingPriority) {
        this.tasks.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
      } else {
        this.tasks.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);
      }

      this.isAscendingPriority = !this.isAscendingPriority;
    },

    async sortTasksByDateAdded() {
      if (this.isAscendingDate) {
        this.tasks.sort((a, b) => a.dateAdded - b.dateAdded);
      } else {
        this.tasks.sort((a, b) => b.dateAdded - a.dateAdded);
      }

      this.isAscendingDate = !this.isAscendingDate;
      this.tasks = [...this.tasks];
    },


  }
};
</script>

<style>
/* General styling for the whole app */
/* General styling for the whole app */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

/* Flexbox layout for main content */
.main-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  position: relative;
}

/* Background that spans across both tasks and filters */
.main-content::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, #B993D6, #8CA6DB); /* Gradient background */
  z-index: -1; /* Ensure the background stays behind everything */
}

/* Task Section Styling */
.task-section {
  position: relative;
  height: 100vh;
  flex-grow: 1;
  overflow-y: auto; /* Enable scrolling for the task section */
  padding-left: 20px;
  padding-right: 10px;
}

/* Task container styling */
.task-container {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  flex-grow: 1;
}

/* Divider Section styling */
.divider-section {
  background-color: #f5f5f5; /* Background color independent of task section */
  position: fixed;
  right: 260px; /* Adjust the value as needed */
  top: 0;
  bottom: 0;
  width: 5px;
  z-index: 1; /* Ensure it stays on top */
}

/* Vertical divider */
.vertical-divider {
  width: 2px;
  background-color: #ccc;
  height: 100vh; /* Full viewport height */
  margin: 0;
}

/* Top bar to hold the Filter & Sort button */
.top-bar {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  margin-right: 20px;
  top: 30px;
  position: relative;
  z-index: 1; /* Keep it on top of the background */
}

/* Dropdown button */
.dropdown-btn {
  width: 200px;
  padding: 10px 15px;
  background-color: #555B6E;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

.dropdown-btn:hover {
  background-color: #a1a1a1;
}

/* Filters container (hidden initially, shown when toggled) */
.filters-container {
  margin-top: 10px;
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 2; /* Ensure it stays above the background */
  width: 200px;
  padding: 10px;
  border-radius: 5px;
}

/* Filter container styling */
.filter-container {
  text-align: left;
}

.tag-list label {
  display: block;
  margin-bottom: 10px;
}

/* Sort button */
.sort-btn {
  padding: 10px 15px;
  background-color: #88bbf5;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

.sort-btn:hover {
  background-color: #629cf3;
}

.task-section::-webkit-scrollbar {
  width: 10px;
}

.task-section::-webkit-scrollbar-thumb {
  background: #666e72;
  border-radius: 5px;
}

.task-section::-webkit-scrollbar-thumb:hover {
  background: #4b69b5;
}


</style>