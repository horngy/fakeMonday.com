<template>
  <div :class="['card', { 'expanded': isExpanded, 'editing': isEditing }]">
    <div v-if="isExpanded" :class="['card-header', statusColor]">
      <div class="form-group">
        <select id="status" v-model="editedTask.status" class="status-select" @change="statusChangedAndSave">
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <button class="close-btn" @click="handleClose">X</button>
    </div>
    <div class="card-body" @click="expandCard">
      <div v-if="!isExpanded" class="minimized-info">
        <div class="story-point">{{ task.storyPoint }}</div>
        <div>Task Name: {{ task.name }}</div>
        <div>Priority: {{ task.priority }}</div>
        <div>
          Tags:
          <span v-for="(tagItem, index) in limitedTags" :key="index" class="tag-item" :style="{ backgroundColor: tagColors[tagItem] || '#ccc' }">
            {{ tagItem }}
          </span>
          <span v-if="task.tags.length > 3">...</span>
        </div>
      </div>
      <div v-if="isExpanded" class="expanded-info">
        <div v-if="!isEditing">

          <!-- Dropdown for selecting a new assignee -->
          <div class="assignee">
            <div class="form-group">
              <!-- Dropdown for selecting assignee -->
              <select v-model="editedTask.assignee" class="assignee-select" @change="assigneeChangedAndSave">
                <option value="">None</option>
                <option v-for="user in users" :key="user.username" :value="user.username">
                  {{ user.username }}
                </option>
              </select>
            </div>
          </div>

          <div class="logtime-graph-section">
            <button class="show-logtime-graph-button" @click="showGraph()">
              Show Time Contribution Graph
            </button>
          </div>

          <div>Task Name: {{ task.name }}</div>
          <div>Priority: {{ task.priority }}</div>
          <div>StoryPoint: {{ task.storyPoint }}</div>
          <div>
            Tags:
            <span v-for="(tagItem, index) in task.tags" :key="index" class="tag-item" :style="{ backgroundColor: tagColors[tagItem] || '#ccc' }">
              {{ tagItem }}
            </span>
          </div>
          <div>Type of the task: {{ task.type }}</div>
          <div>Stages: {{ task.stages }}</div>
          <textarea v-model="editedTask.description" readonly></textarea>
        </div>
        <div v-if="isEditing" class="edit-form">
          <!-- Editable Form for Task Details -->
          <div>
            <label>Task Name:</label>
            <input v-model="editedTask.name" type="text" />
          </div>
          <div>
            <label>Priority:</label>
            <select v-model="editedTask.priority" class="form-select">
              <option value="Urgent">Urgent</option>
              <option value="Important">Important</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label>StoryPoint:</label>
            <select v-model="editedTask.storyPoint" class="form-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>
          <div>
            <label for="tag">Tags:</label>
            <div class="dropdown">
              <div class="tag-container" @click="toggleDropdown">
                <span v-if="tag.length > 0">
                  <span v-for="(tagItem, index) in tag" :key="index" class="tag-item" :style="{ backgroundColor: tagColors[tagItem] || '#ccc' }">
                    {{ tagItem }}
                  </span>
                </span>
                <span v-else class="placeholder">Select tags</span>
              </div>
              <div v-if="showDropdown" class="dropdown-content">
                <label v-for="tagOption in tagOptions" :key="tagOption">
                  <input type="checkbox" :value="tagOption" v-model="tag">
                  {{ tagOption }}
                </label>
              </div>
            </div>
          </div>
          <div>
            <label>Type of the task:</label>
            <select v-model="editedTask.type" class="form-select">
              <option value="Bugtype">Bugtype</option>
              <option value="Storytype">Storytype</option>
            </select>
          </div>
          <div>
            <label>Stages:</label>
            <select v-model="editedTask.stages" class="form-select">
              <option value="Testing">Testing</option>
              <option value="Integration">Integration</option>
              <option value="Development">Development</option>
              <option value="Planning">Planning</option>
            </select>
          </div>

          <div>
            <label>Description:</label>
            <textarea v-model="editedTask.description"></textarea>
          </div>
        </div>
        
        <form id="time-entry-form" @submit.prevent="addTimeEntry" v-if="!isEditing">
          <label for="time-spent">Log Time (hours):</label>
          <input 
            type="number" 
            v-model.number="timeSpent"  
            step="0.5" 
            min="0" 
            required 
          />
          <button type="submit">Log Time</button>  <!-- Trigger the form submission -->
        </form>

        <button class="edit-btn" @click="toggleEdit">{{ isEditing ? 'Save' : 'Edit' }}</button>
        <button class="delete-button" @click="deleteTask">Delete</button>
      </div>

      <!-- Fullscreen overlay for Log Time Graph -->
    <div v-if="showLogTimeGraph" class="modal-overlay">
      <div class="modal-content">
        <button class="close-modal-button" @click="closeGraph()">X</button>
        <!-- Render Log Time Graph for this specific task -->
        <div class="chart-container">
          <LogTimeGraph :logTime="task.logTime" v-if="showLogTimeGraph" />
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script>
import { db } from "@/firebase/init.js";
import { getDocs, collection } from "firebase/firestore";
import LogTimeGraph from "./LogTimeGraph.vue";

