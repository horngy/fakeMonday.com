<template>
  <div id="app">
    <NavBar class="nav-bar-background" />
    <router-view></router-view>
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue';

export default {
  name: 'App',
  components: {
    NavBar,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  position: relative;
}

/* Flexbox layout for main content */
.main-content {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

/* Sidebar styling */
.sidebar {
  width: 220px; /* Adjust width as needed */
  background-color: #e1dad1; /* Light grey background */
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); /* Optional: Add a slight shadow */
  height: 100vh
}

/* Filter container styling inside the sidebar */
.filter-container {
  width: 100%;
  padding: 0;
  text-align: left;
}

/* Vertical layout for tags */
.tag-list label {
  display: block; /* Make labels block elements to stack vertically */
  margin-bottom: 10px; /* Add some space between each tag */
}

/* Task container styling */
.task-container {
  flex-grow: 1;
  padding: 20px;
}
/* Style for Sort Button */
.sort-btn {
  top: 20px;
  left: 20px;
  padding: 10px 15px;
  background-color: #747474;
  color: rgb(203, 249, 255);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 3;
  margin-bottom: 10px; /* Add margin to separate buttons */
}

.sort-btn + .sort-btn { /* New button positioned below the previous one */
  top: 60px; /* Position below the first button */
}

.sort-btn:hover {
  background-color: #fffdec;
}
</style>

