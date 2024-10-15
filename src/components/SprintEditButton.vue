<template>
<div>
    <!-- Edit Task Button that opens the modal -->
    <button v-if="shouldShowEditButton" @click.stop="handleEditSprint" class="edit-sprint-button">Edit Sprint</button>

    <!-- Task Selection Modal -->
    <div v-if="showTaskSelection" class="modal">
    <div class="modal-content" @click.stop>
        <!-- Close button (X) in the top right corner -->
        <button class="close-button" @click="closeModal">X</button>

        <h2>Edit Sprint</h2>
        
        <!-- List of tasks with checkboxes -->
        <div class="task-selection">
        <label v-for="task in tasks" :key="task.id">
            <input type="checkbox" :value="task" v-model="selectedTasks" />
            {{ task.name }}
        </label>
        </div>

        <!-- Custom Single-Select Dropdown for Product Owner -->
        <div>
        <div class="dropdown">
            <h5>Assign a Product Owner</h5>
            <button class="dropdown-button" @click="toggleProductOwnerDropdown">
            <span class="dropdown-text">
                <span v-if="selectedProductOwner" class="pill">{{ selectedProductOwner.username }}</span>
                <span v-else>Select a Product Owner</span>
            </span>
            <span v-if="!selectedProductOwner" class="arrow">▼</span>
            </button>
            <div v-if="dropdownProductOwner" class="dropdown-content">
            <div v-if="assignees.length === 0">No assignees available.</div>
            <div 
                v-for="assignee in assignees" 
                :key="assignee.id" 
                class="dropdown-item"
                @click="selectProductOwner(assignee)"
            >
                {{ assignee.username }}
            </div>
            </div>
        </div>
        </div>

        <!-- Custom Single-Select Dropdown for Scrum Master -->
        <div>
        <div class="dropdown">
            <h5>Assign a Scrum Master</h5>
            <button class="dropdown-button" @click="toggleScrumMasterDropdown">
            <span class="dropdown-text">                
                <span v-if="selectedScrumMaster" class="pill">{{ selectedScrumMaster.username }}</span>
                <span v-else>Select a Scrum Master</span>
            </span>
            <span v-if="!selectedScrumMaster" class="arrow">▼</span>
            </button>
            <div v-if="dropdownScrumMaster" class="dropdown-content">
            <div v-if="assignees.length === 0">No assignees available.</div>
            <div 
                v-for="assignee in assignees" 
                :key="assignee.id" 
                class="dropdown-item"
                @click="selectScrumMaster(assignee)"
            >
                {{ assignee.username }}
            </div>
            </div>
        </div>
        </div>

        <!-- Custom Multi-Select Dropdown for Assignees -->
        <div>
        <div class="dropdown">
            <h5>Assign Team Members</h5>
            <button class="dropdown-button" @click="toggleDropdown">
            <span class="dropdown-text">
                <span v-if="selectedAssignees.length === 0">Select Assignees</span>
                <span v-else>
                <span v-for="assignee in selectedAssignees" :key="assignee.id" class="pill">{{ assignee.username }}</span>
                </span>
            </span>
            <span v-if="selectedAssignees.length === 0" class="arrow">▼</span>
            </button>
            <div v-if="dropdownAssignees" class="dropdown-content">
            <div v-if="assignees.length === 0">No assignees available.</div>
            <div 
                v-for="assignee in assignees" 
                :key="assignee.id" 
                class="dropdown-item"
            >
                <label>
                <input 
                    type="checkbox" 
                    :value="assignee" 
                    v-model="selectedAssignees" 
                />
                {{ assignee.username }}
                </label>
            </div>
            </div>
        </div>
        </div>

        <!-- Include the DatePicker component for date range -->
        <DatePicker :sprintToHave="sprintData" @date-range-selected="updateSelectedDateRange" class="date-picker"></DatePicker>
        
        <!-- Save Changes Button centered in the modal -->
        <div class="modal-actions">
            <button @click="saveChanges" class="add-tasks-button">Save Changes</button>
        </div>
    </div>
    </div>