export default {
  name: 'TaskCard',
  components: {
    LogTimeGraph,
  },

  props: {
    task: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isExpanded: false,
      isEditing: false,
      editedTask: { ...this.task },
      tag: this.task.tags ? [...this.task.tags] : [], 
      showDropdown: false,
      tagOptions: ['UX', 'UI', 'API', 'Front End', 'Database', 'Testing', 'BackEnd', 'Framework'],
      tagColors: {
        UX: '#FF6F61',
        UI: '#6B5B95',
        API: '#88B04B',
        'Front End': '#F7CAC9',
        Database: '#92A8D1',
        Testing: '#F4A582',
        BackEnd: '#034F84',
        Framework: '#DD4124'
      },
      description: this.task.description || '',
      history: this.task.history || [],
      timeSpent: 0,
      assignee: this.task.assignee,
      users: [],
      showLogTimeGraph: false,
    };
  },
  computed: {
    statusColor() {
      switch (this.editedTask.status) {
        case 'in-progress':
          return 'header-blue';
        case 'completed':
          return 'header-green';
        default:
          return 'header-default';
      }
    },
    limitedTags() {
      return this.task.tags.slice(0, 3);
    },
  },
  methods: {
    statusChangedAndSave() {
      // Save immediately on status change
      this.addToHistory('status changed');
      this.$emit('update-task', this.editedTask);
      this.$emit('update-history', this.history);
    },
    assigneeChangedAndSave(){
      this.addToHistory('assignee changed');
      this.$emit('update-task', this.editedTask);
      this.$emit('update-history', this.history);
    },
    toggleEdit() {
      if (this.isEditing) {
        // Sync tags before saving
        this.editedTask.tags = [...this.tag];
        this.addToHistory('task updated');
        this.$emit('update-task', this.editedTask);
        this.$emit('update-history', this.history);
      } else {
        this.editedTask = { ...this.task };
        this.tag = [...this.editedTask.tags];
      }
      this.isEditing = !this.isEditing;
    },

    async fetchUsers() {
        try {
          const assigneesCollection = collection(db, 'users'); // Reference to the assignees collection
          const assigneesSnapshot = await getDocs(assigneesCollection);
          this.users = assigneesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map documents to an array
      } catch (error) {
          console.error("Error fetching assignees: ", error);
      }
    },
    
    addToHistory(action) {
      this.history.push({
        action: action,
        timestamp: new Date().toLocaleString(),
        details: this.getDescription(action),
      });
    },
    
    getDescription(action) {
      if (action === 'status changed') {
        return `Status changed to ${this.editedTask.status}`;
      } else if (action === 'task updated') {
        return `Updated task: ${this.editedTask.name} with priority ${this.editedTask.priority}, story point ${this.editedTask.storyPoint}, and tags ${this.editedTask.tags.join(', ')}`;
      }
      return '';
    },
    
    deleteTask() {
      this.$emit('delete-task', this.task.id, this.task.name);
      this.addToHistory('deleted');
      this.$emit('update-history', this.history);
    },
    
    handleClose() {
      if (this.isEditing) {
        const confirmExit = confirm('You have unsaved changes. Are you sure you want to exit without saving?');
        if (confirmExit) {
          this.isEditing = false;
        }
      } else {
        this.isExpanded = false;
      }
    },
    
    async expandCard() {
      await this.fetchUsers();
      this.isExpanded = true;
    },
    
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    addTimeEntry() {
      this.$emit('log-time', this.task, this.timeSpent); // Emit the event with timeSpent as the payload
      this.timeSpent = 0; // Reset the input field after logging time
    },

    showGraph() {
      this.showLogTimeGraph = true;
    },

    closeGraph() {
      this.showLogTimeGraph = false;
    },

  },
};
</script>



