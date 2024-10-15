<template>
  <div>
    <!-- Enable date range selection -->
    <VueDatePicker
      v-model="dateRange"
      :min-date="new Date()"
      range
      placeholder="Select date range"
      :disabled-dates="disabledDates"
      :value="selectedSprintForEdit ? selectedSprintForEdit.deadlineRange : null"
    />  

    <!-- Display the selected date range -->
    <div v-if="formattedDateRange" class="selected-range">
      Selected Sprint Range: {{ formattedDateRange }}
    </div>
  </div>
</template>

<script setup>
import { db } from "@/firebase/init.js";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { collection, getDocs, Timestamp } from 'firebase/firestore'; // Firestore functions
import { computed, defineEmits, defineProps, onMounted, ref, watch } from 'vue'; // Import necessary functions

const props = defineProps({
  sprintToHave: {
    type: Array,
    required: true,
  },
});

// Define the emit event for sending the selected date range
const emit = defineEmits(['date-range-selected']);
const dateRange = ref(null); // Store the selected date range
const disabledDatesArray = ref([]); // Store the disabled dates fetched from Firestore

// Function to format the date into a readable format
const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Computed property to format the selected date range for display
const formattedDateRange = computed(() => {
  if (!dateRange.value || dateRange.value.length < 2) return null;
  const [startDate, endDate] = dateRange.value;
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
});

// Function to generate all dates within a given range
const generateDateRange = (start, end) => {
  const dates = [];
  const currentDate = new Date(start);
  const endDate = new Date(end);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate)); // Add a copy of the current date
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  return dates;
};

// Function to fetch date ranges from the 'sprints' collection
const fetchDateRanges = async () => {
  const colRef = collection(db, 'sprints'); // Target the 'sprints' collection
  const querySnapshot = await getDocs(colRef);
  
  const allDisabledDates = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (Array.isArray(data.deadlineRange) && data.deadlineRange.length === 2) {
      const start = data.deadlineRange[0] instanceof Timestamp ? data.deadlineRange[0].toDate() : new Date(data.deadlineRange[0]);
      const end = data.deadlineRange[1] instanceof Timestamp ? data.deadlineRange[1].toDate() : new Date(data.deadlineRange[1]);
      allDisabledDates.push(...generateDateRange(start, end)); // Generate dates for this range
    }
  });

  disabledDatesArray.value = allDisabledDates; // Store all ranges in disabledDatesArray
};

const fetchInitialSprintData = () => {
  try{
        // Convert Firebase Timestamps to Date objects if necessary
    const initialStartDate = props.sprintToHave.deadlineRange[0] instanceof Timestamp 
      ? props.sprintToHave.deadlineRange[0].toDate() 
      : new Date(props.sprintToHave.deadlineRange[0]);
      
    const initialEndDate = props.sprintToHave.deadlineRange[1] instanceof Timestamp
      ? props.sprintToHave.deadlineRange[1].toDate()
      : new Date(props.sprintToHave.deadlineRange[1]);
    
    dateRange.value = [initialStartDate, initialEndDate]; // Set the initial date range
    
    // re-enables the dates
    disabledDatesArray.value = disabledDatesArray.value.filter(
      (date) => date < initialStartDate || date > initialEndDate
    );

  } catch(TypeError){
    return
  }
};

  // Fetch date ranges and the initial sprint data on component mount
  onMounted(async () => {
    await fetchDateRanges(); // Fetch disabled dates
    await fetchInitialSprintData(); // Set the initial date range
    console.log("Initial date range:", dateRange.value); // Debugging output
  });

  // Watch for changes to the date range and emit it to the parent
  watch(dateRange, async (newRange) => {
    emit('date-range-selected', newRange); // Emit the date range to the parent component
  });

  // Computes the disabled dates based on the fetched array, excluding the current date range
  const disabledDates = computed(() => {
    if (!dateRange.value || dateRange.value.length < 2) {
      return disabledDatesArray.value;
    }

    const [currentStart, currentEnd] = dateRange.value;
    
    // Filter out the currently selected date range from the disabled dates
    return disabledDatesArray.value.filter(
      (date) => date < currentStart || date > currentEnd
    );
});
</script>

<style scoped>
.selected-range {
  margin-top: 20px;
  font-size: 16px;
  font-weight: bold;
}
</style>