</div>
</template>

<script>
import { db } from '@/firebase/init.js'; // Adjust the import based on your Firebase setup
import { collection, getDocs } from 'firebase/firestore';
import DatePicker from './DatePickerSprint.vue';

export default {
name: 'SprintEditButton',

props: {
    tasks: Array, // Pass tasks from parent
    sprintData: {
        type: Object,
        required: true,
    }, // Pass existing sprint data from parent for editing
},

components: {
    DatePicker,
},

data() {
    return {
        selectedTasks: [], // Holds the selected tasks
        selectedAssignees: [], // Holds the selected assignees (as objects)
        selectedScrumMaster: null, // Holds the scrum master
        selectedProductOwner: null, // Holds the product owner
        showTaskSelection: false, // Controls task selection modal visibility
        selectedDateRange: null, // Holds the selected date range
        assignees: [], // Holds the list of assignees from Firestore
        
        
        dropdownAssignees: false, // Controls the assignee dropdown
        dropdownScrumMaster: false, // Controls the scrum master dropdown
        dropdownProductOwner: false // Controls the product owner dropdown
    };
},

methods: {
    handleEditSprint() {
      this.$emit('click', this.sprintData); // Emit event with sprintData
      this.openModal(); // Call the method to open the modal
    },

    async fetchAssignees() {
    try {
        const assigneesCollection = collection(db, 'users'); // Reference to the assignees collection
        const assigneesSnapshot = await getDocs(assigneesCollection);
        this.assignees = assigneesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map documents to an array
    } catch (error) {
        console.error("Error fetching assignees: ", error);
    }
    },

    loadSprintData() {
    if (this.sprintData) {
        // Load existing data into the form
        this.selectedTasks = this.sprintData.tasks;
        this.selectedAssignees = this.sprintData.assignees;
        this.selectedScrumMaster = this.sprintData.scrumMaster;
        this.selectedProductOwner = this.sprintData.productOwner;
        this.selectedDateRange = this.sprintData.deadlineRange;
    }
    },

    openModal() {
    this.showTaskSelection = true; // Open the modal
    this.fetchAssignees();
    this.loadSprintData(); // load the data when added
    },

    toggleDropdown() {
    this.dropdownAssignees = !this.dropdownAssignees; // Toggle dropdown visibility
    },

    toggleScrumMasterDropdown() {
    this.dropdownScrumMaster = !this.dropdownScrumMaster; // Toggle dropdown visibility
    },

    toggleProductOwnerDropdown() {
    this.dropdownProductOwner = !this.dropdownProductOwner; // Toggle dropdown visibility
    },

    selectScrumMaster(assignee) {
        this.selectedScrumMaster = assignee; // Update the selected single assignee
        this.dropdownScrumMaster = false; // Close the dropdown after selection
    },

    selectProductOwner(assignee) {
        this.selectedProductOwner = assignee; // Update the selected single assignee
        this.dropdownProductOwner = false; // Close the dropdown after selection
    },

    updateSelectedDateRange(dateRange) {
        this.selectedDateRange = dateRange; // Update the selected date range
    },

    saveChanges() {
        // Validation: Ensure all necessary fields are filled
        if (!this.selectedDateRange) {
            alert("Please select a deadline range."); // Ensure a date range is selected
            return;
        }

        if (!this.selectedAssignees.length) {
            alert("Please select at least one assignee."); // Ensure at least one assignee is selected
            return;
        }

        // Prepare data to send
        const assigneesToSend = this.selectedAssignees.map(assignee => ({
            id: assignee.id,
            username: assignee.username
        }));
        
        const scrumMasterToSend = this.selectedScrumMaster ? {
            id: this.selectedScrumMaster.id,
            username: this.selectedScrumMaster.username
        } : null;
        
        const productOwnerToSend = this.selectedProductOwner ? {
            id: this.selectedProductOwner.id,
            username: this.selectedProductOwner.username
        } : null;

        // Log the data being emitted for debugging
        console.log("Emitting updated sprint data:", {
            assignees: assigneesToSend,
            scrumMaster: scrumMasterToSend,
            productOwner: productOwnerToSend,
            deadlineRange: this.selectedDateRange
        });

        // Emit the updated sprint data back to the parent
        this.$emit('update-sprint', {
            id: this.sprintData.id,
            assignees: assigneesToSend,
            scrumMaster: scrumMasterToSend,
            productOwner: productOwnerToSend,
            deadlineRange: this.selectedDateRange
        });
        
        // Clear selections and close the modal
        this.selectedTasks = [];
        this.selectedAssignees = [];
        this.selectedScrumMaster = null;
        this.selectedProductOwner = null;
        this.selectedDateRange = null;
        
        this.closeModal(); // Close modal after emissions
    },

    closeModal() {
        this.showTaskSelection = false;
    },
},

computed: {
    shouldShowEditButton() {
        return this.sprintData.selectedAction !== "Completed" && this.sprintData.selectedAction !== "Active"; // Only show button if status is not 'Completed'
    }
}

};
</script>

