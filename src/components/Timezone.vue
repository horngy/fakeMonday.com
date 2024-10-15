<template>
  <div class="timezone">
    <select v-model="selectedTimeZone" @change="updateTime">
      <option v-for="zone in timeZones" :key="zone" :value="zone">
        {{ zone }}
      </option>
    </select>
    <div>{{ timeString }} ({{ selectedTimeZone }})</div>
  </div>
</template>

<script>
export default {
  name: 'TimeZone',
  data() {
    return {
      timeString: '',
      selectedTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeZones: [
        'UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo', 'Australia/Melbourne', 'Asia/Kuala_Lumpur',
        // Add more time zones if necessary
      ]
    };
  },
  created() {
    this.updateTime();
  },
  methods: {
    updateTime() {
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.timeString = new Date().toLocaleTimeString('en-US', {
          timeZone: this.selectedTimeZone
        });
      }, 1000);
    }
  },
  beforeUnmount() {
    clearInterval(this.interval);
  }
};
</script>

<style scoped>
.timezone {
  font-size: 1.2rem;
  margin-right: 1rem;
  white-space: nowrap;
  color: black;
}

select {
  margin-right: 1rem;
}
</style>
