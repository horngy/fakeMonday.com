<template>
  <div class="sprint">
    <br>
    <div 
      v-for="sprint in filteredTasks" 
      :key="sprint.id"
      class="sprint-container" 
      :class="getSprintClass(sprint.selectedAction)"
      @click="goToSprintPage(sprint)"
    >
      <div class="sprint-header">
        <div class="sprint-title">{{ sprint.name }}</div>
        <div class="sprint-date">
          Start Date: {{ convertToDate(sprint.deadlineRange[0]) }}  
          <br>
          End Date: {{  convertToDate(sprint.deadlineRange[1]) }}
        </div>
        <div class="dropdown-wrapper">
          <select 
            
            class="dropdown-button" 
            
            v-model="sprint.selectedAction" 
            
            @change="handleDropdownChange($event, sprint)" 
            
            @click.stop
          
          >
            <option value="Not Started">Not Started</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div class="burndown-chart-section">
          <div class="burndown-chart-section" v-if="sprint.selectedAction !== 'Not Started'">
            <button class="show-burndown-button" @click="showSprintChart(sprint)" @click.stop>
              Show Burndown Chart
            </button>
          </div>
        </div>

        <!-- Fullscreen overlay for Burndown Chart -->
        <div v-if="sprint.showBurndownChart" class="modal-overlay">
          <div class="modal-content" @click.stop>
            <button class="close-modal-button" @click="closeChart(sprint)">X</button>
            <!-- Render BurndownChart for this specific sprint -->
            <BurndownChart 
              :sprint-id="sprint.name"
              :tasks="sprint.tasks"
              :deadlineRange="sprint.deadlineRange"
              v-if="sprint.showBurndownChart" 
            />
          </div>
        </div>

      </div>

      <div class="task-container">
        <div class="task-item" v-for="task in sprint.tasks" :key="task.id">
          <SprintTaskCard :task="task" @delete-task="removeTask" @update-task="updateTaskDetails" />
        </div>
      </div>

      <CountdownTimer
        v-if="sprint"
        :EndDate="convertToDate(sprint.deadlineRange[1])"
        :StartDate="convertToDate(sprint.deadlineRange[0])"
        :started="sprint.selectedAction"
        @countdown-finished="completeSprint(sprint)"
      />

      <div class="assignee-list">
        <p v-if="sprint.productOwner">
          <strong>Product Owner:</strong> {{ sprint.productOwner.username }}
        </p>
        <p v-if="sprint.scrumMaster">
          <strong>Scrum Master:</strong> {{ sprint.scrumMaster.username }}
        </p>
        <strong>Assignees:</strong>
        <ul class="assignee-list-items">
          <li v-for="assignee in sprint.assignees" :key="assignee.id">
            {{ assignee.username }}
            <span v-if="assignee.role">({{ assignee.role }})</span>
          </li>
        </ul>
      </div>
      
      <!-- Integrating SprintEditButton for editing existing sprint -->
      <SprintEditButton
        :sprintData="sprint"
        @update-sprint="updateSprintData"
        class='edit-button'
      />
        <button class="delete-button" @click.stop="deleteSprint(sprint.id)">Delete Sprint</button>
      
    </div>

    <SprintCreateButton :tasks="tasks" @add-tasks="addTasksToSprint" />

    <div class="divider-section">
      <div class="vertical-divider"></div>
    </div>

    <div class="top-bar">
      <div class="dropdown">
        <button class="dropdown-btn" @click="toggleFilters">
          Filter Sprint
        </button>
      
        <transition name="dropdown">
          <div v-if="showSprint" class="filters-container">
            <div class="filter-container">
              <h5>Filter by status</h5>
              <div class="tag-list">
                <label v-for="tag in tags" :key="tag">
                  <input type="checkbox" :value="tag" v-model="selectedSprints" />
                  {{ tag }}
                </label>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase/init.js";