<style scoped>
.edit-sprint-button {
    background-color: #4CAF50;
    border: none;
    padding: 10px 20px;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    outline: none;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    width: 700px;
    padding: 20px;
    border: 1px solid #333;
    border-radius: 8px;
    box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.5);
    color: black;
    position: relative;
    background-color: white;
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

.modal-actions {
    display: flex;
    justify-content: center; /* Center the button horizontally */
    margin-top: 20px;
}

.add-tasks-button {
    padding: 10px 20px; /* Same padding as the "Create Sprint" button */
    background-color: #4B69B5;
    color: white;
    border: none;
    border-radius: 8px; /* Same border-radius as the "Create Sprint" button */
    cursor: pointer;
    font-size: 16px;
    height: 45px; /* Same height as the "Create Sprint" button */
    width: 200px; /* Same width as the "Create Sprint" button */
}

.task-selection {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.task-selection label {
    display: flex;
    align-items: center;
    gap: 10px;
}

.dropdown {
    position: relative; /* Positioning for the dropdown */
    display: inline-block; /* Inline-block to align properly */
}

.dropdown-button {
    padding: 10px 20px;
    background-color: #ffffff;
    color: rgb(96, 96, 96);
    border: 1px solid #d2c8c8;
    border-radius: 8px;
    cursor: pointer;
    width: 300px; /* Set a fixed width */
    display: flex; /* Use flexbox */
    justify-content: space-between; /* Space between text and arrow */
    align-items: center; /* Center vertically */
}

.dropdown-text {
    flex-grow: 1; /* Allow text to take remaining space */
    text-align: center; /* Center text */
}

.arrow {
    margin-left: 10px; /* Add some space between text and arrow */
}

.dropdown-content {
    display: block;
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    z-index: 1; /* Make sure it appears on top */
    max-height: 150px; /* Limit height */
    overflow-y: auto; /* Enable scrolling */
    width: 100%; /* Match dropdown width with button */
    border-radius: 5px;
}

.dropdown-item {
    padding: 10px; /* Space for items */
    cursor: pointer; /* Change cursor */
}

.dropdown-item:hover {
    background-color: #f1f1f1; /* Highlight on hover */
}

.pill {
    display: inline-block;
    background-color: #4B69B5; /* Pill background color */
    color: white; /* Pill text color */
    border-radius: 15px; /* Pill shape */
    padding: 5px 10px; /* Pill padding */
    margin-right: 5px; /* Space between pills */
    font-size: 14px; /* Font size of pill text */
}

.date-picker {
    margin-top: 20px;
}

.dropdown-item label {
    display: flex; /* Use flexbox for alignment */
    align-items: center; /* Center vertically */
    padding: 10px; /* Add padding for better spacing */
}

.dropdown-item input[type="checkbox"] {
    margin-right: 10px; /* Space between checkbox and label */
}
</style>