<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

.card {
  left: 10px;
  top: 20px;
  width: 93%;
  height: 170px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  color: rgb(228, 228, 228);
  background-color: #555B6E;
  border-radius: 10px;
  font-family: 'Roboto', sans-serif;
  margin: 10px
}

.story-point {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  background-color: #f1f1f1;
  padding: 5px;
  border-radius: 5px;
}

.assignee {
  position: absolute;
  top: 78px;
  right: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  background-color: #f1f1f1;
  padding: 5px;
  border-radius: 5px;
}

.logtime-graph-section {
  position: absolute;
  top: 110px;
  right: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  background-color: #f1f1f1;
  padding: 5px;
  border-radius: 5px;
  margin-top: 10px;
}

.card.expanded {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 835px;
  height: 620px; /* Default height when expanded */
  z-index: 1000;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.3);
  transition: height 0.3s ease;
}

.card.editing {
  height: 855px; /* Height when editing */
  overflow-y: auto;
}
.header-default {
  background-color: rgb(26, 22, 22); /* No color for 'Not Started' */
}

.header-blue {
  background-color: rgb(126, 170, 250);
}

.header-green {
  background-color: rgb(82, 136, 82);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  color: white;
  border-bottom: 1px solid #f8f9fa;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.card-number, .card-status {
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: white;
}

.card-body {
  padding: 20px;
}

.minimized-info, .expanded-info {
  margin-top: 10px;
  text-align: left;
  display: flex;
  flex-direction: column;
}

textarea {
  width: 100%;
  height: 200px;
  margin-top: 20px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Roboto', sans-serif;
  resize: none;
}

textarea:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 5px rgba(106, 17, 203, 0.5);
}

.edit-btn {
  margin-top: 10px;
  padding: 5px 10px;
  border: 2px solid #0056b3;
  border-radius: 5px;
  background-color: #61acfd;
  color: rgb(255, 255, 255);
  font-size: 14px;
  cursor: pointer;
}

.edit-btn:hover {
  background-color: #0056b3;
}
.edit-form {
  max-height: 650px; /* Adjust this height as needed */
  overflow-y: auto;
  padding-right: 15px; /* Ensure scrollbar doesn't overlap content */
}