import { addDoc, collection, deleteDoc, doc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import BurndownChart from './components/BurndownChart.vue'; // Import BurndownChart
import CountdownTimer from "./components/CountdownTimer.vue";
import SprintCreateButton from './components/SprintCreateButton.vue';
import SprintEditButton from './components/SprintEditButton.vue';

export default {
  name: 'SprintView',
  components: {
    SprintCreateButton,
    CountdownTimer,
    SprintEditButton,
    BurndownChart, 
  },

  data() {
    return {
      sprintTasks: [],
      showSprint: false,
      sprintCount: 0, // Counter to create unique sprint names
      tags: ['Active', 'Not Started', 'Completed'],
      selectedSprints: [],
      showBurndownChart: false, // Controls whether the Burndown Chart is visible
    };
  },

  computed: {
    filteredTasks() {
      return this.selectedSprints.length === 0 
        ? this.sprintTasks 
        : this.sprintTasks.filter(sprint => this.selectedSprints.includes(sprint.selectedAction));
    }
  },

  methods: {
    async deleteSprint(sprintId) {
      if (confirm('Are you sure you want to delete this sprint?')) {
        try {
          const sprint = this.sprintTasks.find(s => s.id === sprintId);
          const sprintTask = sprint.tasks
          console.log(this.sprintTasks)
          const tasksCollection = collection(db, 'tasks');
          const cleanTaskData = (task) => {
            return {
              assignee: task.assignee || "none",
              completionDate: task.completionDate || null,
              dateAdded: task.dateAdded || null,
              description: task.description || "",
              id: task.id || null,
              name: task.name || "",
              priority: task.priority || "",
              stages: task.stages || "",
              status: task.status || "not-started",
              storyPoint: task.storyPoint || "",
              tags: task.tags || [],
              type: task.type || ""
            };
          };

          // Map each task to clean data and add to Firestore
          await Promise.all(sprintTask.map(task => addDoc(tasksCollection, cleanTaskData(task))));

          
          const sprintRef = doc(db, 'sprints', sprintId);
          await deleteDoc(sprintRef);
          this.sprintTasks = this.sprintTasks.filter(s => s.id !== sprintId);
        } catch (error) {
          console.error("Error deleting sprint:", error);
        }
      }
    },
    
    async completeSprint(sprint) {
      sprint.selectedAction = 'Completed';
      sprint.color = '#4CAD4F';

      const sRef = doc(db, 'sprints', sprint.id);
      await updateDoc(sRef, { color: sprint.color, selectedAction: sprint.selectedAction });

      this.sprintTasks = this.sprintTasks.sort((a, b) => {
        const order = { 'Active': 1, 'Not Started': 2, 'Completed': 3 };
        if (order[a.selectedAction] !== order[b.selectedAction]) {
          return order[a.selectedAction] - order[b.selectedAction];
        }
        return a.name.localeCompare(b.name);
      });
    },

    convertToDate(timestamp) {
      return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    },

    showSprintChart(sprint) {
      sprint.showBurndownChart = true;
    },  

    closeChart(sprint) {
      sprint.showBurndownChart = false;  // closes the modal
    },

    async fetchSprints() {
      try {
          const sprintCollection = collection(db, 'sprints');
          const sprintSnapshot = await getDocs(sprintCollection);
          let sprints = sprintSnapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              color: doc.data().color || 'grey',
              selectedAction: doc.data().selectedAction || 'Not Started',
              createdDate: doc.data().createdDate || new Date().toISOString(),
              deadlineRange: doc.data().deadlineRange || ['No start date', 'No end date'],
              assignees: doc.data().assignees || [],
              showBurndownChart: false 
          }));

          // Sort and update sprintTasks as before
          const order = { 'Active': 1, 'Not Started': 2, 'Completed': 3 };
          sprints = sprints.sort((a, b) => {
              if (order[a.selectedAction] !== order[b.selectedAction]) {
                  return order[a.selectedAction] - order[b.selectedAction];
              }
              return a.name.localeCompare(b.name);
          });
            this.sprintTasks = sprints;

        } catch (error) {
        console.error("Error fetching sprints:", error);
      }
    },

    async addTasksToSprint({ tasks, deadlineRange, assignees, scrumMaster, productOwner }) {
      const newSprintKey = `Sprint ${this.sprintTasks.length + 1}`;
      const sRef = collection(db, "sprints");
      const data = {
        name: newSprintKey,
        color: 'grey',
        tasks: tasks.map(task => task.name),
        selectedAction: 'Not Started',
        deadlineRange: deadlineRange || ['No start date', 'No end date'],
        createdDate: new Date().toISOString(),
        scrumMaster: scrumMaster,
        productOwner: productOwner,
        assignees: assignees || []
      };

      await addDoc(sRef, data);
      this.fetchSprints();
    },

    async handleDropdownChange(event, sprint) {
      const action = event.target.value;
      let color = action === 'Active' ? '#4B69B5' : (action === 'Completed' ? '#4CAD4F' : 'grey');
      
      if (action === 'Active') {
        const activeSprint = this.sprintTasks.find(s => s.selectedAction === 'Active');
        if (activeSprint && activeSprint.id !== sprint.id) {
          alert("Only one sprint can be active at a time.");
          event.target.value = 'Not Started'; 
          return;
        }
      }

      sprint.color = color;
      sprint.selectedAction = action;

      const sRef = doc(db, 'sprints', sprint.id);
      await updateDoc(sRef, { color, selectedAction: action });
      this.sprintTasks.sort(this.sortSprints);
    },

    sortSprints(a, b) {
      const order = { 'Active': 1, 'Not Started': 2, 'Completed': 3 };
      return order[a.selectedAction] - order[b.selectedAction] || a.name.localeCompare(b.name);
    },

    getSprintClass(status) {
      return status === 'Active' ? 'sprint-active' : (status === 'Completed' ? 'sprint-completed' : 'sprint-not-started');
    },
    
    goToSprintPage(sprint) {
      // Only navigate if the sprint's current state is valid
      if (sprint.selectedAction === 'Active' || sprint.selectedAction === 'Completed') {
        // Redirect to the sprint page
        this.$router.push({ name: 'SecondPage', params: { name: sprint.name } });
      } else if (sprint.selectedAction === 'Not Started') {
        // Redirect to the add task page
        this.$router.push({ name: 'FirstPage', params: { name: sprint.name } });
      }
      // Do nothing if the status is 'Completed' or any other status
    },

    toggleFilters() {
      this.showSprint = !this.showSprint;
    },

    async updateSprintData(updatedSprint) {
      const sprintRef = doc(db, 'sprints', updatedSprint.id); // Ensure we're using the correct ID
      
      console.log(updatedSprint.assignees)
      console.log(updatedSprint.scrumMaster)
      console.log(updatedSprint.productOwner)
      console.log(updatedSprint.deadlineRange)

      const updateSprint = {
        assignees: updatedSprint.assignees,
        scrumMaster: updatedSprint.scrumMaster,
        productOwner: updatedSprint.productOwner,
        deadlineRange: updatedSprint.deadlineRange
      }
      
      await updateDoc(sprintRef, updateSprint)
      await this.fetchSprints(); // Refresh sprint data
    },

  },

  async mounted() {
    await this.fetchSprints();
  },
};
</script>

