<template>
  <div>
    <button class="add-task-box" @click="toggleInputGroup">
      Add Task
    </button>

    <div v-if="showInput" class="task-card">
      <div class="task-card-header">
        <span class="task-title">New Task</span>
        <button class="close-button" @click="toggleInputGroup">&times;</button> 
      </div>
      <hr>
      <div class="task-content">
        <div class="form-group">
          <label for="task-name">Task:</label>
          <input type="text" id="task-name" v-model="taskName" class="form-input"/>
        </div>

        <div class="form-group">
          <label for="priority">Priority:</label>
          <select id="priority" v-model="priority" class="form-select">
            <option value="">Select priority</option>
            <option value="Urgent">Urgent</option>
            <option value="Important">Important</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div class="form-group">
          <label for="story-point">Story Point:</label>
          <select id="story-point" v-model="storyPoint" class="form-select">
            <option value="">Select story point</option>
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

        <div class="form-group">
          <label for="tag">Tag:</label>
          <div class="dropdown">
            <div class="tag-container" @click="toggleDropdown">
              <span v-if="tag.length > 0">
                <!-- Display each tag as a box -->
                <span v-for="(tagItem, index) in tag" :key="index" class="tag-item">
                  {{ tagItem }}
                </span>
              </span>
              <span v-else class="placeholder">Choose tags</span>
            </div>
            <div v-if="showDropdown" class="dropdown-content">
              <label v-for="tagOption in tagOptions" :key="tagOption">
                <input type="checkbox" :value="tagOption" v-model="tag">
                {{ tagOption }}
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="task-type">Type of Task:</label>
          <select id="task-type" v-model="type" class="form-select">
            <option value="">Select type</option>
            <option value="Bugtype">Bugtype</option>
            <option value="Storytype">Storytype</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="status">Status:</label>
          <select id="status" v-model="status" class="form-select" disabled>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div class="form-group">
          <label for="stages">Stages:</label>
          <select id="stages" v-model="stages" class="form-select">
            <option value="">Select Stages</option>
            <option value="Testing">Testing</option>
            <option value="Integration">Integration</option>
            <option value="Development">Development</option>
            <option value="Planning">Planning</option>
          </select>
        </div>

        <div class="form-group">
          <label for="assignee">Assignee:</label>
          <select id="assignee" v-model="assignee" class="form-select">
            <option value="">Select Assignee</option>
            <option v-for="user in users" :key="user.username" :value="user.username">
              {{ user.username }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Description:</label>
          <textarea id="description" v-model="description" class="form-input" rows="5" cols="50" style="resize: none;"></textarea>
        </div>
      </div>
      <button @click="createTask" class="create-task-button">Create Task</button>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase/init.js'; // Adjust the import based on your Firebase setup
import { collection, getDocs } from 'firebase/firestore';

export default {
  name: 'AddTaskButton',
  data() {
    return {
      showInput: false,
      showDropdown: false,
      taskName: '',
      priority: '',
      storyPoint: '',
      tag: [],
      tagOptions: ['UX', 'UI', 'API', 'Front End', 'Database', 'Testing', 'BackEnd', 'Framework'],
      type: '',
      status: 'not-started', // Set default value for status
      stages: '',
      assignee: '', // Set default value for assignee
      description: '',
      users: [], // List of users fetched from the database
    };
  },

  methods: {
    toggleInputGroup() {
      this.fetchUsers();
      this.showInput = !this.showInput;
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
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    createTask() {
      let valid = true;

      if (this.taskName.trim() === '') {
        valid = false;
        alert('Task name is required');
      }

      if (valid) {
        const task = {
          name: this.taskName,
          priority: this.priority,
          storyPoint: this.storyPoint,
          tags: this.tag,
          type: this.type,
          status: this.status,
          stages: this.stages,
          assignee: this.assignee,
          description: this.description,
        };
        this.$emit('create-task', task);
        this.resetForm();
        this.showInput = false;
      }
    },

    resetForm() {
      this.taskName = '';
      this.priority = '';
      this.storyPoint = '';
      this.tag = [];
      this.type = '';
      this.status = 'not-started', // Set default value for status
      this.stages = '',
      this.assignee = '', // Set default value for assignee
      this.description = '';
    }
  }
};
</script>

<style scoped>
/* General dark theme styles */
body {
  background-color: #464646;
}

.add-task-box {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: #555B6E;
  border: none;
  padding: 10px 20px;
  color: rgb(255, 255, 255);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  outline: none;
  height: 45px;
  width: 135px
}

.add-task-box:hover {
  background-color: #797777;
}

.task-card {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px; /* Adjusted width */
  padding: 20px;
  background-color: #686868; /* Dark grey background */
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.5);
  color: #e0e0e0; /* Light grey text */
  z-index: 1000;
  overflow-y: auto;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.task-title {
  font-size: 18px;
  font-weight: bold;
  text-align: left;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #e0e0e0;
}

.close-button:hover {
  color: #1b1b1b;
}

.task-content {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #cccccc; /* Slightly darker text */
}

.form-input, .form-select {
  width: 100%;
  padding: 10px;
  background-color: #818181;
  color: #dbdada;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: default;
}

.form-input:focus, .form-select:focus, textarea:focus{
  outline: none;
  border-color: #777;
}

.create-task-button {
  width: 180px;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #4d4d4d;
  color: #e0e0e0;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 20px;
}

.create-task-button:hover {
  background-color: #5e5e5e;
}

.tag-container {
  padding: 10px;
  border: 1px solid #555;
  border-radius: 5px;
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
  background-color: #818181;
  margin-bottom: 10px;
}

.tag-item {
  background-color: #dbdada; /* Light gray background */
  color: #333;
  padding: 5px 8px;
  margin: 5px;
  border-radius: 5px;
  font-size: 14px;
}

.placeholder {
  color: #ffffff; /* Light gray color for placeholder text */
  background-color: transparent; /* Remove background color */
  border: none; /* Remove border */
  padding: 0; /* Remove padding */
  margin: 0; /* Remove margin */
  display: flex;
  align-items: center;
}

.dropdown-button {
  padding: 10px;
  background-color: #818181;
  color: #dbdada;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.dropdown-content {
  display: flex;
  flex-direction: column;
  background-color: #818181;
  border: 1px solid #333;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-content label {
  margin-bottom: 5px;
  color: #dbdada;
}

.dropdown-content input {
  margin-right: 10px;
}

.dropdown {
  position: relative;
}
</style>