.edit-form input,
.edit-form select,
.edit-form textarea {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.delete-button {
  margin-top: 10px;
  margin-bottom: 10px;
  background-color: #ff8173; /* Red background */
  color: #fff; /* White text */
  border: 2px solid #ff1313;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-button:hover {
  background-color: #c0392b; /* Darker red on hover */
}
.tag-container {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
  background-color: #ffffff;
  margin-bottom: 10px;
}

.tag-item {
  /* background-color: #f1f1f1; Light gray background */
  color: #fff;
  padding: 5px 8px;
  margin: 5px;
  border-radius: 5px;
  font-size: 14px;
}

.placeholder {
  color: #aaa;
}
.dropdown {
  position: relative;
  display: block; /* Full-width display */
}

.dropdown-button {
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  background-color: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: 5px;
  text-align: left;
  width: 100%;
}

.dropdown-content {
  position: absolute;
  top: 100%; 
  left: 0; 
  background-color: white;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  max-height: 150px; 
  overflow-y: auto;  
  width: 100%;
  border: 1px solid #ccc;
  padding: 10px;
}

.dropdown-content label {
  color:#000000;
  display: inline-flex; 
  align-items: center; 
  flex-direction: column; 
  margin: 5px; 
  cursor: pointer;
}

.dropdown-content label input[type="checkbox"] {
  margin-right: 5px;
}

.dropdown-content label input[type="checkbox"] {
  margin-right: 5px;
}

.status-select {
  display: inline-block; /* Ensures the select box behaves like an inline element */
  width: 100%; /* Full width */
  padding: 10px; /* Padding inside the select box */
  background-color: transparent; /* Background color */
  color: #ffffff; /* Text color */
  font-size: 16px; /* Font size */
  font-weight: bold;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease; /* Transition effect for border color */
  appearance: none; /* Remove default dropdown arrow */
  -webkit-appearance: none; /* For Safari */
  -moz-appearance: none;
  cursor: pointer; /* Pointer cursor on hover */
  border: none; /* Remove the border */
}

/* Optionally, you can also style the focus state to ensure it remains visually appealing without a border */
.status-select:focus {
  outline: none; /* Remove default outline */
  box-shadow: 0 0 5px transparent; /* Optional shadow effect on focus */
}

/* Style the options */
.status-select option {
  padding: 10px; /* Padding for each option */
  background-color: #ffffff; /* Option background color */
  color: #333; /* Option text color */
}

/* Change option styles on hover */
.status-select option:hover {
  background-color: #f1f1f1; /* Light gray on hover */
}

.assignee-select {
  position: absolute;
  top: 0px;
  right: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  background-color: #f1f1f1;
  padding: 5px;
  border: none; /* Remove the border */
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease; /* Transition effect for border color */
  appearance: none; /* Remove default dropdown arrow */
  -webkit-appearance: none; /* For Safari */
  -moz-appearance: none;
  cursor: pointer; /* Pointer cursor on hover */
  border-radius: 8px;
}

/* Optionally, you can also style the focus state to ensure it remains visually appealing without a border */
.assignee-select:focus {
  outline: none; /* Remove default outline */
  box-shadow: 0 0 5px transparent; /* Optional shadow effect on focus */
}

/* Style the options */
.assignee-select option {
  padding: 10px; /* Padding for each option */
  background-color: #ffffff; /* Option background color */
  color: #333; /* Option text color */
}

/* Change option styles on hover */
.assignee-select option:hover {
  background-color: #f1f1f1; /* Light gray on hover */
}

/* Button styling */
.show-logtime-graph-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.show-logtime-graph-button:hover {
  background-color: #45a049;
}

/* Modal overlay styling for the fullscreen graph */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent black background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Ensure it's on top of everything */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 800px;
  height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* Make the chart container flexible */
.chart-container {
  width: 100%;
  height: 100%;
}

/* Full width and height for the canvas */
canvas {
  width: 100% !important;
  height: 100% !important;
}

.close-modal-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: red;
  color: white;
  border: none;
  width: 40px; /* Set equal width and height */
  height: 40px; /* Set equal width and height */
  border-radius: 50%; /* Make it a perfect circle */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px; /* Adjust font size for 'X' */
  cursor: pointer;
  line-height: 0; /* Remove default line height */
  padding: 0; /* Remove padding */
}

.close-modal-button:hover {
  background-color: darkred;
}

</style>