<style scoped>
.sprint {
  position: relative;
  padding: 20px;
  background: linear-gradient(to right, #292929, #222222);
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 40px;
  overflow-y: auto;
}

.sprint-container {
  border-radius: 10px;
  padding: 20px;
  height: auto;
  width: 87%;
  max-width: calc(100% - 260px);
  margin-right: auto;
  transition: background-color 0.5s ease;
  cursor: pointer;
  position: relative;
  margin-bottom: 20px;
}

.task-container, .assignee-list, .burndown-chart-section {
  overflow-y: auto; /* Add this to ensure children don't exceed container height */
}

/* Optional: Add scrollbar styling (for modern browsers) */
.sprint::-webkit-scrollbar {
  width: 10px;
}

.sprint::-webkit-scrollbar-thumb {
  background: #666e72;
  border-radius: 5px;
}

.sprint::-webkit-scrollbar-thumb:hover {
  background: #4b69b5;
}

.sprint-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
}

.sprint-date {
  font-size: 24px;
}

.dropdown-wrapper {
  position: absolute;
  top: 10px;
  left: 10px;
}

.dropdown-button {
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
  background-color: white;
  color: black;
}

/* Sprint status colors */
.sprint-active {
  background: linear-gradient(to right, #204a6d, #58758b); /* Medium blue for active sprints */
}

.sprint-completed {
  background: linear-gradient(to right, #164b1a, #466848); /* Calming green for completed sprints */
}

.sprint-not-started {
  background: linear-gradient(to right, #313536, #666e72);/* Soft grey for not started sprints */
}

.filters-container {
  margin-top: 30px;
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: black;
  z-index: 2;
  width: 200px;
  padding: 10px;
  border-radius: 5px;
}

.top-bar {
  position: fixed;
  top: 100px;
  right: 1px;
  border: none;
  padding: 5px 10px;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  outline: none;
  height: 45px;
  width: 135px; /* Set width to ensure consistency */
}

/* Filter container styling */
.filter-container {
  text-align: left;
}

.tag-list label {
  display: block;
  margin-bottom: 10px;
}

.dropdown-btn:hover {
  background-color: #a1a1a1;
}

.dropdown-btn {
  width: 200px;
  padding: 10px 15px;
  background-color: #555B6E;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  pointer-events: auto;
}

.divider-section {
  background-color: #f5f5f5;
  position: fixed;
  right: 260px;
  top: 0;
  bottom: 0;
  width: 5px;
  z-index: 1;
}

.vertical-divider {
  width: 2px;
  background-color: #ccc;
  height: 100vh;
  margin: 0;
}

/* Button to trigger Burndown Chart modal */
.show-burndown-button {
  position: absolute;
  right: 40px;
  bottom: 110px;
  padding: 10px 30px;
  background-color: #4B69B5;
  color: white;
  border: 2px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  
}

/* Modal overlay for the Burndown Chart */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure the modal is on top */
}

/* Modal content */
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  height: 80%; /* Adjust height if necessary */
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.5);
  position: relative;
}

/* Close button for modal */
.close-modal-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  color: black;

}
.edit-button {
  position: absolute;
  top: 33px; /* Adjust as necessary */
  right: 40px; /* Adjust as necessary */
  border: 2px solid transparent;
  border-radius: 5px;
}
.assignee-list{
  position: absolute;
  bottom: 10px;
}
.assignee-list-items {
  list-style-type: none; /* Removes bullet points */
  padding-left: 0;       /* Removes default padding */
}
.delete-button {
  position: absolute;
  top: 87px; /* Adjust as necessary */
  right: 40px; /* Adjust as necessary */
  z-index: 1; /* Ensure it appears above other elements */
  background-color: #ff8173; /* Red background */
  color: #fff; /* White text */
  border: 2px solid transparent;
  border-radius: 5px;
  padding: 8px 29px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
</style>
